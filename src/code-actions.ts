import { SnippetString, Position } from 'vscode';
import { showDirectoryPicker } from "./directories-picker";
import { showFilePicker } from "./file-picker";
import { activeEditor, selectedText, activeFileName, openFile, selectedTextStart, selectedTextEnd, showErrorMessage, showInformationMessage, allText, currentEditorPath, activeURI } from "./editor";
import { statelessToStateful } from "./modules/statless-to-stateful";
import { statefulToStateless } from './modules/stateful-to-stateless'
import { shouldSwitchToTarget, shouldBeConsideredJsFiles } from "./settings";
import { replaceTextInFile, appendTextToFile, prependTextToFile, removeContentFromFileAtLineAndColumn, readFileContent, persistFileSystemChanges } from "./file-system";
import { getIdentifier, generateImportStatementFromFile, transformJSIntoExportExpressions, codeToAst } from "./parsing";
import { createComponentInstance, wrapWithComponent, isRangeContainedInJSXExpression, isJSXExpression, importReactIfNeeded } from "./modules/jsx";
import * as relative from 'relative';
import * as path from 'path'
import { getReactImportReference } from './ast-helpers';
import * as t from "@babel/types";
import { transformFromAst } from "@babel/core";

export async function extractJSXToComponent() {
  var editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const folderPath = await showDirectoryPicker()
    const filePath = await showFilePicker(folderPath);

    const selectionProccessingResult = await wrapWithComponent(filePath, selectedText());
    await appendSelectedTextToFile(selectionProccessingResult, filePath);
    await importReactIfNeeded(filePath);
    await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);
    const componentInstance = createComponentInstance(selectionProccessingResult.metadata.name, selectionProccessingResult.metadata.componentProperties);
    await persistFileSystemChanges(replaceSelectionWith(componentInstance));
    await switchToDestinationFileIfRequired(filePath);
  } catch (e) {
    handleError(e);
  }
}

export async function wrapJSXWithCondition() {
  var editor = activeEditor();
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
  var editor = activeEditor();
  if (!editor) {
    return; // No open text editor
  }

  try {
    const folderPath = await showDirectoryPicker()
    const filePath = await showFilePicker(folderPath);

    const selectionProccessingResult: ProcessedSelection = {
      text: selectedText(),
      metadata: {}
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
    const selectionProccessingResult = statelessToStateful(selectedText())
    await persistFileSystemChanges(replaceSelectionWith(selectionProccessingResult.text));

  } catch (e) {
    handleError(e);
  }
}

export async function statefulToStatelessComponent() {
  const persistantChanges = []
  try {
    await showInformationMessage('WARNING! All lifecycle methods and react instance methods would be removed. Are you sure you want to continue?', ['Yes', 'No']).then(async res => {
      if (res === 'Yes') {
        const selectionProccessingResult = statefulToStateless(selectedText());
        if(selectionProccessingResult.metadata.stateHooksPresent) {
          persistantChanges.push(importStateHook());
        }
        persistantChanges.push(replaceSelectionWith(selectionProccessingResult.text));

        await persistFileSystemChanges(...persistantChanges);
      }
    });
  } catch (e) {
    handleError(e);
  }

function importStateHook() {
    const currentFile = activeURI().path;
    const file = readFileContent(currentFile);
    const ast = codeToAst(file);
    const reactImport = getReactImportReference(ast);
    reactImport.specifiers.push(t.importSpecifier(t.identifier('useState'), t.identifier('useState')));
    const updatedReactImport = transformFromAst(t.program([reactImport])).code;
    return replaceTextInFile(updatedReactImport, new Position(reactImport.loc.start.line, reactImport.loc.start.column), new Position(reactImport.loc.end.line, reactImport.loc.end.column), activeFileName());
  }
}

export async function switchToDestinationFileIfRequired(destinationFilePath: any) {
  if (shouldSwitchToTarget()) {
    await openFile(destinationFilePath);
  }
}

export function replaceSelectionWith(text: string, path = activeFileName()) {
  return replaceTextInFile(text, selectedTextStart(), selectedTextEnd(), activeFileName());
}

export type ProcessedSelection = {
  text: string;
  metadata: any;
};

export const appendSelectedTextToFile = ({
  text: selection
}, destinationPath) => {
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

export const prependImportsToFileIfNeeded = ({
  text: selection
}, destinationFilePath) => {
  if (!isOperationBetweenJSFiles(destinationFilePath)) return;
  const originFilePath = activeFileName();
  const identifiers = getIdentifier(selection);
  const destinationPathRelativeToOrigin = relative(originFilePath, destinationFilePath);
  const destinationFileName = path.parse(destinationPathRelativeToOrigin).name;
  const destinationModule = [...destinationPathRelativeToOrigin.split('/').slice(0, -1), destinationFileName].join('/');
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
