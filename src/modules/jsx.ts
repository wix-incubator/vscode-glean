import { capitalizeFirstLetter } from './../utils';
import { codeToAst, parsingOptions, templateToAst } from '../parsing';
import traverse from '@babel/traverse';
import { buildComponent } from './component-builder';
import { transformFromAst } from '@babel/core';
import * as path from 'path';
import { ProcessedSelection } from '../code-actions';
import * as t from '@babel/types';

export type ComponentProperties = {
  argumentProps: Set<string>,
  memberProps: Set<string>,
  state: Set<string>,
  componentMembers: Set<string>,
};

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
    const containerPath = findContainerPath(ast, start, end);
    return containerPath && t.isJSX(containerPath.node) && t.isExpression(containerPath.node);
  } catch (e) {
    return false;
  }
}

function findContainerPath(ast, start, end) {
  let foundPath = null;
  const visitor = {
    exit(astPath) {
      if (!foundPath && pathContains(astPath, start, end)) {
        foundPath = astPath;
      }
    },
  };

  traverse(ast, visitor);
  return foundPath;
}

function pathContains(astPath, start, end) {
  const pathStart = astPath.node.loc.start;
  const pathEnd = astPath.node.loc.end;
  return ((pathStart.line < start.line) || (pathStart.line === start.line && pathStart.column < start.character))
    && ((pathEnd.line > end.line) || (pathEnd.line === end.line && pathEnd.column > end.character));
}


function produceComponentNameFrom(fullPath: any) {
  const baseName = path.basename(fullPath, path.extname(fullPath));
  return baseName.split('-').map(capitalizeFirstLetter).join('');
}

export function wrapWithComponent(fullPath, jsx): ProcessedSelection {

  const componentProperties = {
    argumentProps: new Set(),
    memberProps: new Set(),
    state: new Set(),
    componentMembers: new Set(),
  };

  // TODO Requires Review
  const visitor = {
    Identifier(astPath) {
      let isMember = !!astPath.findParent(() => (
        (astPath.node.type === 'MemberExpression') ||
        (astPath.parent.type === 'ObjectProperty' && astPath.parent.value.type !== 'Identifier') ||
        astPath.isArrowFunctionExpression(astPath.node)
      ));
      if (!isMember && !astPath.node.wasVisited) {
        componentProperties.argumentProps.add(astPath.node.name);
      }
    },
    MemberExpression(astPath) {
      if (!astPath.node.wasVisited && t.isThisExpression(astPath.node.object)) {
        if (astPath.parent.property && (astPath.node.property.name === 'props' || astPath.node.property.name === 'state')) {
          // props or state = path.node.property.name;
          if (astPath.node.property.name === 'props') {
            componentProperties.memberProps.add(astPath.parent.property.name);
          } else {
            astPath.node.property.name = 'props';
            componentProperties.state.add(astPath.parent.property.name);
          }
        } else if (t.isThisExpression(astPath.node.object)) {
          componentProperties.componentMembers.add(astPath.node.property.name);
          let identifier = t.identifier(astPath.node.property.name);
          (<any>identifier).wasVisited = true;
          astPath.replaceWith(identifier);
        } else {
          componentProperties.componentMembers.add(astPath.node.property.name);
          let membershipExpr = t.memberExpression(
            t.memberExpression(astPath.node.object, t.identifier('props')), t.identifier(astPath.node.property.name),
          );
          // TODO Should Be membershipExpr.node.wasVisited?
          (<any>membershipExpr).wasVisited = true;
          astPath.replaceWith(membershipExpr);
          astPath.skip();
        }

        astPath.node.wasVisited = true;
      }

    },
  };

  const ast = jsxToAst(jsx);

  traverse(ast, visitor);

  const processedJSX = transformFromAst(ast).code;
  const indexOfLastSemicolon = processedJSX.lastIndexOf(';');
  const code = processedJSX.slice(0, indexOfLastSemicolon) + processedJSX.slice(indexOfLastSemicolon + 1);
  const componentName = produceComponentNameFrom(fullPath);

  return {
    text: buildComponent(componentName, code, componentProperties),
    metadata: {
      isJSX: true,
      componentProperties,
      name: componentName,
    },
  };
}

export function createComponentInstance(name, props: ComponentProperties) {
  const stateToInputProps = Array.from(props.state).map(prop => `${prop}={this.state.${prop}}`).join(' ');
  const argPropsToInputProps = Array.from(props.argumentProps).map(prop => `${prop}={${prop}}`).join(' ');
  const memberPropsToInputProps = Array.from(props.memberProps).map(prop => `${prop}={this.props.${prop}}`).join(' ');
  const componentMembersToInputProps = Array.from(props.componentMembers).map(prop => `${prop}={this.${prop}}`).join(' ');

  return `<${name}  ${stateToInputProps} ${argPropsToInputProps} ${memberPropsToInputProps} ${componentMembersToInputProps}/>`;
}

function isExportedDeclaration(ast) {
  return t.isExportNamedDeclaration(ast) || t.isExportDefaultDeclaration(ast);
}

export function isStatelessComp(code) {
  const ast = templateToAst(code);

  return (t.isVariableDeclaration(ast) && t.isFunction(ast.declarations[0].init)) ||
    (isExportedDeclaration(ast) && t.isFunction(ast.declaration)) ||
    t.isFunction(ast);
}


export function isStatefulComp(code) {
  const ast = templateToAst(code);

  const isSupportedComponent = (classPath) => {
    const supportedComponents = ['Component', 'PureComponent'];
    return ((classPath.superClass.object &&
          classPath.superClass.object.name === 'React' &&
          supportedComponents.indexOf(classPath.superClass.property.name) !== -1)  ||
          (supportedComponents.indexOf(classPath.superClass.name) !== -1));
  };

  return (
    (isExportedDeclaration(ast) && isSupportedComponent(ast.declaration)) ||
    isSupportedComponent(ast));

}
