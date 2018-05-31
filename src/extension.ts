'use strict';

import * as vscode from 'vscode';
import { showDirectoryPicker } from './directories-picker';
import { showFilePicker } from './file-picker';
import { selectedText, openFile, showErrorMessage, currentEditorPath } from './editor';
import { appendTextToFile, removeContentFromFileAtLineAndColumn, prependTextToFile } from './file-system';
import { generateImportStatementFromFile, getIdentifier, exportAllDeclarationsCommonJS, exportAllDeclarationsESM, transformJSIntoExportExpressions } from './parsing';
import * as relative from 'relative';
import * as path from 'path';
import { shouldBeConsideredJsFiles, esmModuleSystemUsed, commonJSModuleSystemUsed } from './settings';
import { isJSX, wrapWithComponent, createComponentInstance } from './modules/jsx';

export type ProcessedSelection = {
  text: string;
  metadata?: any
}

const preprocessSelection = (destinationPath): ProcessedSelection => {
  let selection = selectedText();
  if (isOperationBetweenJSFiles(destinationPath) && isJSX(selection)) {
    return wrapWithComponent(destinationPath, selection);
  } else {
    return { text: selection };
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

  const originFilePath = vscode.window.activeTextEditor.document.fileName;
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
    vscode.window.activeTextEditor.selection.start,
    vscode.window.activeTextEditor.selection.end,
    vscode.window.activeTextEditor.document.fileName, content);
}

const isOperationBetweenJSFiles = destinationPath => shouldBeConsideredJsFiles(vscode.window.activeTextEditor.document.fileName, destinationPath);

const handleError = e => {
  if (e) {
    showErrorMessage(e.message);
  }
};

export class CompleteActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(): Promise<vscode.Command[]> {
    return new Promise(resolve => resolve([
      {
        command: 'extension.extractToFile',
        title: 'Export to File'
      }
    ])
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ pattern: '**/*.*' }, new CompleteActionProvider()));

  const disposable = vscode.commands.registerCommand('extension.extractToFile', async () => {

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }

    try {
      const folderPath = await showDirectoryPicker()
      const filePath = await showFilePicker(folderPath);

      const selectionProccessingResult = preprocessSelection(filePath);
      await appendSelectedTextToFile(selectionProccessingResult, filePath);
      await removeSelectedTextFromOriginalFile(selectionProccessingResult);
      await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);
      await openFile(filePath);

    } catch (e) {
      handleError(e);
    }

  });

}

// this method is called when your extension is deactivated
export function deactivate() {
}