import { shell, ipcMain } from "electron";

export function registerOpenerHandlers(): void {
  ipcMain.handle("paseo:opener:openUrl", async (_event, url: string) => {
    await shell.openExternal(url);
  });
}
