import { showDirectoryPicker } from "./directories-picker";
import { showFilePicker } from "./file-picker";
import { activeEditor, selectedText, activeFileName, openFile, selectedTextStart, selectedTextEnd, showErrorMessage } from "./editor";
import { statelessToStateful } from "./modules/statless-to-stateful";
import { shouldSwitchToTarget, shouldBeConsideredJsFiles } from "./settings";
import { replaceTextInFile, appendTextToFile, prependTextToFile, removeContentFromFileAtLineAndColumn } from "./file-system";
import { getIdentifier, generateImportStatementFromFile, transformJSIntoExportExpressions } from "./parsing";
import { createComponentInstance, wrapWithComponent } from "./modules/jsx";
import * as relative from 'relative';
import * as path from 'path';

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
    await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);
    const componentInstance = createComponentInstance(selectionProccessingResult.metadata.name, selectionProccessingResult.metadata.componentProperties);
    await replaceSelectionWith(componentInstance);
    await switchToDestinationFileIfRequired(filePath);
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
    await replaceSelectionWith(selectionProccessingResult.text);

  } catch (e) {
    handleError(e);
  }
}
export async function switchToDestinationFileIfRequired(destinationFilePath: any) {
  if (shouldSwitchToTarget()) {
    await openFile(destinationFilePath);
  }
}

export async function replaceSelectionWith(text: string, path = activeFileName()) {
  await replaceTextInFile(text, selectedTextStart(), selectedTextEnd(), activeFileName());
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
