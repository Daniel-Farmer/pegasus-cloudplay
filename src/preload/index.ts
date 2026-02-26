import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  onAuthCallback: (callback: (url: string) => void) => {
    const handler = (_event: IpcRendererEvent, url: string) => callback(url)
    ipcRenderer.on('auth:callback', handler)
    return () => ipcRenderer.removeListener('auth:callback', handler)
  }
})