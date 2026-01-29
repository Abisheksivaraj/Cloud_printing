const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

app.whenReady().then(createMainWindow);

// -------- System Info Handler --------
ipcMain.handle('get-system-info', () => ({
  homedir: os.homedir(),
  osVersion: os.version(),
  arch: os.arch(),
  platform: os.platform(),
  hostname: os.hostname(),
}));

// -------- Printer Handlers --------

// Get list of available printers
ipcMain.handle('get-printers', async () => {
  try {
    const win = BrowserWindow.getAllWindows()[0];
    const printers = await win.webContents.getPrintersAsync();

    console.log('Printers found:', printers.length);

    // Format printers with additional info
    const formattedPrinters = printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description,
      status: printer.status,
      isDefault: printer.isDefault,
      // Try to determine connection type
      connection: determineConnectionType(printer.name, printer.description),
      options: printer.options || {},
    }));

    return formattedPrinters;
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});

// Helper function to determine connection type
function determineConnectionType(name, description) {
  const nameAndDesc = `${name} ${description || ''}`.toLowerCase();

  if (nameAndDesc.includes('usb')) return 'usb';
  if (
    nameAndDesc.includes('wireless') ||
    nameAndDesc.includes('wifi') ||
    nameAndDesc.includes('network')
  )
    return 'wifi';
  if (nameAndDesc.includes('bluetooth')) return 'bluetooth';
  if (nameAndDesc.includes('ethernet') || nameAndDesc.includes('lan'))
    return 'ethernet';

  return 'local';
}

// Open Windows printer properties dialog
ipcMain.handle('open-printer-properties', async (event, printerName) => {
  try {
    console.log(`Opening printer properties for: ${printerName}`);

    if (process.platform === 'win32') {
      // Method 1: Try using rundll32 with printui.dll
      try {
        const command = `rundll32.exe printui.dll,PrintUIEntry /e /n "${printerName}"`;

        await execPromise(command);

        console.log('Printer properties opened successfully');
        return { success: true, method: 'rundll32' };
      } catch (error) {
        console.log('Method 1 failed, trying alternative...', error.message);

        // Method 2: Try opening control panel printers
        try {
          await execPromise('control.exe printers');
          return {
            success: true,
            method: 'control-panel',
            message:
              'Printers control panel opened. Please select your printer.',
          };
        } catch (error2) {
          console.log(
            'Method 2 failed, trying Windows Settings...',
            error2.message,
          );

          // Method 3: Open Windows Settings
          await execPromise('start ms-settings:printers');
          return {
            success: true,
            method: 'windows-settings',
            message:
              'Windows printer settings opened. Please select your printer.',
          };
        }
      }
    } else if (process.platform === 'darwin') {
      // macOS
      await execPromise(
        `open "x-apple.systempreferences:com.apple.preference.printfax"`,
      );
      return { success: true, method: 'system-preferences' };
    } else {
      // Linux
      await execPromise('system-config-printer');
      return { success: true, method: 'system-config' };
    }
  } catch (error) {
    console.error('Error opening printer properties:', error);
    return {
      success: false,
      error: error.message,
      suggestion:
        'Please open printer settings manually from Windows Settings > Devices > Printers & scanners',
    };
  }
});

// Open Windows printer preferences (printing preferences, not properties)
ipcMain.handle('open-printer-preferences', async (event, printerName) => {
  try {
    console.log(`Opening printer preferences for: ${printerName}`);

    if (process.platform === 'win32') {
      const command = `rundll32.exe printui.dll,PrintUIEntry /p /n "${printerName}"`;
      await execPromise(command);

      return { success: true };
    } else {
      // Fallback to properties for non-Windows
      return await ipcMain.handle(
        'open-printer-properties',
        event,
        printerName,
      );
    }
  } catch (error) {
    console.error('Error opening printer preferences:', error);
    return { success: false, error: error.message };
  }
});

// Open Windows Settings to printers page
ipcMain.handle('open-windows-settings', async (event, page = 'printers') => {
  try {
    console.log(`Opening Windows Settings: ${page}`);

    if (process.platform === 'win32') {
      await execPromise(`start ms-settings:${page}`);
      return { success: true };
    } else if (process.platform === 'darwin') {
      await execPromise(
        'open "x-apple.systempreferences:com.apple.preference.printfax"',
      );
      return { success: true };
    } else {
      await execPromise('system-config-printer');
      return { success: true };
    }
  } catch (error) {
    console.error('Error opening system settings:', error);
    return { success: false, error: error.message };
  }
});

// Get detailed printer information using PowerShell (Windows only)
ipcMain.handle('get-printer-details', async (event, printerName) => {
  try {
    if (process.platform !== 'win32') {
      return { success: false, error: 'Only supported on Windows' };
    }

    console.log(`Getting details for printer: ${printerName}`);

    const { stdout } = await execPromise(
      `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \\"Name='${printerName.replace(/'/g, "''")}'\\" | Select-Object Name, DriverName, PortName, PrinterStatus, WorkOffline, Default, Shared | ConvertTo-Json"`,
    );

    const printerInfo = JSON.parse(stdout);

    return {
      success: true,
      printer: {
        name: printerInfo.Name,
        driver: printerInfo.DriverName,
        port: printerInfo.PortName,
        status: getPrinterStatusText(printerInfo.PrinterStatus),
        isOffline: printerInfo.WorkOffline === true,
        isDefault: printerInfo.Default === true,
        isShared: printerInfo.Shared === true,
      },
    };
  } catch (error) {
    console.error('Error getting printer details:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to convert printer status code to text
function getPrinterStatusText(status) {
  const statusMap = {
    0: 'Ready',
    1: 'Other',
    2: 'Unknown',
    3: 'Idle',
    4: 'Printing',
    5: 'Warmup',
    6: 'Stopped Printing',
    7: 'Offline',
  };
  return statusMap[status] || 'Unknown';
}

// Set default printer (Windows only)
ipcMain.handle('set-default-printer', async (event, printerName) => {
  try {
    if (process.platform !== 'win32') {
      return { success: false, error: 'Only supported on Windows' };
    }

    console.log(`Setting default printer to: ${printerName}`);

    await execPromise(
      `powershell -Command "(Get-WmiObject -Class Win32_Printer -Filter \\"Name='${printerName.replace(/'/g, "''")}'\\"").SetDefaultPrinter()"`,
    );

    return { success: true, message: `Default printer set to ${printerName}` };
  } catch (error) {
    console.error('Error setting default printer:', error);
    return { success: false, error: error.message };
  }
});

// Print label with specific printer
ipcMain.handle('print-label', async (event, options = {}) => {
  try {
    const win = BrowserWindow.getAllWindows()[0];

    const printOptions = {
      silent: options.silent !== undefined ? options.silent : false,
      printBackground:
        options.printBackground !== undefined ? options.printBackground : true,
      deviceName: options.printerName || undefined,
      color: options.color !== undefined ? options.color : true,
      margins: options.margins || {
        marginType: 'none',
      },
      landscape: options.landscape || false,
      scaleFactor: options.scaleFactor || 100,
      pagesPerSheet: options.pagesPerSheet || 1,
      collate: options.collate !== undefined ? options.collate : true,
      copies: options.copies || 1,
      pageRanges: options.pageRanges || [],
      duplexMode: options.duplexMode || 'simplex',
      dpi: options.dpi || { horizontal: 300, vertical: 300 },
      header: options.header || '',
      footer: options.footer || '',
    };

    console.log('Printing with options:', printOptions);

    win.webContents.print(printOptions, (success, errorType) => {
      if (!success) {
        console.error('Print failed:', errorType);
      } else {
        console.log('Print job sent successfully');
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error printing:', error);
    return { success: false, error: error.message };
  }
});

// Print to PDF
ipcMain.handle('print-to-pdf', async (event, options = {}) => {
  try {
    const win = BrowserWindow.getAllWindows()[0];

    const pdfOptions = {
      marginsType: 0,
      pageSize: options.pageSize || 'A4',
      printBackground:
        options.printBackground !== undefined ? options.printBackground : true,
      printSelectionOnly: false,
      landscape: options.landscape || false,
    };

    const data = await win.webContents.printToPDF(pdfOptions);

    console.log('PDF generated successfully, size:', data.length);

    return {
      success: true,
      data: data.toString('base64'),
      size: data.length,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
});

// Open external link
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Error opening external link:', error);
    return { success: false, error: error.message };
  }
});

// App lifecycle events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
