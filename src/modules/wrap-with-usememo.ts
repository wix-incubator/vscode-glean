import { selectedText, importMissingDependencies, activeFileName, allText, selectedTextStart, selectedTextEnd } from "../editor";
import { replaceSelectionWith } from "../code-actions";
import { buildEffectHook, buildUseCallbackHook, buildUseMemo } from "../snippet-builder";
import { codeToAst, astToCode } from "../parsing";
import { persistFileSystemChanges } from "../file-system";
import * as t from '@babel/types';
import { pathContains } from "../ast-helpers";
import traverse from "@babel/traverse";


function isFunction(node) {
    return t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)
}

export function isVariableDeclarationWithNonFunctionInit(text) {
    try {
        const ast = codeToAst(text);
        if (ast.program.body.length > 1) return false;
        return t.isVariableDeclaration(ast.program.body[0]) && !isFunction((ast.program.body[0] as t.VariableDeclaration).declarations[0].init);
    } catch (e) {
        return false;
    }
}

export async function wrapWithUseMemo() {
    const snippet = selectedText();
    const ast = codeToAst(snippet);
    const memoWrapper = buildUseMemo({
        VAR: (ast.program.body[0] as t.VariableDeclaration).declarations[0].id,
        EXPRESSION: (ast.program.body[0] as t.VariableDeclaration).declarations[0].init
    });

    await persistFileSystemChanges(replaceSelectionWith(astToCode(t.program([memoWrapper]))));

    return importMissingDependencies(activeFileName());
}