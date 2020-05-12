import { selectedText, importMissingDependencies, activeFileName, allText, selectedTextStart, selectedTextEnd } from "../editor";
import { replaceSelectionWith } from "../code-actions";
import { buildEffectHook, buildUseCallbackHook } from "../snippet-builder";
import { codeToAst, astToCode } from "../parsing";
import { persistFileSystemChanges } from "../file-system";
import * as t from '@babel/types';
import { pathContains } from "../ast-helpers";
import traverse from "@babel/traverse";


function isFunctionExpression(path) {
    return t.isVariableDeclaration(path) || t.isFunctionExpression(path.node.init)
}

function isFunction(path) {
    return (t.isFunctionDeclaration(path) || isFunctionExpression(path))
}


export function findSelectedFunctionInRange(ast, start, end) {
    let foundPath = null;
    const visitor = {
        'VariableDeclaration|FunctionDeclaration'(path) {
            if (!foundPath && pathContains(path, start, end)) {
                foundPath = path;
            }
        }
    };

    traverse(ast, visitor);
    return foundPath;
}

export function isFunctionInsideAFunction() {
    try {
        const allAST = codeToAst(allText());
        const containerPath = findSelectedFunctionInRange(allAST, selectedTextStart(), selectedTextEnd());
        return isFunction(containerPath) && t.isBlockStatement(containerPath.parent)
    } catch (e) {
        return false;
    }
}

function functionDeclartionToExpression(declarations: t.FunctionDeclaration) {
    const { params, body, generator, async } = declarations
    return t.functionExpression(null, params, body, generator, async)
}

export async function wrapWithUseCallback() {
    const snippet = selectedText();
    const ast = codeToAst(snippet);
    const callackWrapper = buildUseCallbackHook({
        CALLBACK: t.isFunctionDeclaration(ast.program.body[0]) ? functionDeclartionToExpression(ast.program.body[0] as t.FunctionDeclaration) : (ast.program.body[0] as t.VariableDeclaration).declarations[0].init
    });

    const callbackId = t.isFunctionDeclaration(ast.program.body[0]) ? (ast.program.body[0] as t.FunctionDeclaration).id : (ast.program.body[0] as t.VariableDeclaration).declarations[0].id;

    await persistFileSystemChanges(replaceSelectionWith(astToCode(t.program([t.variableDeclaration('const', [t.variableDeclarator(callbackId, callackWrapper.expression)])]))));

    return importMissingDependencies(activeFileName());
}