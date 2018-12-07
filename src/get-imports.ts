import { jsxToAst } from './modules/jsx';
import { allText } from './editor';
import traverse from '@babel/traverse';
import { File } from '@babel/types';
import { transformFromAstSync } from '@babel/core';

export default function getImports(code: string): string {
  let imports: Array<string> = [];
  let sourceAst: File = jsxToAst(allText());
  sourceAst.program.body = sourceAst.program.body.filter(bodyItem => bodyItem.type === 'ImportDeclaration');

  const visitor = {
    JSXIdentifier(path) {
      if (path.container.type === 'JSXOpeningElement') {
        imports = [...imports, path.node.name];
      }
    },
  };

  // include React from Source
  imports = [...imports, 'React'];
  const ast: File = jsxToAst(code);

  traverse(ast, visitor);

  sourceAst.program.body = sourceAst.program.body.filter(imp => {
    imp.specifiers = imp.specifiers.filter(spec => imports.includes(spec.local.name));
    if (imp.specifiers.length > 0) { return true; }
    return false;
  });
  const importsFromSource: string = transformFromAstSync(sourceAst).code;
  // check Source For Exsisting Imports
  return importsFromSource + '\n';
}
