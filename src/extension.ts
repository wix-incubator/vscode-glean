'use strict';

import * as vscode from 'vscode';
import { showDirectoryPicker } from './directories-picker';
import { showFilePicker } from './file-picker';
import { selectedText, openFile, showErrorMessage } from './editor';
import { appendTextToFile } from './file-system';


const appendSelectedTextToFile = absolutePath =>  { 
  appendTextToFile(selectedText(), absolutePath);
  return absolutePath;
};

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('extension.extractToFile', () => {

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }

    showDirectoryPicker()
      .then(showFilePicker)
      .then(appendSelectedTextToFile)
      .then(openFile)
      .catch(showErrorMessage);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}