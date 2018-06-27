
import * as sinon from 'sinon';
import * as directoryPicker from '../directories-picker';
import * as filePicker from '../file-picker';
import * as editor from '../editor';
import * as fileSystem from '../file-system';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { extractJSXToComponent, statelessToStatefulComponent } from '../code-actions';
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
            jsFilesExtentions: ['js'],
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

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport class Source extends React.Component {\n  render() {\n    return <div>{this.props.foo}</div>;\n  }\n\n}\n  ', '/source.js');
    });

    it('creates functional component if there are no "this" references', async () => {
        sandbox.stub(editor, 'selectedText').returns(`
        <div>{foo}</div>
    `);

        await extractJSXToComponent();

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport function Source({\n  foo\n}) {\n  return <div>{foo}</div>;\n}\n  ', '/source.js');
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

            expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport class Source extends React.Component {\n  render() {\n    const {\n      bar\n    } = this.props;\n    return <Wrapper bar={bar}>{this.props.foo}</Wrapper>;\n  }\n\n}\n  ', '/source.js');
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

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return <div>{this.props.x}</div>;\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });

        it('turn all references to props parameter', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                function Foo(props) {
                    return (<div>{props.x}</div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return <div>{this.props.x}</div>;\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });

        it('creates stateful component from functional declaration', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                function Foo(props) {
                    return (<div></div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class Foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return <div></div>;\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });

        it('creates stateful component from arrow function', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                const foo = (props) => {
                    return (<div></div>);
                }
            `);

            await statelessToStatefulComponent();

            expect(fileSystem.replaceTextInFile).to.have.been.calledWith('class foo extends Component {\n  constructor(props) {\n    super(props);\n  }\n\n  render() {\n    return <div></div>;\n  }\n\n}', selectedTextStart, selectedTextEnd, '/source.js');
        });
    })

});