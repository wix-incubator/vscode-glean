import { capitalizeFirstLetter } from "./../utils";
import { codeToAst, parsingOptions, templateToAst } from "../parsing";
import traverse from "@babel/traverse";
import { buildComponent } from "./component-builder";
import { transformFromAst } from "@babel/core";
import * as path from "path";
import { ProcessedSelection } from "../code-actions";
import * as t from "@babel/types";

export function isJSX(code) {
  let ast;
  try {
    ast = templateToAst(code);
  } catch (e) {
    try {
      ast = templateToAst(`<>${code}</>`);
    } catch (e2) {
      return false;
    }
  }

  return ast && ast.expression && t.isJSX(ast.expression);
}

export const jsxToAst = code => {
  try {
    return codeToAst(code);
  } catch (e) {
    return codeToAst(`<>${code}</>`);
  }
};

export function isJSXExpression(code) {
  try {
    const ast = templateToAst(code);
    return ast && ast.expression && t.isJSX(ast.expression);
  } catch (e) {
    return false;
  }
}

export function isRangeContainedInJSXExpression(code, start, end) {
  try {
    const ast = codeToAst(code);
    const path = findContainerPath(ast, start, end);
    return path && t.isJSX(path.node) && t.isExpression(path.node);
  } catch (e) {
    return false;
  }
}

function findContainerPath(ast, start, end) {
  let foundPath = null;
  const visitor = {
    exit(path) {
      if (!foundPath && pathContains(path, start, end)) {
        foundPath = path;
      }
    }
  };

  traverse(ast, visitor);
  return foundPath;
}

function pathContains(path, start, end) {
  const pathStart = path.node.loc.start;
  const pathEnd = path.node.loc.end;
  return (
    (pathStart.line < start.line ||
      (pathStart.line === start.line && pathStart.column < start.character)) &&
    (pathEnd.line > end.line ||
      (pathEnd.line === end.line && pathEnd.column > end.character))
  );
}

export function produceComponentNameFrom(fullPath: any) {
  const baseName = path.basename(fullPath, path.extname(fullPath));
  return baseName
    .split("-")
    .map(capitalizeFirstLetter)
    .join("");
}

function isPropsExpression(path) {
  return (
    t.isMemberExpression(path.node.object) &&
    t.isThisExpression(path.node.object.object) &&
    path.node.object.property.name === "props"
  );
}

function isStateExpression(path) {
  return (
    t.isMemberExpression(path.node.object) &&
    t.isThisExpression(path.node.object.object) &&
    path.node.object.property.name === "state"
  );
}

function isMemberExpression(path) {
  return !t.isMemberExpression(path.parent) && t.isMemberExpression(path.node);
}

export function wrapWithComponent(componentName, jsx): ProcessedSelection {
  const targetProps = {
    fromVariable: new Set(),
    fromProps: new Set(),
    fromState: new Set(),
    fromMember: new Set()
  };

  const visit = path =>
    path.node.wasVisited ? false : (path.node.wasVisited = true);

  const visitor = {
    Identifier(path) {
      if (visit(path)) {
        targetProps.fromVariable.add(path.node.name);
      }
    },
    MemberExpression(path) {
      if (visit(path)) {
        if (isMemberExpression(path)) {
          const propName = path.node.property.name;
          if (isPropsExpression(path)) {
            targetProps.fromProps.add(propName);
          } else if (isStateExpression(path)) {
            targetProps.fromState.add(propName);
          } else {
            targetProps.fromMember.add(propName);
          }
          const expr = t.identifier(propName);
          (<any>expr).wasVisited = true;
          path.replaceWith(expr);
          path.skip();
        }
      }
    }
  };

  const ast = jsxToAst(jsx);

  traverse(ast, visitor);

  const processedJSX = transformFromAst(ast).code;

  const indexOfLastSemicolon = processedJSX.lastIndexOf(";");
  const code =
    processedJSX.slice(0, indexOfLastSemicolon) +
    processedJSX.slice(indexOfLastSemicolon + 1);

  const allProps = [
    ...targetProps.fromVariable,
    ...targetProps.fromProps,
    ...targetProps.fromState,
    ...targetProps.fromMember
  ];

  const componentText = buildComponent(componentName, code, allProps);

  return {
    text: componentText,
    metadata: {
      isJSX: true,
      componentProperties: targetProps,
      name: componentName
    }
  };
}

export function createComponentInstance(name, props) {
  const stateToInputProps = Array.from(props.fromState)
    .map(prop => `${prop}={this.state.${prop}}`)
    .join(" ");
  const variablePropsToInputProps = Array.from(props.fromVariable)
    .map(prop => `${prop}={${prop}}`)
    .join(" ");
  const memberPropsToInputProps = Array.from(props.fromProps)
    .map(prop => `${prop}={this.props.${prop}}`)
    .join(" ");
  const componentMembersToInputProps = Array.from(props.fromMember)
    .map(prop => `${prop}={this.${prop}}`)
    .join(" ");

  return `<${name}  ${stateToInputProps} ${variablePropsToInputProps} ${memberPropsToInputProps} ${componentMembersToInputProps}/>`;
}

function isExportedDeclaration(ast) {
  return t.isExportNamedDeclaration(ast) || t.isExportDefaultDeclaration(ast);
}

export function isStatelessComp(code) {
  const ast = templateToAst(code);

  return (
    (t.isVariableDeclaration(ast) && t.isFunction(ast.declarations[0].init)) ||
    (isExportedDeclaration(ast) && t.isFunction(ast.declaration)) ||
    t.isFunction(ast)
  );
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
