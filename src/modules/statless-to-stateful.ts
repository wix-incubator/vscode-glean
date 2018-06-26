import { codeToAst } from "../parsing";
import traverse from "@babel/traverse";
import * as t from '@babel/types';
import { transformFromAst } from '@babel/core';


function isReferenced(node, parent) {
  for (const param of parent.params) {
    if (param === node) return false;
  }

  return parent.id !== node;
}

export function statelessToStateful(component) {
  const visitor = {
    Function(path) {
      if (path.node.params.length) {
        if (path.node.params[0].type === 'ObjectPattern') {
          path.node.params[0].properties.map(prop => {
            if (isReferenced(prop.value, path.node)) {
              const membershipExpr = t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('props')), t.identifier(prop.value.name));
              path.scope.bindings[prop.value.name].referencePaths.forEach(refPath => refPath.replaceWith(membershipExpr));
            }
          });

        } else {
          path.scope.bindings[path.node.params[0].name].referencePaths.forEach(refPath => {
            const membershipExpr = t.memberExpression(t.memberExpression(t.thisExpression(), refPath.parent.object), refPath.parent.property);
            refPath.parentPath.replaceWith(membershipExpr)
          });

        }


      }

      let name;
      let replacementPath;

      if (t.isArrowFunctionExpression(path)) {
        replacementPath = (<any>path).parentPath.parentPath;
        name = (<any>path).container.id;
      } else {
        replacementPath = path;
        name = path.node.id;

      }

      const render = t.classMethod('method', t.identifier('render'), [], path.node.body);
      const superCall = t.expressionStatement(t.callExpression((<any>t).super(), [t.identifier('props')]))
      const ctor = t.classMethod('constructor', t.identifier('constructor'), [t.identifier('props')], t.blockStatement([superCall]));
      const classDefinition = t.classDeclaration(name, t.identifier('Component'), t.classBody([ctor, render]))
      replacementPath.replaceWith(classDefinition)
      replacementPath.skip()


    }
  }

  const ast = codeToAst(component);

  traverse(ast, visitor);

  const processedJSX = transformFromAst(ast).code;

  return {
    text: processedJSX,
    metadata: {}
  }
}