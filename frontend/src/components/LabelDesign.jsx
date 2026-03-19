import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Save, Minus, X, Grid, ZoomIn, ZoomOut, RefreshCw, Search, Plus, Trash2, LayoutGrid, Check } from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import ToolsPalette from "./designer/ToolsPalette";
import PropertiesPanel from "./designer/PropertiesPanel";
import BarcodeModal from "../components/Models/BarcodeModel";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";
import { callEdgeFunction, API_URLS, mapPayloadToElement, normalizeDesign } from "../supabaseClient";

const LabelDesigner = ({ label, labels = [], onSave, onBack, onSelectLabel, onCreateLabel, onDeleteLabel, onNavigateToLibrary, userRole }) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Helper to get dimensions from various possible formats
  const getInitialDimensions = (l) => {
    if (l?.labelSize) return l.labelSize;
    if (l?.dimensions) return l.dimensions;
    if (l?.width && l?.height) return { width: l.width, height: l.height };
    return { width: 100, height: 150 }; // Default to 100x150mm as requested
  };

  const [elements, setElements] = useState(label?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [labelSize, setLabelSize] = useState(getInitialDimensions(label));
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

  // Define border sync logic
  const syncBorderLines = useCallback((currentElements, currentSize) => {
    if (!currentSize) return currentElements;
    
    const thicknessMm = 5 / 3.7795; // 5px converted to mm
    const borderIds = ['border-top', 'border-bottom', 'border-left', 'border-right'];
    const otherElements = (currentElements || []).filter(el => !borderIds.includes(el.id));
    
    const borders = [
      { id: 'border-top', type: 'line', x: 0, y: 0, x1: 0, y1: 0, x2: currentSize.width, y2: 0, borderWidth: thicknessMm, borderColor: "#000000", isSystem: true, locked: true },
      { id: 'border-bottom', type: 'line', x: 0, y: currentSize.height, x1: 0, y1: currentSize.height, x2: currentSize.width, y2: currentSize.height, borderWidth: thicknessMm, borderColor: "#000000", isSystem: true, locked: true },
      { id: 'border-left', type: 'line', x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: currentSize.height, borderWidth: thicknessMm, borderColor: "#000000", isSystem: true, locked: true },
      { id: 'border-right', type: 'line', x: currentSize.width, y: 0, x1: currentSize.width, y1: 0, x2: currentSize.width, y2: currentSize.height, borderWidth: thicknessMm, borderColor: "#000000", isSystem: true, locked: true },
    ];
    
    return [...otherElements, ...borders];
  }, []);

  // Sync state and fetch full elements when selected label changes
  React.useEffect(() => {
    const syncAndFetch = async () => {
      const designId = label?.design_id || label?.id;
      if (!designId) return;

      try {
        const data = await callEdgeFunction(API_URLS.GET_DESIGN, { design_id: designId });
        const normalized = normalizeDesign(data);
        
        let initialElements = normalized.elements || [];
        initialElements = syncBorderLines(initialElements, normalized.labelSize);
        
        setElements(initialElements);
        setLabelSize(normalized.labelSize);
      } catch (error) {
        console.error("Failed to fetch elements:", error);
      }
      setSelectedElementId(null);
    };

    syncAndFetch();
  }, [label?.id, syncBorderLines]);

  // Effect to update borders when size changes
  React.useEffect(() => {
    setElements(prev => syncBorderLines(prev, labelSize));
  }, [labelSize, syncBorderLines]);

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
  const handleSave = async (status = null) => {
    if (userRole === 'viewer') return;
    if (onSave) await onSave({ elements, labelSize, status: status || label?.status });
    // Navigation to library is handled by App.jsx's handleSaveLabel after successful API call
  };

  // ─── Backend Mappers ──────────────────────────────────────────────────
  // Local mapElementToPayload handles outgoing sync logic
  const mapElementToPayload = (el) => {
    const designId = label.design_id || label.id;
    let content = el.content || "";

    // For images, the src is the content
    if (el.type === "image") content = el.src || "";
    // For lines and shapes, provide a placeholder if empty to satisfy API requirements
    if (!content && ["line", "rectangle", "circle", "shape"].includes(el.type)) {
      content = el.type.toUpperCase();
    }

    return {
      design_id: designId,
      version_major: label.version_major || 0,
      version_minor: label.version_minor || 1,
      element_type: el.type,
      position_x: el.x,
      position_y: el.y,
      width: el.width,
      height: el.height,
      binding_type: el.binding_type || "static",
      static_content: content || " ", // Ensure at least a space if still empty
      properties: { ...el }, // Store full state in JSON properties
      sort_order: el.zIndex || 0
    };
  };

  // ─── Zoom ───────────────────────────────────────────────────────────────
  const handleZoomChange = (newZoom) => setZoom(newZoom);

  // ─── Add element ────────────────────────────────────────────────────────
  const addElement = async (type, extra = {}) => {
    if (type === "image") {
      imageInputRef.current?.click();
      return;
    }

    let newElement = {
      id: generateId(),
      type,
      x: 10, // 10mm instead of 50px
      y: 10,
      width: 40, // 40mm instead of 100px
      height: 20,
      zIndex: elements.length,
      rotation: 0,
      ...extra
    };

    // Type-specific defaults
    if (type === "table") {
      const rows = extra.rows || 2;
      const cols = extra.cols || 2;
      const cellWidth = 60, cellHeight = 25;
      newElement = {
        ...newElement,
        rows, cols, cellWidth, cellHeight,
        width: cols * cellWidth, height: rows * cellHeight,
        tableData: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")),
        borderColor: "#000000", borderWidth: 1, borderStyle: "solid", fontSize: 11,
      };
    } else if (type === "rectangle" || type === "circle") {
      newElement = {
        ...newElement,
        width: 30, height: 20, // mm
        borderWidth: 0.5, borderColor: "#000000", borderStyle: "solid",
        backgroundColor: "transparent",
      };
    } else if (type === "text" || type === "barcode") {
      newElement = {
        ...newElement,
        width: type === "text" ? 40 : 60, // mm
        height: type === "text" ? 8 : 25, // mm
        content: type === "text" ? "Sample Text" : "123456789",
        barcodeType: type === "barcode" ? (extra.barcodeType || "CODE128") : undefined,
        fontSize: 14, fontFamily: "Arial",
      };
    } else if (type === "line" && Object.keys(extra).length === 0) {
      // If we're just triggering the tool, don't create yet
      setIsDrawingLine(true);
      return;
    }

    // Optimistically add locally first so it shows up immediately
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setSelectedTool(null);

    // Only sync to backend if we have a design_id
    const designId = label?.design_id || label?.id;
    if (!designId) return;

    try {
      const payload = mapElementToPayload(newElement);
      const result = await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
      if (result) {
        const synced = mapPayloadToElement(result);
        // Replace the optimistic element with the synced one (using backend ID)
        setElements((prev) => prev.map(el => el.id === newElement.id ? synced : el));
        setSelectedElementId(synced.id);
      }
    } catch (error) {
      console.error("Failed to sync add-element:", error);
      // Keep the local one if sync fails
    }
  };

  // ─── Image upload handler ────────────────────────────────────────────────
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = async () => {
        const maxW = 200;
        const ratio = img.height / img.width;
        const w = Math.min(maxW, img.width);
        const h = Math.round(w * ratio);
        const element = {
          id: generateId(),
          type: "image",
          x: 50, y: 50,
          width: w, height: h,
          src: dataUrl,
          opacity: 1,
          lockAspectRatio: true,
          rotation: 0,
          zIndex: elements.length,
        };

        try {
          const designId = label?.design_id || label?.id;
          if (!designId) {
            // No design saved yet — add locally only
            setElements((prev) => [...prev, element]);
            setSelectedElementId(element.id);
          } else {
            const payload = mapElementToPayload(element);
            const result = await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
            if (result) {
              const synced = mapPayloadToElement(result);
              setElements((prev) => [...prev, synced]);
              setSelectedElementId(synced.id);
            }
          }
        } catch (error) {
          console.error("Failed to sync image:", error);
          setElements((prev) => [...prev, element]);
          setSelectedElementId(element.id);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [elements.length, label?.design_id, label?.id]);

  // ─── Placeholder ─────────────────────────────────────────────────────────
  const handleAddPlaceholder = async (placeholderName) => {
    const element = {
      id: generateId(),
      type: "placeholder",
      x: 50, y: 50, width: 150, height: 35,
      content: placeholderName,
      fontSize: 14, fontFamily: "Arial",
      rotation: 0, zIndex: elements.length,
    };

    try {
      const designId = label?.design_id || label?.id;
      if (!designId) {
        setElements((prev) => [...prev, element]);
        setSelectedElementId(element.id);
        return;
      }
      const payload = mapElementToPayload(element);
      payload.binding_type = "placeholder";
      const result = await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
      if (result) {
        setElements((prev) => [...prev, mapPayloadToElement(result)]);
        setSelectedElementId(result.id);
      }
    } catch (error) {
      console.error("Failed to sync placeholder:", error);
      setElements((prev) => [...prev, element]);
      setSelectedElementId(element.id);
    }
  };

  const handleAddTable = (rows, cols) => addElement("table", { rows, cols });
  const handleAddShape = (shapeType) => addElement(shapeType);

  // ─── Update / Delete ─────────────────────────────────────────────────────
  const updateElementLocal = (id, updates) => {
    const currentEl = elements.find(el => el.id === id);
    if (!currentEl) return;
    const updatedEl = { ...currentEl, ...updates };
    setElements((prev) => prev.map((el) => (el.id === id ? updatedEl : el)));
    return updatedEl;
  };

  const syncElementUpdate = async (id, fullElement = null) => {
    if (userRole === 'viewer') return;
    const designId = label?.design_id || label?.id;
    if (!designId) return; // No design saved yet — skip sync
    const targetEl = fullElement || elements.find(el => el.id === id);
    if (!targetEl) return;

    try {
      const payload = mapElementToPayload(targetEl);
      payload.element_id = id; // Required for update
      await callEdgeFunction(API_URLS.UPDATE_ELEMENT, payload);
    } catch (error) {
      console.error("Failed to sync element update:", error);
    }
  };

  const updateElement = async (id, updates, shouldSync = true) => {
    const updatedEl = updateElementLocal(id, updates);
    if (shouldSync && updatedEl) {
      await syncElementUpdate(id, updatedEl);
    }
  };

  const deleteElement = async () => {
    if (selectedElementId) {
      const idToDelete = selectedElementId;
      // Remove locally
      setElements((prev) => prev.filter((el) => el.id !== idToDelete));
      setSelectedElementId(null);

      // Only sync to backend if we have a design ID
      const designId = label?.design_id || label?.id;
      if (designId) {
        try {
          await callEdgeFunction(API_URLS.DELETE_ELEMENT, {
            element_id: idToDelete,
            design_id: designId,
            version_major: label.version_major || 0,
            version_minor: label.version_minor || 1
          });
        } catch (error) {
          console.error("Failed to sync delete-element:", error);
        }
      }
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
          {/* Left: back button + label info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBack && onBack()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90 group"
              title="Back to Library"
              style={{ color: theme.textMuted }}
            >
              <ArrowLeft size={18} className="group-hover:text-[var(--color-primary)] transition-colors" />
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <h2 className="text-sm font-black tracking-tight" style={{ color: theme.text }}>
                {label?.name || "Untitled Label"}
              </h2>
              <div
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60"
                style={{ color: theme.textMuted }}
              >
                <span>{Math.round(labelSize.width)}×{Math.round(labelSize.height)} MM</span>
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
                onClick={() => handleSave()}
                className="px-4 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                title="Save changes"
              >
                <Save size={14} />
                Save
              </button>
              {label?.status === 'draft' && (
                <button
                  onClick={() => handleSave('published')}
                  className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  title="Save and publish for printing"
                >
                  <Check size={14} />
                  Publish
                </button>
              )}
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
          updateElement={updateElementLocal}
          onUpdateEnd={syncElementUpdate}
          onAddElement={addElement}
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
        onCreateLabel={onCreateLabel}
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
