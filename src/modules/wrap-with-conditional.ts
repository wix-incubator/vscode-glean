import { activeEditor, selectedText, allText, selectedTextStart, selectedTextEnd } from "../editor";

import { isJSXExpression } from "./jsx";

import { SnippetString } from "vscode";

import { handleError } from "../code-actions";
import { codeToAst } from "../parsing";
import { traverse } from "@babel/types";
import * as t from "@babel/types";

function isRangeContainedInJSXExpression(code, start, end) {
  try {
    const ast = codeToAst(code);
    const path = findContainerPath(ast, start, end);
    return path && t.isJSX(path.node) && t.isExpression(path.node);
  } catch (e) {
    return false;
  }
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


export async function wrapJSXWithCondition() {
  var editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const selText = selectedText();
    const isParentJSXExpression = isRangeContainedInJSXExpression(allText(), selectedTextStart(), selectedTextEnd());
    const conditionalJSX = isJSXExpression(selText) ? selText : `<>${selText}</>`;
    const snippetInnerText = `\n$\{1:true\}\n? ${conditionalJSX}\n: $\{2:null\}\n`;
    const snippetText = isParentJSXExpression ? `{${snippetInnerText}}` : `(${snippetInnerText})`;
    await editor.insertSnippet(new SnippetString(snippetText));
  } catch (e) {
    handleError(e);
  }
}
