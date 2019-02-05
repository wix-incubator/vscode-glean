import { activeEditor, selectedText, selectedTextStart, selectedTextEnd, activeFileName } from "../editor";

import { showDirectoryPicker } from "../directories-picker";

import { showFilePicker } from "../file-picker";

import { ProcessedSelection, appendSelectedTextToFile, prependImportsToFileIfNeeded, switchToDestinationFileIfRequired, handleError } from "../code-actions";
import { removeContentFromFileAtLineAndColumn } from "../file-system";

export const removeSelectedTextFromOriginalFile = () => {
  let content = '';

  return removeContentFromFileAtLineAndColumn(selectedTextStart(), selectedTextEnd(), activeFileName(), content);
};

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
    await removeSelectedTextFromOriginalFile();
    await prependImportsToFileIfNeeded(selectionProccessingResult, filePath);

    await switchToDestinationFileIfRequired(filePath);

  } catch (e) {
    handleError(e);
  }
}
