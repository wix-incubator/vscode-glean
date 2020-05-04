import { codeToAst } from "../parsing";
import { selectedText, allText, selectedTextStart, selectedTextEnd, activeFileName, activeEditor, showInputBox } from "../editor";
import traverse from "@babel/traverse";
import { transformFromAst } from "@babel/core";
import { window, Position, Range } from "vscode";
import { persistFileSystemChanges, replaceTextInFile } from "../file-system";
import { capitalizeFirstLetter } from "../utils";
import * as t from "@babel/types";
import { findPathInContext } from "../ast-helpers";

function isPathOnLines(path, start, end) {
    if (!path.node) return false;
    const pathStart = path.node.loc.start;
    const pathEnd = path.node.loc.end;
    return (
        (pathStart.line === start.line && pathStart.column === start.character) &&
        (pathEnd.line === end.line && pathEnd.column === end.character))

}

export function isStateVariable(text) {
    try {
        const allAST = codeToAst(allText());
        const containerPath = findPathInContext(allAST, text);
        const variableDeclarationParent = containerPath.findParent(parent => t.isVariableDeclaration(parent));
        return variableDeclarationParent && variableDeclarationParent.node.declarations[0].init.callee.name === 'useState'
    } catch (e) {
        return false;
    }
}

export async function renameState() {
    const selectedStateVariable = selectedText();
    const varName = await showInputBox(null, 'Name of the state variable');

    const allAST = codeToAst(allText());
    const containerPath = findPathInContext(allAST, selectedStateVariable);
    const variableDeclarationParent = containerPath.findParent(parent => t.isVariableDeclaration(parent));
    if (variableDeclarationParent && variableDeclarationParent.node.declarations[0].init.callee.name === 'useState') {
        containerPath.scope.bindings[selectedStateVariable].path.parentPath.get('declarations.0.id.elements.0').scope.rename(selectedStateVariable, varName);
        containerPath.scope.bindings[varName].path.parentPath.get('declarations.0.id.elements.1').scope.rename(`set${capitalizeFirstLetter(selectedStateVariable)}`, `set${capitalizeFirstLetter(varName)}`);

        const processedJSX = transformFromAst(allAST).code;
        console.log(processedJSX);
        const endLine = activeEditor().document.lineAt(activeEditor().document.lineCount - 1).range;
        const change = replaceTextInFile(
            processedJSX,
            new Position(0, 0),
            endLine.end,
            activeFileName()
        );


        return persistFileSystemChanges(change)

    }
}
