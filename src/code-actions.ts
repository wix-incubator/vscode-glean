import { activeFileName, openFile, selectedTextStart, selectedTextEnd, showErrorMessage } from "./editor";
import { shouldSwitchToTarget, shouldBeConsideredJsFiles } from "./settings";
import { replaceTextInFile, appendTextToFile, prependTextToFile, removeContentFromFileAtLineAndColumn } from "./file-system";
import { getIdentifier, generateImportStatementFromFile, transformJSIntoExportExpressions } from "./parsing";
import * as relative from 'relative';
import * as path from 'path'

export async function switchToDestinationFileIfRequired(destinationFilePath: any) {
  if (shouldSwitchToTarget()) {
    await openFile(destinationFilePath);
  }
}

export function replaceSelectionWith(text: string) {
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

export const isOperationBetweenJSFiles = destinationPath => shouldBeConsideredJsFiles(activeFileName(), destinationPath);

export const handleError = e => {
  if (e) {
    showErrorMessage(e.message);
  }
};
