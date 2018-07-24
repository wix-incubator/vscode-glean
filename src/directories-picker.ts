import { toQuickPick, currentEditorPath, workspaceRoot, extractQuickPickValue, showQuickPicksList, toQuickPicksList } from "./editor";
import { subfoldersListOf, gitIgnoreFolders } from "./file-system";
import { cancelActionIfNeeded } from "./utils";

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
  
 const prependQuickpickForCurrentFileFolder = (quickPicksList) =>  { 
    return [
      toQuickPick(currentEditorPath(), 'current file directory'),
      ...quickPicksList
    ]; 
  };  

const getQuickPicksForWorkspaceFolderStructure = () => {
  if (!workspaceRoot()) {
    return Promise.resolve([]);
  }
  return getWorkspaceFolderStructure().then(toQuickPicksList);
}

export function showDirectoryPicker(): any {
    
      return getQuickPicksForWorkspaceFolderStructure()
        .then(prependQuickpickForCurrentFileFolder)
        .then(choices =>  showQuickPicksList(choices, 'Pick directory that contains the file'))
        .then(extractQuickPickValue)
        .then(cancelActionIfNeeded);

    }
    