import React, { useState, useRef } from "react";
import { ArrowLeft, Save, Minus, X } from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import ToolsPalette from "./designer/ToolsPalette";
import PropertiesPanel from "./designer/PropertiesPanel";
import BarcodeModal from "../components/Models/BarcodeModel";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";

const LabelDesigner = ({ label, onSave, onBack }) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [elements, setElements] = useState(label?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [labelSize, setLabelSize] = useState(label?.labelSize || { width: 100, height: 80 });
  const [showGrid, setShowGrid] = useState(true);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [selectedBarcodeType, setSelectedBarcodeType] = useState(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDrawingBarcode, setIsDrawingBarcode] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [zoom, setZoom] = useState(100);

  // ✅ NEW: Get display name for barcode type
  const getBarcodeTypeName = (type) => {
    const barcodeTypeNames = {
      CODE128: "Code 128",
      CODE39: "Code 39",
      EAN13: "EAN-13",
      EAN8: "EAN-8",
      UPC: "UPC-A",
      QR: "QR Code",
      DATAMATRIX: "Data Matrix",
      PDF417: "PDF417",
      AZTEC: "Aztec Code",
    };
    return barcodeTypeNames[type] || type;
  };

  // ✅ UPDATED: Activate barcode drawing mode with type selection
  const activateBarcodeDrawing = (barcodeType) => {
    if (!barcodeType) {
      console.log("No barcode type selected");
      return;
    }
    console.log("Activating barcode drawing mode with type:", barcodeType);
    setSelectedBarcodeType(barcodeType);
    setIsDrawingBarcode(true);
    setIsDrawingShape(false);
    setIsDrawingLine(false);
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
    }
  };

  const handleZoomChange = (newZoom) => {
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
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    );
  };

  const deleteElement = () => {
    if (selectedElementId) {
      setElements(elements.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  const activateLineDrawing = () => {
    setIsDrawingLine(true);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setSelectedElementId(null);
    setSelectedTool(null);
  };

  const handleBarcodeTypeChange = (newType) => {
    if (selectedElementId) {
      const element = elements.find((el) => el.id === selectedElementId);
      if (!element || element.type !== "barcode") return;

      if (newType === "QR" && element.barcodeType !== "QR") {
        const MM_TO_PX = 3.7795275591;
        const offset = 20;

        const newQRElement = {
          id: generateId(),
          type: "barcode",
          x: Math.min(element.x + offset, labelSize.width * MM_TO_PX - 100),
          y: Math.min(element.y + offset, labelSize.height * MM_TO_PX - 100),
          width: 100,
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

  return (
    <div className="fixed inset-0 top-16 flex transition-colors duration-500" style={{ backgroundColor: theme.bg }}>
      <ToolsPalette
        onAddElement={addElement}
        onActivateLineDrawing={activateLineDrawing}
        isDrawingLine={isDrawingLine}
        onDragStart={(type) => canvasRef.current?.setDraggedElement(type)}
        onToolSelect={setSelectedTool}
        onActivateBarcodeDrawing={() => setSelectedTool("barcode")}
        isDrawingBarcode={isDrawingBarcode}
        selectedBarcodeType={selectedBarcodeType}
        onActivateShapeDrawing={activateShapeDrawing}
        isDrawingShape={isDrawingShape}
        currentShapeType={currentShapeType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 py-3 shadow-sm transition-colors duration-500" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                style={{ backgroundColor: isDarkMode ? '#334155' : '#F1F5F9', color: theme.text }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-lg font-black tracking-tight" style={{ color: theme.text }}>
                  {label?.name || "Untitled Label"}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                  {labelSize.width} × {labelSize.height} MM • {elements.length}{" "}
                  BLOCKS • {zoom}% SCALE
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isDrawingLine && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                  <Minus size={14} />
                  <span>Line Vector Mode</span>
                  <button onClick={() => setIsDrawingLine(false)} className="ml-2 hover:scale-110"><X size={14} /></button>
                </div>
              )}

              {isDrawingBarcode && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  <span>📊</span>
                  <span>{getBarcodeTypeName(selectedBarcodeType)} ENGINE</span>
                  <button onClick={() => { setIsDrawingBarcode(false); setSelectedBarcodeType("CODE128"); }} className="ml-2 hover:scale-110"><X size={14} /></button>
                </div>
              )}

              {isDrawingShape && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 text-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                  <span>🎨</span>
                  <span>{currentShapeType === "rectangle" ? "Rectangle" : "Circle"} VECTOR</span>
                  <button onClick={() => { setIsDrawingShape(false); setCurrentShapeType(null); }} className="ml-2 hover:scale-110"><X size={14} /></button>
                </div>
              )}

              <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest cursor-pointer px-3 py-2 rounded-xl hover:bg-gray-500/5 transition-colors" style={{ color: theme.textMuted }}>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded w-4 h-4 border-2 border-current bg-transparent checked:bg-[#39A3DD]"
                />
                <span>{t.showGrid}</span>
              </label>

              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#39A3DD] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <Save size={18} />
                <span>{t.saveDesign}</span>
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
          isDrawingShape={isDrawingShape}
          setIsDrawingShape={setIsDrawingShape}
          currentShapeType={currentShapeType}
          generateId={generateId}
          selectedBarcodeType={selectedBarcodeType}
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
        isDrawingBarcode={isDrawingBarcode}
        isDrawingShape={isDrawingShape}
        onUndo={() => canvasRef.current?.handleUndo()}
        onRedo={() => canvasRef.current?.handleRedo()}
        onDuplicate={() => canvasRef.current?.handleDuplicate()}
        canUndo={canvasRef.current?.canUndo || false}
        canRedo={canvasRef.current?.canRedo || false}
        onAddShape={handleAddShape}
        onAddTable={handleAddTable}
        onAddPlaceholder={handleAddPlaceholder}
        onActivateShapeDrawing={activateShapeDrawing}
        showShapeSelector={selectedTool === "shape"}
        showTableCreator={selectedTool === "table"}
        onActivateBarcodeDrawing={activateBarcodeDrawing}
        showBarcodeSelector={selectedTool === "barcode"}
        selectedBarcodeType={selectedBarcodeType}
        setSelectedBarcodeType={setSelectedBarcodeType}
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

      {/* AI Assistant Chatbot */}
      <AIChatbot
        onGenerateElements={(newElements, nextLabelSize, isNewRequest) => {
          if (nextLabelSize) {
            setLabelSize(nextLabelSize);
          }
          if (isNewRequest) {
            setElements(newElements);
          } else {
            setElements(prev => [...prev, ...newElements]);
          }
        }}
        labelSize={labelSize}
        generateId={generateId}
      />
    </div>
  );
};

export default LabelDesigner;
