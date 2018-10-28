import { codeToAst } from "../parsing";
import traverse from "@babel/traverse";
import * as t from '@babel/types';
import { transformFromAst } from '@babel/core';


export function statefulToStateless(component) {
  let statelessComponentPath;
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

  const arrowFunction = ({name, params = [], paramTypes = [], paramDefaults = [], body = []}) => {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(name), 
        t.arrowFunctionExpression(
          params.map((param, idx) => {
            const paramIdentifier = t.identifier(param);
      
            if (paramTypes[idx]) {
				      paramIdentifier.typeAnnotation = t.tsTypeAnnotation(paramTypes[idx]);
            }
            
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
      if (t.isThisExpression(path.node.object) && path.node.property.name === 'state') {
        path.node.property.name = 'props';
      }
    }
  };
  
  const RemoveSetStateAndForceUpdateVisitor = {
  	CallExpression(path) {
    	if (t.isMemberExpression(path.node.callee)) {
        	if (t.isThisExpression(path.node.callee.object)) {
              if (['setState', 'forceUpdate'].indexOf(path.node.callee.property.name) !== -1) {
              	path.remove();
              }
            }
        }
    }
  }
  
  const appendFunctionBodyToStatelessComponent = (name, body) => {
    let statelessComponentBodyBlock;
    
    if (t.isExportDefaultDeclaration(statelessComponentPath)) {
      statelessComponentBodyBlock = statelessComponentPath['node'].declaration.body.body;
    } else if (t.isExportNamedDeclaration(statelessComponentPath)) {
      statelessComponentBodyBlock = statelessComponentPath['node'].declaration.declarations[0].init.body.body
    } else {
      statelessComponentBodyBlock =  statelessComponentPath.node.declarations[0].init.body.body;
    }
    
    if (name !== 'render') {
      statelessComponentBodyBlock.push(arrowFunction({name, body}));
    } else {
      statelessComponentBodyBlock.push(...body);
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
        paramTypes: path.node.superTypeParameters && path.node.superTypeParameters.params.length ? [path.node.superTypeParameters.params[0]]: [],
        paramDefaults: defaultPropsPath ? [defaultPropsPath.node.value] : [],
        body: []
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
       
      statelessComponentPath = mainPath.getSibling(0);
    },
    ClassMethod(path) {
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
