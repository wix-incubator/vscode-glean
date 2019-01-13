import { SnippetString } from 'vscode';
import { showDirectoryPicker } from './directories-picker';
import { showFilePicker } from './file-picker';
// tslint:disable-next-line:max-line-length
import { activeEditor, selectedText, activeFileName, openFile, selectedTextStart, selectedTextEnd, showErrorMessage, showInformationMessage, allText } from './editor';
import { statelessToStateful } from './modules/statless-to-stateful';
import { statefulToStateless } from './modules/stateful-to-stateless';
import { shouldSwitchToTarget, shouldBeConsideredJsFiles } from './settings';
import { replaceTextInFile, appendTextToFile, prependTextToFile, removeContentFromFileAtLineAndColumn } from './file-system';
import { getIdentifier, generateImportStatementFromFile, transformJSIntoExportExpressions } from './parsing';
import { createComponentInstance, wrapWithComponent, isRangeContainedInJSXExpression, isJSXExpression } from './modules/jsx';
import * as relative from 'relative';
import * as path from 'path';
import getImports from './get-imports';
import * as prettier from 'prettier';

export async function extractJSXToComponent() {
  let editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const folderPath = await showDirectoryPicker();
    const filePath = await showFilePicker(folderPath);

    const selectionProccessingResult = await wrapWithComponent(filePath, selectedText());
    await appendSelectedTextToFile(selectionProccessingResult, filePath);
    await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);
    const destinationImports: string = getImports(selectionProccessingResult.text);
    prependTextToFile(destinationImports, filePath);
    // tslint:disable-next-line:max-line-length
    const componentInstance = createComponentInstance(selectionProccessingResult.metadata.name, selectionProccessingResult.metadata.componentProperties);
    await replaceSelectionWith(componentInstance);
    await switchToDestinationFileIfRequired(filePath);
  } catch (e) {
    handleError(e);
  }
}

export async function wrapJSXWithCondition() {
  let editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const selText = selectedText();
    const isParentJSXExpression = isRangeContainedInJSXExpression(allText(), selectedTextStart(), selectedTextEnd());
    const conditionalJSX = isJSXExpression(selText) ? selText : `<>${selText}</>`;
    const snippetInnerText = `\n$\{1:true\}\n? ${conditionalJSX}\n: $\{2:null\}\n`;
    const snippetText = isParentJSXExpression ? `{${snippetInnerText}}` : `(${snippetInnerText})`;
    await editor.insertSnippet(new SnippetString(snippetText));
  } catch (e) {
    handleError(e);
  }
}

export async function extractToFile() {
  let editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const folderPath = await showDirectoryPicker();
    const filePath = await showFilePicker(folderPath);

    const selectionProccessingResult: ProcessedSelection = {
      text: selectedText(),
      metadata: {},
    };
    await appendSelectedTextToFile(selectionProccessingResult, filePath);
    await removeSelectedTextFromOriginalFile(selectionProccessingResult);
    await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);

    await switchToDestinationFileIfRequired(filePath);

  } catch (e) {
    handleError(e);
  }
}

export async function statelessToStatefulComponent() {
  try {
    const selectionProccessingResult = statelessToStateful(selectedText());
    await replaceSelectionWith(selectionProccessingResult.text);

  } catch (e) {
    handleError(e);
  }
}

export async function statefulToStatelessComponent() {
  try {
    await showInformationMessage(
      'WARNING! All lifecycle methods and react instance methods would be removed. Are you sure you want to continue?', ['Yes', 'No'],
    ).then(async res => {
      if (res === 'Yes') {
        const selectionProccessingResult = statefulToStateless(selectedText());
        await replaceSelectionWith(selectionProccessingResult.text);
      }
    });
  } catch (e) {
    handleError(e);
  }
}

export async function switchToDestinationFileIfRequired(destinationFilePath: any) {
  if (shouldSwitchToTarget()) {
    await openFile(destinationFilePath);
  }
}

export async function replaceSelectionWith(text: string, filepath = activeFileName()) {
  await replaceTextInFile(text, selectedTextStart(), selectedTextEnd(), activeFileName());
}

export type ProcessedSelection = {
  text: string;
  metadata: any;
};

export const appendSelectedTextToFile = ({ text: selection }, destinationPath) => {
  let text;

  if (isOperationBetweenJSFiles(destinationPath)) {
    text = transformJSIntoExportExpressions(selection);
  } else {
    text = selection;
  }

  const prettyText = prettier.format(text);
  return appendTextToFile(`${prettyText}`, destinationPath);
};

export const prependImportsToFileIfNeeded = ({text: selection }, destinationFilePath) => {
  if (!isOperationBetweenJSFiles(destinationFilePath)) return;
  const originFilePath = activeFileName();
  const identifiers = getIdentifier(selection);
  const destinationPathRelativeToOrigin = relative(originFilePath, destinationFilePath);
  const destinationFileName = path.parse(destinationPathRelativeToOrigin).name;
  const destinationModule = [...destinationPathRelativeToOrigin.split(path.sep).slice(0, -1), destinationFileName].join('/');
  const importStatement = generateImportStatementFromFile(identifiers, destinationModule);
  return prependTextToFile(importStatement, originFilePath);
};
export const removeSelectedTextFromOriginalFile = selection => {
  let content = '';

  return removeContentFromFileAtLineAndColumn(selectedTextStart(), selectedTextEnd(), activeFileName(), content);
};
export const isOperationBetweenJSFiles = destinationPath => shouldBeConsideredJsFiles(activeFileName(), destinationPath);

export const handleError = e => {
  if (e) {
    showErrorMessage(e.message);
  }
};
