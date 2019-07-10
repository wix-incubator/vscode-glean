import * as sinon from "sinon";
import * as directoryPicker from "../directories-picker";
import * as filePicker from "../file-picker";
import * as editor from "../editor";
import * as fileSystem from "../file-system";
import * as chai from "chai";
import * as sinonChai from "sinon-chai";
import { statelessToStatefulComponent } from "../modules/statless-to-stateful";
import { statefulToStatelessComponent } from "../modules/stateful-to-stateless";
import { extractJSXToComponentToFile } from "../modules/extract-to-component";
import * as settings from "../settings";

const expect = chai.expect;

chai.use(sinonChai);

describe("when refactoring stateful component into stateless component", () => {
  let sandbox;
  let selectedTextStart = {},
    selectedTextEnd = {};

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(() => {
    sandbox
      .stub(directoryPicker, "showDirectoryPicker")
      .returns(Promise.resolve("/folder"));
    sandbox
      .stub(filePicker, "showFilePicker")
      .returns(Promise.resolve("/target.js"));
    sandbox.stub(editor, "activeFileName").returns("/source.js");
    sandbox.stub(editor, "activeEditor").returns("67676");
    sandbox.stub(editor, "selectedTextStart").returns(selectedTextStart);
    sandbox.stub(editor, "selectedTextEnd").returns(selectedTextEnd);
    sandbox.stub(fileSystem, "replaceTextInFile").returns(Promise.resolve());
    sandbox.stub(fileSystem, "prependTextToFile").returns(Promise.resolve());
    sandbox.stub(fileSystem, "readFileContent").returns("");
    sandbox.stub(editor, "config").returns({
      jsModuleSystem: "esm",
      jsFilesExtensions: ["js"],
      switchToTarget: true
    });
    sandbox.stub(fileSystem, "appendTextToFile").returns(Promise.resolve());

    sandbox.stub(editor, "openFile");
  });

  afterEach(function() {
    sandbox.restore();
  });

  it("shows the warning dialog before making a change", async () => {
    givenApprovedWarning();
    await statefulToStatelessComponent();

    expect((<any>editor.showInformationMessage).args[0][0]).to.equal(
      "WARNING! All lifecycle methods and react instance methods would be removed. Are you sure you want to continue?"
    );
    expect((<any>editor.showInformationMessage).args[0][1]).to.deep.equal([
      "Yes",
      "No"
    ]);
  });

  it("does not refactor when the user does not accept the warning message", async () => {
    givenDeclinedWarning();
    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).not.to.have.been.called;
  });

  it("creates a stateless component from a class component ", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        class SomeComponent extends React.Component {
          render() {
            return <div />;
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "const SomeComponent = props => {\n  return <div />;\n};",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  it("creates a stateless component without lifecycle methods and instance references", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        class SomeComponent extends React.Component {
          componentWillMount() {
            console.log(2);
          }
          render() {
            return (
              <div>
                {this.state.foo} + {this.state.bar}
              </div>
            );
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "const SomeComponent = props => {\n  return <div>\n                {props.foo} + {props.bar}\n              </div>;\n};",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  it("creates stateless component including instance methods without state functions", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        class SomeComponent extends React.Component {
          someMethod() {
            this.setState({a: 3});
            console.log(2);
            this.forceUpdate();
          }
          render() {
            return <div />;
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "const SomeComponent = props => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  it("creates stateless component with props type interface and default props", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        class SomeComponent extends React.Component<MyProps> {
          static defaultProps = {a: 3};
          someMethod() {
            this.setState({a: 3});
            console.log(2);
            this.forceUpdate();
          }
          render() {
            return <div />;
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "const SomeComponent: SFC<MyProps> = (props = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  it("creates stateless component with props type literal and default props", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        class SomeComponent extends React.Component<{a: number}> {
          static defaultProps = {a: 3};
          someMethod() {
            this.setState({a: 3});
            console.log(2);
            this.forceUpdate();
          }
          render() {
            return <div />;
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "const SomeComponent: SFC<{\n  a: number;\n}> = (props = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  it("creates stateless component with default export", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        export default class SomeComponent extends React.Component {
          static defaultProps = {a: 3};
          someMethod() {
            this.setState({a: 3});
            console.log(2);
            this.forceUpdate();
          }
          render() {
            return <div />;
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "const SomeComponent = (props = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};\n\nexport default SomeComponent;",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  it("creates stateless component with named export", async () => {
    givenApprovedWarning();
    sandbox.stub(editor, "selectedText").returns(`
        export class SomeComponent extends React.Component {
          static defaultProps = {a: 3};
          someMethod() {
            this.setState({a: 3});
            console.log(2);
            this.forceUpdate();
          }
          render() {
            return <div />;
          }
        }
      `);

    await statefulToStatelessComponent();

    expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
      "export const SomeComponent = (props = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};",
      selectedTextStart,
      selectedTextEnd,
      "/source.js"
    );
  });

  describe("when hooks support is on", () => {
    beforeEach(() => {
      sandbox
        .stub(settings, "isHooksForFunctionalComponentsExperimentOn")
        .returns(true);
    });

    it("add useState hook for any state variable referenced in the JSX", async () => {
      givenApprovedWarning();
      sandbox.stub(editor, "selectedText").returns(`
          class SomeComponent extends React.Component {
            render() {
              return (
                <div>
                  {this.state.foo}
                </div>
              );
            }
          }
        `);

      await statefulToStatelessComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "const SomeComponent = props => {\n  const [foo, setFoo] = useState();\n  return <div>\n                  {foo}\n                </div>;\n};",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("replaces componentDidMount with useEffect", async () => {
      givenApprovedWarning();
      sandbox.stub(editor, "selectedText").returns(`
          class SomeComponent extends React.Component {
            componentDidMount() {
              console.log(2);
            }
            render() {
              return (
                <div>
                  {this.state.foo} + {this.state.bar}
                </div>
              );
            }
          }
        `);

      await statefulToStatelessComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "const SomeComponent = props => {\n  const [foo, setFoo] = useState();\n  const [bar, setBar] = useState();\n  useEffect(() => {\n    console.log(2);\n  }, []);\n  return <div>\n                  {foo} + {bar}\n                </div>;\n};",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("wraps all non-lifecycle methods with useCallback", async () => {
      givenApprovedWarning();
      sandbox.stub(editor, "selectedText").returns(`
          class SomeComponent extends React.Component {
            doFoo() {
              console.log(2);
            }
            render() {
              return (
                <div>
                  {this.state.foo} + {this.state.bar}
                </div>
              );
            }
          }
        `);

      await statefulToStatelessComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "const SomeComponent = props => {\n  const [foo, setFoo] = useState();\n  const [bar, setBar] = useState();\n  const doFoo = useCallback(() => {\n    console.log(2);\n  });\n  return <div>\n                  {foo} + {bar}\n                </div>;\n};",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("replaces componentWillUnmount with useEffect cleanup function", async () => {
      givenApprovedWarning();
      sandbox.stub(editor, "selectedText").returns(`
          class SomeComponent extends React.Component {
            componentWillUnmount() {
              console.log(2);
            }
            render() {
              return (
                <div>
                  {this.state.foo} + {this.state.bar}
                </div>
              );
            }
          }
        `);

      await statefulToStatelessComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "const SomeComponent = props => {\n  const [foo, setFoo] = useState();\n  const [bar, setBar] = useState();\n  useEffect(() => {\n    return () => {\n      console.log(2);\n    };\n  }, []);\n  return <div>\n                  {foo} + {bar}\n                </div>;\n};",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });
  });

  const givenApprovedWarning = () => {
    sandbox
      .stub(editor, "showInformationMessage")
      .returns(Promise.resolve("Yes"));
  };
  const givenDeclinedWarning = () => {
    sandbox
      .stub(editor, "showInformationMessage")
      .returns(Promise.resolve("No"));
  };
});
