
import * as sinon from 'sinon';
import * as directoryPicker from '../directories-picker';
import * as filePicker from '../file-picker';
import * as editor from '../editor';
import * as fileSystem from '../file-system';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { extractJSXToComponent, statelessToStatefulComponent, statefulToStatelessComponent } from '../code-actions';
import { toASCII } from 'punycode';
const expect = chai.expect;

chai.use(sinonChai);

describe('jsx module', function () {
    let sandbox;
    let selectedTextStart = {},
        selectedTextEnd = {};

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        sandbox.stub(directoryPicker, 'showDirectoryPicker').returns(Promise.resolve('/folder'));
        sandbox.stub(filePicker, 'showFilePicker').returns(Promise.resolve('/target.js'));
        sandbox.stub(editor, 'activeFileName').returns('/source.js');
        sandbox.stub(editor, 'activeEditor').returns('67676');
        sandbox.stub(editor, 'selectedTextStart').returns(selectedTextStart);
        sandbox.stub(editor, 'selectedTextEnd').returns(selectedTextEnd);
        sandbox.stub(fileSystem, 'replaceTextInFile').returns(Promise.resolve());
        sandbox.stub(fileSystem, 'prependTextToFile').returns(Promise.resolve())
        sandbox.stub(editor, 'config').returns({
            jsModuleSystem: 'esm',
            jsFilesExtensions: ['js'],
            switchToTarget: true
        });
        sandbox.stub(fileSystem, 'appendTextToFile').returns(Promise.resolve());


        sandbox.stub(editor, 'openFile');
    })

    afterEach(function () {
        sandbox.restore();
    });


    it('creates stateful component if the JSX string contains "this" references', async () => {
        sandbox.stub(editor, 'selectedText').returns(`
        <div>{this.props.foo}</div>
    `);

        await extractJSXToComponent();

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport class Target extends React.Component {\n  render() {\n    return <>\n        <div>{this.props.foo}</div>\n    </>;\n  }\n\n}\n  ', '/target.js');
    });

    it('creates functional component if there are no "this" references', async () => {
        sandbox.stub(editor, 'selectedText').returns(`
        <div>{foo}</div>
    `);

        await extractJSXToComponent();

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport function Target({\n  foo\n}) {\n  return <>\n        <div>{foo}</div>\n    </>;\n}\n  ', '/target.js');
    });


    describe('When extracting JSX to component', () => {
        it('replaces all state references to props', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                <div>{this.state.foo}</div>
        `);

            await extractJSXToComponent();

            expect((<any>fileSystem.appendTextToFile).args[0][0]).to.contain('this.props.foo');
            expect((<any>fileSystem.appendTextToFile).args[0][0]).not.to.contain('this.state.foo');

        });

        it('instantiates referenced variables by destructring them from props object', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                <Wrapper bar={bar}>{this.props.foo}</Wrapper>
            `);

            await extractJSXToComponent();

            expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport class Target extends React.Component {\n  render() {\n    const {\n      bar\n    } = this.props;\n    return <>\n                <Wrapper bar={bar}>{this.props.foo}</Wrapper>\n            </>;\n  }\n\n}\n  ', '/target.js');
        });

        it('replaces selected jsx code with an instance of newly created component', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                <Wrapper></Wrapper>
            `);

            await extractJSXToComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('<Target     />', selectedTextStart, selectedTextStart, '/source.js');
        });

        it('should pass original references used by original jsx to the new component instance', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                <div>{x}</div>
                <div>{this.state.foo}</div>
                <div>{this.props.bar}</div>
                <div>{this.getZoo()}</div>
            `);

            await extractJSXToComponent();

            expect((<any>fileSystem.replaceTextInFile).args[0][0]).to.be.equal('<Target  foo={this.state.foo} x={x} bar={this.props.bar} getZoo={this.getZoo}/>');
        });
    });

    describe('when refactoring stateless component into stateful component', () => {
        it('turn all references to destructed props to references to props object', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                function Foo({x}) {
                    return (<div>{x}</div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div>{this.props.x}</div>);\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });

        it('turn all references to props parameter', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                function Foo(props) {
                    return (<div>{props.x}</div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div>{this.props.x}</div>);\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });

        it('creates stateful component from functional declaration', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                function Foo(props) {
                    return (<div></div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });

        it('supports rest operation in props', async () => {
          sandbox.stub(editor, 'selectedText').returns(`
          function Foo({...rest}) {
              return (<div {...rest}></div>);
          }
          `);

        await statelessToStatefulComponent();

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div {...this.props.rest}></div>);\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        })

        it('creates stateful component from variable declaration', async () => {
          sandbox.stub(editor, 'selectedText').returns(`
              const Foo = (props) => (<div></div>)
          `);

          await statelessToStatefulComponent();

          expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
      });

        it('creates stateful component from arrow function', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                const foo = (props) => {
                    return (<div></div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return (<div></div>);\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });
    })

    describe('when refactoring stateful component into stateless component', () => {
      it('shows the warning dialog before making a change', async () => {
        givenApprovedWarning();
        await statefulToStatelessComponent();

        expect((<any>editor.showInformationMessage).args[0][0]).to.equal('WARNING! All lifecycle methods and react instance methods would be removed. Are you sure you want to continue?');
        expect((<any>editor.showInformationMessage).args[0][1]).to.deep.equal(['Yes', 'No']);
      });

      it('does not refactor when the user does not accept the warning message', async () => {
        givenDeclinedWarning();
        await statefulToStatelessComponent();

        expect(fileSystem.replaceTextInFile).not.to.have.been.called;
      });

      it('creates a stateless component from a class component ', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
          class SomeComponent extends React.Component {
            render() {
              return <div />;
            }
          }
        `);

        await statefulToStatelessComponent();

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('const someComponent = props => {\n  return <div />;\n};', selectedTextStart, selectedTextEnd, '/source.js');
      });

      it('creates a stateless component without lifecycle methods and instance references', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
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

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('const someComponent = props => {\n  return <div>\n                  {props.foo} + {props.bar}\n                </div>;\n};', selectedTextStart, selectedTextEnd, '/source.js');
      });

      it('creates stateless component including instance methods without state functions', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
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

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('const someComponent = props => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};', selectedTextStart, selectedTextEnd, '/source.js');
      });

      it('creates stateless component with props type interface and default props', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
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

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('const someComponent = (props: MyProps = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};', selectedTextStart, selectedTextEnd, '/source.js');
      });

      it('creates stateless component with props type literal and default props', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
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

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('const someComponent = (props: {\n  a: number;\n} = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};', selectedTextStart, selectedTextEnd, '/source.js');
      });

      it('creates stateless component with default export', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
          export default class SomeComponent extends React.Component<{a: number}> {
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

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('const someComponent = (props: {\n  a: number;\n} = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};\n\nexport default someComponent;', selectedTextStart, selectedTextEnd, '/source.js');
      });

      it('creates stateless component with named export', async () => {
        givenApprovedWarning();
        sandbox.stub(editor, 'selectedText').returns(`
          export class SomeComponent extends React.Component<{a: number}> {
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

        expect(fileSystem.replaceTextInFile).to.have.been.calledWith('export const someComponent = (props: {\n  a: number;\n} = {\n  a: 3\n}) => {\n  const someMethod = () => {\n    console.log(2);\n  };\n\n  return <div />;\n};', selectedTextStart, selectedTextEnd, '/source.js');
      });

      const givenApprovedWarning = () => {
        sandbox.stub(editor, 'showInformationMessage').returns(Promise.resolve('Yes'));
      }
      const givenDeclinedWarning = () => {
        sandbox.stub(editor, 'showInformationMessage').returns(Promise.resolve('No'));
      }
    })

});
