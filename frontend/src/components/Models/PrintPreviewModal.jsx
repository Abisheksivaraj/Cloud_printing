import React, { useState, useEffect } from "react";
import { X, Printer, Settings, Maximize2, Minimize2, Check } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import BarcodeElement from "../designer/code";
import { useTheme } from "../../ThemeContext";
import { callEdgeFunction, API_URLS, convertToPx } from "../../supabaseClient";

/* =========================
   CUT MARKS
========================= */
const CutMarks = () => {
  const markLength = 10;
  const style = {
    position: "absolute",
    background: "#000",
  };

  return (
    <>
      <div style={{ ...style, top: -markLength, left: 0, width: 1, height: markLength }} />
      <div style={{ ...style, top: 0, left: -markLength, width: markLength, height: 1 }} />
      <div style={{ ...style, top: -markLength, right: 0, width: 1, height: markLength }} />
      <div style={{ ...style, top: 0, right: -markLength, width: markLength, height: 1 }} />
      <div style={{ ...style, bottom: -markLength, left: 0, width: 1, height: markLength }} />
      <div style={{ ...style, bottom: 0, left: -markLength, width: markLength, height: 1 }} />
      <div style={{ ...style, bottom: -markLength, right: 0, width: 1, height: markLength }} />
      <div style={{ ...style, bottom: 0, right: -markLength, width: markLength, height: 1 }} />
    </>
  );
};

/* =========================
   RENDER LABEL - EXACT MATCH TO DESIGN CANVAS
========================= */
const RenderLabel = ({ label, noBorder = false }) => {
  const width = label.labelSize?.width || 100;
  const height = label.labelSize?.height || 80;
  const unit = label.labelSize?.unit || 'mm';

  // Use canvas_width if available (legacy), otherwise use unit conversion
  const labelW = label.settings?.canvas_width || convertToPx(width, unit);
  const labelH = label.settings?.canvas_width 
    ? (label.settings.canvas_width * (height / width)) 
    : convertToPx(height, unit);

  return (
    <div
      style={{
        width: labelW,
        height: labelH,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        border: noBorder ? "none" : "5px solid #000000",
      }}
    >

      {(label.elements || []).map((element, elIndex) => {
        // Elements are already normalized to pixels in supabaseClient.js
        const style = {
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign,
          color: element.color,
          backgroundColor: element.backgroundColor,
          borderWidth: element.borderWidth || 0,
          borderColor: element.borderColor,
          borderStyle: (element.borderWidth > 0) ? (element.borderStyle || "solid") : "none",
          borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
          boxSizing: "border-box",
        };

        // Handle different element types
        if (element.type === "text" || element.type === "placeholder") {
          return (
            <div
              key={elIndex}
              style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  element.textAlign === "center"
                    ? "center"
                    : element.textAlign === "right"
                      ? "flex-end"
                      : "flex-start",
                padding: "0 4px",
                lineHeight: "1.2",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {element.content}
              </span>
            </div>
          );
        }

        if (element.type === "barcode") {
          return (
            <div
              key={elIndex}
              style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                padding: 0,
              }}
            >
              <BarcodeElement element={element} />
            </div>
          );
        }

        if (element.type === "line") {
          const x1 = element.x1 !== undefined ? element.x1 : element.x;
          const y1 = element.y1 !== undefined ? element.y1 : element.y;
          const x2 =
            element.x2 !== undefined ? element.x2 : element.x + element.width;
          const y2 =
            element.y2 !== undefined ? element.y2 : element.y + element.height;

          return (
            <svg
              key={elIndex}
              style={{
                position: "absolute",
                left: Math.min(x1, x2),
                top: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
                overflow: "visible",
              }}
            >
              <line
                x1={x1 < x2 ? 0 : Math.abs(x2 - x1)}
                y1={y1 < y2 ? 0 : Math.abs(y2 - y1)}
                x2={x1 < x2 ? Math.abs(x2 - x1) : 0}
                y2={y1 < y2 ? Math.abs(y2 - y1) : 0}
                stroke={element.borderColor || "#000000"}
                strokeWidth={element.borderWidth || 2}
                strokeDasharray={
                  element.borderStyle === "dashed"
                    ? "5,5"
                    : element.borderStyle === "dotted"
                      ? "2,2"
                      : "none"
                }
              />
            </svg>
          );
        }

        if (element.type === "image") {
          return (
            <div key={elIndex} style={style}>
              <img
                src={element.src}
                crossOrigin="anonymous"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                }}
              />
            </div>
          );
        }

        if (element.type === "rectangle") {
          return <div key={elIndex} style={style}></div>;
        }

        if (element.type === "circle") {
          return (
            <div key={elIndex} style={{ ...style, borderRadius: "50%" }}></div>
          );
        }

        return null;
      })}
    </div>
  );
};

/* =========================
   MULTI-UP CONFIGURATIONS
========================= */
const MULTI_UP_CONFIGS = {
  "1up": { cols: 1, rows: 1, name: "1-Up (Single)" },
  "2up-horizontal": { cols: 2, rows: 1, name: "2-Up (Horizontal)" },
  "2up-vertical": { cols: 1, rows: 2, name: "2-Up (Vertical)" },
  "3up-horizontal": { cols: 3, rows: 1, name: "3-Up (Horizontal)" },
  "3up-vertical": { cols: 1, rows: 3, name: "3-Up (Vertical)" },
  "4up-grid": { cols: 2, rows: 2, name: "4-Up (2×2 Grid)" },
  "4up-horizontal": { cols: 4, rows: 1, name: "4-Up (Horizontal)" },
  "4up-vertical": { cols: 1, rows: 4, name: "4-Up (Vertical)" },
};

/* =========================
   MAIN MODAL
========================= */
const PrintPreviewModal = ({ label, onClose }) => {
  const { theme, isDarkMode } = useTheme();
  const labelRef = React.useRef(null);
  const labelSize = label.labelSize || { width: 100, height: 80 };

  // State for multi-up configuration
  const [multiUpConfig, setMultiUpConfig] = useState("2up-horizontal");
  const [showSettings, setShowSettings] = useState(true);

  // Print settings
  const [horizontalGap, setHorizontalGap] = useState(3);
  const [verticalGap, setVerticalGap] = useState(3);
  const [margins, setMargins] = useState({
    left: 5,
    top: 5,
    right: 5,
    bottom: 5,
  });
  const [showCutMarks, setShowCutMarks] = useState(true);
  const [selectedDpi, setSelectedDpi] = useState(label.settings?.dpi || 300);

  // Connector & Printer selection
  const [connectors, setConnectors] = useState([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Fetch connectors on mount
  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        setIsLoadingDevices(true);
        const data = await callEdgeFunction(API_URLS.LIST_CONNECTORS, {});
        const connectorList = Array.isArray(data) ? data : (data?.connectors || []);
        setConnectors(connectorList);
        if (connectorList.length > 0) {
          setSelectedConnectorId(connectorList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch connectors:", error);
      } finally {
        setIsLoadingDevices(false);
      }
    };
    fetchConnectors();
  }, []);

  // Fetch printers when connector changes
  useEffect(() => {
    const fetchPrinters = async () => {
      if (!selectedConnectorId) {
        setPrinters([]);
        return;
      }
      try {
        setIsLoadingDevices(true);
        const data = await callEdgeFunction(API_URLS.LIST_PRINTERS, {
          connector_id: selectedConnectorId
        });
        const printerList = Array.isArray(data) ? data : (data?.printers || []);
        setPrinters(printerList);
        if (printerList.length > 0) {
          setSelectedPrinterId(printerList[0].id);
        } else {
          setSelectedPrinterId(null);
        }
      } catch (error) {
        console.error("Failed to fetch printers:", error);
      } finally {
        setIsLoadingDevices(false);
      }
    };
    fetchPrinters();
  }, [selectedConnectorId]);

  const config = MULTI_UP_CONFIGS[multiUpConfig];
  const { cols, rows } = config;

  /* ---- Sizes ---- */
  const unit = labelSize.unit || 'mm';
  const labelW = convertToPx(labelSize.width, unit);
  const labelH = convertToPx(labelSize.height, unit);

  // Gaps and margins are currently in MM in the UI
  const sheetWidth =
    cols * labelW +
    (cols - 1) * convertToPx(horizontalGap, 'mm') +
    (convertToPx(margins.left, 'mm') + convertToPx(margins.right, 'mm'));

  const sheetHeight =
    rows * labelH +
    (rows - 1) * convertToPx(verticalGap, 'mm') +
    (convertToPx(margins.top, 'mm') + convertToPx(margins.bottom, 'mm'));

  // Calculate preview scale to fit in viewport
  // We want a bit more padding for the new UI
  const maxPreviewWidth = window.innerWidth * 0.6;
  const maxPreviewHeight = window.innerHeight * 0.6;
  const previewScale = Math.min(
    maxPreviewWidth / sheetWidth,
    maxPreviewHeight / sheetHeight,
    1,
  );

  const handlePrint = async () => {
    try {
      // Get current printer info or default
      let printerName = "System Default";

      // Calculate print metrics
      const printedLengthMm = (sheetHeight / (96 / 25.4)).toFixed(1);

      // Capture label as PNG
      let renderedPng = null;
      if (labelRef.current) {
        try {
          // Calculate exact pixel ratio for target DPI (e.g., 203 DPI)
          // Standard web DPI is 96. Ratio = Target / 96.
          const targetDpi = (label.settings && label.settings.dpi) ? Number(label.settings.dpi) : 203;
          const currentDpi = 96;
          const ratio = targetDpi / currentDpi;

          console.log(`Capturing PNG at ${targetDpi} DPI (pixelRatio: ${ratio.toFixed(4)})`);

          renderedPng = await htmlToImage.toPng(labelRef.current, {
            pixelRatio: ratio,
            backgroundColor: '#ffffff',
            skipFonts: true, // Reverted to true to bypass CORS/SecurityError with Google Fonts
            cacheBust: true,
            includePlaceholder: true,
            // Ensure no transforms interfere with capture
            style: {
              transform: 'none',
              transformOrigin: 'top left',
              left: '0',
              top: '0',
              margin: '0',
            }
          });

          if (renderedPng) {
            const dataSizeKb = Math.round(renderedPng.length / 1024);
            console.log(`Captured PNG size: ${dataSizeKb} KB (DPI: ${targetDpi}, PixelRatio: ${ratio.toFixed(2)})`);

            if (!renderedPng.startsWith('data:image/png;base64,')) {
              console.warn("PNG Capture returned invalid prefix:", renderedPng.substring(0, 30));
            }
            if (dataSizeKb < 30) {
               console.warn("PNG Capture result is suspiciously small. Check if elements are visible in the capture container.");
            }
          }
        } catch (captureErr) {
          console.error("PNG Capture failed, falling back to ZPL elements:", captureErr);
        }
      }

      // Create print job record
      const jobData = {
        design_id: label.design_id || label.id || label.design?.id || label.data?.id,
        version_major: (label.version_major !== undefined && label.version_major !== null) ? label.version_major : 1,
        version_minor: (label.version_minor !== undefined && label.version_minor !== null) ? label.version_minor : 0,
        connector_id: selectedConnectorId,
        printer_id: selectedPrinterId,
        idempotency_key: `print_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        input_data: {} // Empty as per user example, but could be extended
      };

      console.log("Submitting Print Job Data:", jobData);

      if (!jobData.design_id) {
        throw new Error("Cannot print: Missing design_id. Please save the design first.");
      }

      await callEdgeFunction(API_URLS.CREATE_JOB, jobData);
      alert("Print job submitted successfully.");
      onClose();
    } catch (error) {
      console.error("Print tracking failed:", error);
      alert("Print failed: " + error.message);
    }
  };

  return (
    <>
      {/* ================= HIDDEN CAPTURE CONTAINER ================= */}
      <div 
        style={{ 
          position: "fixed", 
          top: "-9999px", 
          left: "-9999px", 
          zIndex: -1,
          width: labelW,
          height: labelH,
          backgroundColor: "#ffffff",
          overflow: "hidden"
        }}
      >
        <div ref={labelRef} style={{ width: labelW, height: labelH, position: "relative", backgroundColor: "#ffffff" }}>
          <RenderLabel label={label} noBorder={true} />
        </div>
      </div>

      {/* ================= PREVIEW UI ================= */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden overflow-hidden p-6 animate-in fade-in duration-200">
        <div
          className="rounded-2xl shadow-2xl w-full max-w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b p-6" style={{ borderColor: theme.border }}>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
                <Printer size={24} className="text-[var(--color-primary)]" />
                Print Preview
              </h2>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                {config.name} • {Math.round(labelSize.width * 100) / 100}×{Math.round(labelSize.height * 100) / 100}{labelSize.unit || 'mm'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`btn btn-outline flex items-center gap-2 ${showSettings ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]' : ''}`}
              >
                <Settings size={18} />
                <span className="font-medium hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--color-bg-main)] transition-colors"
                style={{ color: theme.textMuted }}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Settings Panel */}
            {showSettings && (
              <div
                className="w-80 border-r p-6 overflow-y-auto animate-in slide-in-from-left-4 duration-200"
                style={{ backgroundColor: theme.bg, borderColor: theme.border }}
              >
                <h3 className="font-bold text-sm uppercase tracking-wider mb-6" style={{ color: theme.textMuted }}>Configuration</h3>

                {/* Multi-Up Layout */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold mb-2" style={{ color: theme.text }}>
                    Layout Configuration
                  </label>
                  <select
                    value={multiUpConfig}
                    onChange={(e) => setMultiUpConfig(e.target.value)}
                    className="input text-sm"
                  >
                    {Object.entries(MULTI_UP_CONFIGS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs mt-2" style={{ color: theme.textMuted }}>
                    {cols * rows} labels per sheet
                  </p>
                </div>

                {/* Gaps */}
                <div className="mb-8">
                  <h4 className="font-semibold text-sm mb-3" style={{ color: theme.text }}>Spacing (mm)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>
                        Horizontal
                      </label>
                      <input
                        type="number"
                        value={horizontalGap}
                        onChange={(e) => setHorizontalGap(Number(e.target.value))}
                        min="0"
                        max="50"
                        className="input text-sm py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>
                        Vertical
                      </label>
                      <input
                        type="number"
                        value={verticalGap}
                        onChange={(e) => setVerticalGap(Number(e.target.value))}
                        min="0"
                        max="50"
                        className="input text-sm py-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Margins */}
                <div className="mb-8">
                  <h4 className="font-semibold text-sm mb-3" style={{ color: theme.text }}>Margins (mm)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(margins).map((side) => (
                      <div key={side}>
                        <label className="block text-xs mb-1 capitalize" style={{ color: theme.textMuted }}>
                          {side}
                        </label>
                        <input
                          type="number"
                          value={margins[side]}
                          onChange={(e) => setMargins({ ...margins, [side]: Number(e.target.value) })}
                          min="0"
                          max="50"
                          className="input text-sm py-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cut Marks */}
                <div className="mb-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showCutMarks ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-gray-400 group-hover:border-[var(--color-primary)]'}`}>
                      {showCutMarks && <Check size={14} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={showCutMarks}
                      onChange={(e) => setShowCutMarks(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium" style={{ color: theme.text }}>Show Cut Marks</span>
                  </label>
                </div>

                {/* DPI Settings */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold mb-2" style={{ color: theme.text }}>
                    Target Resolution
                  </label>
                  <select
                    value={selectedDpi}
                    onChange={(e) => setSelectedDpi(Number(e.target.value))}
                    className="input text-sm"
                  >
                    <option value={203}>203 DPI</option>
                    <option value={300}>300 DPI</option>
                    <option value={600}>600 DPI</option>
                  </select>
                  <p className="text-xs mt-2" style={{ color: theme.textMuted }}>
                    Physical resolution of your printer
                  </p>
                </div>

                {/* Device Selection */}
                <div className="mb-8 border-t pt-6" style={{ borderColor: theme.border }}>
                  <h4 className="font-semibold text-sm mb-4" style={{ color: theme.text }}>Print Destination</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>
                        Connector
                      </label>
                      <select
                        value={selectedConnectorId || ""}
                        onChange={(e) => setSelectedConnectorId(e.target.value)}
                        className="input text-sm"
                        disabled={isLoadingDevices}
                      >
                        <option value="" disabled>Select Connector</option>
                        {connectors.map(c => (
                          <option key={c.id} value={c.id}>{c.name || 'Unnamed Connector'}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>
                        Printer
                      </label>
                      <select
                        value={selectedPrinterId || ""}
                        onChange={(e) => setSelectedPrinterId(e.target.value)}
                        className="input text-sm"
                        disabled={isLoadingDevices || !selectedConnectorId}
                      >
                        <option value="" disabled>Select Printer</option>
                        {printers.map(p => (
                          <option key={p.id} value={p.id}>{p.printer_name || p.name || 'Unnamed Printer'}</option>
                        ))}
                      </select>
                      {selectedConnectorId && printers.length === 0 && !isLoadingDevices && (
                        <p className="text-[10px] mt-1 text-red-500">No printers found for this connector</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setHorizontalGap(3);
                      setVerticalGap(3);
                      setMargins({ left: 5, top: 5, right: 5, bottom: 5 });
                    }}
                    className="w-full btn btn-outline py-2 text-xs justify-start"
                  >
                    Reset to Standard
                  </button>
                  <button
                    onClick={() => {
                      setHorizontalGap(0);
                      setVerticalGap(0);
                      setMargins({ left: 0, top: 0, right: 0, bottom: 0 });
                    }}
                    className="w-full btn btn-outline py-2 text-xs justify-start"
                  >
                    Reset to No Gaps
                  </button>
                </div>
              </div>
            )}

            {/* Preview Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-gray-100 dark:bg-gray-900/50">
              {/* Toolbar */}
              <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-2 flex gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title={showSettings ? "Expand Preview" : "Show Settings"}>
                  {showSettings ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                <div
                  className="bg-white shadow-2xl transition-all duration-300"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: "center",
                  }}
                >
                  <div
                    style={{
                      width: sheetWidth,
                      height: sheetHeight,
                      display: "grid",
                      gridTemplateColumns: `repeat(${cols}, ${labelW}px)`,
                      gridTemplateRows: `repeat(${rows}, ${labelH}px)`,
                      gap: `${convertToPx(verticalGap, 'mm')}px ${convertToPx(horizontalGap, 'mm')}px`,
                      padding: `${convertToPx(margins.top, 'mm')}px ${convertToPx(margins.right, 'mm')}px ${convertToPx(margins.bottom, 'mm')}px ${convertToPx(margins.left, 'mm')}px`,
                      backgroundColor: "#fff",
                      backgroundImage: `
                            linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                        `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  >
                    {Array.from({ length: cols * rows }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: labelW,
                          height: labelH,
                          position: "relative",
                          background: "#fff",
                          border: "1px dashed #e2e8f0", // Light border for preview
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        {showCutMarks && <CutMarks />}
                        <RenderLabel label={label} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 text-center text-xs text-gray-500">
                Sheet Size: {(sheetWidth / (96 / 25.4)).toFixed(1)}mm × {(sheetHeight / (96 / 25.4)).toFixed(1)}mm
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center border-t p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <div className="text-sm" style={{ color: theme.textMuted }}>
              Ready to print {cols * rows} labels
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary px-8"
              >
                <Printer size={18} className="mr-2" />
                Print Labels
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PRINT CONTENT (HIDDEN FROM UI) ================= */}
      <div className="print-container">
        <div
          className="print-sheet"
          style={{
            width: `${sheetWidth}px`,
            height: `${sheetHeight}px`,
          }}
        >
          <div
            className="print-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${labelW}px)`,
              gridTemplateRows: `repeat(${rows}, ${labelH}px)`,
              columnGap: `${convertToPx(horizontalGap, 'mm')}px`,
              rowGap: `${convertToPx(verticalGap, 'mm')}px`,
              padding: `${convertToPx(margins.top, 'mm')}px ${convertToPx(margins.right, 'mm')}px ${convertToPx(margins.bottom, 'mm')}px ${convertToPx(margins.left, 'mm')}px`,
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            {Array.from({ length: cols * rows }).map((_, i) => (
              <div
                key={i}
                className="print-label"
                style={{
                  width: `${labelW}px`,
                  height: `${labelH}px`,
                  position: "relative",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {showCutMarks && <CutMarks />}
                <RenderLabel label={label} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PRINT CSS ================= */}
      <style>{`
        @media print {
          * {
            visibility: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-container,
          .print-container *,
          .print-sheet,
          .print-sheet *,
          .print-grid,
          .print-grid *,
          .print-label,
          .print-label * {
            visibility: visible !important;
          }

          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }

          .print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
          }

          .print-grid {
            display: grid !important;
          }

          .print-label {
            display: block !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          @page {
            size: auto;
            margin: 0mm;
            padding: 0mm;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-label {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }

        @media screen {
          .print-container {
            position: absolute;
            left: -9999px;
            top: -9999px;
            visibility: hidden;
          }
        }
      `}</style>
      {/* Hidden container for high-resolution PNG capture */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          zIndex: -1,
          pointerEvents: "none",
          backgroundColor: "#fff"
        }}
      >
        <div ref={labelRef} style={{ background: '#fff', display: 'inline-block' }}>
          <RenderLabel label={label} noBorder={true} />
        </div>
      </div>
    </>
  );
};

export default PrintPreviewModal;
