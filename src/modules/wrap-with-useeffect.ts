import { selectedText, importMissingDependencies, activeFileName, allText } from "../editor";
import { replaceSelectionWith } from "../code-actions";
import { buildEffectHook } from "../snippet-builder";
import { codeToAst, astToCode } from "../parsing";
import { persistFileSystemChanges } from "../file-system";
import * as t from '@babel/types';
import { findPathInContext } from "../ast-helpers";


export async function isInsideOfFunctionBody(text) {
    try {
        const allAST = codeToAst(allText());
        const containerPath = findPathInContext(allAST, text);
        return !!containerPath.findParent(parent => {
            return t.isFunctionExpression(parent)
        });
    } catch (e) {
        return false;
    }
}
export async function wrapWithUseEffect() {
    const snippet = selectedText();
    const ast = codeToAst(snippet);
    const effectWrapper = buildEffectHook({
        EFFECT: t.arrowFunctionExpression([], t.blockStatement(ast.program.body))
    });

    await persistFileSystemChanges(replaceSelectionWith(astToCode(t.program([effectWrapper]))));

    return importMissingDependencies(activeFileName());
}