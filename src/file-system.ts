import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { sync as globSync } from 'glob';
import * as gitignoreToGlob from 'gitignore-to-glob';
import { workspaceRoot, activeURI } from './editor';
import * as vscode from 'vscode';
import { Position, Uri } from 'vscode';

export function createFileIfDoesntExist(absolutePath: string): string {
  let directoryToFile = path.dirname(absolutePath);
  if (!fs.existsSync(absolutePath)) {
    mkdirp.sync(directoryToFile);
    fs.appendFileSync(absolutePath, '');
  }

  return absolutePath;
}

export function readFileContent(absolutePath) {
  return fs.readFileSync(absolutePath, 'utf8');
}

export function subfoldersListOf(root: string, ignoreList): string[] {
  if (!root) {
    return [];
  }

  const results = globSync('**', { cwd: root, ignore: ignoreList })
    .filter(f => fs.statSync(path.join(root, f)).isDirectory())
    .map(f => '/' + f);

  return results;
}

export function filesInFolder(folder): string[] {
  const root = workspaceRoot();
  const fullPathToFolder = root ? `${root}${folder}` : folder;
  const results = globSync('**', { cwd: fullPathToFolder })
    .filter(f => !fs.statSync(path.join(fullPathToFolder, f)).isDirectory());

  return results;
}

export const replaceTextInFile = (text, start: vscode.Position, end: vscode.Position, path) => edit => edit.replace(Uri.file(path), new vscode.Range(start, end), text); 

export async function appendTextToFile(text, absolutePath) {
  const edit = new vscode.WorkspaceEdit();
  const linesInFile = await countLineInFile(absolutePath);

  edit.insert(Uri.file(absolutePath), new Position(linesInFile, 0), text);
  return vscode.workspace.applyEdit(edit);

  // return new Promise((resolve, reject) => {
  //   fs.appendFile(absolutePath, text, function (err) {
  //     if (err)
  //       reject(err);
  //     resolve(absolutePath);
  //   });
  // });
}

export function persistFileSystemChanges(...changes) {
  const accumulatedEdit = new vscode.WorkspaceEdit();
  changes.forEach(addChangeTo => addChangeTo(accumulatedEdit))
  return vscode.workspace.applyEdit(accumulatedEdit);
}

export function prependTextToFile(text, absolutePath) {
  const edit = new vscode.WorkspaceEdit();
  edit.insert(Uri.file(absolutePath), new vscode.Position(0, 0), text);
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


function countLineInFile(file): Promise<number> {
  return new Promise(reoslve => {
    let i;
    let count = 0;
    fs.createReadStream(file)
      .on('data', function (chunk) {
        for (i = 0; i < chunk.length; ++i)
          if (chunk[i] == 10) count++;
      })
      .on('end', function () {
        reoslve(count);
      });
  })

}