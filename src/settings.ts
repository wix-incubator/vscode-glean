import * as vscode from 'vscode';
import * as path from 'path';


export const shouldBeConsideredJsFiles = (...files) => {
    const extentionsToBeConsideredJS = vscode.workspace.getConfiguration('extract-to-file').jsFilesExtentions;
    return files.every(file => extentionsToBeConsideredJS.includes(path.extname(file).replace('.','')));
}