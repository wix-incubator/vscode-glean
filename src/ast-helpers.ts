import * as t from "@babel/types";
import traverse from "@babel/traverse";


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

export function findPathInContext(ast, identifierName) {
  let foundPath = null;
  const visitor = {
    Identifier(path) {
      if (!foundPath && path.node.name === identifierName) {
        foundPath = path;
      }
    }
  };

  traverse(ast, visitor);
  return foundPath;
}

export function findFirstPathInRange(ast, start, end) {
  let foundPath = null;
  const visitor = {
    enter(path) {
      if (!foundPath && pathInRange(path, start, end)) {
        foundPath = path;
        path.stop();
      }
    }
  };

  traverse(ast, visitor);
  return foundPath;
}


export function pathInRange(path, start, end) {
  if (!path.node) return false;
  const pathStart = path.node.loc.start;
  const pathEnd = path.node.loc.end;
  return (pathStart.line >= start.line && pathStart.column >= start.character)

}

export function pathContains(path, start, end) {
  if (!path.node) return false;
  const pathStart = path.node.loc.start;
  const pathEnd = path.node.loc.end;
  return (
    (
      (pathStart.line === start.line && pathStart.column >= start.character)) &&
    (
      (pathEnd.line >= end.line && pathEnd.column >= end.character))
  );
}
