import { codeToAst, templateToAst } from "../parsing";
import traverse from "@babel/traverse";
import template from "@babel/template";
import * as t from '@babel/types';
import { transformFromAst } from '@babel/core';
import { capitalizeFirstLetter } from "../utils";
import { isHooksForFunctionalComponentsExperimentOn } from "../settings";
import { getReactImportReference, isExportedDeclaration } from "../ast-helpers";
import { showInformationMessage, selectedText, activeURI, activeFileName } from "../editor";
import { replaceSelectionWith, handleError } from "../code-actions";
import { persistFileSystemChanges, readFileContent, replaceTextInFile } from "../file-system";
import { Position } from "vscode";


export function statefulToStateless(component) {
  const functionBody = []

  let stateHooksPresent = false;

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
    addPropTSAnnotationIfNeeded(propType, identifier);
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

  const buildStateHook = template(`
  const [STATE_PROP, STATE_SETTER] = useState(STATE_VALUE);
`);

  const visitor = {
    ClassDeclaration(path) {
      const statelessComponentName = path.node.id.name;
      const defaultPropsPath = path.get('body').get('body').find(property => {
        return t.isClassProperty(property) && property['node'].key.name === 'defaultProps'
      });

      const statelessComponent = arrowFunction({
        name: (statelessComponentName),
        params: ['props'],
        propType: path.node.superTypeParameters && path.node.superTypeParameters.params.length ? path.node.superTypeParameters.params : null,
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

          if (expression.left.property.name === "state") {
            stateHooksPresent = true;
            const stateHooksExpressions = expression.right.properties.map(({key, value}) => {
              return buildStateHook({
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
    },

    ImportDeclaration(path) {
      if(path.node.source.value === 'react') {
        
      }
    }
  };

  const ast = codeToAst(component);

  traverse(ast, visitor);

  // if(stateHooksPresent) {
  //   const reactImport = getReactImportReference(ast);
  //   reactImport.specifiers.push(t.importSpecifier(t.identifier('useState'),t.identifier('useState')));
  // }
  ast.program.body.splice(-1);

  const processedJSX = transformFromAst(ast).code;

  return {
    text: processedJSX,
    metadata: {
      stateHooksPresent
    }
  }
}
function addPropTSAnnotationIfNeeded(propType: any, identifier: t.Identifier) {
  if (propType) {
    const members = propType.reduce((acc, typeLiteral) => ([...acc, ...typeLiteral.members]), []);
    const typeAnnotation = t.tsTypeLiteral(members);
    identifier.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(t.identifier('SFC'), t.tsTypeParameterInstantiation([typeAnnotation])));
  }
}

export async function statefulToStatelessComponent() {
  try {
    const answer = await showInformationMessage('WARNING! All lifecycle methods and react instance methods would be removed. Are you sure you want to continue?', ['Yes', 'No']);
      if (answer === 'Yes') {
        const selectionProccessingResult = statefulToStateless(selectedText());
        const persistantChanges = [replaceSelectionWith(selectionProccessingResult.text)]
        if(selectionProccessingResult.metadata.stateHooksPresent) {
          persistantChanges.push(importStateHook());
        }
        await persistFileSystemChanges(...persistantChanges);
      }

  } catch (e) {
    handleError(e);
  }

function importStateHook() {
    const currentFile = activeURI().path;
    const file = readFileContent(currentFile);
    const ast = codeToAst(file);
    const reactImport = getReactImportReference(ast);
    reactImport.specifiers.push(t.importSpecifier(t.identifier('useState'), t.identifier('useState')));
    const updatedReactImport = transformFromAst(t.program([reactImport])).code;
    return replaceTextInFile(updatedReactImport, new Position(reactImport.loc.start.line, reactImport.loc.start.column), new Position(reactImport.loc.end.line, reactImport.loc.end.column), activeFileName());
  }
}

export function isStatefulComp(code) {
  const ast = templateToAst(code);

  const isSupportedComponent = classPath => {
    const supportedComponents = ["Component", "PureComponent"];
    return (
      (classPath.superClass.object &&
        classPath.superClass.object.name === "React" &&
        supportedComponents.indexOf(classPath.superClass.property.name) !==
          -1) ||
      supportedComponents.indexOf(classPath.superClass.name) !== -1
    );
  };

  return (
    (isExportedDeclaration(ast) && isSupportedComponent(ast.declaration)) ||
    isSupportedComponent(ast)
  );
}
