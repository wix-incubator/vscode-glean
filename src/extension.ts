'use strict';

import * as vscode from 'vscode';
import { showDirectoryPicker } from './directories-picker';
import { showFilePicker } from './file-picker';
import { selectedText, openFile, showErrorMessage, currentEditorPath, activeFileName, selectedTextStart, selectedTextEnd, activeEditor } from './editor';
import { appendTextToFile, removeContentFromFileAtLineAndColumn, prependTextToFile, replaceTextInFile } from './file-system';
import { generateImportStatementFromFile, getIdentifier, exportAllDeclarationsCommonJS, exportAllDeclarationsESM, transformJSIntoExportExpressions } from './parsing';
import * as relative from 'relative';
import * as path from 'path';
import { shouldBeConsideredJsFiles, esmModuleSystemUsed, commonJSModuleSystemUsed, shouldSwitchToTarget } from './settings';
import { isJSX, wrapWithComponent, createComponentInstance } from './modules/jsx';
import { CancellationToken, CodeActionContext, Range, TextDocument } from 'vscode';
import { statelessToStateful } from './modules/statless-to-stateful';

export type ProcessedSelection = {
  text: string;
  metadata: any
}

const preprocessSelection = (destinationPath): ProcessedSelection => {
  let selection = selectedText();
  if (isOperationBetweenJSFiles(destinationPath) && isJSX(selection)) {
    return wrapWithComponent(destinationPath, selection);
  } else {
    return { text: selection, metadata: {} };
  }
};

const appendSelectedTextToFile = ({ text: selection }, destinationPath) => {
  let text;

  if (isOperationBetweenJSFiles(destinationPath)) {
    text = transformJSIntoExportExpressions(selection);
  } else {
    text = selection;
  }

  return appendTextToFile(`
${text}
  `, destinationPath);
};

const prependImportsToFileIfNeeded = ({ text: selection }, destinationFilePath) => {

  if (!isOperationBetweenJSFiles(destinationFilePath)) return;

  const originFilePath = activeFileName();
  const identifiers = getIdentifier(selection);
  const destinationPathRelativeToOrigin = relative(originFilePath, destinationFilePath);

  const destinationFileName = path.parse(destinationPathRelativeToOrigin).name;

  const destinationModule = [
    ...destinationPathRelativeToOrigin.split('/').slice(0, -1),
    destinationFileName
  ].join('/');

  const importStatement = generateImportStatementFromFile(identifiers, destinationModule);

  return prependTextToFile(importStatement, originFilePath);
}

const removeSelectedTextFromOriginalFile = (selection) => {
  let content = '';
  if (selection.metadata.isJSX) {
    content = createComponentInstance(selection.metadata.name, selection.metadata.componentProperties);
  }
  return removeContentFromFileAtLineAndColumn(
    selectedTextStart(),
    selectedTextEnd(),
    activeFileName(), content);
}

const isOperationBetweenJSFiles = destinationPath => shouldBeConsideredJsFiles(activeFileName(), destinationPath);

const handleError = e => {
  if (e) {
    showErrorMessage(e.message);
  }
};

export class CompleteActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext, token: CancellationToken): Promise<vscode.Command[]> {
    return new Promise(resolve => resolve([
      {
        command: 'extension.glean',
        title: 'Export to File'
      },
      {
        command: 'extension.glean.react.stateless-to-stateful',
        title: 'Convert Stateless to Stateful Component'
      }
    ])
    );
  }
}

export async function run() {

  var editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const folderPath = await showDirectoryPicker()
    const filePath = await showFilePicker(folderPath);

    const selectionProccessingResult = preprocessSelection(filePath);
    await commonFlow(selectionProccessingResult, filePath);

  } catch (e) {
    handleError(e);
  }

}

async function commonFlow(selectionProccessingResult, filePath) {
  await appendSelectedTextToFile(selectionProccessingResult, filePath);
  await removeSelectedTextFromOriginalFile(selectionProccessingResult);
  await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);

  if (shouldSwitchToTarget()) {
    await openFile(filePath);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ pattern: '**/*.*' }, new CompleteActionProvider()));

  vscode.commands.registerCommand('extension.glean', run);

  vscode.commands.registerCommand('extension.glean.react.stateless-to-stateful', async () => {
    try {
      const selectionProccessingResult = statelessToStateful(selectedText())
      const filePath = activeFileName();
      await replaceTextInFile(selectionProccessingResult.text, selectedTextStart(), selectedTextEnd(), filePath);
      await removeSelectedTextFromOriginalFile(selectionProccessingResult);

      if (shouldSwitchToTarget()) {
        await openFile(filePath);
      }

    } catch (e) {
      handleError(e);
    }
  });


}

// this method is called when your extension is deactivated
export function deactivate() {
}