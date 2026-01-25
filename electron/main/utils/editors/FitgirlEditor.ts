import * as fs from 'fs';
import { join } from 'path';
import { EditorInterface } from '../../../../types/global';
import { installService } from '../../services/installService';
import { Game, GameInstalled } from '../../../../types/global';
import { rootPath } from 'electron-root-path';
import { exec } from 'child_process';
import { getMainWindow } from '../..';
import { deleteFolderRecursive } from '../DeleteFolder';

export class FitgirlEditor implements EditorInterface {
  verifyStructure(gamePath: string): boolean {
    // Example of a game structure of OnlineFix games
    // gamePath/
    // ├── MD5/
    // │   ├── QuickSFV.EXE
    // │   ├── QuickSFV.ini
    // │   ├── fitgirl-bins.md5
    // ├── fg-0X.bin (X = 1 ,2, 3, 4, ...)
    // ├── setup.exe
    // ├── setup-fitgirl-0X.bin (X = 1, 2, 3, ...) (Optionnal - Only for bigs games)
    // ├── Verify BIN files before installation.bat

    // Verify the structure of the game folder

    const gameFiles = fs.readdirSync(gamePath);
    const md5Folder = gameFiles.find((file) => file === 'MD5');
    const setupFile = gameFiles.find((file) => file === 'setup.exe');
    const verifyFile = gameFiles.find((file) => file === 'Verify BIN files before installation.bat');
    if (!md5Folder || !setupFile || !verifyFile) {
      return false;
    }

    return true;
  }

  public installGame = async (setupFolder: string, gameData: Game): Promise<void> => {
    const savePath = join(rootPath, 'downloads', gameData.title);
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath);
    }
    // Find the setup file
    const setupPath = join(setupFolder, 'setup.exe');
    // Run the setup file
    this.runSetup(setupPath, savePath, gameData);
  };
  private runSetup = (setupPath: string, installPath: string, gameData: Game) => {
    const command = `"${setupPath}" /? /silent /DIR="${installPath}/"`;
    this.execute(command, (output) => {
      installService.installFinished(installPath, gameData);
      const path = this.deleteInstallFiles(setupPath);
    });
  };
  private execute = (command, callback) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        const win = getMainWindow();
        win?.webContents.send('error', error.message);
        return;
      }
      if (stderr) {
        const win = getMainWindow();
        win?.webContents.send('error', stderr);
        return;
      }
      console.log(`Stdout : ${stdout}`);
      callback(stdout);
    });
  };
  private deleteInstallFiles = (setupPath: string) => {
    const folder = setupPath.split('\\').slice(0, -1).join('\\');
    deleteFolderRecursive(folder);
  };
}
