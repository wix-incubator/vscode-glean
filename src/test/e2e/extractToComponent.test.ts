import * as chai from "chai";
import * as fs from "fs-extra";
import outdent from "outdent";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as vscode from "vscode";
import * as environment from "./environment";
import { extensionDriver } from "./extensionDriver";

chai.use(sinonChai);
const expect = chai.expect;

describe("extract to component", function() {
  let env: environment.Environment;

  beforeEach(async () => {
    env = await environment.setup();
  });

  afterEach(async () => {
    await env.teardown();
  });

  it("extract to new file", async () => {
    const sourceFileName = "ExtractToNewFile_Source.jsx";
    const targetFileName = "ExtractToNewFile_Target.jsx";

    const sourceFileContents = outdent`
        const ParentComp = () => (
            <div>
                <div>let's extract this div</div>
            </div>
        )
    `;
    const expectedTargetFileContents = outdent`
        export function ExtractToNewFile_Target({}) {
          return <div>let's extract this div</div>;
        }
      `;

    fs.writeFileSync(env.getAbsolutePath(sourceFileName), sourceFileContents);

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toNewFile(".", targetFileName);

    const targetDocumentText = await driver.getDocumentText(targetFileName);
    expect(targetDocumentText).to.equal(expectedTargetFileContents);
  });

  it("extract to existing file,and prompt for component name", async () => {
    const sourceFileName = "ExtractToEXistingFile_Source.jsx";
    const existingFileName = "ExtractToEXistingFile_Existing.jsx";

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

    fs.writeFileSync(env.getAbsolutePath(sourceFileName), sourceFileContents);
    fs.writeFileSync(
      env.getAbsolutePath(existingFileName),
      existingFileContents
    );

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toExistingFile(".", existingFileName, "Target");

    const targetDocumentText = await driver.getDocumentText(existingFileName);
    expect(targetDocumentText).to.equal(expectedTargetFileContents);
  });
});
