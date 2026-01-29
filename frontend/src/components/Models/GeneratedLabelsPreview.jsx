import React, { useState } from "react";
import {
  X,
  Printer,
  Settings,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";
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
   RENDER LABEL
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
        backgroundColor: "#fff",
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
                position: "absolute",
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "scale(0.95)",
                }}
              >
                <BarcodeElement element={element} />
              </div>
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

const RollPrinterPreview = ({ labels, labelSettings, onClose }) => {
  const [showSettings, setShowSettings] = useState(true);
  const [showCutMarks, setShowCutMarks] = useState(false);

  const labelSize = labels[0]?.labelSize ||
    labelSettings?.labelSize || { width: 100, height: 80 };
  const advancedSettings = labelSettings?.advancedSettings || {};

  const [columns, setColumns] = useState(advancedSettings.columns || 2);

  const [horizontalSpacing, setHorizontalSpacing] = useState(
    advancedSettings.horizontalSpacing !== undefined
      ? advancedSettings.horizontalSpacing
      : 0,
  );
  const [verticalSpacing, setVerticalSpacing] = useState(
    advancedSettings.verticalSpacing !== undefined
      ? advancedSettings.verticalSpacing
      : 0,
  );
  const [margins, setMargins] = useState(
    advancedSettings.margins || { left: 0, top: 0, right: 0, bottom: 0 },
  );
  const [calibration, setCalibration] = useState({ offsetX: 0, offsetY: 0 });

  const labelW = labelSize.width * MM_TO_PX;
  const labelH = labelSize.height * MM_TO_PX;

  // Calculate roll dimensions (all labels in continuous roll)
  const labelsPerRow = columns;
  const totalRows = Math.ceil(labels.length / labelsPerRow);

  const rollWidth =
    columns * labelW +
    (columns - 1) * horizontalSpacing * MM_TO_PX +
    (margins.left + margins.right) * MM_TO_PX;
  const rollHeight =
    totalRows * labelH +
    (totalRows - 1) * verticalSpacing * MM_TO_PX +
    (margins.top + margins.bottom) * MM_TO_PX;

  // Calculate preview scale
  const maxPreviewWidth = window.innerWidth * 0.5;
  const maxPreviewHeight = window.innerHeight * 0.6;
  const previewScale = Math.min(
    maxPreviewWidth / rollWidth,
    maxPreviewHeight / rollHeight,
    1,
  );

  const handlePrintAll = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <>
      {/* ================= PREVIEW UI ================= */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden overflow-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Roll Printer Preview
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {labels.length} label{labels.length !== 1 ? "s" : ""} •{" "}
                {columns}×{totalRows} layout • {labelSize.width}×
                {labelSize.height}mm each
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:bg-white transition-colors"
              >
                <Settings size={18} />
                <span className="font-medium">Settings</span>
                {showSettings ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
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

                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">Layout</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Columns
                      </label>
                      <input
                        type="number"
                        value={columns}
                        onChange={(e) =>
                          setColumns(Math.max(1, Number(e.target.value)))
                        }
                        min="1"
                        max="5"
                        className="w-full border-2 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">Spacing (mm)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Horizontal Gap
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
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Vertical Gap
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
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

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
                        step="0.5"
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
                        step="0.5"
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
                        step="0.5"
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
                        step="0.5"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

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

                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">Quick Presets</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setHorizontalSpacing(0);
                        setVerticalSpacing(0);
                        setMargins({ left: 0, top: 0, right: 0, bottom: 0 });
                      }}
                      className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-left font-semibold"
                    >
                      No Gaps (Continuous Roll)
                    </button>
                    <button
                      onClick={() => {
                        setHorizontalSpacing(3);
                        setVerticalSpacing(3);
                        setMargins({ left: 5, top: 5, right: 5, bottom: 5 });
                      }}
                      className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-left"
                    >
                      Standard Spacing
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={18} className="text-amber-600" />
                    <h4 className="font-semibold text-sm text-amber-900">
                      Calibration
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1 font-medium">
                        Horizontal Offset (mm)
                      </label>
                      <input
                        type="number"
                        value={calibration.offsetX}
                        onChange={(e) =>
                          setCalibration({
                            ...calibration,
                            offsetX: Number(e.target.value),
                          })
                        }
                        min="-20"
                        max="20"
                        step="0.1"
                        className="w-full border-2 border-amber-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1 font-medium">
                        Vertical Offset (mm)
                      </label>
                      <input
                        type="number"
                        value={calibration.offsetY}
                        onChange={(e) =>
                          setCalibration({
                            ...calibration,
                            offsetY: Number(e.target.value),
                          })
                        }
                        min="-20"
                        max="20"
                        step="0.1"
                        className="w-full border-2 border-amber-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Label Size:</strong> {labelSize.width}mm ×{" "}
                    {labelSize.height}mm
                    <br />
                    <strong>Roll Size:</strong>{" "}
                    {(rollWidth / MM_TO_PX).toFixed(1)}mm ×{" "}
                    {(rollHeight / MM_TO_PX).toFixed(1)}mm
                    <br />
                    <strong>Total Labels:</strong> {labels.length} labels •{" "}
                    {columns} column{columns > 1 ? "s" : ""} × {totalRows} rows
                  </p>
                </div>
              </div>
            )}

            {/* Preview Area - CONTINUOUS ROLL */}
            <div className="flex-1 flex flex-col items-center p-6 bg-gray-100 overflow-auto">
              <div className="text-sm font-semibold text-gray-600 mb-4">
                Continuous Roll Preview
              </div>

              <div
                className="bg-white shadow-2xl"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                }}
              >
                <div
                  style={{
                    width: rollWidth,
                    height: rollHeight,
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, ${labelW}px)`,
                    gridAutoRows: `${labelH}px`,
                    gap: `${verticalSpacing * MM_TO_PX}px ${horizontalSpacing * MM_TO_PX}px`,
                    padding: `${margins.top * MM_TO_PX}px ${margins.right * MM_TO_PX}px ${margins.bottom * MM_TO_PX}px ${margins.left * MM_TO_PX}px`,
                    background: "#fff",
                  }}
                >
                  {labels.map((label, labelIndex) => (
                    <div
                      key={labelIndex}
                      style={{
                        width: labelW,
                        height: labelH,
                        position: "relative",
                        background: "#fff",
                        border: "none",
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
              {labels.length} labels • Continuous roll • {columns} column
              {columns > 1 ? "s" : ""}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handlePrintAll}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <Printer size={18} />
                <span>Print Roll</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PRINT CONTENT ================= */}
      <div className="print-container">
        <div
          className="print-roll"
          style={{
            width: rollWidth,
            height: rollHeight,
            position: "relative",
            marginLeft: `${calibration.offsetX * MM_TO_PX}px`,
            marginTop: `${calibration.offsetY * MM_TO_PX}px`,
          }}
        >
          <div
            className="print-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, ${labelW}px)`,
              gridAutoRows: `${labelH}px`,
              gap: `${verticalSpacing * MM_TO_PX}px ${horizontalSpacing * MM_TO_PX}px`,
              padding: `${margins.top * MM_TO_PX}px ${margins.right * MM_TO_PX}px ${margins.bottom * MM_TO_PX}px ${margins.left * MM_TO_PX}px`,
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            {labels.map((label, labelIndex) => (
              <div
                key={labelIndex}
                className="print-label"
                style={{
                  width: labelW,
                  height: labelH,
                  position: "relative",
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
          .print-roll,
          .print-roll *,
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
          }

          .print-roll {
            position: relative !important;
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
            margin: 0;
            size: auto;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
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

export default RollPrinterPreview;
