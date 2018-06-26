import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { sync as globSync } from 'glob';
import * as gitignoreToGlob from 'gitignore-to-glob';
import { workspaceRoot, activeURI } from './editor';
import * as lineColumn from 'line-column';
import * as prependFile from 'prepend-file';
import * as vscode from 'vscode';

export function createFileIfDoesntExist(absolutePath: string): string {
  let directoryToFile = path.dirname(absolutePath);
  if (!fs.existsSync(absolutePath)) {
    mkdirp.sync(directoryToFile);
    fs.appendFileSync(absolutePath, '');
  }

  return absolutePath;
}

export function subfoldersListOf(root: string, ignoreList): string[] {

  const results = globSync('**', { cwd: root, ignore: ignoreList })
    .filter(f => fs.statSync(path.join(root, f)).isDirectory())
    .map(f => '/' + f);

  return results;
}

export function filesInFolder(folder): string[] {
  const root = workspaceRoot();
  const fullPathToFolder = `${root}${folder}`;
  const results = globSync('**', { cwd: fullPathToFolder })
    .filter(f => !fs.statSync(path.join(fullPathToFolder, f)).isDirectory());

  return results;
}

export function appendTextToFile(text, absolutePath) {
  return new Promise((resolve, reject) => {
    fs.appendFile(absolutePath, text, function (err) {
      if (err)
        reject(err);
      resolve(absolutePath);
    });
  });
}

export function prependTextToFile(text, absolutePath) {
  let edit = new vscode.WorkspaceEdit();
  edit.insert(vscode.Uri.parse(`file://${absolutePath}`), new vscode.Position(0, 0), text);
  return vscode.workspace.applyEdit(edit);
}

const invertGlob = pattern => pattern.replace(/^!/, '');

export const gitIgnoreFolders = () => {
  const pathToLocalGitIgnore = workspaceRoot() + '/.gitignore';
  return fs.existsSync(pathToLocalGitIgnore) ? gitignoreToGlob(pathToLocalGitIgnore).map(invertGlob) : [];
};

export function removeContentFromFileAtLineAndColumn(start, end, path, replacement) {
  let edit = new vscode.WorkspaceEdit();
  edit.delete(activeURI(), new vscode.Range(start, end));
  return vscode.workspace.applyEdit(edit);
};
