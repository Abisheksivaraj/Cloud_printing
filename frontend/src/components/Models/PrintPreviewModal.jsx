import React, { useState, useEffect } from "react";
import { X, Printer, Settings, Maximize2, Minimize2, Check } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import BarcodeElement from "../designer/code";
import RenderLabel from "../designer/RenderLabel";
import { useTheme } from "../../ThemeContext";
import { callEdgeFunction, API_URLS, convertToPx } from "../../supabaseClient";

/* =========================
   CUT MARKS
========================= */
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
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-300">
        <div
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-[1400px] h-full max-h-[900px] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 text-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Printer size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Design Verification & Print
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {config.name} • {Math.round(labelSize.width * 100) / 100}×{Math.round(labelSize.height * 100) / 100}{labelSize.unit || 'mm'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  showSettings 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-50 border border-transparent'
                }`}
                title="Configuration"
              >
                <Settings size={20} />
              </button>
              <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Print Options Toolbar */}
          <div 
            className="flex flex-wrap items-center gap-8 px-8 py-5 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50" 
          >
            {/* Target Resolution */}
            <div className="flex items-center gap-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                Print Density
              </label>
              <select
                value={selectedDpi}
                onChange={(e) => setSelectedDpi(Number(e.target.value))}
                className="input h-9 text-xs py-0 min-w-[120px] font-bold"
              >
                <option value={203}>203 DPI (Standard)</option>
                <option value={300}>300 DPI (High)</option>
                <option value={600}>600 DPI (Ultra)</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>

            {/* Print Destination */}
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Connector
                </label>
                <select
                  value={selectedConnectorId || ""}
                  onChange={(e) => setSelectedConnectorId(e.target.value)}
                  className="input h-9 text-xs py-0 min-w-[180px] font-bold"
                  disabled={isLoadingDevices}
                >
                  <option value="" disabled>Search Connector...</option>
                  {connectors.map(c => (
                    <option key={c.id} value={c.id}>{c.name || 'Cloud Connector'}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Target Printer
                </label>
                <select
                  value={selectedPrinterId || ""}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  className="input h-9 text-xs py-0 min-w-[220px] font-bold"
                  disabled={isLoadingDevices || !selectedConnectorId}
                >
                  <option value="" disabled>Select Printer...</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>{p.printer_name || p.name || 'Industrial Printer'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Settings Panel */}
            {showSettings && (
              <div
                className="w-80 border-r border-slate-100 dark:border-slate-800 p-8 overflow-y-auto bg-white dark:bg-slate-900 animate-in slide-in-from-left-4 duration-300"
              >
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Layout & Geometry</h3>

                {/* Multi-Up Layout */}
                <div className="mb-10">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 block">
                    Grid Setup
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(MULTI_UP_CONFIGS).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setMultiUpConfig(key)}
                        className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          multiUpConfig === key 
                          ? 'bg-sky-50 text-sky-600 border-sky-100 shadow-sm' 
                          : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        {cfg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div className="mb-10">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4 block">Spacing (mm)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Horizontal</label>
                      <input
                        type="number"
                        value={horizontalGap}
                        onChange={(e) => setHorizontalGap(Number(e.target.value))}
                        className="input h-10 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Vertical</label>
                      <input
                        type="number"
                        value={verticalGap}
                        onChange={(e) => setVerticalGap(Number(e.target.value))}
                        className="input h-10 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Margins */}
                <div className="mb-10">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4 block">Retractions / Margins (mm)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(margins).map((side) => (
                      <div key={side} className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 capitalize">{side}</label>
                        <input
                          type="number"
                          value={margins[side]}
                          onChange={(e) => setMargins({ ...margins, [side]: Number(e.target.value) })}
                          className="input h-10 text-xs font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cut Marks */}
                <div className="mb-10">
                  <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-all hover:border-sky-200">
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showCutMarks ? 'bg-sky-500 border-sky-500 shadow-lg shadow-sky-500/20' : 'bg-white border-slate-300 group-hover:border-sky-400'}`}>
                      {showCutMarks && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={showCutMarks}
                      onChange={(e) => setShowCutMarks(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Show Boundary Codes</span>
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setHorizontalGap(3); setVerticalGap(3);
                      setMargins({ left: 5, top: 5, right: 5, bottom: 5 });
                    }}
                    className="w-full text-center py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    Load Enterprise Default
                  </button>
                  <button
                    onClick={() => {
                      setHorizontalGap(0); setVerticalGap(0);
                      setMargins({ left: 0, top: 0, right: 0, bottom: 0 });
                    }}
                    className="w-full text-center py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Zero Geometry (Pure)
                  </button>
                </div>
              </div>
            )}

            {/* Preview Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 p-8">
              {/* Floating Toolbar */}
              <div className="absolute top-8 right-8 z-10 flex gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-sky-600 transition-all active:scale-95"
                  title="Toggle Controls"
                >
                  {showSettings ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div
                  className="bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] transition-all duration-500 ease-out p-[1px] rounded-sm ring-1 ring-slate-200"
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
                      backgroundSize: '10px 10px',
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
                          border: "1px dashed rgba(0,0,0,0.05)",
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

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                Canvas: {(sheetWidth / (96 / 25.4)).toFixed(1)}mm × {(sheetHeight / (96 / 25.4)).toFixed(1)}mm
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Verification Complete • Ready to Dispatch {cols * rows} Units
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary px-10 h-12 shadow-sky-500/20"
              >
                <Printer size={18} className="mr-3" />
                Print
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
