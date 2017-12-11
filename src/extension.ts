'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { appendTextToFile, subfoldersListOf, createFileIfDoesntExist, gitIgnoreFolders } from './file-system';
import { openFile, selectedText, showInputBox, showQuickPicksList, convertRelativeToFullPath, workspaceRoot, currentEditorPath, toQuickPicksList, extractQuickPickValue, toQuickPick } from './editor';


const appendSelectedTextToFile = absolutePath =>  appendTextToFile(selectedText(), absolutePath);

const prependQuickpickForCurrentFileFolder = (quickPicksList) =>  { 
  return [
    toQuickPick(currentEditorPath(), 'current file directory'),
    ...quickPicksList
  ]; 
};

const getQuickPicksForWorkspaceFolderStructure = () => getWorkspaceFolderStructure().then(toQuickPicksList);

function showDirectoryPicker(): any {

  return getQuickPicksForWorkspaceFolderStructure()
    .then(prependQuickpickForCurrentFileFolder)
    .then(choices =>  showQuickPicksList(choices, 'Pick directory that contains the file'))
    .then(extractQuickPickValue);
}



function getWorkspaceFolderStructure(): Promise<string[]> {
  return new Promise((resolveWith, reject) => {
    const findDirectories = () => {
      try {
        resolveWith(subfoldersListOf(workspaceRoot(), gitIgnoreFolders()));
      } catch (error) {
        
        reject(error);
      }
    };

    const delayToAllowVSCodeToRender = 1;
    setTimeout(findDirectories, delayToAllowVSCodeToRender);
  });
}

export function promptFileNameInput(directory) {
  return showInputBox(directory, 'Filename or relative path to a file')
  .then(convertRelativeToFullPath);
}
  

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "export-to-file" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.sayHello', () => {

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }

    showDirectoryPicker()
      .then(promptFileNameInput)
      .then(createFileIfDoesntExist)
      .then(appendSelectedTextToFile)
      .then(openFile);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}