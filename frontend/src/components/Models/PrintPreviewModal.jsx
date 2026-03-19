import React, { useState, useEffect } from "react";
import { X, Printer, Settings, Maximize2, Minimize2, Check } from "lucide-react";
import BarcodeElement from "../designer/code";
import { useTheme } from "../../ThemeContext";
import { callEdgeFunction, API_URLS } from "../../supabaseClient";


const MM_TO_PX = 3.7795275591;

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
const RenderLabel = ({ label }) => {
  const labelW = (label.labelSize?.width || 100) * MM_TO_PX;
  const labelH = (label.labelSize?.height || 80) * MM_TO_PX;

  return (
    <div
      style={{
        width: labelW,
        height: labelH,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        border: "5px solid #000000",
      }}
    >
      {(label.elements || []).map((element, elIndex) => {
        const style = {
          position: "absolute",
          left: element.x * MM_TO_PX,
          top: element.y * MM_TO_PX,
          width: element.width * MM_TO_PX,
          height: element.height * MM_TO_PX,
          fontSize: (element.fontSize || 14) * (MM_TO_PX / 3.78) * 3.78, // Simplified scaling for text
          // Note: Standard canvas used 3.78 for mm to px at 96dpi.
          // Let's just use MM_TO_PX consistently.
          fontSize: (element.fontSize || 14) * (MM_TO_PX / 3.78) * 3.78, 
          // Actually, fontSize is usually in pt or px. If it's in px, it needs scaling.
          fontSize: (element.fontSize || 14) * (MM_TO_PX / 3.78),
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign,
          color: element.color,
          backgroundColor: element.backgroundColor,
          borderWidth: (element.borderWidth || 0) * MM_TO_PX,
          borderColor: element.borderColor,
          borderStyle: (element.borderWidth > 0) ? (element.borderStyle || "solid") : "none",
          borderRadius: element.borderRadius ? `${element.borderRadius * MM_TO_PX}px` : undefined,
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
                left: Math.min(x1, x2) * MM_TO_PX,
                top: Math.min(y1, y2) * MM_TO_PX,
                width: Math.abs(x2 - x1) * MM_TO_PX,
                height: Math.abs(y2 - y1) * MM_TO_PX,
                overflow: "visible",
              }}
            >
              <line
                x1={(x1 < x2 ? 0 : Math.abs(x2 - x1)) * MM_TO_PX}
                y1={(y1 < y2 ? 0 : Math.abs(y2 - y1)) * MM_TO_PX}
                x2={(x1 < x2 ? Math.abs(x2 - x1) : 0) * MM_TO_PX}
                y2={(y1 < y2 ? Math.abs(y2 - y1) : 0) * MM_TO_PX}
                stroke={element.borderColor || "#000000"}
                strokeWidth={(element.borderWidth || 2) * MM_TO_PX}
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
  const labelW = labelSize.width * MM_TO_PX;
  const labelH = labelSize.height * MM_TO_PX;

  const sheetWidth =
    cols * labelW +
    (cols - 1) * horizontalGap * MM_TO_PX +
    (margins.left + margins.right) * MM_TO_PX;

  const sheetHeight =
    rows * labelH +
    (rows - 1) * verticalGap * MM_TO_PX +
    (margins.top + margins.bottom) * MM_TO_PX;

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
      const printedLengthMm = (sheetHeight / MM_TO_PX).toFixed(1);

      // Create print job record
      const jobData = {
        printer_name: printerName,
        document_name: label.name || "Unnamed Label",
        design_id: label.design_id || label.id,
        version_major: label.version_major || 1,
        version_minor: label.version_minor || 0,
        document_type: "label",
        volumes: cols * rows,
        priority: "normal",
        total_records: 1,
        printed_records: 1,
        printed_length: parseFloat(printedLengthMm),
        connector_id: selectedConnectorId,
        printer_id: selectedPrinterId,
        output_format: "zpl",
        elements: (label.elements || []).map(el => {
          const dpi = (label.settings && label.settings.dpi) ? label.settings.dpi : 203;
          const mmToDots = dpi / 25.4;
          const scaled = { ...el };
          if (scaled.x !== undefined) scaled.x = el.x * mmToDots;
          if (scaled.y !== undefined) scaled.y = el.y * mmToDots;
          if (scaled.width !== undefined) scaled.width = el.width * mmToDots;
          if (scaled.height !== undefined) scaled.height = el.height * mmToDots;
          if (scaled.x1 !== undefined) scaled.x1 = el.x1 * mmToDots;
          if (scaled.y1 !== undefined) scaled.y1 = el.y1 * mmToDots;
          if (scaled.x2 !== undefined) scaled.x2 = el.x2 * mmToDots;
          if (scaled.y2 !== undefined) scaled.y2 = el.y2 * mmToDots;
          if (scaled.borderWidth !== undefined) scaled.borderWidth = (el.borderWidth || 0) * mmToDots;
          return scaled;
        }),
        idempotency_key: `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          label_width: labelSize.width,
          label_height: labelSize.height,
          cols,
          rows
        }
      };

      await callEdgeFunction(API_URLS.CREATE_JOB, jobData);
      alert("Print job submitted successfully to the connector.");
      onClose();
    } catch (error) {
      console.error("Print tracking failed:", error);
      alert("Print failed: " + error.message);
    }
  };

  return (
    <>
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
                {config.name} • {labelSize.width}×{labelSize.height}mm
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
                      gap: `${verticalGap * MM_TO_PX}px ${horizontalGap * MM_TO_PX}px`,
                      padding: `${margins.top * MM_TO_PX}px ${margins.right * MM_TO_PX}px ${margins.bottom * MM_TO_PX}px ${margins.left * MM_TO_PX}px`,
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
                Sheet Size: {(sheetWidth / MM_TO_PX).toFixed(1)}mm × {(sheetHeight / MM_TO_PX).toFixed(1)}mm
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
              columnGap: `${horizontalGap * MM_TO_PX}px`,
              rowGap: `${verticalGap * MM_TO_PX}px`,
              padding: `${margins.top * MM_TO_PX}px ${margins.right * MM_TO_PX}px ${margins.bottom * MM_TO_PX}px ${margins.left * MM_TO_PX}px`,
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
    </>
  );
};

export default PrintPreviewModal;
