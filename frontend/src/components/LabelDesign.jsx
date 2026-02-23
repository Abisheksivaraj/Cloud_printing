import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Save, Minus, X, Grid, ZoomIn, ZoomOut, RefreshCw, Search, Plus, Trash2, LayoutGrid } from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import ToolsPalette from "./designer/ToolsPalette";
import PropertiesPanel from "./designer/PropertiesPanel";
import BarcodeModal from "../components/Models/BarcodeModel";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";

const LabelDesigner = ({ label, labels = [], onSave, onSelectLabel, onCreateLabel, onDeleteLabel, onNavigateToLibrary }) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [isDrawingText, setIsDrawingText] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(false);

  // Sync state when selected label changes
  React.useEffect(() => {
    if (label) {
      setElements(label.elements || []);
      setLabelSize(label.labelSize || { width: 100, height: 80 });
      setSelectedElementId(null);
    }
  }, [label?.id]);

  const elementIdCounter = useRef(0);
  const canvasRef = useRef(null);
  const imageInputRef = useRef(null);

  const generateId = () => `element_${Date.now()}_${++elementIdCounter.current}`;

  // ─── Barcode type name helper ───────────────────────────────────────────
  const getBarcodeTypeName = (type) => {
    const names = {
      CODE128: "Code 128", CODE39: "Code 39", EAN13: "EAN-13",
      EAN8: "EAN-8", UPC: "UPC-A", QR: "QR Code",
      DATAMATRIX: "Data Matrix", PDF417: "PDF417", AZTEC: "Aztec Code",
    };
    return names[type] || type;
  };

  // ─── Activate text drawing ────────────────────────────────────────────────
  const activateTextDrawing = () => {
    setIsDrawingText(true);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setSelectedTool(null);
    setIsPropertiesExpanded(true);
  };

  // ─── Activate barcode drawing ───────────────────────────────────────────
  const activateBarcodeDrawing = (barcodeType) => {
    if (!barcodeType) return;
    setSelectedBarcodeType(barcodeType);
    setIsDrawingBarcode(true);
    setIsDrawingShape(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setSelectedTool(null);
    setIsPropertiesExpanded(true);
  };

  // ─── Activate shape drawing ─────────────────────────────────────────────
  const activateShapeDrawing = (shapeType) => {
    setIsDrawingShape(true);
    setCurrentShapeType(shapeType);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(true);
  };

  // ─── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (onSave) await onSave({ elements, labelSize });
    // Navigation to library is handled by App.jsx's handleSaveLabel after successful API call
  };

  // ─── Zoom ───────────────────────────────────────────────────────────────
  const handleZoomChange = (newZoom) => setZoom(newZoom);

  // ─── Add element ────────────────────────────────────────────────────────
  const addElement = (type, extra = {}) => {
    const MM_TO_PX = 3.7795275591;

    if (type === "table") {
      const rows = extra.rows || 2;
      const cols = extra.cols || 2;
      const cellWidth = 60;
      const cellHeight = 25;
      const tableData = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => "")
      );
      const table = {
        id: generateId(),
        type: "table",
        x: 20,
        y: 20,
        rows,
        cols,
        cellWidth,
        cellHeight,
        width: cols * cellWidth,
        height: rows * cellHeight,
        tableData,
        borderColor: "#000000",
        borderWidth: 1,
        borderStyle: "solid",
        backgroundColor: "transparent",
        fontSize: 11,
        fontFamily: "Arial",
        rotation: 0,
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
        x: 20,
        y: 20,
        width: 80,
        height: 60,
        borderWidth: 2,
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
      // Properties panel will open AFTER line is drawn (via onElementCreated)
      return;
    }

    if (type === "image") {
      // Trigger file input
      if (imageInputRef.current) imageInputRef.current.click();
      return;
    }

    const element = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 120 : type === "barcode" ? 200 : 100,
      height: type === "text" ? 30 : type === "barcode" ? 80 : 100,
      content:
        type === "text" ? "Sample Text" : type === "barcode" ? "123456789" : "",
      barcodeType: type === "barcode" ? "CODE128" : undefined,
      barcodeWidth: 2,
      barcodeBarHeight: 70,
      showBarcodeText: true,
      fontSize: 14,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "left",
      letterSpacing: 0,
      lineHeight: 1.2,
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "#000000",
      borderStyle: "solid",
      borderRadius: 0,
      rotation: 0,
      opacity: 1,
      lockAspectRatio: true,
      zIndex: elements.length,
    };

    setElements((prev) => [...prev, element]);
    setSelectedElementId(element.id);
    setSelectedTool(null);
  };

  // ─── Image upload handler ────────────────────────────────────────────────
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const maxW = 200;
        const ratio = img.height / img.width;
        const w = Math.min(maxW, img.width);
        const h = Math.round(w * ratio);
        const element = {
          id: generateId(),
          type: "image",
          x: 50,
          y: 50,
          width: w,
          height: h,
          src: dataUrl,
          opacity: 1,
          lockAspectRatio: true,
          rotation: 0,
          zIndex: elements.length,
        };
        setElements((prev) => [...prev, element]);
        setSelectedElementId(element.id);
        setSelectedTool(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset so same file can be reuploaded
  }, [elements.length]);

  // ─── Placeholder ─────────────────────────────────────────────────────────
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
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
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

  const handleAddTable = (rows, cols) => addElement("table", { rows, cols });
  const handleAddShape = (shapeType) => addElement(shapeType);

  // ─── Update / Delete ─────────────────────────────────────────────────────
  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = () => {
    if (selectedElementId) {
      setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  // ─── Line drawing ─────────────────────────────────────────────────────────
  const activateLineDrawing = () => {
    setIsDrawingLine(true);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setSelectedElementId(null);
    setSelectedTool(null);
  };

  // ─── Barcode type change ──────────────────────────────────────────────────
  const handleBarcodeTypeChange = (newType) => {
    if (selectedElementId) {
      const element = elements.find((el) => el.id === selectedElementId);
      if (!element || element.type !== "barcode") return;
      setSelectedBarcodeType(newType);
      updateElement(selectedElementId, { barcodeType: newType });
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

  // ─── LAYER CONTROL ────────────────────────────────────────────────────────
  const handleBringForward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === selectedElementId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const newArr = [...prev];
      const el = newArr[idx];
      const nextEl = newArr[idx + 1];
      // Swap z-indexes
      const newZ = nextEl.zIndex !== undefined ? nextEl.zIndex + 1 : (el.zIndex || 0) + 1;
      newArr[idx] = { ...el, zIndex: newZ };
      newArr[idx + 1] = { ...nextEl, zIndex: el.zIndex !== undefined ? el.zIndex : 0 };
      return newArr.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    });
  };

  const handleSendBackward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === selectedElementId);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      const el = newArr[idx];
      const prevEl = newArr[idx - 1];
      const newZ = prevEl.zIndex !== undefined ? Math.max(0, prevEl.zIndex - 1) : 0;
      newArr[idx] = { ...el, zIndex: newZ };
      newArr[idx - 1] = { ...prevEl, zIndex: el.zIndex !== undefined ? el.zIndex : 0 };
      return newArr.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    });
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div
      className="fixed inset-0 top-12 md:top-14 flex transition-colors duration-200"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Sidebar removed as requested */}

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* ─── Tools Palette ─── */}
      <ToolsPalette
        onAddElement={addElement}
        onActivateLineDrawing={activateLineDrawing}
        isDrawingLine={isDrawingLine}
        onActivateTextDrawing={activateTextDrawing}
        isDrawingText={isDrawingText}
        onDragStart={(type) => canvasRef.current?.setDraggedElement(type)}
        onToolSelect={(tool) => {
          setSelectedTool(tool);
          if (tool) setIsPropertiesExpanded(true);
        }}
        onActivateBarcodeDrawing={(type) => {
          activateBarcodeDrawing(type);
          setIsPropertiesExpanded(true);
        }}
        isDrawingBarcode={isDrawingBarcode}
        selectedBarcodeType={selectedBarcodeType}
        onActivateShapeDrawing={(type) => {
          activateShapeDrawing(type);
          setIsPropertiesExpanded(true);
        }}
        isDrawingShape={isDrawingShape}
        currentShapeType={currentShapeType}
      />

      {/* ─── Canvas Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Toolbar */}
        <div
          className="border-b px-4 py-2 shadow-sm z-10 flex items-center justify-between gap-3"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          {/* Left: label info */}
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-black tracking-tight" style={{ color: theme.text }}>
                {label?.name || "Untitled Label"}
              </h2>
              <div
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60"
                style={{ color: theme.textMuted }}
              >
                <span>{labelSize.width}×{labelSize.height} MM</span>
                <span>·</span>
                <span>{elements.length} Objects</span>
                <span>·</span>
                <span>{zoom}% Zoom</span>
              </div>
            </div>
          </div>

          {/* Center: active mode badges */}
          <div className="flex items-center gap-2">
            {isDrawingText && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                📝 Text Mode
                <button onClick={() => setIsDrawingText(false)} className="ml-1 hover:bg-blue-500/20 rounded p-0.5"><X size={10} /></button>
              </div>
            )}
            {isDrawingLine && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                <Minus size={12} /> Line Mode
                <button onClick={() => setIsDrawingLine(false)} className="ml-1 hover:bg-amber-500/20 rounded p-0.5"><X size={10} /></button>
              </div>
            )}
            {isDrawingBarcode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                📊 {getBarcodeTypeName(selectedBarcodeType)} Mode
                <button onClick={() => { setIsDrawingBarcode(false); setSelectedBarcodeType(null); }} className="ml-1 hover:bg-blue-500/20 rounded p-0.5"><X size={10} /></button>
              </div>
            )}
            {isDrawingShape && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                🎨 {currentShapeType === "rectangle" ? "Rectangle" : "Circle"}
                <button onClick={() => { setIsDrawingShape(false); setCurrentShapeType(null); }} className="ml-1 hover:bg-purple-500/20 rounded p-0.5"><X size={10} /></button>
              </div>
            )}
          </div>

          {/* Right: zoom + grid + save */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-[var(--color-bg-main)] rounded-xl border border-[var(--color-border)] px-1">
              <button
                onClick={() => canvasRef.current?.handleZoomOut()}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Zoom Out (Ctrl+-)"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-black w-10 text-center">{zoom}%</span>
              <button
                onClick={() => canvasRef.current?.handleZoomIn()}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Zoom In (Ctrl++)"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => canvasRef.current?.handleZoomReset()}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Reset Zoom (Ctrl+0)"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors border text-xs font-bold flex items-center gap-1.5 ${showGrid
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30"
                : "border-[var(--color-border)] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              title="Toggle Grid"
            >
              <Grid size={14} />
            </button>

            {/* Save group */}
            <div className="flex items-center gap-1 bg-[var(--color-bg-main)] p-1 rounded-xl border border-[var(--color-border)]">
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <Save size={14} />
                Save
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
              <button
                onClick={() => { if (onNavigateToLibrary) onNavigateToLibrary(); }}
                className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
                title="Go to Templates Library"
              >
                <LayoutGrid size={14} />
                Templates
              </button>
            </div>
          </div>
        </div>

        {/* Design Canvas */}
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
          isDrawingText={isDrawingText}
          setIsDrawingText={setIsDrawingText}
          generateId={generateId}
          selectedBarcodeType={selectedBarcodeType}
          updateElement={updateElement}
          setSelectedBarcodeType={setSelectedBarcodeType}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onInteraction={() => {
            // Collapse properties panel when user clicks empty canvas
            setIsPropertiesExpanded(false);
          }}
          onElementCreated={() => {
            // Open properties panel after an element is drawn (e.g. after line is placed)
            setIsPropertiesExpanded(true);
          }}
          onElementSelected={() => {
            // Open properties panel when an element is clicked/selected
            setIsPropertiesExpanded(true);
          }}
        />
      </div>

      {/* ─── Properties Panel (Expandable/Collapsible) ─── */}
      <div
        className={`fixed top-12 md:top-14 bottom-0 right-0 z-40 transition-transform duration-500 ease-in-out border-l shadow-2xl ${isPropertiesExpanded ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ width: "320px", backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <button
          onClick={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
          className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-[var(--color-surface)] border-l border-t border-b rounded-l-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.05)]"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <div className={`transition-transform duration-500 ${isPropertiesExpanded ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }}>
            <ArrowLeft size={16} />
          </div>
        </button>

        <div className="h-full overflow-y-auto custom-scrollbar">
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
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
          />
        </div>
      </div>

      {/* Barcode Modal */}
      {showBarcodeModal && (
        <BarcodeModal
          onClose={() => setShowBarcodeModal(false)}
          onAdd={handleAddBarcode}
          initialValue={barcodeValue}
        />
      )}

      {showCreateModal && (
        <CreateLabelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(labelData) => {
            onCreateLabel(labelData);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* AI Assistant Chatbot */}
      <AIChatbot
        onGenerateElements={(newElements, nextLabelSize, isNewRequest) => {
          if (nextLabelSize) setLabelSize(nextLabelSize);
          if (isNewRequest) {
            setElements(newElements);
          } else {
            setElements((prev) => [...prev, ...newElements]);
          }
        }}
        labelSize={labelSize}
        generateId={generateId}
      />
    </div>
  );
};

export default LabelDesigner;
