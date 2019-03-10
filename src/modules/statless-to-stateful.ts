import { codeToAst, templateToAst } from "../parsing";
import traverse from "@babel/traverse";
import * as t from '@babel/types';
import { transformFromAst } from '@babel/core';
import { isExportedDeclaration } from "../ast-helpers";
import { persistFileSystemChanges } from "../file-system";
import { selectedText } from "../editor";
import { replaceSelectionWith, handleError } from "../code-actions";

export function isStatelessComp(code) {
  const ast = templateToAst(code);

  return (
    (t.isVariableDeclaration(ast) && t.isFunction(ast.declarations[0].init)) ||
    (isExportedDeclaration(ast) && t.isFunction(ast.declaration)) ||
    t.isFunction(ast)
  );
}

function isReferenced(node, parent) {
  for (const param of parent.params) {
    if (param === node) return false;
  }

  return parent.id !== node;
}

function getRenderFunctionBody(statelessComponentBody) {
  if(t.isBlockStatement(statelessComponentBody)) {
    const returnStatement = < t.ReturnStatement >statelessComponentBody.body.find(bodyContent => bodyContent.type === 'ReturnStatement');
    const returnStatementContent = returnStatement.argument;
    if(!t.isParenthesizedExpression(returnStatementContent)){
      const parenthesizedReturnStatement = t.parenthesizedExpression(returnStatementContent);
      returnStatement.argument = parenthesizedReturnStatement
    }
    return statelessComponentBody;
  } else if(t.isJSXElement(statelessComponentBody)) {
    const body  = t.isParenthesizedExpression(statelessComponentBody) ? statelessComponentBody : t.parenthesizedExpression(statelessComponentBody);
    return t.blockStatement([t.returnStatement(body)]);
  } else {
    return t.blockStatement([t.returnStatement(statelessComponentBody)]);
  }
}

const getParamTypeAnnotation = (param) => {
  return param && param.typeAnnotation? t.tsTypeParameterInstantiation([param.typeAnnotation.typeAnnotation]): null;
}

const getDeclarationTypeAnnotation = (declaration) => {
  return declaration && declaration.typeAnnotation ? t.tsTypeParameterInstantiation([declaration.typeAnnotation.typeAnnotation.typeParameters.params[0]]) : null
}

export function statelessToStateful(component) {
  const defaultProps = new Map();
  let name;
  const visitor = {
    Function(path) {
      if (path.node.params.length) {
        if (path.node.params[0].type === 'ObjectPattern') {
          path.node.params[0].properties.map(prop => {
            if (isReferenced(prop.value, path.node)) {
              if(t.isAssignmentPattern(prop.value)){
                defaultProps.set(prop.value.left.name, prop.value.right);
              }
              const name = prop.value? (prop.value.left? prop.value.left.name : prop.value.name) : prop.argument.name;
              const membershipExpr = t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('props')), t.identifier(name));
              path.scope.bindings[name].referencePaths.forEach(refPath => refPath.replaceWith(membershipExpr));
            }
          });

        } else {
          path.scope.bindings[path.node.params[0].name].referencePaths.forEach(refPath => {
            if (t.isIdentifier(refPath)) {
              const membershipExpr = t.memberExpression(t.thisExpression(), (<any>refPath).node);
              (<any>refPath).replaceWith(membershipExpr)
            }
          });

        }

      }

      let replacementPath;

      if (t.isArrowFunctionExpression(path)) {
        name = (<any>path).container.id;
      } else {
        name = path.node.id;
      }

      const typeAnnotation = getParamTypeAnnotation(path.node.params[0]) || getDeclarationTypeAnnotation((<any>path).container.id);
      const render = t.classMethod('method', t.identifier('render'), [], getRenderFunctionBody(path.node.body));
      const superCall = t.expressionStatement(t.callExpression((<any>t).super(), [t.identifier('props')]))
      const ctor = t.classMethod('constructor', t.identifier('constructor'), [t.identifier('props')], t.blockStatement([superCall]));
      const classDefinition = t.classDeclaration(name, t.identifier('Component'), t.classBody([ctor, render]));
      classDefinition.superTypeParameters = typeAnnotation;
      
      if (t.isArrowFunctionExpression(path) && !t.isExportDefaultDeclaration((<any>path).parentPath)) {
        replacementPath = (<any>path).parentPath.parentPath;
      } else {
        replacementPath = path;
      }
      
      replacementPath.replaceWith(classDefinition)
      replacementPath.skip()

      path.skip();
    }
  }

  const ast = codeToAst(component);

  traverse(ast, visitor);

  if(defaultProps.size) {
    const properties = Array.from(defaultProps).map(([key, value]) => { 
      return t.objectProperty(t.identifier(key), value) 
    });
    ast.program.body.push(t.expressionStatement(t.assignmentExpression('=',t.memberExpression(name,t.identifier('defaultProps')),t.objectExpression(properties))))
  }

  const processedJSX = transformFromAst(ast).code;

  return {
    text: processedJSX,
    metadata: {}
  }
}

export async function statelessToStatefulComponent() {
  try {
    const selectionProccessingResult = statelessToStateful(selectedText())
    await persistFileSystemChanges(replaceSelectionWith(selectionProccessingResult.text));

  } catch (e) {
    handleError(e);
  }
}
