import { parse } from 'babylon';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import {transformFromAst} from '@babel/core';


export function getIdentifier(code) {
    const identifiers = [];
    const Visitor = {
        Identifier(path) {
            if (path.parentPath.parent.type === 'Program' || path.parentPath.parent.type  === 'File') {
                identifiers.push(path.node.name);
            }
        }
    };

    const ast = parse(code, {
        plugins: [
            "typescript"
          ],
          sourceType: "module"
    });

    traverse(ast, Visitor);

    return identifiers;
}

export function generateImportStatementFromFile(identifier, modulePath) {
    return `import { ${identifier.join(', ')} } from './${modulePath}';\n`;
}

export function exportAllDeclarations(code) {

    
    const ast = parse(code, {
        plugins: [
            "typescript"
          ],
          sourceType: "module"
    });

    const visitor = {
      Declaration(path) {
        if (path.parent.type === 'Program' && !path.node.type.includes('Export')) {
          path.replaceWith(t.exportNamedDeclaration(path.node, []));
        }
      }
    
    };

    traverse(ast, visitor);
    
    return transformFromAst(ast).code;
    
}
