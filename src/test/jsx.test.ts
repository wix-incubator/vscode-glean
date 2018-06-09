
import * as sinon from 'sinon';
import { run } from '../extension';
import * as directoryPicker from '../directories-picker';
import * as filePicker from '../file-picker';
import * as editor from '../editor';
import * as fileSystem from '../file-system';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
const expect = chai.expect;

chai.use(sinonChai);

describe('esm support', function () {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        sandbox.stub(directoryPicker, 'showDirectoryPicker').returns(Promise.resolve('/folder'));
        sandbox.stub(filePicker, 'showFilePicker').returns(Promise.resolve('/target.js'));
        sandbox.stub(editor, 'activeFileName').returns('source.js');
        sandbox.stub(editor, 'activeEditor').returns('67676');
        sandbox.stub(editor, 'selectedTextStart').returns({});
        sandbox.stub(editor, 'selectedTextEnd').returns({});
        sandbox.stub(fileSystem, 'removeContentFromFileAtLineAndColumn').returns(Promise.resolve());
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

        await run();

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport class Target extends React.Component {\n  render() {\n    return <div>{this.props.foo}</div>;\n  }\n\n}\n  ', '/target.js');
    });

    it('creates functional component if there are no "this" references', async () => {
        sandbox.stub(editor, 'selectedText').returns(`
        <div>{foo}</div>
    `);

        await run();

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport function Target(foo) {\n  return <div>{foo}</div>;\n}\n  ', '/target.js');
    });

    describe('when creating stateful component', () => {
        it('replaces all state references to props', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                <div>{this.state.foo}</div>
        `);

            await run();

            expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport function Target() {\n  return <div>{this.props.foo}</div>;\n}\n  ', '/target.js');
        });

        it('instantiates referenced variables by destructring them from prosp object', async () => {
            sandbox.stub(editor, 'selectedText').returns(`
                <Wrapper bar={bar}>{this.props.foo}</Wrapper>
            `);

            await run();

            expect(fileSystem.appendTextToFile).to.have.been.calledWith('\nexport class Target extends React.Component {\n  render() {\n    const {\n      bar\n    } = this.props;\n    return <Wrapper bar={bar}>{this.props.foo}</Wrapper>;\n  }\n\n}\n  ', '/target.js');
        });
    })

});