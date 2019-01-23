import * as chai from "chai";
import * as fs from "fs-extra";
import outdent from "outdent";
import * as vscode from "vscode";
import * as environment from "./environment";
import { extensionDriver } from "./extensionDriver";

const expect = chai.expect;

const stripSpaces = str => str.replace(/[\s\n]/g, ""); // TODO: stop using once formatting is defined and fixed

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

    const originalSourceFileContent = outdent`
        const ParentComp = () => (
            <div>
                <div>let's extract this div</div>
            </div>
        )
    `;

    const expectedSourceFileContent = outdent`
        import { ExtractToNewFile_Target } from './ExtractToNewFile_Target';

        const ParentComp = () => (
            <div>
               <ExtractToNewFile_Target />
            </div>
        )
      `;

    const expectedTargetFileContent = outdent`
        export function ExtractToNewFile_Target({}) {
          return <div>let's extract this div</div>;
        }
      `;

    fs.writeFileSync(
      env.getAbsolutePath(sourceFileName),
      originalSourceFileContent
    );

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toNewFile(".", targetFileName);

    const sourceFileContent = await driver.getDocumentText(sourceFileName);
    expect(stripSpaces(sourceFileContent)).to.equal(
      stripSpaces(expectedSourceFileContent)
    );

    const targetFileContent = await driver.getDocumentText(targetFileName);
    expect(targetFileContent).to.equal(expectedTargetFileContent);
  });

  it("extract to existing file,and prompt for component name", async () => {
    const sourceFileName = "ExtractToExistingFile_Source.jsx";
    const targetFileName = "ExtractToExistingFile_Target.jsx";

    const originalSourceFileContent = outdent`
        const ParentComp = () => (
            <div>
                <span>some content</span>
            </div>
        )
    `;

    const originalTargetFileContent = outdent`
      export function Existing({}) {
        return (<div />)
      }

    `;

    const expectedSourceFileContent = outdent`
      import { NewTargetComp } from './ExtractToExistingFile_Target';

      const ParentComp = () => (
        <div>
          <NewTargetComp />
        </div>
      )
    `;

    const expectedTargetFileContent = outdent`
        export function Existing({}) {
          return (<div />)
        }
        export function NewTargetComp({}) {
          return <span>some content</span>;
        }
      `;

    fs.writeFileSync(
      env.getAbsolutePath(sourceFileName),
      originalSourceFileContent
    );
    fs.writeFileSync(
      env.getAbsolutePath(targetFileName),
      originalTargetFileContent
    );

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toExistingFile(".", targetFileName, "NewTargetComp");

    const sourceFileContent = await driver.getDocumentText(sourceFileName);
    expect(stripSpaces(sourceFileContent)).to.equal(
      stripSpaces(expectedSourceFileContent)
    );

    const targetFileContent = await driver.getDocumentText(targetFileName);
    expect(targetFileContent).to.equal(expectedTargetFileContent);
  });

  it("extract to same file", async () => {
    const sourceFileName = "ExtractToSameFile_Source.jsx";

    const originalSourceFileContent = outdent`
        const ParentComp = () => (
            <div>
                <span>some content</span>
            </div>
        )
    `;

    const expectedSourceFileContent = outdent`
        const ParentComp = () => (
            <div>
                <Target />
            </div>
        )

        function Target ({}) {
            return (<span>some content</span>);
        }
    `;

    fs.writeFileSync(
      env.getAbsolutePath(sourceFileName),
      originalSourceFileContent
    );

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toExistingFile(".", sourceFileName, "Target");

    const sourceFileContent = await driver.getDocumentText(sourceFileName);
    expect(stripSpaces(sourceFileContent)).to.equal(
      stripSpaces(expectedSourceFileContent)
    );
  });
});
