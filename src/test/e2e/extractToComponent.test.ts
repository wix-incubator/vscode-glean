import * as vscode from "vscode";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as path from "path";
import * as fs from "fs";
import * as detent from "dedent";

chai.use(sinonChai);
const expect = chai.expect;

const TEST_ROOT_PATH = vscode.workspace.rootPath;

describe("extract to component", function() {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it.only("exports selected component to a chosen new target file", async () => {
    const sourceFileContents = detent`
        const ParentComp = () => (
            <div>
                <div>let's extract this div</div>
            </div>
        )
    `;
    const expectedTargetFileContents = detent`
        export function Target({}) {
            return <div>let's extract this div</div>;
        }
    `;

    const sourceFilePath = path.join(TEST_ROOT_PATH, "source.js");
    const targetFilePath = path.join(TEST_ROOT_PATH, "extracted", "target.js");

    fs.writeFileSync(sourceFilePath, sourceFileContents);

    const document = await vscode.workspace.openTextDocument(sourceFilePath);
    const editor = await vscode.window.showTextDocument(document);

    editor.selection = new vscode.Selection(2, 0, 3, 0);

    sandbox
      .stub(vscode.window, "showQuickPick")
      .onFirstCall()
      .returns(Promise.resolve({ label: "/extracted" }))
      .onSecondCall()
      .returns(Promise.resolve({ label: "target.js" }));

    await vscode.commands.executeCommand(
      "extension.glean.react.extract-component"
    );

    const targetDocument = await vscode.workspace.openTextDocument(
      targetFilePath
    );

    expect(targetDocument.getText()).to.equal(expectedTargetFileContents);
  });
});
