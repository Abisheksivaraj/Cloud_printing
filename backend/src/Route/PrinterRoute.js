const express = require("express");
const router = express.Router();
const { exec, spawn } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// Helper functions
function determineConnection(portName) {
  if (!portName) return "local";
  portName = portName.toLowerCase();

  if (portName.includes("usb")) return "usb";
  if (portName.includes("wsd") || portName.includes("network")) return "wifi";
  if (portName.includes("bluetooth") || portName.includes("bth"))
    return "bluetooth";
  if (portName.includes("ip_") || portName.includes("tcp")) return "ethernet";

  return "local";
}

async function getDefaultPrinter() {
  try {
    const { stdout } = await execPromise(
      'powershell -Command "(Get-WmiObject -Class Win32_Printer | Where-Object {$_.Default -eq $true}).Name"',
    );
    return stdout.trim();
  } catch (error) {
    console.error("Error getting default printer:", error);
    return null;
  }
}

function getStatusText(status) {
  const statusMap = {
    0: "Ready",
    1: "Other",
    2: "Unknown",
    3: "Idle",
    4: "Printing",
    5: "Warmup",
    6: "Stopped Printing",
    7: "Offline",
  };
  return statusMap[status] || "Unknown";
}

// Check if printer is actually connected and available
async function isPrinterConnected(printerName) {
  try {
    const { stdout } = await execPromise(
      `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \\"Name='${printerName.replace(/'/g, "''")}'\\" | Select-Object Name, WorkOffline, PrinterStatus, DetectedErrorState | ConvertTo-Json"`,
    );

    const printerStatus = JSON.parse(stdout);

    if (printerStatus.WorkOffline === true) {
      return false;
    }

    if (printerStatus.PrinterStatus === 7) {
      return false;
    }

    if (printerStatus.PortName && printerStatus.PortName.includes("USB")) {
      try {
        const { stdout: usbCheck } = await execPromise(
          `powershell -Command "Get-Printer -Name '${printerName.replace(/'/g, "''")}' | Select-Object PortName, PrinterStatus"`,
        );
        return printerStatus.PrinterStatus !== 7;
      } catch (usbError) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(
      `Error checking printer connection for ${printerName}:`,
      error,
    );
    return false;
  }
}

// Get list of available and connected printers only
router.get("/api/printers", async (req, res) => {
  try {
    console.log("Fetching connected printers...");

    const { stdout } = await execPromise(
      'powershell -Command "Get-WmiObject -Class Win32_Printer | Select-Object Name, DriverName, PortName, Default, WorkOffline, PrinterStatus, DetectedErrorState, Shared, Network | ConvertTo-Json"',
    );

    let printers = [];
    try {
      const parsed = JSON.parse(stdout);
      printers = Array.isArray(parsed) ? parsed : [parsed];
    } catch (parseError) {
      console.error("Error parsing printer data:", parseError);
      return res.json({ printers: [] });
    }

    const connectedPrinters = [];

    for (const printer of printers) {
      if (printer.WorkOffline === true || printer.PrinterStatus === 7) {
        console.log(`Skipping offline printer: ${printer.Name}`);
        continue;
      }

      if (printer.PortName && printer.PortName.includes("USB")) {
        const isConnected = await isPrinterConnected(printer.Name);
        if (!isConnected) {
          console.log(`USB printer not connected: ${printer.Name}`);
          continue;
        }
      }

      connectedPrinters.push({
        name: printer.Name,
        displayName: printer.Name,
        driver: printer.DriverName,
        port: printer.PortName,
        status: getStatusText(printer.PrinterStatus),
        connection: determineConnection(printer.PortName),
        isNetwork: printer.Shared || printer.Network || false,
        isDefault: printer.Default === true,
        workOffline: printer.WorkOffline === true,
      });
    }

    console.log(
      `Found ${connectedPrinters.length} connected printers out of ${printers.length} total`,
    );

    if (connectedPrinters.length === 0) {
      console.log("No connected printers found");
      return res.json({ printers: [] });
    }

    res.json({ printers: connectedPrinters });
  } catch (error) {
    console.error("Error fetching printers:", error);
    res.json({ printers: [] });
  }
});

// Open printer properties - MULTIPLE METHODS
router.post("/api/printer/properties", async (req, res) => {
  try {
    const { printerName } = req.body;

    if (!printerName) {
      return res.status(400).json({ error: "Printer name is required" });
    }

    console.log(`Opening printer properties for: ${printerName}`);

    // Method 1: Try using rundll32 with printui.dll (most reliable for properties)
    try {
      const command = `rundll32.exe printui.dll,PrintUIEntry /e /n "${printerName}"`;

      // Use spawn instead of exec for better process handling
      const child = spawn(
        "rundll32.exe",
        ["printui.dll,PrintUIEntry", "/e", `/n"${printerName}"`],
        {
          detached: true,
          stdio: "ignore",
          shell: true,
        },
      );

      child.unref();

      // Wait a moment to see if it errors immediately
      await new Promise((resolve) => setTimeout(resolve, 500));

      return res.json({
        success: true,
        message: "Printer properties dialog opened",
        method: "rundll32",
      });
    } catch (error) {
      console.log("Method 1 failed, trying method 2...", error);
    }

    // Method 2: Try using control.exe
    try {
      const child = spawn("control.exe", ["printers"], {
        detached: true,
        stdio: "ignore",
      });

      child.unref();

      return res.json({
        success: true,
        message:
          "Printers control panel opened. Please double-click on your printer to see properties.",
        method: "control.exe",
      });
    } catch (error) {
      console.log("Method 2 failed, trying method 3...", error);
    }

    // Method 3: Try using PowerShell to invoke printer properties
    try {
      await execPromise(
        `powershell -Command "Start-Process 'rundll32.exe' -ArgumentList 'printui.dll,PrintUIEntry /e /n \\"${printerName}\\"'"`,
      );

      return res.json({
        success: true,
        message: "Printer properties dialog opened",
        method: "powershell",
      });
    } catch (error) {
      console.log("Method 3 failed, trying method 4...", error);
    }

    // Method 4: Open Windows Settings to printer page
    try {
      await execPromise(`start ms-settings:printers`);

      return res.json({
        success: true,
        message:
          "Windows printer settings opened. Please select your printer to configure.",
        method: "windows-settings",
        requiresManualAction: true,
      });
    } catch (error) {
      console.log("All methods failed", error);
    }

    throw new Error("All methods to open printer properties failed");
  } catch (error) {
    console.error("Error opening printer properties:", error);
    res.status(500).json({
      error: "Failed to open printer properties",
      details: error.message,
      suggestion:
        "Please open Windows Settings > Devices > Printers & scanners manually",
    });
  }
});

// Open specific printer's settings page in Windows Settings
router.post("/api/printer/settings-page", async (req, res) => {
  try {
    const { printerName } = req.body;

    if (!printerName) {
      return res.status(400).json({ error: "Printer name is required" });
    }

    console.log(`Opening Windows settings page for printer: ${printerName}`);

    // This will open the printer's specific management page
    const command = `start shell:::{A8A91A66-3A7D-4424-8D24-04E180695C7A}`;
    await execPromise(command);

    res.json({
      success: true,
      message: "Printer devices page opened",
    });
  } catch (error) {
    console.error("Error opening printer settings page:", error);

    // Fallback to general printers settings
    try {
      await execPromise("start ms-settings:printers");
      res.json({
        success: true,
        message: "Windows printer settings opened",
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: "Failed to open printer settings",
        details: error.message,
      });
    }
  }
});

// Open printer preferences (different from properties)
router.post("/api/printer/preferences", async (req, res) => {
  try {
    const { printerName } = req.body;

    if (!printerName) {
      return res.status(400).json({ error: "Printer name is required" });
    }

    console.log(`Opening printer preferences for: ${printerName}`);

    // Open printing preferences (not properties)
    const command = `rundll32.exe printui.dll,PrintUIEntry /p /n "${printerName}"`;

    const child = spawn(
      "rundll32.exe",
      ["printui.dll,PrintUIEntry", "/p", `/n"${printerName}"`],
      {
        detached: true,
        stdio: "ignore",
        shell: true,
      },
    );

    child.unref();

    res.json({
      success: true,
      message: "Printer preferences dialog opened",
    });
  } catch (error) {
    console.error("Error opening printer preferences:", error);
    res.status(500).json({
      error: "Failed to open printer preferences",
      details: error.message,
    });
  }
});

// Open Windows Printer Settings page
router.post("/api/open-printer-settings", async (req, res) => {
  try {
    console.log("Opening Windows printer settings...");

    // Try multiple methods
    try {
      await execPromise("start ms-settings:printers");
    } catch {
      // Fallback to control panel
      await execPromise("control.exe printers");
    }

    res.json({
      success: true,
      message: "Windows printer settings opened",
    });
  } catch (error) {
    console.error("Error opening printer settings:", error);
    res.status(500).json({
      error: "Failed to open printer settings",
      details: error.message,
    });
  }
});

// Get detailed printer information (only if connected)
router.get("/api/printer/:printerName/info", async (req, res) => {
  try {
    const { printerName } = req.params;

    console.log(`Getting detailed info for printer: ${printerName}`);

    const { stdout } = await execPromise(
      `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \\"Name='${printerName.replace(/'/g, "''")}'\\" | Select-Object * | ConvertTo-Json"`,
    );

    const printerInfo = JSON.parse(stdout);

    res.json({
      success: true,
      printer: printerInfo,
    });
  } catch (error) {
    console.error("Error getting printer info:", error);
    res.status(500).json({
      error: "Failed to get printer information",
      details: error.message,
    });
  }
});

// Check real-time printer connection status
router.get("/api/printer/:printerName/status", async (req, res) => {
  try {
    const { printerName } = req.params;

    console.log(`Checking connection status for: ${printerName}`);

    const isConnected = await isPrinterConnected(printerName);

    res.json({
      success: true,
      printerName,
      isConnected,
      status: isConnected ? "Connected" : "Disconnected",
    });
  } catch (error) {
    console.error("Error checking printer status:", error);
    res.status(500).json({
      error: "Failed to check printer status",
      details: error.message,
    });
  }
});

module.exports = router;
