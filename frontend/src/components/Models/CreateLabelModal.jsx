import React, { useState, useMemo, useEffect } from "react";
import { X, Printer, Settings, RefreshCw } from "lucide-react";

const EnhancedCreateLabelModal = ({ onClose, onCreate }) => {
  const [activeTab, setActiveTab] = useState("settings");
  const [labelName, setLabelName] = useState("");
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(30);

  // Printer states
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({
    paperSize: "A4",
    orientation: "portrait",
    quality: "normal",
    copies: 1,
    colorMode: "color",
  });

  // Advanced settings - Default to 2x2 grid
  const [columns, setColumns] = useState(2);
  const [rows, setRows] = useState(2);
  const [horizontalSpacing, setHorizontalSpacing] = useState(1);
  const [verticalSpacing, setVerticalSpacing] = useState(11);
  const [marginLeft, setMarginLeft] = useState(2);
  const [marginRight, setMarginRight] = useState(2);
  const [marginTop, setMarginTop] = useState(2);
  const [marginBottom, setMarginBottom] = useState(2);

  // Shape settings
  const [labelShape, setLabelShape] = useState("rectangle");
  const [cornerRadius, setCornerRadius] = useState(2);
  const [printDirection, setPrintDirection] = useState("horizontal");
  const [startCorner, setStartCorner] = useState("top-left");
  const [orientation, setOrientation] = useState(0);

  // Relocation
  const [relocateLeft, setRelocateLeft] = useState(0);
  const [relocateTop, setRelocateTop] = useState(0);

  // Predefined label sizes
  const [selectedLabelSize, setSelectedLabelSize] = useState("custom");

  // Archery Technocrats Brand Colors
  const colors = {
    primaryPink: "#E85874",
    primaryBlue: "#39A3DD",
    darkGray: "#38474F",
    lightPink: "#FDD7E0",
    mediumPink: "#F59FB5",
    darkPink: "#C4455D",
    lightBlue: "#D4EAF7",
    mediumBlue: "#6BB9E5",
    darkBlue: "#2A7FAF",
    white: "#FFFFFF",
    lightGray: "#F5F7F9",
    mediumGray: "#8A9BA5",
  };


  // Fetch available printers on component mount
  useEffect(() => {
    fetchAvailablePrinters();
  }, []);

  // Fetch printers - works in both Electron and web browser
  const fetchAvailablePrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      console.log("Fetching printers...");


      // Method 2: Fallback to backend API
      console.log("Using backend API to get printers...");
      const response = await fetch("http://localhost:3001/api/printers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Printers from backend:", data.printers);

        setAvailablePrinters(data.printers || []);

        if (data.printers && data.printers.length > 0) {
          const defaultPrinter = data.printers.find((p) => p.isDefault);
          setSelectedPrinter(
            defaultPrinter ? defaultPrinter.name : data.printers[0].name,
          );
        }
      } else {
        console.error("Failed to fetch printers from backend");
        setAvailablePrinters([]);
      }
    } catch (error) {
      console.error("Error fetching printers:", error);
      setAvailablePrinters([]);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handlePrinterChange = async (printerName) => {
    setSelectedPrinter(printerName);
    await loadPrinterSettings(printerName);
  };

  const loadPrinterSettings = async (printerName) => {
    try {
      const printer = availablePrinters.find((p) => p.name === printerName);

      if (printer) {
        // Load printer-specific default settings
        if (printer.name.includes("PDF")) {
          setPrinterSettings((prev) => ({
            ...prev,
            paperSize: "A4",
            quality: "high",
          }));
        } else if (
          printer.name.includes("HPRT") ||
          printer.name.includes("ZPL")
        ) {
          setPrinterSettings((prev) => ({
            ...prev,
            paperSize: "Custom",
            quality: "normal",
          }));
        }
      }

    } catch (error) {
      console.error("Error loading printer settings:", error);
    }
  };

  // Function to open Windows printer properties dialog
  const handlePrintSettings = async () => {
    if (!selectedPrinter) {
      alert("Please select a printer first");
      return;
    }

    try {
      console.log(`Opening printer properties for: ${selectedPrinter}`);


      // Method 2: Try backend API (fallback for web)
      console.log("Using backend API to open printer properties...");
      const response = await fetch(
        "http://localhost:3001/api/printer/properties",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ printerName: selectedPrinter }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Printer properties opened via backend:", data.message);

        if (data.requiresManualAction || data.message) {
          alert(
            data.message ||
            "Printer settings opened. Please select your printer to configure.",
          );
        }
        return;
      }

      // Method 3: Show fallback modal if all else fails
      console.log("All methods failed, showing fallback modal");
      setShowPrinterSettings(true);
    } catch (error) {
      console.error("Error opening printer properties:", error);

      // Show fallback modal
      setShowPrinterSettings(true);
    }
  };

  const openWindowsPrinterSettings = async () => {
    try {
      await fetch("http://localhost:3001/api/open-printer-settings", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error opening Windows settings:", error);
      alert(
        "Please open Windows Settings > Devices > Printers & scanners manually",
      );
    }
  };

  const savePrinterSettings = () => {
    setShowPrinterSettings(false);
  };

  const getConnectionIcon = (connection) => {
    switch (connection?.toLowerCase()) {
      case "usb":
        return "🔌";
      case "wifi":
      case "wireless":
        return "📶";
      case "bluetooth":
        return "📱";
      case "ethernet":
      case "network":
        return "🌐";
      case "local":
        return "🖨️";
      default:
        return "🖨️";
    }
  };

  const labelSizePresets = [
    {
      id: "ATPL-100x75",
      name: "ATPL 100mm x 75mm",
      width: 100,
      height: 75,
      cols: 2,
      rows: 1,
    },
    {
      id: "ATPL-100x50",
      name: "ATPL 100mm x 50mm",
      width: 100,
      height: 50,
      cols: 2,
      rows: 1,
    },
    {
      id: "ATPL-100x150",
      name: "ATPL 100mm x 150mm",
      width: 100,
      height: 150,
      cols: 1,
      rows: 1,
    },
    {
      id: "ATPL-50x25-2a",
      name: "ATPL 50mm x 25mm 2A",
      width: 50,
      height: 25,
      cols: 2,
      rows: 2,
    },
    {
      id: "ATPL-50x25-1a",
      name: "ATPL 50mm x 25mm 1A",
      width: 50,
      height: 25,
      cols: 1,
      rows: 1,
    },
    {
      id: "ATPL-75x50",
      name: "ATPL 75mm x 50mm",
      width: 75,
      height: 50,
      cols: 2,
      rows: 2,
    },
    {
      id: "ATPL-100x100",
      name: "ATPL 100mm x 100mm",
      width: 100,
      height: 100,
      cols: 1,
      rows: 1,
    },
    {
      id: "ATPL-35x25-3a",
      name: "ATPL 35mm x 25mm 3A",
      width: 35,
      height: 25,
      cols: 3,
      rows: 3,
    },
    {
      id: "ATPL-35x22-3a",
      name: "ATPL 35mm x 22mm 3A",
      width: 35,
      height: 22,
      cols: 3,
      rows: 3,
    },
    {
      id: "ATPL-150x210",
      name: "ATPL 150mm x 210mm",
      width: 150,
      height: 210,
      cols: 1,
      rows: 1,
    },
    { id: "custom", name: "Custom", width: 50, height: 30, cols: 2, rows: 2 },
  ];

  const presetSizes = [
    { name: "Small Label", width: 50, height: 30, cols: 2, rows: 2 },
    { name: "Medium Label", width: 75, height: 50, cols: 2, rows: 2 },
    { name: "Large Label", width: 100, height: 80, cols: 1, rows: 1 },
    { name: "4-Up Small", width: 50, height: 25, cols: 2, rows: 2 },
    { name: "2-Up Wide", width: 100, height: 50, cols: 2, rows: 1 },
    { name: "Single", width: 100, height: 80, cols: 1, rows: 1 },
  ];

  // Calculate label order based on settings
  const getLabelOrder = useMemo(() => {
    const totalLabels = Math.min(columns * rows, 25);
    const order = [];

    for (let i = 0; i < totalLabels; i++) {
      let row, col;

      if (printDirection === "horizontal") {
        row = Math.floor(i / columns);
        col = i % columns;
      } else {
        col = Math.floor(i / rows);
        row = i % rows;
      }

      if (startCorner === "top-right") {
        col = columns - 1 - col;
      } else if (startCorner === "bottom-left") {
        row = rows - 1 - row;
      } else if (startCorner === "bottom-right") {
        col = columns - 1 - col;
        row = rows - 1 - row;
      }

      order.push({ row, col, number: i + 1 });
    }

    return order;
  }, [columns, rows, printDirection, startCorner]);

  const calculatePaperSize = () => {
    let paperWidth =
      width * columns +
      marginLeft +
      marginRight +
      horizontalSpacing * (columns - 1);
    let paperHeight =
      height * rows + marginTop + marginBottom + verticalSpacing * (rows - 1);

    paperWidth += Math.abs(relocateLeft);
    paperHeight += Math.abs(relocateTop);

    if (orientation === 90 || orientation === 270) {
      return { width: paperHeight, height: paperWidth };
    }

    return { width: paperWidth, height: paperHeight };
  };

  const paperSize = calculatePaperSize();

  const handleSubmit = () => {
    if (labelName.trim()) {
      onCreate({
        name: labelName.trim(),
        elements: [],
        labelSize: { width, height },
        printer: {
          name: selectedPrinter,
          displayName:
            availablePrinters.find((p) => p.name === selectedPrinter)
              ?.displayName || selectedPrinter,
          settings: printerSettings,
        },
        advancedSettings: {
          columns,
          rows,
          horizontalSpacing,
          verticalSpacing,
          margins: {
            left: marginLeft,
            right: marginRight,
            top: marginTop,
            bottom: marginBottom,
          },
          shape: labelShape,
          cornerRadius,
          printDirection,
          startCorner,
          orientation,
          relocation: {
            left: relocateLeft,
            top: relocateTop,
          },
        },
      });
      onClose();
    }
  };

  const applyPreset = (preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setColumns(preset.cols);
    setRows(preset.rows);
    setSelectedLabelSize("custom");
  };

  const applyLabelSizePreset = (presetId) => {
    const preset = labelSizePresets.find((p) => p.id === presetId);
    if (preset) {
      setSelectedLabelSize(presetId);
      setWidth(preset.width);
      setHeight(preset.height);
      setColumns(preset.cols);
      setRows(preset.rows);
    }
  };

  // Printer Settings Modal Component (Fallback)
  const PrinterSettingsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{
            background: colors.darkGray,
            borderColor: colors.lightGray,
          }}
        >
          <div className="flex items-center space-x-3">
            <Settings size={24} style={{ color: colors.white }} />
            <div>
              <h3 className="text-xl font-bold" style={{ color: colors.white }}>
                Printer Settings
              </h3>
              <p className="text-sm" style={{ color: colors.mediumGray }}>
                {availablePrinters.find((p) => p.name === selectedPrinter)
                  ?.displayName || selectedPrinter}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPrinterSettings(false)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} style={{ color: colors.white }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: colors.lightBlue,
              borderColor: colors.mediumBlue,
            }}
          >
            <p className="text-sm" style={{ color: colors.darkGray }}>
              <strong>Note:</strong> For full printer configuration, please use
              the Windows printer properties dialog. Click "Open Windows
              Settings" below to access system printer settings.
            </p>
          </div>

          {/* Paper Size */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.darkGray }}
            >
              Paper Size
            </label>
            <select
              value={printerSettings.paperSize}
              onChange={(e) =>
                setPrinterSettings({
                  ...printerSettings,
                  paperSize: e.target.value,
                })
              }
              className="w-full px-3 py-2 border-2 rounded-lg"
              style={{ borderColor: colors.lightGray }}
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="Custom">Custom Size</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.darkGray }}
            >
              Page Orientation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  checked={printerSettings.orientation === "portrait"}
                  onChange={() =>
                    setPrinterSettings({
                      ...printerSettings,
                      orientation: "portrait",
                    })
                  }
                  style={{ accentColor: colors.primaryPink }}
                />
                <span>Portrait</span>
              </label>
              <label className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  checked={printerSettings.orientation === "landscape"}
                  onChange={() =>
                    setPrinterSettings({
                      ...printerSettings,
                      orientation: "landscape",
                    })
                  }
                  style={{ accentColor: colors.primaryPink }}
                />
                <span>Landscape</span>
              </label>
            </div>
          </div>

          {/* Print Quality */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.darkGray }}
            >
              Print Quality
            </label>
            <select
              value={printerSettings.quality}
              onChange={(e) =>
                setPrinterSettings({
                  ...printerSettings,
                  quality: e.target.value,
                })
              }
              className="w-full px-3 py-2 border-2 rounded-lg"
              style={{ borderColor: colors.lightGray }}
            >
              <option value="draft">Draft (Fast)</option>
              <option value="normal">Normal</option>
              <option value="high">High Quality</option>
              <option value="best">Best Quality (Slow)</option>
            </select>
          </div>

          {/* Color Mode */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.darkGray }}
            >
              Color Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  checked={printerSettings.colorMode === "color"}
                  onChange={() =>
                    setPrinterSettings({
                      ...printerSettings,
                      colorMode: "color",
                    })
                  }
                  style={{ accentColor: colors.primaryPink }}
                />
                <span>Color</span>
              </label>
              <label className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  checked={printerSettings.colorMode === "grayscale"}
                  onChange={() =>
                    setPrinterSettings({
                      ...printerSettings,
                      colorMode: "grayscale",
                    })
                  }
                  style={{ accentColor: colors.primaryPink }}
                />
                <span>Grayscale</span>
              </label>
            </div>
          </div>

          {/* Copies */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.darkGray }}
            >
              Number of Copies
            </label>
            <input
              type="number"
              value={printerSettings.copies}
              onChange={(e) =>
                setPrinterSettings({
                  ...printerSettings,
                  copies: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              min="1"
              max="100"
              className="w-full px-3 py-2 border-2 rounded-lg"
              style={{ borderColor: colors.lightGray }}
            />
          </div>

          {/* Open Windows Settings Button */}
          <button
            onClick={openWindowsPrinterSettings}
            className="w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
            style={{
              backgroundColor: colors.primaryBlue,
              color: colors.white,
            }}
          >
            <Settings size={18} />
            <span>Open Windows Printer Settings</span>
          </button>
        </div>

        <div
          className="flex justify-end space-x-3 p-5 border-t"
          style={{
            backgroundColor: colors.lightGray,
            borderColor: colors.mediumGray,
          }}
        >
          <button
            onClick={() => setShowPrinterSettings(false)}
            className="px-5 py-2 rounded-lg font-medium"
            style={{ color: colors.darkGray }}
          >
            Cancel
          </button>
          <button
            onClick={savePrinterSettings}
            className="px-5 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: colors.primaryPink,
              color: colors.white,
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{
              background: "#38474F",
              borderColor: colors.lightGray,
            }}
          >
            <div>
              <h3 className="text-2xl font-bold" style={{ color: "white" }}>
                New Label
              </h3>
              <p className="text-sm mt-1" style={{ color: colors.mediumGray }}>
                Configure your die-cut label template (Up to 25 labels: 5×5)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              style={{ color: colors.mediumGray }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div
            className="flex border-b px-6"
            style={{
              backgroundColor: colors.lightGray,
              borderColor: colors.mediumGray,
            }}
          >
            <button
              onClick={() => setActiveTab("settings")}
              className="px-6 py-3 font-semibold transition-colors"
              style={{
                color:
                  activeTab === "settings"
                    ? colors.primaryBlue
                    : colors.mediumGray,
                borderBottom:
                  activeTab === "settings"
                    ? `2px solid ${colors.primaryBlue}`
                    : "none",
                backgroundColor:
                  activeTab === "settings" ? colors.white : "transparent",
              }}
            >
              Label Settings
            </button>
            <button
              onClick={() => setActiveTab("shape")}
              className="px-6 py-3 font-semibold transition-colors"
              style={{
                color:
                  activeTab === "shape"
                    ? colors.primaryBlue
                    : colors.mediumGray,
                borderBottom:
                  activeTab === "shape"
                    ? `2px solid ${colors.primaryBlue}`
                    : "none",
                backgroundColor:
                  activeTab === "shape" ? colors.white : "transparent",
              }}
            >
              Shape/Printing Order
            </button>
          </div>

          {/* Content - Split View */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Side - Preview (35%) */}
            <div
              className="w-[35%] border-r p-4 overflow-y-auto"
              style={{
                background: `linear-gradient(to bottom right, ${colors.lightGray}, ${colors.lightBlue})`,
                borderColor: colors.mediumGray,
              }}
            >
              <h3
                className="font-bold mb-3 text-base flex items-center"
                style={{ color: colors.darkGray }}
              >
                <span className="mr-2">👁️</span> Preview
              </h3>
              <div
                className="rounded-xl p-4 border-2"
                style={{
                  backgroundColor: colors.mediumGray,
                  borderColor: colors.darkGray,
                }}
              >
                {/* Grid Preview */}
                <div
                  className="mb-4 mx-auto flex items-center justify-center"
                  style={{ minHeight: "250px" }}
                >
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${columns}, 1fr)`,
                      maxWidth: "450px",
                      transform: `rotate(${orientation}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    {getLabelOrder.map((labelInfo) => (
                      <div
                        key={labelInfo.number}
                        className="flex items-center justify-center transition-all duration-300 relative"
                        style={{
                          gridColumn: labelInfo.col + 1,
                          gridRow: labelInfo.row + 1,
                          width: `${width * 2}px`,
                          height: `${height * 2}px`,
                          backgroundColor: colors.white,
                          border: `2px solid #000000`,
                          borderRadius:
                            labelShape === "rounded"
                              ? `${Math.min(cornerRadius * 2, 12)}px`
                              : labelShape === "ellipse"
                                ? "50%"
                                : "2px",
                        }}
                      >
                        <div className="text-center">
                          <div
                            className="text-3xl font-bold"
                            style={{ color: colors.darkGray }}
                          >
                            {labelInfo.number}
                          </div>
                        </div>
                        {labelInfo.number === 1 && (
                          <div className="absolute -left-2 -top-2">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colors.primaryPink }}
                            >
                              <span className="text-white text-[10px] font-bold">
                                S
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-2 text-xs">
                  <div
                    className="border p-2 rounded-lg"
                    style={{
                      backgroundColor: colors.lightBlue,
                      borderColor: colors.mediumBlue,
                    }}
                  >
                    <p
                      className="font-medium"
                      style={{ color: colors.mediumGray }}
                    >
                      Paper size:
                    </p>
                    <p
                      className="font-bold text-sm"
                      style={{ color: colors.primaryBlue }}
                    >
                      {paperSize.width.toFixed(1)} ×{" "}
                      {paperSize.height.toFixed(1)} mm
                    </p>
                  </div>
                  <div
                    className="border p-2 rounded-lg"
                    style={{
                      backgroundColor: colors.lightPink,
                      borderColor: colors.mediumPink,
                    }}
                  >
                    <p
                      className="font-medium"
                      style={{ color: colors.mediumGray }}
                    >
                      Label Size:
                    </p>
                    <p
                      className="font-bold text-sm"
                      style={{ color: colors.primaryPink }}
                    >
                      {width} × {height} mm
                    </p>
                  </div>
                  {(columns > 1 || rows > 1) && (
                    <>
                      <div
                        className="border p-2 rounded-lg"
                        style={{
                          backgroundColor: colors.lightBlue,
                          borderColor: colors.mediumBlue,
                        }}
                      >
                        <p
                          className="font-medium"
                          style={{ color: colors.mediumGray }}
                        >
                          Layout:
                        </p>
                        <p
                          className="font-bold text-sm"
                          style={{ color: colors.darkBlue }}
                        >
                          {columns} × {rows} ({Math.min(columns * rows, 25)}-up)
                        </p>
                      </div>
                      {(horizontalSpacing > 0 || verticalSpacing > 0) && (
                        <div
                          className="border p-2 rounded-lg"
                          style={{
                            backgroundColor: colors.lightPink,
                            borderColor: colors.mediumPink,
                          }}
                        >
                          <p
                            className="font-medium"
                            style={{ color: colors.mediumGray }}
                          >
                            Spacing:
                          </p>
                          <p
                            className="font-bold text-sm"
                            style={{ color: colors.darkPink }}
                          >
                            H: {horizontalSpacing}mm / V: {verticalSpacing}mm
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {(relocateLeft !== 0 || relocateTop !== 0) && (
                    <div
                      className="border p-2 rounded-lg"
                      style={{
                        backgroundColor: colors.lightBlue,
                        borderColor: colors.mediumBlue,
                      }}
                    >
                      <p
                        className="font-medium"
                        style={{ color: colors.mediumGray }}
                      >
                        Relocation:
                      </p>
                      <p
                        className="font-bold text-sm"
                        style={{ color: colors.darkBlue }}
                      >
                        Left: {relocateLeft}mm / Top: {relocateTop}mm
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Settings (65%) */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "settings" && (
                <div className="space-y-5">
                  {/* Label Name */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.darkGray }}
                    >
                      Label Name *
                    </label>
                    <input
                      type="text"
                      value={labelName}
                      onChange={(e) => setLabelName(e.target.value)}
                      placeholder="Enter label name..."
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: colors.lightGray,
                      }}
                      autoFocus
                    />
                  </div>

                  {/* Printer Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="block text-sm font-medium"
                        style={{ color: colors.darkGray }}
                      >
                        Printer{" "}
                        {isLoadingPrinters && (
                          <span className="text-xs">(Loading...)</span>
                        )}
                      </label>
                      <button
                        onClick={fetchAvailablePrinters}
                        disabled={isLoadingPrinters}
                        className="flex items-center space-x-1 px-2 py-1 text-xs rounded hover:bg-gray-100 disabled:opacity-50"
                        style={{ color: colors.primaryBlue }}
                      >
                        <RefreshCw
                          size={14}
                          className={isLoadingPrinters ? "animate-spin" : ""}
                        />
                        <span>Refresh</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <select
                          value={selectedPrinter}
                          onChange={(e) => handlePrinterChange(e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                          disabled={
                            isLoadingPrinters || availablePrinters.length === 0
                          }
                        >
                          {availablePrinters.length === 0 ? (
                            <option>No printers connected</option>
                          ) : (
                            availablePrinters.map((printer) => (
                              <option key={printer.name} value={printer.name}>
                                {getConnectionIcon(printer.connection)}{" "}
                                {printer.displayName || printer.name}
                                {printer.isDefault ? " (Default)" : ""}
                              </option>
                            ))
                          )}
                        </select>
                        {availablePrinters.length === 0 &&
                          !isLoadingPrinters && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: colors.mediumGray }}
                            >
                              No printers detected. Please connect a printer and
                              click Refresh.
                            </p>
                          )}
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handlePrintSettings}
                          disabled={
                            !selectedPrinter || availablePrinters.length === 0
                          }
                          className="w-full px-4 py-2 border-2 rounded-lg font-medium text-sm transition-colors hover:opacity-80 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            borderColor: colors.primaryBlue,
                            color: colors.primaryBlue,
                            backgroundColor: colors.lightBlue + "40",
                          }}
                        >
                          <Settings size={16} />
                          <span>Print Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Label Size Dropdown */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: colors.darkGray }}
                    >
                      Label Size Presets
                    </label>
                    <select
                      value={selectedLabelSize}
                      onChange={(e) => applyLabelSizePreset(e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                      style={{ borderColor: colors.lightGray }}
                    >
                      {labelSizePresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Quick Presets */}
                  <div
                    className="border rounded-lg p-3"
                    style={{
                      backgroundColor: colors.lightBlue,
                      borderColor: colors.mediumBlue,
                    }}
                  >
                    <h4
                      className="font-semibold mb-2 text-sm"
                      style={{ color: colors.darkBlue }}
                    >
                      Quick Presets (Die-Cut Labels)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {presetSizes.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className="px-2 py-2 border rounded text-xs font-medium transition-all hover:opacity-80"
                          style={{
                            backgroundColor: colors.white,
                            borderColor: colors.primaryBlue,
                          }}
                        >
                          {preset.name}
                          <br />
                          <span
                            className="text-[10px]"
                            style={{ color: colors.mediumGray }}
                          >
                            {preset.width}×{preset.height} ({preset.cols}×
                            {preset.rows})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Label Size */}
                  <div
                    className="border-2 rounded-lg p-3"
                    style={{ borderColor: colors.lightGray }}
                  >
                    <h4
                      className="font-semibold mb-3 text-sm"
                      style={{ color: colors.darkGray }}
                    >
                      Label Size
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Width{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {width}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => {
                            setWidth(Number(e.target.value));
                            setSelectedLabelSize("custom");
                          }}
                          min="10"
                          max="200"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Height{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {height}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => {
                            setHeight(Number(e.target.value));
                            setSelectedLabelSize("custom");
                          }}
                          min="10"
                          max="200"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Columns (Max 5)
                        </label>
                        <input
                          type="number"
                          value={columns}
                          onChange={(e) =>
                            setColumns(
                              Math.min(Math.max(Number(e.target.value), 1), 5),
                            )
                          }
                          min="1"
                          max="5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Rows (Max 5)
                        </label>
                        <input
                          type="number"
                          value={rows}
                          onChange={(e) =>
                            setRows(
                              Math.min(Math.max(Number(e.target.value), 1), 5),
                            )
                          }
                          min="1"
                          max="5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Horizontal{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {horizontalSpacing}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={horizontalSpacing}
                          onChange={(e) =>
                            setHorizontalSpacing(Number(e.target.value))
                          }
                          min="0"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Vertical{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {verticalSpacing}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={verticalSpacing}
                          onChange={(e) =>
                            setVerticalSpacing(Number(e.target.value))
                          }
                          min="0"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Margins */}
                  <div
                    className="border-2 rounded-lg p-3"
                    style={{ borderColor: colors.lightGray }}
                  >
                    <h4
                      className="font-semibold mb-3 text-sm"
                      style={{ color: colors.darkGray }}
                    >
                      Margins
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Left{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {marginLeft}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={marginLeft}
                          onChange={(e) =>
                            setMarginLeft(Number(e.target.value))
                          }
                          min="0"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Right{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {marginRight}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={marginRight}
                          onChange={(e) =>
                            setMarginRight(Number(e.target.value))
                          }
                          min="0"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Top{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {marginTop}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={marginTop}
                          onChange={(e) => setMarginTop(Number(e.target.value))}
                          min="0"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Bottom{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {marginBottom}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={marginBottom}
                          onChange={(e) =>
                            setMarginBottom(Number(e.target.value))
                          }
                          min="0"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "shape" && (
                <div className="space-y-5">
                  {/* Label Shape */}
                  <div
                    className="border-2 rounded-lg p-3"
                    style={{ borderColor: colors.lightGray }}
                  >
                    <h4
                      className="font-semibold mb-3 text-sm"
                      style={{ color: colors.darkGray }}
                    >
                      Label Shape
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors">
                        <input
                          type="radio"
                          name="shape"
                          checked={labelShape === "rectangle"}
                          onChange={() => setLabelShape("rectangle")}
                          className="w-4 h-4"
                          style={{ accentColor: colors.primaryPink }}
                        />
                        <span
                          className="font-medium text-sm"
                          style={{ color: colors.darkGray }}
                        >
                          Rectangle
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors">
                        <input
                          type="radio"
                          name="shape"
                          checked={labelShape === "rounded"}
                          onChange={() => setLabelShape("rounded")}
                          className="w-4 h-4"
                          style={{ accentColor: colors.primaryPink }}
                        />
                        <span
                          className="font-medium text-sm"
                          style={{ color: colors.darkGray }}
                        >
                          Rounded
                        </span>
                        {labelShape === "rounded" && (
                          <div className="ml-auto flex items-center space-x-2">
                            <span
                              className="text-xs"
                              style={{ color: colors.mediumGray }}
                            >
                              Radius
                            </span>
                            <input
                              type="number"
                              value={cornerRadius}
                              onChange={(e) =>
                                setCornerRadius(Number(e.target.value))
                              }
                              min="0"
                              max="20"
                              className="w-16 px-2 py-1 border rounded text-sm"
                              style={{ borderColor: colors.lightGray }}
                            />
                            <span
                              className="text-xs"
                              style={{ color: colors.mediumGray }}
                            >
                              mm
                            </span>
                          </div>
                        )}
                      </label>
                      <label className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors">
                        <input
                          type="radio"
                          name="shape"
                          checked={labelShape === "ellipse"}
                          onChange={() => setLabelShape("ellipse")}
                          className="w-4 h-4"
                          style={{ accentColor: colors.primaryPink }}
                        />
                        <span
                          className="font-medium text-sm"
                          style={{ color: colors.darkGray }}
                        >
                          Ellipse
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Label Order */}
                  <div
                    className="border-2 rounded-lg p-3"
                    style={{ borderColor: colors.lightGray }}
                  >
                    <h4
                      className="font-semibold mb-3 text-sm"
                      style={{ color: colors.darkGray }}
                    >
                      Label Order
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: colors.darkGray }}
                        >
                          Start Corner
                        </label>
                        <select
                          value={startCorner}
                          onChange={(e) => setStartCorner(e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        >
                          <option value="top-left">Top Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: colors.darkGray }}
                        >
                          Primary Direction
                        </label>
                        <select
                          value={printDirection}
                          onChange={(e) => setPrintDirection(e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{ borderColor: colors.lightGray }}
                        >
                          <option value="horizontal">Horizontal</option>
                          <option value="vertical">Vertical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Direction */}
                  <div
                    className="border-2 rounded-lg p-3"
                    style={{ borderColor: colors.lightGray }}
                  >
                    <h4
                      className="font-semibold mb-3 text-sm"
                      style={{ color: colors.darkGray }}
                    >
                      Direction (Rotation)
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 0, label: "0°" },
                        { value: 90, label: "90°" },
                        { value: 180, label: "180°" },
                        { value: 270, label: "270°" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center space-x-2 p-2 border-2 rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors"
                        >
                          <input
                            type="radio"
                            name="orientation"
                            checked={orientation === opt.value}
                            onChange={() => setOrientation(opt.value)}
                            className="w-4 h-4"
                            style={{ accentColor: colors.primaryPink }}
                          />
                          <span
                            className="font-medium text-sm"
                            style={{ color: colors.darkGray }}
                          >
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Relocation */}
                  <div
                    className="border-2 rounded-lg p-3"
                    style={{
                      backgroundColor: colors.lightBlue,
                      borderColor: colors.mediumBlue,
                    }}
                  >
                    <h4
                      className="font-semibold mb-3 text-sm"
                      style={{ color: colors.darkGray }}
                    >
                      Relocation (Fine-tune position)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Left{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {relocateLeft}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={relocateLeft}
                          onChange={(e) =>
                            setRelocateLeft(Number(e.target.value))
                          }
                          min="-50"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{
                            borderColor: colors.lightGray,
                            backgroundColor: colors.white,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: colors.darkGray }}
                        >
                          Top{" "}
                          <span
                            className="font-bold"
                            style={{ color: colors.primaryBlue }}
                          >
                            {relocateTop}
                          </span>{" "}
                          mm
                        </label>
                        <input
                          type="number"
                          value={relocateTop}
                          onChange={(e) =>
                            setRelocateTop(Number(e.target.value))
                          }
                          min="-50"
                          max="50"
                          step="0.5"
                          className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                          style={{
                            borderColor: colors.lightGray,
                            backgroundColor: colors.white,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="flex justify-end items-center space-x-3 p-6 border-t"
            style={{
              backgroundColor: colors.lightGray,
              borderColor: colors.mediumGray,
            }}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium text-sm hover:bg-white transition-colors"
              style={{ color: colors.darkGray }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!labelName.trim()}
              className="px-6 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{
                backgroundColor: labelName.trim()
                  ? colors.primaryPink
                  : colors.mediumGray,
                color: colors.white,
                cursor: labelName.trim() ? "pointer" : "not-allowed",
                opacity: labelName.trim() ? 1 : 0.6,
              }}
            >
              ➤ New Label
            </button>
          </div>
        </div>
      </div>

      {/* Printer Settings Modal (Fallback) */}
      {showPrinterSettings && <PrinterSettingsModal />}
    </>
  );
};

export default EnhancedCreateLabelModal;
