import * as vscode from "vscode";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as path from "path";
import * as fs from "fs-extra";
import outdent from "outdent";
import { e2eSetup, TEST_TEMP_PATH } from "./setup.test";

chai.use(sinonChai);
const expect = chai.expect;

describe.only("extract to component", function() {
  let sandbox;

  e2eSetup();

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const openWorksapce = (folder: string) => {
    const workspacefolders = vscode.workspace.workspaceFolders || 0;
    vscode.workspace.updateWorkspaceFolders(
      0,
      workspacefolders && workspacefolders.length,
      {
        uri: vscode.Uri.file(folder)
      }
    );
  };

  it("exports selected component to a chosen new target file", async () => {
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

    openWorksapce(TEST_TEMP_PATH);
    const document = await vscode.workspace.openTextDocument(sourceFilePath);
    const editor = await vscode.window.showTextDocument(document);

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
});
