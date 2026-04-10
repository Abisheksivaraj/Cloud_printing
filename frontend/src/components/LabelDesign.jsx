import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ArrowLeft, Save, Minus, X, Grid, ZoomIn, ZoomOut, 
  RefreshCw, Search, Plus, Trash2, LayoutGrid, Check, 
  ChevronRight, FileText, Settings, History, Layers, 
  Monitor, Info, Palette 
} from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import ToolsPalette from "./designer/ToolsPalette";
import PropertiesPanel from "./designer/PropertiesPanel";
import BarcodeModal from "../components/Models/BarcodeModel";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import BindingTypeModal from "../components/Models/BindingTypeModal";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";
import { callEdgeFunction, API_URLS, mapPayloadToElement, normalizeDesign, convertFromPx, convertToPx, MM_TO_PX, DPI } from "../supabaseClient";

const LabelDesigner = ({ label, labels = [], onSave, onBack, onSelectLabel, onCreateLabel, onDeleteLabel, onNavigateToLibrary, userRole }) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingBindingElement, setPendingBindingElement] = useState(null);
  
  const getInitialDimensions = (l) => {
    if (l?.labelSize) return l.labelSize;
    if (l?.dimensions) return l.dimensions;
    if (l?.width && l?.height) return { width: l.width, height: l.height, unit: l.unit || 'mm' };
    return { width: 100, height: 150, unit: 'mm' }; 
  };

  const [elements, setElements] = useState(label?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [labelSize, setLabelSize] = useState(getInitialDimensions(label));
  const [showGrid, setShowGrid] = useState(true);
  const [selectedBarcodeType, setSelectedBarcodeType] = useState(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDrawingBarcode, setIsDrawingBarcode] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [isDrawingText, setIsDrawingText] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(true); // Default open for professional feel

  const measureText = useCallback((text, style) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontWeight = style.fontWeight || 'normal';
    const fontStyle = style.fontStyle || 'normal';
    const fontSize = style.fontSize || 14;
    const fontFamily = style.fontFamily || 'Arial';
    
    context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text || '');
    const paddingX = 12; 
    const paddingY = 8;
    
    return { 
      width: Math.max(20, metrics.width + paddingX), 
      height: Math.max(20, (fontSize * (style.lineHeight || 1.2)) + paddingY) 
    };
  }, []);

  React.useEffect(() => {
    const syncAndFetch = async () => {
      const designId = label?.design_id || label?.id;
      if (!designId) return;
      try {
        const data = await callEdgeFunction(API_URLS.GET_DESIGN, { design_id: designId });
        const normalized = normalizeDesign(data);
        let repairedElements = normalized.elements || [];
        const hasRectangleBorder = repairedElements.some(el => el.type === 'rectangle' && (el.id === 'label-border' || el.isSystem));
        const hasLineBorders = repairedElements.some(el => el.type === 'line' && (el.id?.startsWith('border-') || el.isSystem));
        
        if (hasRectangleBorder || !hasLineBorders) {
          repairedElements = repairedElements.filter(el => !(el.type === 'rectangle' && (el.id === 'label-border' || el.isSystem)));
          const { width, height, unit } = normalized.labelSize;
          const widthPx = convertToPx(width, unit);
          const heightPx = convertToPx(height, unit);
          const newBorders = [
            { id: `border-top`, type: 'line', x: 0, y: 0, x1: 0, y1: 0, x2: widthPx, y2: 0, borderWidth: 2, borderColor: "#000000", isSystem: true, locked: true, zIndex: 0 },
            { id: `border-bottom`, type: 'line', x: 0, y: heightPx, x1: 0, y1: heightPx, x2: widthPx, y2: heightPx, borderWidth: 2, borderColor: "#000000", isSystem: true, locked: true, zIndex: 0 },
            { id: `border-left`, type: 'line', x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: heightPx, borderWidth: 2, borderColor: "#000000", isSystem: true, locked: true, zIndex: 0 },
            { id: `border-right`, type: 'line', x: widthPx, y: 0, x1: widthPx, y1: 0, x2: widthPx, y2: heightPx, borderWidth: 2, borderColor: "#000000", isSystem: true, locked: true, zIndex: 0 },
          ];
          const otherElements = repairedElements.filter(el => !el.id?.startsWith('border-'));
          repairedElements = [...newBorders, ...otherElements];
        }
        setElements(repairedElements);
        setLabelSize(normalized.labelSize);
      } catch (error) { console.error("Fetch failure:", error); }
      setSelectedElementId(null);
    };
    syncAndFetch();
  }, [label?.id]);

  const elementIdCounter = useRef(0);
  const canvasRef = useRef(null);
  const imageInputRef = useRef(null);

  const generateId = () => `element_${Date.now()}_${++elementIdCounter.current}`;

  const activateTextDrawing = () => {
    setIsDrawingText(true);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(true);
  };

  const activateBarcodeDrawing = (barcodeType) => {
    if (!barcodeType) return;
    setSelectedBarcodeType(barcodeType);
    setIsDrawingBarcode(true);
    setIsDrawingText(false);
    setIsDrawingShape(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(true);
  };

  const activateShapeDrawing = (shapeType) => {
    setIsDrawingShape(true);
    setCurrentShapeType(shapeType);
    setIsDrawingText(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(true);
  };

  const handleSave = async (status = null) => {
    if (userRole === 'viewer') return;
    if (onSave) await onSave({ elements, labelSize, status: status || label?.status });
  };

  const mapElementToPayload = (el) => {
    const designId = label.design_id || label.id;
    let content = el.content || "";
    if (el.type === "image") content = el.src || "";
    if (!content && ["line", "rectangle", "circle", "shape"].includes(el.type)) content = el.type.toUpperCase();
    const currentUnit = labelSize.unit || 'mm';
    const properties = {
      ...el,
      x: convertFromPx(el.x, currentUnit),
      y: convertFromPx(el.y, currentUnit),
      width: convertFromPx(el.width, currentUnit),
      height: convertFromPx(el.height, currentUnit),
      fontSize: el.fontSize ? convertFromPx(el.fontSize, currentUnit) : undefined,
      borderWidth: el.borderWidth !== undefined ? convertFromPx(el.borderWidth, currentUnit) : undefined,
      borderRadius: el.borderRadius !== undefined ? convertFromPx(el.borderRadius, currentUnit) : undefined,
      letterSpacing: el.letterSpacing !== undefined ? convertFromPx(el.letterSpacing, currentUnit) : undefined,
    };
    if (el.x1 !== undefined) properties.x1 = convertFromPx(el.x1, currentUnit);
    if (el.y1 !== undefined) properties.y1 = convertFromPx(el.y1, currentUnit);
    if (el.x2 !== undefined) properties.x2 = convertFromPx(el.x2, currentUnit);
    if (el.y2 !== undefined) properties.y2 = convertFromPx(el.y2, currentUnit);

    return {
      design_id: designId,
      version_major: label.version_major || 0,
      version_minor: label.version_minor || 1,
      element_type: el.type,
      position_x: properties.x,
      position_y: properties.y,
      width: properties.width,
      height: properties.height,
      binding_type: el.binding_type || null,
      static_content: content || " ",
      properties,
      sort_order: el.zIndex || 0
    };
  };

  const handleZoomChange = (newZoom) => setZoom(newZoom);

  const addElement = async (type, extra = {}) => {
    if (type === "image") { imageInputRef.current?.click(); return; }
    let newElement = {
      id: generateId(), type, x: 38, y: 38, width: 151, height: 76, zIndex: elements.length, rotation: 0, ...extra
    };
    if (type === "table") {
      const rows = extra.rows || 2, cols = extra.cols || 2;
      newElement = { ...newElement, rows, cols, cellWidth: 60, cellHeight: 25, width: cols * 60, height: rows * 25, tableData: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")), borderColor: "#000000", borderWidth: 1, borderStyle: "solid", fontSize: 11 };
    } else if (type === "rectangle" || type === "circle") {
      newElement = { ...newElement, width: 113, height: 76, borderWidth: 2, borderColor: "#000000", borderStyle: "solid", backgroundColor: "transparent" };
    } else if (type === "text" || type === "barcode") {
      newElement = { ...newElement, width: extra.width || (type === "text" ? 151 : 227), height: extra.height || (type === "text" ? 30 : 95), content: extra.content || (type === "text" ? "Sample Text" : "123456789"), barcodeType: type === "barcode" ? (extra.barcodeType || "CODE128") : undefined, fontSize: extra.fontSize || 14, fontFamily: extra.fontFamily || "Arial" };
      if (type === "text") { const dims = measureText(newElement.content, newElement); newElement.width = dims.width; newElement.height = dims.height; }
    } else if (type === "line" && Object.keys(extra).length === 0) { setIsDrawingLine(true); return; }
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setPendingBindingElement(newElement);
  };

  const handleBindingTypeSave = async (bindingType) => {
    if (!pendingBindingElement) return;
    const updatedElement = { ...pendingBindingElement, binding_type: bindingType };
    setElements((prev) => prev.map(el => el.id === pendingBindingElement.id ? updatedElement : el));
    setPendingBindingElement(null);
    const designId = label?.design_id || label?.id;
    if (!designId) return;
    try {
      const payload = mapElementToPayload(updatedElement);
      const result = await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
      if (result) {
        const synced = { ...updatedElement, ...mapPayloadToElement(result) };
        setElements((prev) => prev.some(el => el.id === updatedElement.id) ? prev.map(el => el.id === updatedElement.id ? synced : el) : [...prev, synced]);
        setSelectedElementId(synced.id);
      }
    } catch (error) { console.error("Sync error:", error); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const w = Math.min(200, img.width), h = Math.round(w * (img.height / img.width));
        const element = { id: generateId(), type: "image", x: 189, y: 189, width: w * MM_TO_PX, height: h * MM_TO_PX, src: ev.target.result, opacity: 1, lockAspectRatio: true, rotation: 0, zIndex: elements.length };
        setElements((prev) => [...prev, element]); setSelectedElementId(element.id); setPendingBindingElement(element);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleAddPlaceholder = async (placeholderName) => {
    const tempId = generateId();
    const defaults = { id: tempId, type: "placeholder", content: placeholderName, fontSize: 14, fontFamily: "Arial", rotation: 0, zIndex: elements.length };
    const dims = measureText(placeholderName, defaults);
    const element = { ...defaults, x: 38, y: 38, width: dims.width, height: dims.height };
    setElements((prev) => [...prev, element]); setSelectedElementId(tempId);
    const designId = label?.design_id || label?.id;
    if (!designId) return;
    try {
      const payload = mapElementToPayload(element); payload.binding_type = "placeholder";
      const result = await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
      if (result) {
        const synced = { ...element, ...mapPayloadToElement(result) };
        setElements((prev) => prev.map(el => el.id === tempId ? synced : el));
        setSelectedElementId(synced.id);
      }
    } catch (error) { console.error("Placeholder sync failure:", error); }
  };

  const updateElementLocal = (id, updates) => {
    const el = elements.find(el => el.id === id); if (!el) return;
    const updated = { ...el, ...updates };
    setElements((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const syncElementUpdate = async (id, fullElement = null) => {
    if (userRole === 'viewer') return;
    const designId = label?.design_id || label?.id; if (!designId) return;
    const target = fullElement || elements.find(el => el.id === id); if (!target) return;
    try {
      const payload = mapElementToPayload(target); payload.element_id = id;
      await callEdgeFunction(API_URLS.UPDATE_ELEMENT, payload);
    } catch (error) { console.error("Update sync failure:", error); }
  };

  const updateElement = async (id, updates, shouldSync = true) => {
    const target = elements.find(e => e.id === id);
    if (target && (target.type === 'text' || target.type === 'placeholder')) {
      const combined = { ...target, ...updates };
      const dims = measureText(combined.content || target.content, combined);
      updates.width = dims.width; updates.height = dims.height;
    }
    const updated = updateElementLocal(id, updates);
    if (shouldSync && updated) await syncElementUpdate(id, updated);
  };

  const deleteElement = async () => {
    if (selectedElementId) {
      const idToDelete = selectedElementId;
      setElements((prev) => prev.filter((el) => el.id !== idToDelete));
      setSelectedElementId(null);
      const designId = label?.design_id || label?.id;
      if (designId) {
        try {
          await callEdgeFunction(API_URLS.DELETE_ELEMENT, { element_id: idToDelete, design_id: designId, version_major: label.version_major || 0, version_minor: label.version_minor || 1 });
        } catch (error) { console.error("Delete sync failure:", error); }
      }
    }
  };

  const activateLineDrawing = () => { 
    setIsDrawingLine(true); 
    setIsDrawingText(false);
    setIsDrawingShape(false); 
    setIsDrawingBarcode(false); 
    setSelectedElementId(null); 
  };

  const handleBarcodeTypeChange = (newType) => {
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (!el || el.type !== "barcode") return;
      setSelectedBarcodeType(newType); updateElement(selectedElementId, { barcodeType: newType });
    }
  };

  const handleBringForward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === selectedElementId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const newArr = [...prev]; const el = newArr[idx]; const next = newArr[idx + 1];
      newArr[idx] = { ...el, zIndex: (next.zIndex || 0) + 1 };
      newArr[idx + 1] = { ...next, zIndex: el.zIndex || 0 };
      return newArr.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    });
  };

  const handleSendBackward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === selectedElementId);
      if (idx <= 0) return prev;
      const newArr = [...prev]; const el = newArr[idx]; const prevEl = newArr[idx - 1];
      newArr[idx] = { ...el, zIndex: Math.max(0, (prevEl.zIndex || 0) - 1) };
      newArr[idx - 1] = { ...prevEl, zIndex: el.zIndex || 0 };
      return newArr.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    });
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div className="fixed inset-0 top-12 md:top-14 flex overflow-hidden bg-slate-900">
      
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ─── Premium Workspace Rail (Smarter Sidebar) ─── */}
      <div className="flex flex-col border-r border-slate-800 bg-slate-900 z-30 shadow-2xl relative">
        <ToolsPalette
          onAddElement={addElement}
          onActivateLineDrawing={activateLineDrawing}
          isDrawingLine={isDrawingLine}
          onActivateTextDrawing={activateTextDrawing}
          isDrawingText={isDrawingText}
          onDragStart={(type) => canvasRef.current?.setDraggedElement(type)}
          onToolSelect={(tool) => { setSelectedTool(tool); if (tool) setIsPropertiesExpanded(true); }}
          onActivateBarcodeDrawing={activateBarcodeDrawing}
          isDrawingBarcode={isDrawingBarcode}
          selectedBarcodeType={selectedBarcodeType}
          onActivateShapeDrawing={activateShapeDrawing}
          isDrawingShape={isDrawingShape}
          currentShapeType={currentShapeType}
        />
      </div>

      {/* ─── Main Content Surface ─── */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* ─── Studio Toolbar (Floating Glass Header) ─── */}
        <div className="px-5 py-3 glass z-20 flex items-center justify-between border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] mx-4 mt-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl">
          
          {/* Section: Breadcrumbs & Identity */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => onBack && onBack()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95 group border border-white/5"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace</span>
                  <ChevronRight size={10} className="text-slate-600" />
                  <h2 className="text-sm font-black text-white tracking-tight">{label?.name || "Untitled Template"}</h2>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse" />
                   {labelSize.width} × {labelSize.height} {labelSize.unit?.toUpperCase()} <span className="text-slate-700">•</span> {elements.length} LAYERS
                </div>
              </div>
            </div>
          </div>

          {/* Section: Active Intelligence & Mode Indicators */}
          <div className="hidden xl:flex items-center gap-3">
             {!(isDrawingText || isDrawingLine || isDrawingBarcode || isDrawingShape) ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Monitor size={14} className="text-blue-500/70" /> Ready for Interaction
                </div>
             ) : (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  {isDrawingText && <div className="badge-studio bg-sky-500/10 text-sky-400 border-sky-500/20"><FileText size={12} /> Text Mode</div>}
                  {isDrawingLine && <div className="badge-studio bg-amber-500/10 text-amber-400 border-amber-500/20"><Minus size={12} /> Line Tool</div>}
                  {isDrawingBarcode && <div className="badge-studio bg-indigo-500/10 text-indigo-400 border-indigo-500/20"><Search size={12} /> {selectedBarcodeType}</div>}
                  {isDrawingShape && <div className="badge-studio bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><LayoutGrid size={12} /> Shape Tool</div>}
                  <button onClick={() => { setIsDrawingText(false); setIsDrawingLine(false); setIsDrawingBarcode(false); setIsDrawingShape(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                     <X size={14} />
                  </button>
                </div>
             )}
          </div>

          {/* Section: Render Engine Controls */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 bg-slate-800/30 rounded-xl p-1 border border-white/5">
                <button onClick={() => canvasRef.current?.handleZoomOut()} className="p-1.5 text-slate-500 hover:text-white transition-colors"><ZoomOut size={16} /></button>
                <div className="w-11 text-center text-[10px] font-black text-slate-400 tracking-tighter">{zoom}%</div>
                <button onClick={() => canvasRef.current?.handleZoomIn()} className="p-1.5 text-slate-500 hover:text-white transition-colors"><ZoomIn size={16} /></button>
                <button onClick={() => canvasRef.current?.handleZoomReset()} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"><RefreshCw size={12} /></button>
            </div>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${showGrid ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-slate-800/40 text-slate-500 border-white/5"}`}
              title="Toggle Grid"
            >
              <Grid size={18} />
            </button>

            <div className="h-6 w-px bg-white/5 mx-1" />

            <div className="flex items-center gap-2">
              <button onClick={() => handleSave()} className="btn btn-primary h-9 px-4 text-[10px] uppercase tracking-widest font-black gap-2">
                <Save size={14} /> Save
              </button>
              {label?.status === 'draft' && (
                <button onClick={() => handleSave('published')} className="btn bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-4 text-[10px] uppercase tracking-widest font-black gap-2">
                  <Check size={14} /> Publish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Studio Workspace Interior ─── */}
        <div className="flex-1 relative overflow-hidden group/workspace">
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
            onInteraction={() => setIsPropertiesExpanded(false)}
            onElementSelected={() => setIsPropertiesExpanded(true)}
          />
          
          {/* AIChatbot positioned floating in studio */}
          <div className="absolute left-6 bottom-6 z-20">
            <AIChatbot labelId={label?.id} />
          </div>
        </div>
      </div>

      {/* ─── Inspector Sheet (Properties) ─── */}
      <div
        className={`fixed top-[72px] bottom-4 right-4 z-40 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl overflow-hidden border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] ${isPropertiesExpanded ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[calc(100%+20px)] opacity-0 scale-95'}`}
        style={{ width: "340px", backgroundColor: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
          className="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-24 bg-slate-900/80 border border-white/5 border-r-0 rounded-l-2xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-[-10px_0_20px_rgba(0,0,0,0.2)] group"
        >
          <div className={`transition-transform duration-700 ${isPropertiesExpanded ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }}>
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
        </button>

        <div className="h-full flex flex-col">
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette size={14} className="text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inspector</h3>
                </div>
                {selectedElementId && (
                   <span className="text-[9px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded-lg bg-white/5">Layer Active</span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <PropertiesPanel
                    selectedElement={selectedElement}
                    updateElement={updateElement}
                    deleteElement={deleteElement}
                    onBarcodeTypeChange={handleBarcodeTypeChange}
                    isDrawingLine={isDrawingLine}
                    isDrawingBarcode={isDrawingBarcode}
                    isDrawingShape={isDrawingShape}
                    onActivateBarcodeDrawing={activateBarcodeDrawing}
                    onActivateShapeDrawing={activateShapeDrawing}
                    selectedBarcodeType={selectedBarcodeType}
                    setSelectedBarcodeType={setSelectedBarcodeType}
                    onBringForward={handleBringForward}
                    onSendBackward={handleSendBackward}
                    labelSize={labelSize}
                    updateLabelSize={setLabelSize}
                />
            </div>
        </div>
      </div>

      <BindingTypeModal
        isOpen={pendingBindingElement !== null}
        onSave={handleBindingTypeSave}
        onClose={() => { setElements(prev => prev.filter(el => el.id !== pendingBindingElement?.id)); setPendingBindingElement(null); }}
      />

      <style jsx="true">{`
        .glass {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .badge-studio {
          @apply flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all;
        }
        .btn-primary {
          @apply bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all active:scale-95;
        }
      `}</style>
    </div>
  );
};

export default LabelDesigner;
