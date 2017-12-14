import { toQuickPick, currentEditorPath, workspaceRoot, extractQuickPickValue, showQuickPicksList } from "./editor";
import { subfoldersListOf, gitIgnoreFolders } from "./file-system";

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

const getQuickPicksForWorkspaceFolderStructure = () => getWorkspaceFolderStructure().then(toQuickPicksList);

export function showDirectoryPicker(): any {
    
      return getQuickPicksForWorkspaceFolderStructure()
        .then(prependQuickpickForCurrentFileFolder)
        .then(choices =>  showQuickPicksList(choices, 'Pick directory that contains the file'))
        .then(extractQuickPickValue);
    }
    