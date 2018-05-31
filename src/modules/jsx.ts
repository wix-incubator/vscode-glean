import { codeToAst } from "../parsing";
import traverse from "@babel/traverse";
import * as t from '@babel/types';
import { buildComponent } from "./component-builder";
import { transformFromAst } from '@babel/core';
import { ProcessedSelection } from "../extension";
import * as path from 'path';


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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function wrapWithComponent(fullPath, jsx): ProcessedSelection {

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
      if (!path.node.wasVisited && t.isThisExpression(path.node.object)) {
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
  const componentName = capitalizeFirstLetter(path.basename(fullPath, path.extname(fullPath)).replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }));

  return {
    text: buildComponent(componentName, code, componentProperties),
    metadata: {
      isJSX: true,
      componentProperties,
      name: componentName
    }
  };
}


export function createComponentInstance(name, props) {
  const stateToInputProps = Array.from(props.state).map(prop => `${prop}={this.state.${prop}}`).join(' ');
  const argPropsToInputProps = Array.from(props.argumentProps).map(prop => `${prop}={${prop}}`).join(' ');
  const memberPropsToInputProps = Array.from(props.memberProps).map(prop => `${prop}={this.props.${prop}}`).join(' ');

  return `<${name}  ${stateToInputProps} ${argPropsToInputProps} ${memberPropsToInputProps}/>`;
}