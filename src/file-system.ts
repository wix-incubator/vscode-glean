import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { sync as globSync } from 'glob';
import * as gitignoreToGlob from 'gitignore-to-glob';
import { workspaceRoot } from './editor';


export function createFileIfDoesntExist(absolutePath: string): string {
    let directoryToFile = path.dirname(absolutePath);
    if (!fs.existsSync(absolutePath)) {
      mkdirp.sync(directoryToFile);
      fs.appendFileSync(absolutePath, '');
    }
  
    return absolutePath;
  }

export function subfoldersListOf(root: string, ignoreList): string[] {
    
    const results = globSync('**', { cwd: root, ignore: ignoreList})
      .filter(f => fs.statSync(path.join(root, f)).isDirectory())
      .map(f => '/' + f);
  
    return results;
  }
  
  
  export function appendTextToFile(text, absolutePath) {
    new Promise((resolve, reject) => {
        fs.appendFile(absolutePath, text, function (err) {
          if (err)
            reject(err);
          resolve(absolutePath);
        });
      });
  }

  const invertGlob = pattern => pattern.replace(/^!/, '');
  
  export const gitIgnoreFolders = () => gitignoreToGlob(workspaceRoot() + '/.gitignore').map(invertGlob);