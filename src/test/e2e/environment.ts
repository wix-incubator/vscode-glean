import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";

let runningWorkspaceIndex = 0;

export interface TestEnvironment {
  workspaceRootPath: string;
}

const workspaceFolderRoot = index =>
  path.join(vscode.workspace.rootPath, `workspace_${index}`);

const setup = async (): Promise<TestEnvironment> => {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  const workspaceRootPath = workspaceFolderRoot(++runningWorkspaceIndex);
  await fs.emptyDir(workspaceRootPath);
  return { workspaceRootPath };
};

const teardown = async (environment: TestEnvironment) => {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  await fs.remove(environment.workspaceRootPath);
};

const preDefineWorkspaceFolders = async numberOfFolders => {
  const folders = [];
  for (var index = 1; index <= numberOfFolders; index++) {
    folders.push({
      uri: vscode.Uri.file(workspaceFolderRoot(index))
    });
  }
  vscode.workspace.updateWorkspaceFolders(
    vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders.length
      : 0,
    null,
    ...folders
  );
};

export const prepare = () => {
  let numberOfRequiredEnvironments = 0;

  before(async () => {
    await new Promise(resolve => setTimeout(resolve, 100)); // vscode needs time to warm up, welcome screens to load, etc...
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await preDefineWorkspaceFolders(numberOfRequiredEnvironments); // updating workspace folders before & after each tests currently causes different sorts of bugs. see vscode issues.
  });

  const testWithEnv = (description, testCallback) => {
    numberOfRequiredEnvironments++;
    return it(description, async () => {
      const env = await setup();
      try {
        await testCallback(env);
      } finally {
        await teardown(env);
      }
    });
  };

  return testWithEnv;
};
