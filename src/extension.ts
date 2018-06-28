import { extractToFile, statelessToStatefulComponent, extractJSXToComponent } from './code-actions';
'use strict';

import * as vscode from 'vscode';
import { selectedText } from './editor';
import { isStatelessComp, isJSX } from './modules/jsx';
import { ProviderResult } from 'vscode';





export class CompleteActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(): ProviderResult<vscode.Command[]> {
    const exportToFileAction = {
      command: 'extension.glean',
      title: 'Export to File'
    };

    if (isJSX(selectedText())) {
      return [{
        command: 'extension.glean.react.extract-component',
        title: 'Extract Component'
      }];
    }

    if (isStatelessComp(selectedText())) {
      return [exportToFileAction, {
        command: 'extension.glean.react.stateless-to-stateful',
        title: 'Convert Stateless to Stateful Component'
      }]
    }

    return [exportToFileAction];

  }
}



export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ pattern: '**/*.*' }, new CompleteActionProvider()));

  vscode.commands.registerCommand('extension.glean', extractToFile);

  vscode.commands.registerCommand('extension.glean.react.extract-component', extractJSXToComponent);

  vscode.commands.registerCommand('extension.glean.react.stateless-to-stateful', statelessToStatefulComponent);

}



// this method is called when your extension is deactivated
export function deactivate() {
}