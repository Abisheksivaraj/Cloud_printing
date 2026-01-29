import React, { useState } from "react";
import { X, Printer, Settings } from "lucide-react";
import BarcodeElement from "../designer/code";

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
      <div
        style={{
          ...style,
          top: -markLength,
          left: 0,
          width: 1,
          height: markLength,
        }}
      />
      <div
        style={{
          ...style,
          top: 0,
          left: -markLength,
          width: markLength,
          height: 1,
        }}
      />
      <div
        style={{
          ...style,
          top: -markLength,
          right: 0,
          width: 1,
          height: markLength,
        }}
      />
      <div
        style={{
          ...style,
          top: 0,
          right: -markLength,
          width: markLength,
          height: 1,
        }}
      />
      <div
        style={{
          ...style,
          bottom: -markLength,
          left: 0,
          width: 1,
          height: markLength,
        }}
      />
      <div
        style={{
          ...style,
          bottom: 0,
          left: -markLength,
          width: markLength,
          height: 1,
        }}
      />
      <div
        style={{
          ...style,
          bottom: -markLength,
          right: 0,
          width: 1,
          height: markLength,
        }}
      />
      <div
        style={{
          ...style,
          bottom: 0,
          right: -markLength,
          width: markLength,
          height: 1,
        }}
      />
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
      }}
    >
      {label.elements.map((element, elIndex) => {
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
          borderWidth: element.borderWidth,
          borderColor: element.borderColor,
          borderStyle:
            element.borderWidth > 0 ? element.borderStyle || "solid" : "none",
          borderRadius: element.borderRadius
            ? `${element.borderRadius}px`
            : undefined,
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
  const { labelSize } = label;

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
  const maxPreviewWidth = window.innerWidth * 0.7;
  const maxPreviewHeight = window.innerHeight * 0.5;
  const previewScale = Math.min(
    maxPreviewWidth / sheetWidth,
    maxPreviewHeight / sheetHeight,
    1,
  );

  const handlePrint = () => {
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      {/* ================= PREVIEW ================= */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden overflow-auto">
        <div className="bg-white rounded-2xl w-[95vw] max-w-7xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center border-b p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Print Preview
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {config.name} • {labelSize.width}×{labelSize.height}mm • Each
                label contains all elements
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings size={18} />
                <span className="font-medium">Settings</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Settings Panel */}
            {showSettings && (
              <div className="w-80 border-r p-6 overflow-y-auto bg-gray-50">
                <h3 className="font-bold text-lg mb-4">Print Settings</h3>

                {/* Multi-Up Layout */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Layout
                  </label>
                  <select
                    value={multiUpConfig}
                    onChange={(e) => setMultiUpConfig(e.target.value)}
                    className="w-full border-2 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(MULTI_UP_CONFIGS).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Each label will contain all your designed elements
                  </p>
                </div>

                {/* Gaps */}
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">Spacing</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Horizontal Gap (mm)
                      </label>
                      <input
                        type="number"
                        value={horizontalGap}
                        onChange={(e) =>
                          setHorizontalGap(Number(e.target.value))
                        }
                        min="0"
                        max="50"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Vertical Gap (mm)
                      </label>
                      <input
                        type="number"
                        value={verticalGap}
                        onChange={(e) => setVerticalGap(Number(e.target.value))}
                        min="0"
                        max="50"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Margins */}
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">Margins (mm)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Left
                      </label>
                      <input
                        type="number"
                        value={margins.left}
                        onChange={(e) =>
                          setMargins({
                            ...margins,
                            left: Number(e.target.value),
                          })
                        }
                        min="0"
                        max="50"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Right
                      </label>
                      <input
                        type="number"
                        value={margins.right}
                        onChange={(e) =>
                          setMargins({
                            ...margins,
                            right: Number(e.target.value),
                          })
                        }
                        min="0"
                        max="50"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Top
                      </label>
                      <input
                        type="number"
                        value={margins.top}
                        onChange={(e) =>
                          setMargins({
                            ...margins,
                            top: Number(e.target.value),
                          })
                        }
                        min="0"
                        max="50"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Bottom
                      </label>
                      <input
                        type="number"
                        value={margins.bottom}
                        onChange={(e) =>
                          setMargins({
                            ...margins,
                            bottom: Number(e.target.value),
                          })
                        }
                        min="0"
                        max="50"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Cut Marks */}
                <div className="mb-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showCutMarks}
                      onChange={(e) => setShowCutMarks(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Show Cut Marks</span>
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">Quick Presets</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setHorizontalGap(3);
                        setVerticalGap(3);
                        setMargins({ left: 5, top: 5, right: 5, bottom: 5 });
                      }}
                      className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-left"
                    >
                      Standard Spacing
                    </button>
                    <button
                      onClick={() => {
                        setHorizontalGap(0);
                        setVerticalGap(0);
                        setMargins({ left: 0, top: 0, right: 0, bottom: 0 });
                      }}
                      className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-left"
                    >
                      No Gaps (Full Bleed)
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Each label will be identical and
                    contain all elements from your design. The design is
                    replicated {cols * rows} times on this sheet.
                  </p>
                </div>
              </div>
            )}

            {/* Preview Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-100 overflow-auto">
              <div className="mb-4 text-sm text-gray-600">
                Sheet Size: {(sheetWidth / MM_TO_PX).toFixed(1)}mm ×{" "}
                {(sheetHeight / MM_TO_PX).toFixed(1)}mm
              </div>

              <div
                className="bg-white shadow-2xl"
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
                    background: "#fff",
                    border: "2px dashed #93c5fd",
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
                        border: "1px solid #CBD5E1",
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
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center border-t p-6 bg-gray-50">
            <div className="text-sm text-gray-600">
              {cols * rows} identical label{cols * rows > 1 ? "s" : ""} per
              sheet
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PRINT CONTENT ================= */}
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
