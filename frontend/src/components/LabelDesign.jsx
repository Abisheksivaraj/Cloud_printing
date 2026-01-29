import React, { useState, useRef } from "react";
import { ArrowLeft, Save, Minus, X } from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import ToolsPalette from "./designer/ToolsPalette";
import PropertiesPanel from "./designer/PropertiesPanel";
import BarcodeModal from "../components/Models/BarcodeModel";

const LabelDesigner = ({ label, onSave, onBack }) => {
  const [elements, setElements] = useState(label?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [labelSize] = useState(label?.labelSize || { width: 100, height: 80 });
  const [showGrid, setShowGrid] = useState(true);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [selectedBarcodeType, setSelectedBarcodeType] = useState("CODE128");
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDrawingBarcode, setIsDrawingBarcode] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false); // ✅ NEW: Shape drawing state
  const [currentShapeType, setCurrentShapeType] = useState(null); // ✅ NEW: Current shape type
  const [selectedTool, setSelectedTool] = useState(null);
  const [zoom, setZoom] = useState(100);

  const activateBarcodeDrawing = () => {
    console.log("Activating barcode drawing mode");
    setIsDrawingBarcode(true);
    setIsDrawingShape(false);
    setSelectedElementId(null);
    setSelectedTool(null);
  };

  // ✅ NEW: Activate shape drawing mode
  const activateShapeDrawing = (shapeType) => {
    console.log("Activating shape drawing mode:", shapeType);
    setIsDrawingShape(true);
    setCurrentShapeType(shapeType);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
  };

  const elementIdCounter = useRef(0);
  const canvasRef = useRef(null);

  const generateId = () =>
    `element_${Date.now()}_${++elementIdCounter.current}`;

  const handleSave = () => {
    if (onSave) {
      onSave({
        elements,
        labelSize,
      });
      alert("Label saved successfully!");
    }
  };

  // Add a function to handle zoom changes with logging
  const handleZoomChange = (newZoom) => {
    console.log("LabelDesigner: Setting zoom to", newZoom);
    setZoom(newZoom);
  };

  const addElement = (type, extra = {}) => {
    const MM_TO_PX = 3.7795275591;

    if (type === "table") {
      const table = {
        id: generateId(),
        type: "table",
        x: 20,
        y: 20,
        rows: extra.rows || 2,
        cols: extra.cols || 2,
        cellWidth: 40,
        cellHeight: 25,
        borderColor: "#38474F",
        borderWidth: 1,
        backgroundColor: "transparent",
        zIndex: elements.length,
      };

      setElements((prev) => [...prev, table]);
      setSelectedElementId(table.id);
      setSelectedTool(null);
      return;
    }

    if (type === "rectangle" || type === "circle") {
      const shape = {
        id: generateId(),
        type,
        x: 0,
        y: 0,
        width: labelSize.width * MM_TO_PX,
        height: labelSize.height * MM_TO_PX,
        borderWidth: 1,
        borderColor: "#000000",
        borderStyle: "solid",
        borderRadius: 0,
        backgroundColor: "transparent",
        rotation: 0,
        zIndex: elements.length,
      };

      setElements((prev) => [...prev, shape]);
      setSelectedElementId(shape.id);
      setSelectedTool(null);
      return;
    }

    if (type === "line") {
      setIsDrawingLine(true);
      setSelectedElementId(null);
      return;
    }

    const element = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 120 : type === "barcode" ? 200 : 100,
      height: type === "text" ? 30 : type === "barcode" ? 100 : 100,
      content:
        type === "text" ? "Sample Text" : type === "barcode" ? "123456789" : "",
      barcodeType: type === "barcode" ? "CODE128" : undefined,
      fontSize: 14,
      fontFamily: "Arial",
      textAlign: "left",
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "#000000",
      borderRadius: 0,
      rotation: 0,
      zIndex: elements.length,
    };

    setElements((prev) => [...prev, element]);
    setSelectedElementId(element.id);
    setSelectedTool(null);
  };

  const handleAddShape = (shapeType) => {
    addElement(shapeType);
  };

  const handleAddPlaceholder = (placeholderName) => {
    const element = {
      id: generateId(),
      type: "placeholder",
      x: 50,
      y: 50,
      width: 150,
      height: 35,
      content: placeholderName,
      fontSize: 14,
      fontFamily: "Arial",
      textAlign: "left",
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
      borderStyle: "solid",
      rotation: 0,
      zIndex: elements.length,
    };

    setElements((prev) => [...prev, element]);
    setSelectedElementId(element.id);
  };

  const handleAddTable = (rows, cols) => {
    addElement("table", { rows, cols });
  };

  const updateElement = (id, updates) => {
    console.log("Updating element:", id, updates);
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    );
  };

  const deleteElement = () => {
    if (selectedElementId) {
      console.log("Deleting element:", selectedElementId);
      setElements(elements.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  const activateLineDrawing = () => {
    console.log("Activating line drawing mode");
    setIsDrawingLine(true);
    setIsDrawingShape(false);
    setSelectedElementId(null);
    setSelectedTool(null);
  };

  // ✅ UPDATED: Handle barcode type change - creates new QR code if changing to QR
  const handleBarcodeTypeChange = (newType) => {
    if (selectedElementId) {
      const element = elements.find((el) => el.id === selectedElementId);

      if (!element || element.type !== "barcode") return;

      // If changing to QR Code, create a new QR code element near the current barcode
      if (newType === "QR" && element.barcodeType !== "QR") {
        const MM_TO_PX = 3.7795275591;
        const offset = 20; // Offset to place new QR code nearby

        const newQRElement = {
          id: generateId(),
          type: "barcode",
          x: Math.min(element.x + offset, labelSize.width * MM_TO_PX - 100),
          y: Math.min(element.y + offset, labelSize.height * MM_TO_PX - 100),
          width: 100, // Square for QR code
          height: 100,
          content: element.content || "123456789",
          barcodeType: "QR",
          fontSize: 14,
          fontFamily: "Arial",
          color: "#000000",
          backgroundColor: "#ffffff",
          borderWidth: 0,
          borderColor: "#000000",
          borderStyle: "solid",
          rotation: 0,
          zIndex: elements.length,
        };

        setElements((prev) => [...prev, newQRElement]);
        setSelectedElementId(newQRElement.id);
        setSelectedBarcodeType("QR");
      } else {
        // Normal barcode type change
        setSelectedBarcodeType(newType);
        updateElement(selectedElementId, { barcodeType: newType });
      }
    }
  };

  const handleBarcodeCreate = () => {
    if (barcodeValue.trim() && selectedElementId) {
      updateElement(selectedElementId, {
        content: barcodeValue.trim(),
        barcodeType: selectedBarcodeType,
      });
      setShowBarcodeModal(false);
      setBarcodeValue("");
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Add console log to track zoom state
  console.log("LabelDesigner render - Current zoom:", zoom);

  return (
    <div className="fixed inset-0 top-16 flex bg-gradient-to-br from-gray-50 to-gray-100">
      <ToolsPalette
        onAddElement={addElement}
        onActivateLineDrawing={activateLineDrawing}
        isDrawingLine={isDrawingLine}
        onDragStart={(type) => canvasRef.current?.setDraggedElement(type)}
        onToolSelect={setSelectedTool}
        onActivateBarcodeDrawing={activateBarcodeDrawing}
        isDrawingBarcode={isDrawingBarcode}
        onActivateShapeDrawing={activateShapeDrawing} // ✅ NEW
        isDrawingShape={isDrawingShape} // ✅ NEW
        currentShapeType={currentShapeType} // ✅ NEW
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Reduced header height with smaller padding and text */}
        <div className="bg-white border-b px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {label?.name || "New Label"}
                </h2>
                <p className="text-xs text-gray-500">
                  {labelSize.width} × {labelSize.height} mm • {elements.length}{" "}
                  elements • Zoom: {zoom}%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isDrawingLine && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">
                  <Minus size={14} />
                  <span>Line Drawing Mode</span>
                  <button
                    onClick={() => setIsDrawingLine(false)}
                    className="ml-1 p-0.5 hover:bg-yellow-200 rounded"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {isDrawingShape && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-medium">
                  <span>🎨</span>
                  <span>
                    Drawing{" "}
                    {currentShapeType === "rectangle" ? "Rectangle" : "Circle"}
                  </span>
                  <button
                    onClick={() => {
                      setIsDrawingShape(false);
                      setCurrentShapeType(null);
                    }}
                    className="ml-1 p-0.5 hover:bg-purple-200 rounded"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <label className="flex items-center space-x-1.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded w-3.5 h-3.5"
                />
                <span>Show Grid</span>
              </label>

              <button
                onClick={handleSave}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Save size={16} />
                <span>Save Label</span>
              </button>
            </div>
          </div>
        </div>

        <DesignCanvas
          ref={canvasRef}
          elements={elements}
          setElements={setElements}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
          labelSize={labelSize}
          showGrid={showGrid}
          isDrawingLine={isDrawingLine}
          setIsDrawingLine={setIsDrawingLine}
          isDrawingBarcode={isDrawingBarcode}
          setIsDrawingBarcode={setIsDrawingBarcode}
          isDrawingShape={isDrawingShape} // ✅ NEW
          setIsDrawingShape={setIsDrawingShape} // ✅ NEW
          currentShapeType={currentShapeType} // ✅ NEW
          generateId={generateId}
          updateElement={updateElement}
          setSelectedBarcodeType={setSelectedBarcodeType}
          zoom={zoom}
          onZoomChange={handleZoomChange}
        />
      </div>

      <PropertiesPanel
        selectedElement={selectedElement}
        updateElement={updateElement}
        deleteElement={deleteElement}
        onBarcodeTypeChange={handleBarcodeTypeChange}
        isDrawingLine={isDrawingLine}
        isDrawingShape={isDrawingShape} // ✅ NEW
        onUndo={() => canvasRef.current?.handleUndo()}
        onRedo={() => canvasRef.current?.handleRedo()}
        onDuplicate={() => canvasRef.current?.handleDuplicate()}
        canUndo={canvasRef.current?.canUndo || false}
        canRedo={canvasRef.current?.canRedo || false}
        onAddShape={handleAddShape}
        onAddTable={handleAddTable}
        onAddPlaceholder={handleAddPlaceholder}
        onActivateShapeDrawing={activateShapeDrawing} // ✅ NEW
        showShapeSelector={selectedTool === "shape"}
        showTableCreator={selectedTool === "table"}
      />
      {showBarcodeModal && (
        <BarcodeModal
          value={barcodeValue}
          setValue={setBarcodeValue}
          barcodeType={selectedBarcodeType}
          onClose={() => {
            setShowBarcodeModal(false);
            setBarcodeValue("");
          }}
          onCreate={handleBarcodeCreate}
        />
      )}
    </div>
  );
};

export default LabelDesigner;
