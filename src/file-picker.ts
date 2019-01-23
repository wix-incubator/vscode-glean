import {
  showQuickPicksList,
  extractQuickPickValue,
  toQuickPicksList,
  convertRelativeToFullPath,
  showInputBox,
  workspaceRoot
} from "./editor";
import { filesInFolder } from "./file-system";
import * as path from "path";

function completeToFullFilePath(file, folder) {
  if (file === NEW_FILE_OPTION) {
    return promptFileNameInput(folder);
  } else {
    const root = workspaceRoot() || "";
    const absolutePath = path.join(root, folder, file);
    return absolutePath;
  }
}

export function promptFileNameInput(directory) {
  return showInputBox(directory, "Filename or relative path to a file").then(
    convertRelativeToFullPath
  );
}

export function promptComponentNameInput() {
  return showInputBox("Component Name", "MyComponent");
}

const NEW_FILE_OPTION: string = "Create New File";

function filesInDirectoryQuickPicksList(directory) {
  return toQuickPicksList([NEW_FILE_OPTION, ...filesInFolder(directory)]);
}

export function showFilePicker(directory) {
  return showQuickPicksList(
    filesInDirectoryQuickPicksList(directory),
    "Select File to extract to"
  )
    .then(extractQuickPickValue)
    .then(file => completeToFullFilePath(file, directory));
}
