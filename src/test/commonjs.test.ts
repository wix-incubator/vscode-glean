
import * as sinon from 'sinon';
import * as directoryPicker from '../directories-picker';
import * as filePicker from '../file-picker';
import * as editor from '../editor';
import * as fileSystem from '../file-system';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { extractToFile } from '../modules/extract-to-file';
const expect = chai.expect;

chai.use(sinonChai);

describe('commonjs support', function () {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        sandbox.stub(directoryPicker, 'showDirectoryPicker').returns(Promise.resolve('/folder'));
        sandbox.stub(filePicker, 'showFilePicker').returns(Promise.resolve('./target.js'));
        sandbox.stub(editor, 'activeFileName').returns('./source.js');
        sandbox.stub(editor, 'activeEditor').returns('67676');
        sandbox.stub(editor, 'selectedTextStart').returns({});
        sandbox.stub(editor, 'selectedTextEnd').returns({});
        sandbox.stub(fileSystem, 'removeContentFromFileAtLineAndColumn').returns(Promise.resolve());
        sandbox.stub(fileSystem, 'prependTextToFile').returns(Promise.resolve())
        sandbox.stub(editor, 'config').returns({
            jsModuleSystem: 'commonjs',
            jsFilesExtensions: ['js'],
            switchToTarget: true
        });
        sandbox.stub(fileSystem, 'appendTextToFile').returns(Promise.resolve());
        sandbox.stub(editor, 'selectedText').returns(`
            class Foo {

            }
        `);

        sandbox.stub(editor, 'openFile');
    })

    afterEach(function () {
        sandbox.restore();
    });


    it('exports selected declarations from target file', async () => {
        await extractToFile();

        expect(fileSystem.appendTextToFile).to.have.been.calledWith('\n\n\n            class Foo {\n\n            }\n        \n    \nmodule.exports = {\n  Foo\n};\n        \n  ', './target.js');

    });

    it('removes selected text from the source file', async () => {

        await extractToFile();

        expect(fileSystem.removeContentFromFileAtLineAndColumn).to.have.been.called;

    });

    it('prepends import statement to target with all exported declarations', async () => {

        await extractToFile();

        expect(fileSystem.prependTextToFile).to.have.been.calledWith(`const { Foo } = require('./target');\n`);

    });

    it('should switches to the target file', async () => {

        await extractToFile();

        expect(editor.openFile).to.have.calledWith('./target.js');

    });
});