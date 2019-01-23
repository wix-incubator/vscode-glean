import * as vscode from "vscode";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as path from "path";
import * as fs from "fs-extra";
import outdent from "outdent";
import { e2eSetup } from "./setup";

export const TEST_TEMP_PATH = path.join(__dirname, "../../../", ".tmp");

chai.use(sinonChai);
const expect = chai.expect;

describe.only("extract to component", function() {
  this.timeout(1000000000);
  let sandbox;

  beforeEach(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    fs.emptyDirSync(TEST_TEMP_PATH);
    expect(fs.existsSync(path.join(TEST_TEMP_PATH, "source.jsx"))).to.eq(false);
  });

  after(() => {
    fs.removeSync(TEST_TEMP_PATH);
  });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  before(async () => {
    console.log("*** before");
    await openWorksapce(TEST_TEMP_PATH);
  });

  const openWorksapce = (folder: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let workspacefolders = vscode.workspace.workspaceFolders || [];
      // if (workspacefolders.length) {
      //   if (
      //     !vscode.workspace.updateWorkspaceFolders(0, workspacefolders.length)
      //   ) {
      //     reject("failed 1");
      //   }
      // }

      const res = vscode.workspace.updateWorkspaceFolders(
        0,
        workspacefolders.length || null,
        {
          uri: vscode.Uri.file(folder)
        }
      );
      if (!res) {
        // reject("updateWorkspaceFolders failed 2");
      }

      vscode.workspace.onDidChangeWorkspaceFolders(() => resolve());
    });
  };

  const openDocument = async (path: string, workspacePath?: string) => {
    // if (workspacePath) {
    //   await openWorksapce(workspacePath);
    // }
    const document = await vscode.workspace.openTextDocument(path);
    const editor = await vscode.window.showTextDocument(document);
    return editor;
  };

  it("extract to new file", async () => {
    console.log("***", "Test 1: extract to new file");

    const sourceFileContents = outdent`
        const ParentComp = () => (
            <div>
                <div>let's extract this div</div>
            </div>
        )
    `;
    const expectedTargetFileContents = outdent`
        
        export function Target({}) {
          return <div>let's extract this div</div>;
        }
          
      `;

    const sourceFilePath = path.join(TEST_TEMP_PATH, "source.jsx");
    const targetFilePath = path.join(TEST_TEMP_PATH, "target.jsx");
    fs.writeFileSync(sourceFilePath, sourceFileContents);

    const editor = await openDocument(sourceFilePath, TEST_TEMP_PATH);

    editor.selection = new vscode.Selection(2, 0, 3, 0);

    sandbox
      .stub(vscode.window, "showQuickPick")
      .onFirstCall()
      .returns(Promise.resolve({ label: "/" }))
      .onSecondCall()
      .returns(Promise.resolve({ label: "Create New File" }));

    sandbox
      .stub(vscode.window, "showInputBox")
      .onFirstCall()
      .returns(Promise.resolve("target.jsx"));

    await vscode.commands.executeCommand(
      "extension.glean.react.extract-component"
    );

    const targetDocument = await vscode.workspace.openTextDocument(
      targetFilePath
    );

    expect(targetDocument.getText()).to.equal(expectedTargetFileContents);
  });

  // it("extract to existing file,and prompt for component name", async () => {
  //   console.log('***', 'Test 2 ');

  //   const sourceFileContents = outdent`
  //       const ParentComp = () => (
  //           <div>
  //               <span>some content</span>
  //           </div>
  //       )
  //   `;
  //   const expectedTargetFileContents = outdent`

  //       export function Existing({}) {
  //         return (<div />)
  //       }

  //       export function Target({}) {
  //         return <span>some content</span>;
  //       }

  //     `;

  //   const existingFileContents = outdent`

  //     export function Existing({}) {
  //       return (<div />)
  //     }

  //   `;

  //   const sourceFilePath = path.join(TEST_TEMP_PATH, "source.jsx");
  //   fs.writeFileSync(sourceFilePath, sourceFileContents);
  //   const targetFilePath = path.join(TEST_TEMP_PATH, "existing.jsx");
  //   fs.writeFileSync(targetFilePath, existingFileContents);

  //   const editor = await openDocument(sourceFilePath, TEST_TEMP_PATH);

  //   editor.selection = new vscode.Selection(2, 0, 3, 0);
  //   // await new Promise(r => setTimeout(r, 100))

  //   sandbox
  //     .stub(vscode.window, "showQuickPick")
  //     .onFirstCall()
  //     .returns(Promise.resolve({ label: "." }))
  //     .onSecondCall()
  //     .returns(Promise.resolve({ label: "existing.jsx" }));

  //   sandbox
  //     .stub(vscode.window, "showInputBox")
  //     .returns(Promise.resolve("Target"));

  //   await vscode.commands.executeCommand(
  //     "extension.glean.react.extract-component"
  //   );

  //   await new Promise(r => setTimeout(r, 1000));

  //   const targetDocument = await vscode.workspace.openTextDocument(
  //     targetFilePath
  //   );
  //   const actualTargetContent = targetDocument.getText();

  //   expect(actualTargetContent).to.equal(expectedTargetFileContents);
  // });
});
