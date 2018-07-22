import { showQuickPicksList, extractQuickPickValue, toQuickPicksList, convertRelativeToFullPath, showInputBox, workspaceRoot } from "./editor";
import { filesInFolder, createFileIfDoesntExist } from "./file-system";
import { cancelActionIfNeeded } from "./utils";

function completeToFullFilePath(file, folder) {
    if (file === NEW_FILE_OPTION) {
      return promptFileNameInput(folder).then(createFileIfDoesntExist);
    } else {
      const root = workspaceRoot();
      return `${root || ''}${folder}/${file}`;
    }
  };
  
  export function promptFileNameInput(directory) {
    return showInputBox(directory, 'Filename or relative path to a file')
    .then(convertRelativeToFullPath);
  }
    
  
  const NEW_FILE_OPTION: string = 'Create New File';
  
  function filesInDirectoryQuickPicksList(directory) {
    return toQuickPicksList([
      NEW_FILE_OPTION,
      ...filesInFolder(directory)
    ]);
  }
  
  export function showFilePicker(directory) {
    return showQuickPicksList(filesInDirectoryQuickPicksList(directory), 'Select File to extract to')
      .then(extractQuickPickValue)
      .then(cancelActionIfNeeded)
      .then(file => completeToFullFilePath(file, directory));
  };