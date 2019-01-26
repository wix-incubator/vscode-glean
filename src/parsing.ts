import { parse, ParserOptions } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { transformFromAst } from "@babel/core";
import { esmModuleSystemUsed, commonJSModuleSystemUsed } from "./settings";
import template from "@babel/template";

export const parsingOptions = {
  plugins: ["objectRestSpread", "classProperties", "typescript", "jsx"],
  sourceType: "module"
};

export const codeToAst = code =>
  parse(code, <ParserOptions>{
    startLine: 0,
    ...parsingOptions
  });

  export const jsxToAst = code => {
    try {
      return codeToAst(code);
    } catch (e) {
      return codeToAst(`<>${code}</>`);
    }
  };

export const templateToAst = code => template.ast(code, parsingOptions);

export function getIdentifier(code) {
  const identifiers = [];
  const Visitor = {
    Identifier(path) {
      if (
        (t.isProgram(path.parentPath.parent) ||
          t.isFile(path.parentPath.parent) ||
          t.isExportDeclaration(path.parentPath.parent)) &&
        path.listKey !== "params" &&
        path.key !== "superClass"
      ) {
        identifiers.push(path.node.name);
      }
    }
  };

  traverse(codeToAst(code), Visitor);

  return identifiers;
}

function assignment(value) {
  return t.assignmentExpression(
    "=",
    t.memberExpression(t.identifier("module"), t.identifier("exports"), false),
    value
  );
}

function generateExportsExpr(value) {
  return t.expressionStatement(assignment(value));
}

export function generateImportStatementFromFile(identifiers, modulePath) {
  const identifiersString = identifiers.join(", ");
  if (esmModuleSystemUsed()) {
    return `import { ${identifiersString} } from './${modulePath}';\n`;
  } else if (commonJSModuleSystemUsed()) {
    return `const { ${identifiersString} } = require('./${modulePath}');\n`;
  }
}

export function exportAllDeclarationsESM(code) {
  const ast = codeToAst(code);

  const visitor = {
    Declaration(path) {
      if (
        path.parent.type === "Program" &&
        !path.node.type.includes("Export")
      ) {
        path.replaceWith(t.exportNamedDeclaration(path.node, []));
      }
    }
  };

  traverse(ast, visitor);

  return transformFromAst(ast).code;
}

export function exportAllDeclarationsCommonJS(code) {
  const identifiers = getIdentifier(code).map(id =>
    t.objectProperty(t.identifier(id), t.identifier(id), false, true)
  );
  const exportExpression = generateExportsExpr(t.objectExpression(identifiers));
  const ast = t.file(t.program([exportExpression]), "", "");
  return `
${code}
    
${transformFromAst(ast).code}
        `;
}

export function transformJSIntoExportExpressions(code) {
  if (esmModuleSystemUsed()) {
    return exportAllDeclarationsESM(code);
  } else if (commonJSModuleSystemUsed()) {
    return exportAllDeclarationsCommonJS(code);
  }
}
