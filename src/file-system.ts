import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { sync as globSync } from 'glob';
import * as gitignoreToGlob from 'gitignore-to-glob';
import { workspaceRoot } from './editor';
import * as lineColumn from 'line-column';
import * as prependFile from 'prepend-file';


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
  return new Promise((resolve, reject) => {
    prependFile(absolutePath, text, err => {
      if (err) {
        reject(err);
      }
      resolve(absolutePath);
    });
  });
}

const invertGlob = pattern => pattern.replace(/^!/, '');

export const gitIgnoreFolders = () => {
  const pathToLocalGitIgnore = workspaceRoot() + '/.gitignore';
  return fs.existsSync(pathToLocalGitIgnore) ? gitignoreToGlob(pathToLocalGitIgnore).map(invertGlob) : [];
};

export function removeContentFromFileAtLineAndColumn(start, end, path, replacement) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', function (err, content) {
      if (err) {
        reject(err);
      }
      const lineColumnFinder = lineColumn(content, { origin: 0 });
      const startIndex = lineColumnFinder.toIndex(start.line, start.character);
      const endIndex = lineColumnFinder.toIndex(end.line, end.character);
      var result = content.substr(0, startIndex) + replacement + content.substr(endIndex);

      fs.writeFile(path, result, 'utf8', function (err) {
        if (err) reject(err);

        resolve(path);
      });
    });
  });

}
