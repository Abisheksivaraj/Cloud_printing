import React, { useState } from "react";
import { Trash2, Undo, Redo, Copy } from "lucide-react";

const PropertiesPanel = ({
  selectedElement,
  updateElement,
  deleteElement,
  onBarcodeTypeChange,
  isDrawingLine,
  isDrawingShape, // ✅ NEW: Shape drawing state
  onUndo,
  onRedo,
  onDuplicate,
  canUndo,
  canRedo,
  onAddShape,
  onAddTable,
  onAddPlaceholder,
  onActivateShapeDrawing, // ✅ NEW: Activate shape drawing
  showShapeSelector = false,
  showTableCreator = false,
}) => {
  const [tableRows, setTableRows] = useState(2);
  const [tableColumns, setTableColumns] = useState(2);
  const [placeholderName, setPlaceholderName] = useState("");

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128" },
    { value: "CODE39", label: "Code 39" },
    { value: "EAN13", label: "EAN-13" },
    { value: "EAN8", label: "EAN-8" },
    { value: "UPC", label: "UPC-A" },
    { value: "QR", label: "QR Code" },
    { value: "DATAMATRIX", label: "Data Matrix" },
    { value: "PDF417", label: "PDF417" },
    { value: "AZTEC", label: "Aztec Code" },
  ];

  const shapeTypes = [
    { value: "", label: "Select Shape..." },
    { value: "rectangle", label: "Rectangle" },
    { value: "circle", label: "Circle" },
  ];

  const lineThicknesses = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];

  const handleAddPlaceholder = () => {
    if (placeholderName.trim()) {
      const formattedName = placeholderName.trim().startsWith("{{")
        ? placeholderName.trim()
        : `{{${placeholderName.trim()}}}`;
      onAddPlaceholder(formattedName);
      setPlaceholderName("");
    }
  };

  // ✅ NEW: Handle shape type selection for drawing
  const handleShapeSelection = (shapeType) => {
    if (shapeType && onActivateShapeDrawing) {
      onActivateShapeDrawing(shapeType);
    }
  };

  return (
    <div className="w-80 bg-white border-l flex flex-col overflow-y-auto shadow-lg">
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-bold text-gray-900 text-xl">Properties</h3>
        <p className="text-sm text-gray-600 mt-1">Configure your design</p>

        {/* Undo/Redo/Duplicate Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              canUndo
                ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
            <span className="text-xs font-semibold">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              canRedo
                ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
            <span className="text-xs font-semibold">Redo</span>
          </button>
          <button
            onClick={onDuplicate}
            disabled={!selectedElement}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectedElement
                ? "bg-green-100 hover:bg-green-200 text-green-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={16} />
            <span className="text-xs font-semibold">Duplicate</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Add Placeholder - ALWAYS VISIBLE */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-4 rounded-xl border border-amber-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📦</span> Add Placeholder
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Placeholder Name
              </label>
              <input
                type="text"
                value={placeholderName}
                onChange={(e) => setPlaceholderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddPlaceholder();
                  }
                }}
                placeholder="e.g., first_name or {{first_name}}"
                className="w-full border-2 border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-wraps with {"{{"} {"}}"}
              </p>
            </div>
            <button
              onClick={handleAddPlaceholder}
              disabled={!placeholderName.trim()}
              className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                placeholderName.trim()
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Create Placeholder
            </button>
          </div>
        </div>

        {/* ✅ UPDATED: Shape Selector - Activates drawing mode when shape is selected */}
        {showShapeSelector && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl border border-purple-200">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">⬜</span> Draw Shape
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Select a shape type and drag on canvas to draw
            </p>
            <select
              onChange={(e) => {
                handleShapeSelection(e.target.value);
                e.target.value = "";
              }}
              value=""
              className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {shapeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {isDrawingShape && (
              <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                <p className="text-xs text-purple-800 font-semibold">
                  ✏️ Drawing mode active - Drag on canvas to draw
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Table - Only show when table tool is selected */}
        {showTableCreator && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">📋</span> Add Table
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Rows
                  </label>
                  <input
                    type="number"
                    value={tableRows}
                    onChange={(e) => setTableRows(Number(e.target.value))}
                    min="1"
                    max="20"
                    className="w-full border-2 border-green-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Columns
                  </label>
                  <input
                    type="number"
                    value={tableColumns}
                    onChange={(e) => setTableColumns(Number(e.target.value))}
                    min="1"
                    max="20"
                    className="w-full border-2 border-green-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => onAddTable(tableRows, tableColumns)}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Create Table
              </button>
            </div>
          </div>
        )}

        {selectedElement ? (
          <>
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl mb-4">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center text-lg">
                  <span className="mr-2">⚙️</span>
                  {selectedElement.type.charAt(0).toUpperCase() +
                    selectedElement.type.slice(1)}
                </h4>
                <p className="text-sm text-gray-600">
                  ID: {selectedElement.id}
                </p>
              </div>

              <button
                onClick={deleteElement}
                className="w-full p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl font-semibold mb-6"
              >
                <Trash2 size={18} />
                <span>Delete Element</span>
              </button>
            </div>

            {/* Content */}
            {(selectedElement.type === "text" ||
              selectedElement.type === "barcode" ||
              selectedElement.type === "placeholder") && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">Content</h4>
                <textarea
                  value={selectedElement.content}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      content: e.target.value,
                    })
                  }
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={selectedElement.type === "text" ? 4 : 3}
                  placeholder={
                    selectedElement.type === "text"
                      ? "Enter text..."
                      : selectedElement.type === "placeholder"
                        ? "e.g., {{first_name}}"
                        : "Enter barcode value..."
                  }
                />
                {selectedElement.type === "placeholder" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Use format: {"{{"} field_name {"}}"}
                  </p>
                )}
              </div>
            )}

            {/* ✅ UPDATED: Barcode Settings - Creates new element when changing to QR */}
            {selectedElement.type === "barcode" && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                <h4 className="font-bold text-gray-800 mb-3">Barcode Type</h4>
                <select
                  value={selectedElement.barcodeType || "CODE128"}
                  onChange={(e) => onBarcodeTypeChange(e.target.value)}
                  className="w-full border-2 border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {barcodeTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Changing to QR Code will create a new QR code element
                  nearby
                </p>
              </div>
            )}

            {/* Text Styling */}
            {(selectedElement.type === "text" ||
              selectedElement.type === "placeholder") && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-800 mb-3">Text Style</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      min="8"
                      max="72"
                      className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={selectedElement.fontFamily}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Text Align
                    </label>
                    <select
                      value={selectedElement.textAlign}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          textAlign: e.target.value,
                        })
                      }
                      className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Line Thickness - Only for Lines */}
            {selectedElement.type === "line" && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-4 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-gray-800 mb-3">Line Thickness</h4>
                <div className="grid grid-cols-6 gap-2">
                  {lineThicknesses.map((thickness) => (
                    <button
                      key={thickness}
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          borderWidth: thickness,
                        })
                      }
                      className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center ${
                        (selectedElement.borderWidth || 2) === thickness
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-300 bg-white hover:border-blue-300"
                      }`}
                      title={`${thickness}px`}
                    >
                      <div
                        className="w-full bg-black"
                        style={{ height: `${Math.min(thickness, 4)}px` }}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Thickness (px)
                  </label>
                  <input
                    type="number"
                    value={selectedElement.borderWidth || 2}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        borderWidth: Number(e.target.value),
                      })
                    }
                    min="1"
                    max="50"
                    className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Line Color
                  </label>
                  <input
                    type="color"
                    value={selectedElement.borderColor || "#000000"}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        borderColor: e.target.value,
                      })
                    }
                    className="w-full h-12 border-2 border-indigo-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Line Style
                  </label>
                  <select
                    value={selectedElement.borderStyle || "solid"}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        borderStyle: e.target.value,
                      })
                    }
                    className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>
            )}

            {/* Colors - For non-line elements */}
            {selectedElement.type !== "line" && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-4 rounded-xl border border-orange-200">
                <h4 className="font-bold text-gray-800 mb-3">Colors</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Foreground
                    </label>
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          color: e.target.value,
                        })
                      }
                      className="w-full h-12 border-2 border-orange-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Background
                    </label>
                    <input
                      type="color"
                      value={
                        selectedElement.backgroundColor === "transparent"
                          ? "#ffffff"
                          : selectedElement.backgroundColor
                      }
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-full h-12 border-2 border-orange-300 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Border Controls for shapes only (not lines) */}
            {(selectedElement.type === "rectangle" ||
              selectedElement.type === "circle") && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-4 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-gray-800 mb-3">
                  Border & Styling
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Border Width (px)
                    </label>
                    <input
                      type="number"
                      value={selectedElement.borderWidth || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          borderWidth: Number(e.target.value),
                        })
                      }
                      min="0"
                      max="20"
                      className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.borderColor || "#000000"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          borderColor: e.target.value,
                        })
                      }
                      className="w-full h-12 border-2 border-indigo-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Border Style
                    </label>
                    <select
                      value={selectedElement.borderStyle || "solid"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          borderStyle: e.target.value,
                        })
                      }
                      className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                      <option value="double">Double</option>
                    </select>
                  </div>

                  {selectedElement.type === "rectangle" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Corner Radius (px)
                      </label>
                      <input
                        type="number"
                        value={selectedElement.borderRadius || 0}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            borderRadius: Number(e.target.value),
                          })
                        }
                        min="0"
                        max="100"
                        className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">
                {isDrawingLine ? "✏️" : isDrawingShape ? "🎨" : "🎯"}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-700 mb-2">
              {isDrawingLine
                ? "Line Drawing Mode"
                : isDrawingShape
                  ? "Shape Drawing Mode"
                  : "No Element Selected"}
            </div>
            <div className="text-sm text-gray-500 px-4">
              {isDrawingLine || isDrawingShape
                ? "Drag on canvas to draw"
                : "Select an element to edit"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
