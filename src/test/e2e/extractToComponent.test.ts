import * as chai from "chai";
import * as fs from "fs-extra";
import * as path from "path";
import outdent from "outdent";
import * as vscode from "vscode";
import * as environment from "./environment";
import { extensionDriver } from "./extensionDriver";

const expect = chai.expect;

const stripSpaces = str => str.replace(/[\s\n]/g, ""); // TODO: stop using once formatting is defined and fixed

const getDocumentText = async (
  env: environment.TestEnvironment,
  documentRelativePath: string
): Promise<string> => {
  const document = await vscode.workspace.openTextDocument(
    path.join(env.workspaceRootPath, documentRelativePath)
  );
  return document.getText();
};

describe("extract to component", function() {
  const itWithEnv = environment.prepare();

  itWithEnv("extract to new file", async env => {
    const sourceFileName = "source.jsx";
    const targetFileName = "target.jsx";

    const originalSourceFileContent = outdent`
        const ParentComp = () => (
            <div>
                <div>let's extract this div</div>
            </div>
        )
    `;

    const expectedSourceFileContent = outdent`
        import { Target } from './target';

        const ParentComp = () => (
            <div>
               <Target />
            </div>
        )
      `;

    const expectedTargetFileContent = outdent`
        export function Target({}) {
          return <div>let's extract this div</div>;
        }
      `;

    fs.writeFileSync(
      path.join(env.workspaceRootPath, sourceFileName),
      originalSourceFileContent
    );

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toNewFile(".", targetFileName);

    const sourceFileContent = await getDocumentText(env, sourceFileName);
    expect(stripSpaces(sourceFileContent)).to.equal(
      stripSpaces(expectedSourceFileContent)
    );

    const targetFileContent = await getDocumentText(env, targetFileName);
    expect(targetFileContent).to.equal(expectedTargetFileContent);
  });

  itWithEnv(
    "extract to existing file,and prompt for component name",
    async env => {
      const sourceFileName = "source.jsx";
      const targetFileName = "target.jsx";

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
      import { NewTargetComp } from './target';

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
        path.join(env.workspaceRootPath, sourceFileName),
        originalSourceFileContent
      );
      fs.writeFileSync(
        path.join(env.workspaceRootPath, targetFileName),
        originalTargetFileContent
      );

      const driver = extensionDriver(vscode, env);
      await driver
        .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
        .toExistingFile(".", targetFileName, "NewTargetComp");

      const sourceFileContent = await getDocumentText(env, sourceFileName);
      expect(stripSpaces(sourceFileContent)).to.equal(
        stripSpaces(expectedSourceFileContent)
      );

      const targetFileContent = await getDocumentText(env, targetFileName);
      expect(targetFileContent).to.equal(expectedTargetFileContent);
    }
  );

  itWithEnv("extract to same file", async env => {
    const sourceFileName = "source.jsx";

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
      path.join(env.workspaceRootPath, sourceFileName),
      originalSourceFileContent
    );

    const driver = extensionDriver(vscode, env);
    await driver
      .extractComponent(sourceFileName, new vscode.Selection(2, 0, 3, 0))
      .toExistingFile(".", sourceFileName, "Target");

    const sourceFileContent = await getDocumentText(env, sourceFileName);
    expect(stripSpaces(sourceFileContent)).to.equal(
      stripSpaces(expectedSourceFileContent)
    );
  });
});
