import * as sinon from "sinon";
import * as directoryPicker from "../../directories-picker";
import * as filePicker from "../../file-picker";
import * as editor from "../../editor";
import * as fileSystem from "../../file-system";
import * as chai from "chai";
import * as sinonChai from "sinon-chai";
import {
  extractJSXToComponent,
  statelessToStatefulComponent,
  statefulToStatelessComponent
} from "../../code-actions";
import outdent from "outdent";
const expect = chai.expect;

chai.use(sinonChai);

describe("jsx module", function() {
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

  it('creates stateful component if the JSX string contains "this" references', async () => {
    sandbox.stub(editor, "selectedText").returns(`
        <div>{this.props.foo}</div>
    `);

    await extractJSXToComponent();

    expect(
      (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
    ).to.deep.equal([
      outdent`
        export class Target extends React.Component {
          render() {
            return <div>{this.props.foo}</div>;
          }
        
        }
      `,
      "/target.js"
    ]);
  });

  it('creates functional component if there are no "this" references', async () => {
    sandbox.stub(editor, "selectedText").returns(`
        <div>{foo}</div>
    `);

    await extractJSXToComponent();

    expect(
      (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
    ).to.deep.equal([
      outdent`
        export function Target({
          foo
        }) {
          return <div>{foo}</div>;
        }
      `,
      "/target.js"
    ]);
  });

  describe("When extracting JSX to component", () => {
    it("doesnt wrap the extracted jsx with a Fragment if its a single line", async () => {
      sandbox.stub(editor, "selectedText").returns(`
        <div>{foo}</div>
    `);

      await extractJSXToComponent();

      expect(
        (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          export function Target({
            foo
          }) {
            return <div>{foo}</div>;
          }
        `,
        "/target.js"
      ]);
    });

    it("wraps extracted jsx with a fragment if its multiline", async () => {
      sandbox.stub(editor, "selectedText").returns(`
      <div>{foo}</div>
      <div>{bar}</div>
  `);

      await extractJSXToComponent();

      expect(
        (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          export function Target({
            foo,
            bar
          }) {
            return <>
                <div>{foo}</div>
                <div>{bar}</div>
            </>;
          }
        `,
        "/target.js"
      ]);
    });

    it('creates functional component if there are no "this" references', async () => {
      sandbox.stub(editor, "selectedText").returns(`
        <div>{foo}</div>
    `);

      await extractJSXToComponent();

      expect(
        (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          export function Target({
            foo
          }) {
            return <div>{foo}</div>;
          }
        `,
        "/target.js"
      ]);
    });

    it("replaces all state references to props", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <div>{this.state.foo}</div>
        `);

      await extractJSXToComponent();

      expect((<any>fileSystem.appendTextToFile).args[0][0]).to.contain(
        "this.props.foo"
      );
      expect((<any>fileSystem.appendTextToFile).args[0][0]).not.to.contain(
        "this.state.foo"
      );
    });

    it("instantiates referenced variables by destructring them from props object", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <Wrapper bar={bar}>{this.props.foo}</Wrapper>
            `);

      await extractJSXToComponent();

      expect(
        (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          export class Target extends React.Component {
            render() {
              const {
                bar
              } = this.props;
              return <Wrapper bar={bar}>{this.props.foo}</Wrapper>;
            }

          }
        `,
        "/target.js"
      ]);
    });

    it("instantiates referenced variables by destructring them from props object", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              <Wrapper bar={bar}>{this.props.foo}</Wrapper>
          `);

      await extractJSXToComponent();

      expect(
        (fileSystem.appendTextToFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          export class Target extends React.Component {
            render() {
              const {
                bar
              } = this.props;
              return <Wrapper bar={bar}>{this.props.foo}</Wrapper>;
            }

          }
        `,
        "/target.js"
      ]);
    });

    it("replaces selected jsx code with an instance of newly created component", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <Wrapper></Wrapper>
            `);

      await extractJSXToComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`<Target     />`,
        selectedTextStart,
        selectedTextStart,
        "/source.js"
      ]);
    });

    it("should pass original references used by original jsx to the new component instance", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <div>{x}</div>
                <div>{this.state.foo}</div>
                <div>{this.props.bar}</div>
                <div>{this.getZoo()}</div>
            `);

      await extractJSXToComponent();

      expect((<any>fileSystem.replaceTextInFile).args[0][0]).to.be.equal(
        "<Target  foo={this.state.foo} x={x} bar={this.props.bar} getZoo={this.getZoo}/>"
      );
    });
  });

  describe("when refactoring stateless component into stateful component", () => {
    it("turn all references to destructed props to references to props object", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                function Foo({x}) {
                    return (<div>{x}</div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div>{this.props.x}</div>);
            }

          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("turn all references to props parameter", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                function Foo(props) {
                    return (<div>{props.x}</div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div>{this.props.x}</div>);
            }

          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("creates stateful component from functional declaration", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                function Foo(props) {
                    return (<div></div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }

          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("supports rest operation in props", async () => {
      sandbox.stub(editor, "selectedText").returns(`
          function Foo({...rest}) {
              return (<div {...rest}></div>);
          }
          `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div {...this.props.rest}></div>);
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("creates stateful component from variable declaration", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              const Foo = (props) => (<div></div>)
          `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("maintains prop type annotation", async () => {
      sandbox.stub(editor, "selectedText").returns(`
            const Foo = (props: Props) => (<div></div>)
        `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component<Props> {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }

          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("maintains prop type annotation", async () => {
      sandbox.stub(editor, "selectedText").returns(`
          const Foo: SFC<Props> = (props) => (<div></div>)
      `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component<Props> {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }

          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("should not convert functions and function calls in the body", async () => {
      sandbox.stub(editor, "selectedText").returns(`
            const Foo = ({handleUpdate}) => (<input onChange={e => handleUpdate(e)} />)
        `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class Foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<input onChange={e => this.props.handleUpdate(e)} />);
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("creates stateful component from arrow function", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                const foo = (props) => {
                    return (<div></div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("creates stateful component from arrow function", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              const foo = (props) => {
                  return (<div></div>);
              }
          `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("creates stateful component from arrow function with JSX element being behind an AND operator", async () => {
      sandbox.stub(editor, "selectedText").returns(`
            const foo = (props) => true && <div></div>;
        `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return true && <div></div>;
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });

    it("wraps returned JSX in parenthesis if they are missing ", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              const foo = (props) => {
                  return <div></div>;
              }
          `);

      await statelessToStatefulComponent();

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          class foo extends Component {
            constructor(props) {
              super(props);
            }

            render() {
              return (<div></div>);
            }
          
          }
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
    });
  });

  describe("when refactoring stateful component into stateless component", () => {
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          const SomeComponent = props => {
            return <div />;
          };
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
            const SomeComponent = props => {
              return <div>
                              {props.foo} + {props.bar}
                            </div>;
            };
          `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          const SomeComponent = props => {
            const someMethod = () => {
              console.log(2);
            };
          
            return <div />;
          };
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          const SomeComponent: SFC<MyProps> = (props = {
            a: 3
          }) => {
            const someMethod = () => {
              console.log(2);
            };
          
            return <div />;
          };
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          const SomeComponent: SFC<{
            a: number;
          }> = (props = {
            a: 3
          }) => {
            const someMethod = () => {
              console.log(2);
            };
          
            return <div />;
          };
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          const SomeComponent = (props = {
            a: 3
          }) => {
            const someMethod = () => {
              console.log(2);
            };

            return <div />;
          };

          export default SomeComponent;
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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

      expect(
        (fileSystem.replaceTextInFile as sinon.SinonSpy).getCall(0).args
      ).to.deep.equal([
        outdent`
          export const SomeComponent = (props = {
            a: 3
          }) => {
            const someMethod = () => {
              console.log(2);
            };

            return <div />;
          };
        `,
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      ]);
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
});
