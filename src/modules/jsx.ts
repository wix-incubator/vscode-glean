import { codeToAst } from "../parsing";
import traverse from "@babel/traverse";
import * as t from '@babel/types';
import { buildComponent } from "./component-builder";
import { transformFromAst } from '@babel/core';


export function isJSX(code) {
  let isJSXString = false;
  const Visitor = {
    JSXElement(path) {
      if (path.parentPath.parent.type === 'Program' || path.parentPath.parent.type === 'File') {
        isJSXString = true;
      }
    }

  };

  traverse(codeToAst(code), Visitor);

  return isJSXString;

}

export function wrapWithComponent(jsx) {
  const componentProperties = {
    argumentProps: new Set(),
    memberProps: new Set(),
    state: new Set()
  };

  const visitor = {
    Identifier(path) {
      let isMember = !!path.findParent(path => path.node.type === 'MemberExpression' || path.isArrowFunctionExpression(path.node));
      if (!isMember) {
        componentProperties.argumentProps.add(path.node.name);
      }
    },
    MemberExpression(path) {
      if (!path.node.wasVisited && path.node.object && path.node.property && path.node.object.type === 'ThisExpression') {
        if (path.parent.property && (path.node.property.name === 'props' || path.node.property.name === 'state')) {
          //props or state = path.node.property.name;
          if (path.node.property.name === 'props') {
            componentProperties.memberProps.add(path.parent.property.name);
          } else {
            path.node.property.name = 'props';
            componentProperties.state.add(path.parent.property.name);
          }
        } else {
          const membershipExpr = t.memberExpression(t.memberExpression(path.node.object, t.identifier('props')), t.identifier(path.node.property.name));
          (<any>membershipExpr).wasVisited = true;
          path.replaceWith(membershipExpr);
        }

        path.node.wasVisited = true;
      }

    }
  }

  const ast = codeToAst(jsx);

  traverse(ast, visitor);

  const processedJSX = transformFromAst(ast).code;
  const indexOfLastSemicolon = processedJSX.lastIndexOf(';');
  const code = processedJSX.slice(0, indexOfLastSemicolon) + processedJSX.slice(indexOfLastSemicolon + 1);

  return buildComponent('Yosi', code, componentProperties);
}

export function createComponent(name, props) {
  const allProps = new Set([...props.state, ...props.memberProps, ...props.argumentProps]);
  return `<${name}  />`
}