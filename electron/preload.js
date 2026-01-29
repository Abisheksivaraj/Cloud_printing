const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // -------- System Info (via IPC) --------
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // -------- Printer Management --------
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  openPrinterProperties: (printerName) =>
    ipcRenderer.invoke('open-printer-properties', printerName),
  openPrinterPreferences: (printerName) =>
    ipcRenderer.invoke('open-printer-preferences', printerName),
  openWindowsSettings: (page) =>
    ipcRenderer.invoke('open-windows-settings', page),
  getPrinterDetails: (printerName) =>
    ipcRenderer.invoke('get-printer-details', printerName),
  setDefaultPrinter: (printerName) =>
    ipcRenderer.invoke('set-default-printer', printerName),

  // -------- Print Actions --------
  printLabel: (options) => ipcRenderer.invoke('print-label', options),
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),

  // -------- Utility --------
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // -------- Events (optional) --------
  onPrintStatus: (callback) => {
    ipcRenderer.on('print-status', (_event, status) => callback(status));
  },

  // Remove listener when component unmounts
  removePrintStatusListener: () => {
    ipcRenderer.removeAllListeners('print-status');
  },
});
