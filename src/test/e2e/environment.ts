import * as fs from "fs-extra";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";
import * as sinon from "sinon";

/**
 * Adding new workspaces doesn't work. It causes the test runner to restart.
 * After the issue is resolved we may create a fresh folder for each test and set it as the workspace.
 * Until then, make sure to create unique names for files that are opened by tests,
 * because COLLISIONS MAY BREAK TESTS!
 *
 * see: https://github.com/Microsoft/vscode/issues/66936
 *
 * const addNewWorkspace = async (absolutePath) =>
 *   new Promise(resolve => {
 *     vscode.workspace.onDidChangeWorkspaceFolders(e => {
 *       resolve();
 *     });
 *
 *     vscode.workspace.updateWorkspaceFolders(
 *       vscode.workspace.workspaceFolders
 *         ? vscode.workspace.workspaceFolders.length
 *         : 0,
 *       0,
 *       { uri: vscode.Uri.file(absolutePath) }
 *     );
 *   });
 */

export interface Environment {
  rootPath: string;
  teardown: () => Promise<void>;
  getAbsolutePath: (relativePath: string) => string;
}

const cleanRootDir = async rootDirPath => {
  await promisify(fs.emptyDir)(rootDirPath);
  const gitKeepPath = path.join(rootDirPath, ".gitkeep");
  await fs.createFileSync(gitKeepPath);
};

export const setup = async (): Promise<Environment> => {
  const rootPath = vscode.workspace.rootPath;
  await cleanRootDir(rootPath);

  // await addNewWorkspace(absolutePath);

  const teardown = async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await cleanRootDir(rootPath);
  };

  const getAbsolutePath = (relativePath: string) =>
    path.join(rootPath, relativePath);

  return { rootPath, teardown, getAbsolutePath };
};
