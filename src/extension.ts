import {
  extractToFile,
  statelessToStatefulComponent,
  statefulToStatelessComponent,
  extractJSXToComponent,
  wrapJSXWithCondition
} from "./code-actions";
"use strict";

import * as vscode from "vscode";
import { selectedText } from "./editor";
import { isStatelessComp, isStatefulComp, isJSX } from "./modules/jsx";
import { ProviderResult } from "vscode";

export class CompleteActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(): ProviderResult<vscode.Command[]> {
    const exportToFileAction = {
      command: "extension.glean",
      title: "Export to File"
    };

    const text = selectedText();
    if (!text) return [];

    if (isJSX(text)) {
      return [
        {
          command: "extension.glean.react.extract-component",
          title: "Extract Component"
        },
        {
          command: "extension.glean.react.render-conditionally",
          title: "Render Conditionally"
        }
      ];
    }

    if (isStatelessComp(text)) {
      return [
        exportToFileAction,
        {
          command: "extension.glean.react.stateless-to-stateful",
          title: "Convert Stateless to Stateful Component"
        }
      ];
    }

    if (isStatefulComp(text)) {
      return [
        exportToFileAction,
        {
          command: "extension.glean.react.stateful-to-stateless",
          title: "Convert Stateful to Stateless Component"
        }
      ];
    }

    return [exportToFileAction];
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: "**/*.*" },
      new CompleteActionProvider()
    )
  );

  vscode.commands.registerCommand("extension.glean", extractToFile);

  vscode.commands.registerCommand(
    "extension.glean.react.extract-component",
    extractJSXToComponent
  );

  vscode.commands.registerCommand(
    "extension.glean.react.render-conditionally",
    wrapJSXWithCondition
  );

  vscode.commands.registerCommand(
    "extension.glean.react.stateless-to-stateful",
    statelessToStatefulComponent
  );

  vscode.commands.registerCommand(
    "extension.glean.react.stateful-to-stateless",
    statefulToStatelessComponent
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
