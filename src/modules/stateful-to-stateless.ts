import { codeToAst } from "../parsing";
import traverse from "@babel/traverse";
import template from "@babel/template";
import * as t from '@babel/types';
import { transformFromAst } from '@babel/core';
import { capitalizeFirstLetter } from "../utils";
import { isHooksForFunctionalComponentsExperimentOn } from "../settings";


export function statefulToStateless(component) {
  const functionBody = []

  const lifecycleMethods = [
    'constructor',
    'componentWillMount',
    'componentDidMount',
    'componentWillReceiveProps',
    'shouldComponentUpdate',
    'componentWillUpdate',
    'componentDidUpdate',
    'componentWillUnmount',
    'componentDidCatch',
    'getDerivedStateFromProps'
  ];

  const arrowFunction = ({ name, params = [], propType = null, paramDefaults = [], body = [] }) => {
    const identifier = t.identifier(name);
    identifier.typeAnnotation = propType ? t.tsTypeAnnotation(t.tsTypeReference(t.identifier('SFC'), t.tsTypeParameterInstantiation([propType]))) : null;
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        identifier,
        t.arrowFunctionExpression(
          params.map((param, idx) => {
            const paramIdentifier = t.identifier(param);

            let paramObj: any = paramIdentifier;

            if (paramDefaults[idx]) {
              paramObj = t.assignmentPattern(paramIdentifier, paramDefaults[idx]);
            }

            return paramObj;
          }),
          t.blockStatement(body))
      )
    ])
  };

  const copyNonLifeCycleMethods = (path) => {
    const className = path.node.key.name;
    const classBody = t.isClassMethod(path) ? path['node'].body.body : path.node.value.body.body;
    if (lifecycleMethods.indexOf(className) === -1) {
      path.traverse(RemoveSetStateAndForceUpdateVisitor);
      path.traverse(ReplaceStateWithPropsVisitor);
      path.traverse(RemoveThisVisitor);
      appendFunctionBodyToStatelessComponent(className, classBody);
    }
  }

  const RemoveThisVisitor = {
    MemberExpression(path) {
      if (t.isThisExpression(path.node.object)) {
        path.replaceWith(path.node.property)
      }
    }
  };

  const ReplaceStateWithPropsVisitor = {
    MemberExpression(path) {

      if (isHooksForFunctionalComponentsExperimentOn()) {
        if (t.isThisExpression(path.node.object.object) && path.node.object.property.name === 'state') {
          path.replaceWith(t.identifier(path.node.property.name));
        }
      } else {
        if (t.isThisExpression(path.node.object) && path.node.property.name === 'state') {
          path.node.property.name = 'props';
        }
      }
    }
  };

  const RemoveSetStateAndForceUpdateVisitor = {
    CallExpression(path) {
      if (t.isMemberExpression(path.node.callee)) {
        if (t.isThisExpression(path.node.callee.object)) {
          if(isHooksForFunctionalComponentsExperimentOn()) {
            if(path.node.callee.property.name === 'forceUpdate') {
              path.remove();
            } else if(path.node.callee.property.name === 'setState') {
              const buildRequire = template(`
              STATE_SETTER(STATE_VALUE);
            `);
              path.node.arguments[0].properties.forEach(({key, value}) => {
                path.insertBefore(buildRequire({
                  STATE_SETTER: t.identifier(`set${capitalizeFirstLetter(key.name)}`),
                  STATE_VALUE: value
                }));
              });

              path.remove();
            }
          } else {
            if (['setState', 'forceUpdate'].indexOf(path.node.callee.property.name) !== -1) {
              path.remove();
            }
          }
  
        }
      }
    }
  }

  const appendFunctionBodyToStatelessComponent = (name, body) => {

    if (name !== 'render') {
      functionBody.push(arrowFunction({ name, body }));
    } else {
      functionBody.push(...body);
    }

  };

  const visitor = {
    ClassDeclaration(path) {
      const statelessComponentName = path.node.id.name;
      const defaultPropsPath = path.get('body').get('body').find(property => {
        return t.isClassProperty(property) && property['node'].key.name === 'defaultProps'
      });

      const statelessComponent = arrowFunction({
        name: (statelessComponentName),
        params: ['props'],
        propType: path.node.superTypeParameters && path.node.superTypeParameters.params.length ? path.node.superTypeParameters.params[0] : null,
        paramDefaults: defaultPropsPath ? [defaultPropsPath.node.value] : [],
        body: functionBody
      });

      const isExportDefaultDeclaration = t.isExportDefaultDeclaration(path.container);
      const isExportNamedDeclaration = t.isExportNamedDeclaration(path.container);

      const exportDefaultStatelessComponent = t.exportDefaultDeclaration(t.identifier(statelessComponentName));
      const exportNamedStatelessComponent = t.exportNamedDeclaration(statelessComponent, []);

      const mainPath = t.isExportDeclaration(path.container) ? path.findParent(p => t.isExportDeclaration(p)) : path;

      if (isExportDefaultDeclaration) {
        mainPath.insertBefore(statelessComponent);
        mainPath.insertBefore(exportDefaultStatelessComponent);
      } else if (isExportNamedDeclaration) {
        mainPath.insertBefore(exportNamedStatelessComponent);
      } else {
        mainPath.insertBefore(statelessComponent);
      }
    },
    ClassMethod(path) {
   
      if (isHooksForFunctionalComponentsExperimentOn()) {
        if (path.node.kind === "constructor") {
          const { expression } = path.node.body.body.find((bodyStatement => {
            return t.isAssignmentExpression(bodyStatement.expression)
          }));

          const buildRequire = template(`
          const [STATE_PROP, STATE_SETTER] = useState(STATE_VALUE);
        `);

          if (expression.left.property.name === "state") {
            const stateHooksExpressions = expression.right.properties.map(({key, value}) => {
              return buildRequire({
                STATE_PROP: t.identifier(key.name),
                STATE_SETTER: t.identifier(`set${capitalizeFirstLetter(key.name)}`),
                STATE_VALUE: value
              });
            });
            functionBody.push(...stateHooksExpressions);
          }
        }

      }

      copyNonLifeCycleMethods(path);
    },
    ClassProperty(path) {
      const propValue = path.node.value;
      if (t.isFunctionExpression(propValue) || t.isArrowFunctionExpression(propValue)) {
        copyNonLifeCycleMethods(path);
      }
    }
  };

  const ast = codeToAst(component);

  traverse(ast, visitor);
  ast.program.body.splice(-1);

  const processedJSX = transformFromAst(ast).code;

  return {
    text: processedJSX,
    metadata: {}
  }
}
