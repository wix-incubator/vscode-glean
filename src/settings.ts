import * as vscode from 'vscode';
import * as path from 'path';

const config = () => vscode.workspace.getConfiguration('extract-to-file');

export const shouldBeConsideredJsFiles = (...files) => {
    const extentionsToBeConsideredJS = config().jsFilesExtentions;
    return files.every(file => extentionsToBeConsideredJS.includes(path.extname(file).replace('.','')));
}

export const commonJSModuleSystemUsed = () => config().jsModuleSystem === 'commonjs'


export const esmModuleSystemUsed = () => config().jsModuleSystem === 'esm';