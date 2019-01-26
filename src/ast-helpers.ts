import * as t from "@babel/types";

export function getReactImportReference(ast): t.ImportDeclaration {
  return ast.program.body.find(statement => {
    return (
      t.isImportDeclaration(statement) && statement.source.value === "react"
    );
  });
}

export function isExportedDeclaration(ast) {
  return t.isExportNamedDeclaration(ast) || t.isExportDefaultDeclaration(ast);
}
