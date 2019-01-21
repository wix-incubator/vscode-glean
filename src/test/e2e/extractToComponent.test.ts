import * as vscode from "vscode";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as path from "path";
import * as fs from "fs-extra";
import outdent from "outdent";

chai.use(sinonChai);
const expect = chai.expect;

describe("extract to component", function() {
  let sandbox;
  let relativeTestRoot;
  let absoluteTestRoot;
  let testIdx = 1;

  beforeEach(() => {
    relativeTestRoot = `test_${testIdx++}`;
    absoluteTestRoot = path.join(vscode.workspace.rootPath, relativeTestRoot);
    fs.emptyDirSync(absoluteTestRoot);
  });

  afterEach(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    expect(vscode.window.visibleTextEditors.length).to.eq(0);
    fs.removeSync(absoluteTestRoot);
  });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const openDocument = async (path: string) => {
    const document = await vscode.workspace.openTextDocument(path);
    const editor = await vscode.window.showTextDocument(document, 1);
    return editor;
  };

  it("extract to new file", async () => {
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

    const sourceFilePath = path.join(absoluteTestRoot, "source.jsx");
    const targetFilePath = path.join(absoluteTestRoot, "target.jsx");
    fs.writeFileSync(sourceFilePath, sourceFileContents);

    const editor = await openDocument(sourceFilePath);

    editor.selection = new vscode.Selection(2, 0, 3, 0);

    sandbox
      .stub(vscode.window, "showQuickPick")
      .onFirstCall()
      .returns(Promise.resolve({ label: `${relativeTestRoot}/` }))
      .onSecondCall()
      .returns(Promise.resolve({ label: "Create New File" }));

    sandbox
      .stub(vscode.window, "showInputBox")
      .onFirstCall()
      .returns(Promise.resolve(`${relativeTestRoot}/target.jsx`));

    await vscode.commands.executeCommand(
      "extension.glean.react.extract-component"
    );

    const targetDocument = await vscode.workspace.openTextDocument(
      targetFilePath
    );

    expect(targetDocument.getText()).to.equal(expectedTargetFileContents);
  });

  it("extract to existing file,and prompt for component name", async () => {
    const sourceFileContents = outdent`
        const SomeParentComp = () => (
            <div>
                <span>some content</span>
            </div>
        )
    `;
    const expectedTargetFileContents = outdent`
        export function Existing({}) {
          return (<div />)
        }
        export function Target({}) {
          return <span>some content</span>;
        }
      `;

    const existingFileContents = outdent`
      export function Existing({}) {
        return (<div />)
      }

    `;

    const sourceFilePath = path.join(absoluteTestRoot, "source.jsx");
    fs.writeFileSync(sourceFilePath, sourceFileContents);
    const targetFilePath = path.join(absoluteTestRoot, "existing.jsx");
    fs.writeFileSync(targetFilePath, existingFileContents);

    const editor = await openDocument(sourceFilePath);
    editor.selection = new vscode.Selection(2, 0, 3, 0);

    sandbox
      .stub(vscode.window, "showQuickPick")
      .onFirstCall()
      .returns(Promise.resolve({ label: `${relativeTestRoot}/` }))
      .onSecondCall()
      .returns(Promise.resolve({ label: "existing.jsx" }));

    sandbox
      .stub(vscode.window, "showInputBox")
      .returns(Promise.resolve("Target"));

    await vscode.commands.executeCommand(
      "extension.glean.react.extract-component"
    );

    const targetDocument = await vscode.workspace.openTextDocument(
      targetFilePath
    );
    const actualTargetContent = targetDocument.getText();

    expect(actualTargetContent).to.equal(expectedTargetFileContents);
  });
});
