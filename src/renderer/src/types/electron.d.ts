interface ElectronAPI {
  minimize: () => void
  close: () => void
  openExternal: (url: string) => void
  onAuthCallback: (callback: (url: string) => void) => () => void
}

declare interface Window {
  electronAPI: ElectronAPI
}