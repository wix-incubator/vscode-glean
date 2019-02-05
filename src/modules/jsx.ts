import { capitalizeFirstLetter } from "./../utils";
import { codeToAst, templateToAst, jsxToAst } from "../parsing";
import traverse from "@babel/traverse";
import { buildComponent } from "./component-builder";
import { transformFromAst } from "@babel/core";
import * as path from "path";
import { ProcessedSelection } from "../code-actions";
import * as t from "@babel/types";
import { readFileContent, prependTextToFile } from "../file-system";
import { getReactImportReference } from "../ast-helpers";

export type ComponentProperties = {
  argumentProps: Set<string>;
  memberProps: Set<string>;
  state: Set<string>;
  componentMembers: Set<string>;
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

export function isJSXExpression(code) {
  try {
    const ast = templateToAst(code);
    return ast && ast.expression && t.isJSX(ast.expression);
  } catch (e) {
    return false;
  }
}

export async function importReactIfNeeded(filePath) {
  const file = readFileContent(filePath);
  const ast = codeToAst(file);

  const reactImport = getReactImportReference(ast);

  if (!reactImport) {
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier("React"))],
        t.stringLiteral("react")
      )
    );
  }
  const code = transformFromAst(ast).code;

  return prependTextToFile(code, filePath);
}

