import { TestEnvironment } from "./environment";
import { Selection } from "vscode";
import * as sinon from "sinon";
import * as path from "path";

const runInSandbox = async <T>(
  cb: (sandbox: sinon.SinonSandbox) => Promise<T>
): Promise<T> => {
  const sandbox = sinon.sandbox.create();
  try {
    return await cb(sandbox);
  } finally {
    sandbox.restore();
  }
};

export const extensionDriver = (vscode, env: TestEnvironment) => {
  const openDocument = async (path: string) => {
    const document = await vscode.workspace.openTextDocument(path);
    const editor = await vscode.window.showTextDocument(document, 1);
    return editor;
  };

  const extractComponent = (
    sourceFileRelativePath: string,
    selection: Selection
  ) => {
    const runCommand = async () => {
      const editor = await openDocument(
        path.join(env.workspaceRootPath, sourceFileRelativePath)
      );
      editor.selection = selection;
      await vscode.commands.executeCommand(
        "extension.glean.react.extract-component"
      );
    };

    return {
      toNewFile: (folder: string, targetFileName: string) =>
        runInSandbox(async sandbox => {
          sandbox
            .stub(vscode.window, "showQuickPick")
            .onFirstCall() // select folder
            .returns(Promise.resolve({ label: folder }))
            .onSecondCall() // select file
            .returns(Promise.resolve({ label: "Create New File" }));

          sandbox
            .stub(vscode.window, "showInputBox")
            .onFirstCall() // choose file name
            .returns(Promise.resolve(`/${targetFileName}`));

          await runCommand();
        }),

      toExistingFile: (
        folder: string,
        existingFileName: string,
        newComponentName: string
      ) =>
        runInSandbox(async sandbox => {
          sandbox
            .stub(vscode.window, "showQuickPick")
            .onFirstCall() // select folder
            .callsFake(() => {
              return Promise.resolve({ label: folder });
            })
            .onSecondCall() // select file
            .returns(Promise.resolve({ label: existingFileName }));

          sandbox
            .stub(vscode.window, "showInputBox")
            .onFirstCall() // choose component name
            .returns(Promise.resolve(newComponentName));

          await runCommand();
        })
    };
  };

  return {
    extractComponent
  };
};
