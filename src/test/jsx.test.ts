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


  it('creates functional component if there are no "this" references', async () => {
    sandbox.stub(editor, "selectedText").returns(`
        <div>{foo}</div>
    `);

    await extractJSXToComponentToFile();

    expect(fileSystem.appendTextToFile).to.have.been.calledWith(
      "\nexport function Target({\n  foo\n}) {\n  return <div>{foo}</div>;\n}\n  ",
      "/target.js"
    );
  });

  describe("When extracting JSX to component", () => {
    it("doesnt wrap the extracted jsx with a Fragment if its a single line", async () => {
      sandbox.stub(editor, "selectedText").returns(`
        <div>{foo}</div>
    `);

      await extractJSXToComponentToFile();

      expect(fileSystem.appendTextToFile).to.have.been.calledWith(
        "\nexport function Target({\n  foo\n}) {\n  return <div>{foo}</div>;\n}\n  ",
        "/target.js"
      );
    });

    it("wraps extracted jsx with a fragment if its multiline", async () => {
      sandbox.stub(editor, "selectedText").returns(`
      <div>{foo}</div>
      <div>{bar}</div>
  `);

      await extractJSXToComponentToFile();

      expect(fileSystem.appendTextToFile).to.have.been.calledWith(
        "\nexport function Target({\n  foo,\n  bar\n}) {\n  return <>\n      <div>{foo}</div>\n      <div>{bar}</div>\n  </>;\n}\n  ",
        "/target.js"
      );
    });

    it("imports react", async () => {
      sandbox.stub(editor, "selectedText").returns(`
    <div>{foo}</div>
    <div>{bar}</div>
`);

      await extractJSXToComponentToFile();

      expect(fileSystem.prependTextToFile).to.have.been.calledWith(
        'import React from "react";',
        "/target.js"
      );
    });

    it('creates functional component if there are no "this" references', async () => {
      sandbox.stub(editor, "selectedText").returns(`
        <div>{foo}</div>
    `);

      await extractJSXToComponentToFile();

      expect(fileSystem.appendTextToFile).to.have.been.calledWith(
        "\nexport function Target({\n  foo\n}) {\n  return <div>{foo}</div>;\n}\n  ",
        "/target.js"
      );
    });

    it("replaces all state references to props", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <div>{this.state.foo}</div>
        `);

      await extractJSXToComponentToFile();

      expect((<any>fileSystem.appendTextToFile).args[0][0]).to.contain(
        "{foo}"
      );
      expect((<any>fileSystem.appendTextToFile).args[0][0]).not.to.contain(
        "this.state.foo"
      );
    });

    it("replaces references to class methods with props", async () => {
      sandbox.stub(editor, "selectedText").returns(`
        <Wrapper handleClick={this.handleClick}/>
    `);

      await extractJSXToComponentToFile();

      expect(fileSystem.appendTextToFile).to.have.been.calledWith(
        "\nexport function Target({\n  handleClick\n}) {\n  return <Wrapper handleClick={handleClick} />;\n}\n  ",
        "/target.js"
      );
    });

    it("instantiates referenced variables by destructring them from props object", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <Wrapper bar={bar}>{this.props.foo}</Wrapper>
            `);

      await extractJSXToComponentToFile();

      expect(fileSystem.appendTextToFile).to.have.been.calledWith(
        "\nexport function Target({\n  bar,\n  foo\n}) {\n  return <Wrapper bar={bar}>{foo}</Wrapper>;\n}\n  ",
        "/target.js"
      );
    });

    it("replaces selected jsx code with an instance of newly created component", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <Wrapper></Wrapper>
            `);

      await extractJSXToComponentToFile();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "<Target     />",
        selectedTextStart,
        selectedTextStart,
        "/source.js"
      );
    });

    it("should pass original references used by original jsx to the new component instance", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                <div>{x}</div>
                <div>{this.state.foo}</div>
                <div>{this.props.bar}</div>
                <div>{this.getZoo()}</div>
            `);

      await extractJSXToComponentToFile();

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

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div>{this.props.x}</div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it('adds default props if the props have default value', async () => {
      sandbox.stub(editor, "selectedText").returns(`
                function Foo({x = 'boo'}) {
                    return (<div>{x}</div>);
                }
            `);

      await statelessToStatefulComponent();

      expect((fileSystem.replaceTextInFile as any).lastCall.args[0]).to.contain(`Foo.defaultProps = {\n  x: 'boo'\n};`);
    });

    it("turn all references to props parameter", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                function Foo(props) {
                    return (<div>{props.x}</div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div>{this.props.x}</div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("creates stateful component from functional declaration", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                function Foo(props) {
                    return (<div></div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("supports rest operation in props", async () => {
      sandbox.stub(editor, "selectedText").returns(`
          function Foo({...rest}) {
              return (<div {...rest}></div>);
          }
          `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div {...this.props.rest}></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("creates stateful component from variable declaration", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              const Foo = (props) => (<div></div>)
          `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("maintains prop type annotation", async () => {
      sandbox.stub(editor, "selectedText").returns(`
            const Foo = (props: Props) => (<div></div>)
        `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component<Props> {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("maintains prop type annotation", async () => {
      sandbox.stub(editor, "selectedText").returns(`
          const Foo: SFC<Props> = (props) => (<div></div>)
      `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component<Props> {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("should not convert functions and function calls in the body", async () => {
      sandbox.stub(editor, "selectedText").returns(`
            const Foo = ({handleUpdate}) => (<input onChange={e => handleUpdate(e)} />)
        `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<input onChange={e => this.props.handleUpdate(e)} />);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("creates stateful component from arrow function", async () => {
      sandbox.stub(editor, "selectedText").returns(`
                const foo = (props) => {
                    return (<div></div>);
                }
            `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("creates stateful component from arrow function", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              const foo = (props) => {
                  return (<div></div>);
              }
          `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("creates stateful component from arrow function with JSX element being behind an AND operator", async () => {
      sandbox.stub(editor, "selectedText").returns(`
            const foo = (props) => true && <div></div>;
        `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return true && <div></div>;\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });

    it("wraps returned JSX in parenthesis if they are missing ", async () => {
      sandbox.stub(editor, "selectedText").returns(`
              const foo = (props) => {
                  return <div></div>;
              }
          `);

      await statelessToStatefulComponent();

      expect(fileSystem.replaceTextInFile).to.have.been.calledWith(
        "class foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}",
        selectedTextStart,
        selectedTextEnd,
        "/source.js"
      );
    });
  });

  
});
