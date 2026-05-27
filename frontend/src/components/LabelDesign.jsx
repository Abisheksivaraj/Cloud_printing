import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Save, Minus, X, Grid, ZoomIn, ZoomOut,
  RefreshCw, Search, Plus, Trash2, LayoutGrid, Check,
  ChevronRight, FileText, Settings, History, Layers,
  Monitor, Info, Palette, Image as ImageIcon, Table,
  Moon, LogOut, File, FolderOpen, Printer, Scissors, Copy, Clipboard, Undo, Redo, Type, Barcode, Square,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Lock, Unlock, Hash, MousePointer2, Bold, Italic, Underline, Strikethrough,
  Tag, CornerUpLeft, CornerUpRight, Upload, CheckCircle, AlertCircle, Loader
} from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import ToolsPalette from "./designer/ToolsPalette";
import PropertiesPanel from "./designer/PropertiesPanel";

// Custom Alignment Icons
const AlignCanvasLeftIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="2" x2="4" y2="22"></line><rect x="8" y="6" width="12" height="12" rx="2"></rect></svg>;
const AlignCanvasCenterHIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>;
const AlignCanvasRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="20" y1="2" x2="20" y2="22"></line><rect x="4" y="6" width="12" height="12" rx="2"></rect></svg>;
const AlignCanvasTopIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="4" x2="22" y2="4"></line><rect x="6" y="8" width="12" height="12" rx="2"></rect></svg>;
const AlignCanvasCenterVIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"></line><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>;
const AlignCanvasBottomIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="20" x2="22" y2="20"></line><rect x="6" y="4" width="12" height="12" rx="2"></rect></svg>;
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
  const [pendingImageProps, setPendingImageProps] = useState(null);

  // Serial Number State
  const [showSerialMenu, setShowSerialMenu] = useState(false);
  const [serialStart, setSerialStart] = useState("1");
  const [serialEnd, setSerialEnd] = useState("100");
  const [serialDigits, setSerialDigits] = useState("3");
  const [serialType, setSerialType] = useState("text");

  const getInitialDimensions = (l) => {
    if (l?.labelSize) return l.labelSize;
    if (l?.dimensions) return l.dimensions;
    if (l?.width && l?.height) return { width: l.width, height: l.height, unit: l.unit || 'mm' };
    return { width: 100, height: 150, unit: 'mm' };
  };

  const [elements, setElements] = useState(label?.elements || []);
  const [deletedElementIds, setDeletedElementIds] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [labelSize, setLabelSize] = useState(getInitialDimensions(label));
  const [showGrid, setShowGrid] = useState(true);
  const [selectedBarcodeType, setSelectedBarcodeType] = useState(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDrawingBarcode, setIsDrawingBarcode] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [isDrawingText, setIsDrawingText] = useState(false);
  const [isDrawingImage, setIsDrawingImage] = useState(false);
  const [isDrawingTable, setIsDrawingTable] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [zoom, setZoom] = useState(150);
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(true); // Default open for professional feel
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showBarcodeMenu, setShowBarcodeMenu] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null); // null | 'success' | 'error'

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
        
        // Check for local unsaved changes
        const localData = localStorage.getItem(`unsaved_design_${designId}`);
        if (localData) {
          try {
            const { elements: savedElements, deletedIds: savedDeletedIds, timestamp } = JSON.parse(localData);
            // Only restore if the local data is newer or user wants it (simplified: always restore if exists)
            console.log(`Restoring unsaved changes from ${new Date(timestamp).toLocaleString()}`);
            setElements(savedElements);
            setDeletedElementIds(savedDeletedIds || []);
          } catch (e) {
            console.error("Local restore failed:", e);
            const repairedElements = (normalized.elements || []).filter(el => !el.isSystem && !el.id?.startsWith('border-'));
            setElements(repairedElements);
          }
        } else {
          const repairedElements = (normalized.elements || []).filter(el => !el.isSystem && !el.id?.startsWith('border-'));
          setElements(repairedElements);
        }
        
        setLabelSize(normalized.labelSize);

        // Apply size-specific initial zoom
        if (normalized.labelSize?.width === 100 && normalized.labelSize?.height === 150) {
          setZoom(100);
        } else {
          setZoom(150);
        }
      } catch (error) { console.error("Fetch failure:", error); }
      setSelectedElementId(null);
    };
    syncAndFetch();
  }, [label?.id]);

  // Autosave to localStorage
  useEffect(() => {
    const designId = label?.design_id || label?.id;
    if (!designId || elements.length === 0) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(`unsaved_design_${designId}`, JSON.stringify({
        elements,
        deletedIds: deletedElementIds,
        timestamp: Date.now()
      }));
    }, 1000); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [elements, deletedElementIds, label?.id]);

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
    setIsDrawingImage(false);
    setIsDrawingTable(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(true);
    setShowBarcodeMenu(false); // Close dropdown
  };

  const activateShapeDrawing = (shapeType) => {
    setIsDrawingShape(true);
    setIsDrawingText(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setIsDrawingImage(false);
    setIsDrawingTable(false);
    setCurrentShapeType(shapeType);
    setSelectedElementId(null);
    setIsPropertiesExpanded(true);
    setShowShapeMenu(false); // Close dropdown
  };

  const activateImageDrawing = () => {
    setIsDrawingImage(true);
    setIsDrawingText(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setIsDrawingShape(false);
    setIsDrawingTable(false);
    setSelectedElementId(null);
  };

  const activateTableDrawing = () => {
    setIsDrawingTable(true);
    setIsDrawingText(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setIsDrawingShape(false);
    setIsDrawingImage(false);
    setSelectedElementId(null);
  };

  const handleSave = async (status = null) => {
    if (userRole === 'viewer') return;
    const designId = label.design_id || label.id;
    if (!designId) return;

    try {
      // 1. Sync deletions
      if (deletedElementIds.length > 0) {
        // We use a separate loop and try/catch so one missing element doesn't break the entire save
        for (const id of deletedElementIds) {
          try {
            // Skip local-only IDs just in case they slipped in
            if (String(id).startsWith('element_')) continue;

            await callEdgeFunction(API_URLS.DELETE_ELEMENT, { 
              element_id: id, 
              design_id: designId, 
              version_major: label.version_major || 0, 
              version_minor: label.version_minor || 1 
            });
          } catch (delError) {
            // If the element is already gone (404/Element not found), ignore the error
            if (delError.message?.includes("not found") || delError.status === 404) {
              console.warn(`Element ${id} already deleted from server.`);
              continue;
            }
            // Propagate other more serious errors
            throw delError;
          }
        }
      }

      // 2. Sync Additions and Updates
      const syncTasks = elements.map(async (el) => {
        const payload = mapElementToPayload(el);
        if (String(el.id).startsWith('element_')) {
          // New element
          console.log(`➕ Adding new element: ${el.type} (${el.id})`);
          return await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
        } else {
          try {
            // Existing element
            payload.element_id = el.id;
            console.log(`🔄 Updating element: ${el.type} (${el.id})`, { 
              payload_keys: Object.keys(payload),
              static_content_length: payload.static_content?.length,
              properties_keys: Object.keys(payload.properties || {})
            });
            return await callEdgeFunction(API_URLS.UPDATE_ELEMENT, payload);
          } catch (updError) {
            console.error(`❌ Failed to update element ${el.id} (${el.type}):`, updError.message);
            // If the element is missing from the DB, fallback to Adding it
            if (updError.message?.includes("not found") || updError.status === 404) {
              console.warn(`Element ${el.id} missing from server. Attempting to re-add.`);
              // Remove the fixed element_id so a new one is generated
              delete payload.element_id;
              return await callEdgeFunction(API_URLS.ADD_ELEMENT, payload);
            }
            throw updError;
          }
        }
      });

      const results = await Promise.all(syncTasks);

      // 3. Clear local storage for this design
      localStorage.removeItem(`unsaved_design_${designId}`);
      setDeletedElementIds([]);

      // 4. Update the parent/metadata
      if (onSave) {
        await onSave({ 
          elements, 
          labelSize, 
          status: status || label?.status 
        });
      }
    } catch (error) {
      console.error("Bulk save failure:", error);
      // We could show a specific error toast here too
      throw error;
    }
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    const designId = label?.design_id || label?.id;
    if (!designId) return;

    setIsPublishing(true);
    setPublishStatus(null);
    try {
      // First save current state
      await handleSave();
      // Then publish
      await callEdgeFunction(API_URLS.PUBLISH_DESIGN, { design_id: designId });
      setPublishStatus('success');
    } catch (error) {
      console.error('Publish failed:', error);
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
      setTimeout(() => setPublishStatus(null), 3000);
    }
  };

  const mapElementToPayload = (el) => {
    const designId = label.design_id || label.id;
    let content = el.content || "";
    if (el.type === "image") content = el.src || "";
    if (!content && ["line", "rectangle", "circle", "shape"].includes(el.type)) content = el.type.toUpperCase();
    const currentUnit = labelSize.unit || 'mm';

    // Sanitize: ensure numeric value or fallback to 0
    const safeConvert = (val, unit) => {
      const result = convertFromPx(val, unit);
      return (result !== undefined && result !== null && !isNaN(result)) ? result : 0;
    };

    // Strip large/non-serializable fields from the properties JSON
    const { src, tableData, ...cleanEl } = el;
    const properties = {
      ...cleanEl,
      x: safeConvert(el.x, currentUnit),
      y: safeConvert(el.y, currentUnit),
      width: safeConvert(el.width, currentUnit),
      height: safeConvert(el.height, currentUnit),
      fontSize: el.fontSize ? safeConvert(el.fontSize, currentUnit) : undefined,
      borderWidth: el.borderWidth !== undefined ? safeConvert(el.borderWidth, currentUnit) : undefined,
      borderRadius: el.borderRadius !== undefined ? safeConvert(el.borderRadius, currentUnit) : undefined,
      letterSpacing: el.letterSpacing !== undefined ? safeConvert(el.letterSpacing, currentUnit) : undefined,
    };
    if (el.x1 !== undefined) properties.x1 = safeConvert(el.x1, currentUnit);
    if (el.y1 !== undefined) properties.y1 = safeConvert(el.y1, currentUnit);
    if (el.x2 !== undefined) properties.x2 = safeConvert(el.x2, currentUnit);
    if (el.y2 !== undefined) properties.y2 = safeConvert(el.y2, currentUnit);

    // For table elements, store tableData compactly in properties
    if (el.type === "table" && tableData) {
      properties.tableData = tableData;
    }

    properties.actualType = el.type; // Always save actual type

    const ALLOWED_TYPES = ["text", "qr", "barcode", "rectangle", "image", "line", "circle"];
    let safeBackendType = el.type;
    if (!ALLOWED_TYPES.includes(safeBackendType)) {
      if (safeBackendType === 'placeholder') safeBackendType = 'text';
      else safeBackendType = 'rectangle';
    }

    const finalBindingType = (function(bt) {
      if (!bt) return 'static';
      bt = String(bt).toLowerCase().trim();
      if (['dynamic', 'placeholder'].includes(bt)) return 'input';
      if (bt === 'computational') return 'computed';
      return ['static', 'input', 'computed'].includes(bt) ? bt : 'static';
    })(el.binding_type);

    const derivedBindingKey = el.binding_key || el.content || `field_${el.id}`;

    const payload = {
      design_id: designId,
      version_major: label.version_major || 0,
      version_minor: label.version_minor || 1,
      element_type: safeBackendType,
      position_x: safeConvert(el.x, currentUnit),
      position_y: safeConvert(el.y, currentUnit),
      width: safeConvert(el.width, currentUnit),
      height: safeConvert(el.height, currentUnit),
      binding_type: finalBindingType,
      binding_key: derivedBindingKey,
      static_content: content || " ",
      properties: {
        ...properties,
        binding_key: derivedBindingKey
      },
      sort_order: el.zIndex || 0
    };

    // Debug: log payload size to catch oversized requests
    const payloadSize = new Blob([JSON.stringify(payload)]).size;
    if (payloadSize > 1_000_000) {
      console.warn(`⚠️ Large payload for element ${el.id} (${el.type}): ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);
    }

    return payload;
  };

  const handleZoomChange = useCallback((newZoom) => setZoom(newZoom), []);

  const addElement = async (type, extra = {}) => {
    if (type === "image") { 
      setPendingImageProps(extra);
      imageInputRef.current?.click(); 
      return; 
    }
    let newElement = {
      id: generateId(), type, x: extra.x || 38, y: extra.y || 38, width: extra.width || 151, height: extra.height || 76, zIndex: elements.length, rotation: 0, ...extra
    };
    if (type === "table") {
      const rows = extra.rows || 2, cols = extra.cols || 2;
      const width = extra.width || (cols * 60);
      const height = extra.height || (rows * 25);
      newElement = { 
        ...newElement, 
        rows, cols, 
        width, height,
        cellWidth: width / cols, 
        cellHeight: height / rows, 
        tableData: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")), 
        borderColor: "#000000", borderWidth: 1, borderStyle: "solid", fontSize: 11 
      };
    } else if (type === "rectangle" || type === "circle") {
      newElement = { ...newElement, borderWidth: 2, borderColor: "#000000", borderStyle: "solid", backgroundColor: "transparent" };
    } else if (type === "text" || type === "barcode") {
      const bType = extra.barcodeType || "CODE128";
      const isGs1 = ["DATAMATRIX", "PDF417", "DATABAR"].includes(bType);
      const defaultContentMap = { EAN13: "5901234123457", EAN8: "96385074", UPCA: "012345678905" };
      const defaultContent = isGs1 ? "(01)01234567890128" : (defaultContentMap[bType] || "123456789");
      
      newElement = { ...newElement, width: extra.width || (type === "text" ? 151 : 227), height: extra.height || (type === "text" ? 30 : 95), content: extra.content || (type === "text" ? "Sample Text" : defaultContent), barcodeType: type === "barcode" ? bType : undefined, fontSize: extra.fontSize || 14, fontFamily: extra.fontFamily || "Arial" };
      if (type === "text" && !extra.width) { const dims = measureText(newElement.content, newElement); newElement.width = dims.width; newElement.height = dims.height; }
    } else if (type === "line" && Object.keys(extra).length === 0) { setIsDrawingLine(true); return; }
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    // Only show binding type modal for text and barcode — not shapes, lines, tables
    const noBindingTypes = ['line', 'rectangle', 'circle', 'rounded', 'dot', 'table',
      'triangle', 'rightTriangle', 'parallelogram', 'trapezoid', 'diamond', 'cross',
      'heart', 'moon', 'arrowRight', 'arrowLeft', 'arrowUp', 'arrowDown',
      'doubleH', 'doubleV', 'diagUpRight', 'diagUpLeft', 'diagDownRight', 'diagDownLeft',
      'blockArrowRight', 'blockArrowLeft', 'blockArrowUp', 'blockArrowDown',
      'blockArrowLeftRight', 'blockArrowUpDown', 'arc', 'doubleArc', 'waveBanner',
      'pentagon', 'hexagon', 'octagon', 'star4', 'star5', 'star6', 'star8'];
    if (!noBindingTypes.includes(type) && !extra.binding_type) {
      setPendingBindingElement(newElement);
    }
  };

  const handleBindingTypeSave = async (bindingType) => {
    if (!pendingBindingElement) return;
    const updatedElement = { ...pendingBindingElement, binding_type: bindingType };
    setElements((prev) => prev.map(el => el.id === pendingBindingElement.id ? updatedElement : el));
    setPendingBindingElement(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const defaultW = Math.min(200, img.width);
        const defaultH = Math.round(defaultW * (img.height / img.width));
        
        const props = pendingImageProps || {};
        const width = props.width || (defaultW * MM_TO_PX);
        const height = props.height || (defaultH * MM_TO_PX);
        const x = props.x !== undefined ? props.x : 189;
        const y = props.y !== undefined ? props.y : 189;

        const element = { 
          id: generateId(), 
          type: "image", 
          x, y, 
          width, height, 
          src: ev.target.result, 
          opacity: 1, 
          lockAspectRatio: true, 
          rotation: 0, 
          zIndex: elements.length 
        };
        setElements((prev) => [...prev, element]); 
        setSelectedElementId(element.id); 
        setPendingBindingElement(element);
        setPendingImageProps(null);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleAddPlaceholder = async (placeholderName) => {
    const tempId = generateId();
    const defaults = { id: tempId, type: "placeholder", content: placeholderName, fontSize: 14, fontFamily: "Arial", rotation: 0, zIndex: elements.length };
    const dims = measureText(placeholderName, defaults);
    const element = { ...defaults, x: 38, y: 38, width: dims.width, height: dims.height, binding_type: "input" };
    setElements((prev) => [...prev, element]); setSelectedElementId(tempId);
  };

  const updateElementLocal = (id, updates) => {
    const el = elements.find(el => el.id === id); if (!el) return;
    const updated = { ...el, ...updates };
    setElements((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const handleAlign = (alignment) => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el) return;
    
    const currentUnit = labelSize.unit || 'mm';
    const canvasWidthPx = convertToPx(labelSize.width, currentUnit);
    const canvasHeightPx = convertToPx(labelSize.height, currentUnit);
    
    let updates = {};
    if (alignment === 'left') updates.x = 0;
    else if (alignment === 'center-h') updates.x = (canvasWidthPx - el.width) / 2;
    else if (alignment === 'right') updates.x = canvasWidthPx - el.width;
    else if (alignment === 'top') updates.y = 0;
    else if (alignment === 'center-v') updates.y = (canvasHeightPx - el.height) / 2;
    else if (alignment === 'bottom') updates.y = canvasHeightPx - el.height;
    
    updateElement(selectedElementId, updates);
  };

  const handleInsertSerial = () => {
    setShowSerialMenu(false);
    const placeholder = `<<${String(serialStart).padStart(parseInt(serialDigits) || 1, '0')}..${serialEnd}>>`;
    addElement(serialType, { 
      content: placeholder, 
      binding_type: 'computed', 
      isSerial: true, 
      serialStart, 
      serialEnd, 
      serialDigits 
    });
  };


  const updateElement = async (id, updates, shouldSync = true) => {
    const target = elements.find(e => e.id === id);
    if (target && (target.type === 'text' || target.type === 'placeholder')) {
      const combined = { ...target, ...updates };
      const dims = measureText(combined.content || target.content, combined);
      updates.width = dims.width; updates.height = dims.height;
    }
    updateElementLocal(id, updates);
    // Note: shouldSync is ignored now as everything is local-first
  };

  const deleteElement = async () => {
    if (selectedElementId) {
      const idToDelete = selectedElementId;
      // Track real (DB) IDs for deletion on save
      if (!String(idToDelete).startsWith('element_')) {
        setDeletedElementIds(prev => [...prev, idToDelete]);
      }
      setElements((prev) => prev.filter((el) => el.id !== idToDelete));
      setSelectedElementId(null);
    }
  };

  const activateLineDrawing = () => {
    setIsDrawingLine(true);
    setIsDrawingText(false);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setIsDrawingImage(false);
    setIsDrawingTable(false);
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
    <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-800">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ─── 1. TOP HEADER (BRAND & USER) ─── */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => onBack && onBack()} className="text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shadow-md">
              <Tag size={16} className="fill-white" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-black tracking-tight text-slate-800">Perfect Labeler</span>
              </div>
              <div className="bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider w-max">
                PRO EDITION
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-slate-600">
            <Moon size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">Abishek Sivaraj</div>
              <div className="text-[9px] font-bold text-blue-500 tracking-wider">SUPERADMIN</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-sm">
              A
            </div>
            <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="flex items-center gap-1.5 ml-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-colors">
              <LogOut size={12} /> LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. MENU BAR ─── */}
      <div className="flex items-center px-4 h-8 bg-white border-b border-slate-200 shrink-0 text-xs font-medium text-slate-700">
        {["File", "Edit", "View", "Create", "Arrange", "Help"].map(item => (
          <button key={item} className="px-3 hover:bg-slate-100 h-full transition-colors">{item}</button>
        ))}
      </div>

      {/* ─── 3. STANDARD TOOLBAR ─── */}
      <div className="flex items-center px-2 h-12 bg-white border-b border-slate-200 shrink-0 gap-1 z-50 justify-between">
        {/* Document Actions */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200">
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="New"><File size={16} /></button>
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Open"><FolderOpen size={16} /></button>
          <button onClick={() => handleSave()} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Save"><Save size={16} /></button>
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Print"><Printer size={16} /></button>
        </div>
        
        {/* Clipboard */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200">
          <button className="p-1.5 text-slate-300 rounded" title="Cut"><Scissors size={16} /></button>
          <button className="p-1.5 text-slate-300 rounded" title="Copy"><Copy size={16} /></button>
          <button className="p-1.5 text-slate-300 rounded" title="Paste"><Clipboard size={16} /></button>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200">
          <button onClick={() => canvasRef.current?.handleUndo?.()} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Undo"><CornerUpLeft size={16} /></button>
          <button onClick={() => canvasRef.current?.handleRedo?.()} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Redo"><CornerUpRight size={16} /></button>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1 px-2">
          <button onClick={() => { setIsDrawingText(false); setIsDrawingLine(false); setIsDrawingBarcode(false); setIsDrawingShape(false); setIsDrawingImage(false); setIsDrawingTable(false); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${!(isDrawingText || isDrawingLine || isDrawingBarcode || isDrawingShape || isDrawingImage || isDrawingTable) ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
            <MousePointer2 size={14} className={!(isDrawingText || isDrawingLine || isDrawingBarcode || isDrawingShape || isDrawingImage || isDrawingTable) ? "fill-blue-600" : ""} /> Select
          </button>
          
          <button onClick={activateTextDrawing} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${isDrawingText ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Type size={14} /> Text
          </button>
          
          <div className="relative group" onMouseEnter={() => setShowBarcodeMenu(true)} onMouseLeave={() => setShowBarcodeMenu(false)}>
            <button onClick={() => activateBarcodeDrawing("CODE128")} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${isDrawingBarcode ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Barcode size={14} /> Barcode <ChevronRight size={10} className="rotate-90 opacity-50" />
            </button>
            <div className={`absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl transition-all z-50 ${showBarcodeMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="text-[9px] font-bold text-slate-400 uppercase px-3 py-2 border-b border-slate-100">Select Barcode Symbology</div>
                <div className="max-h-64 overflow-y-auto">
                    {[
                      { label: "Code 128", value: "CODE128" },
                      { label: "Code 39", value: "CODE39" },
                      { label: "EAN-13", value: "EAN13" },
                      { label: "EAN-8", value: "EAN8" },
                      { label: "UPC-A", value: "UPCA" },
                      { label: "QR Code", value: "QR" },
                      { label: "Data Matrix", value: "DATAMATRIX" },
                      { label: "PDF417", value: "PDF417" },
                      { label: "Aztec Code", value: "AZTEC" },
                    ].map(b => (
                        <button key={b.value} onClick={() => activateBarcodeDrawing(b.value)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600">
                            <div className="font-bold">{b.label}</div>
                            <div className="text-[9px] text-slate-400 font-normal">Standard format</div>
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <button onClick={activateLineDrawing} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${isDrawingLine ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Minus size={14} /> Line
          </button>

          <div className="relative group" onMouseEnter={() => setShowShapeMenu(true)} onMouseLeave={() => setShowShapeMenu(false)}>
            <button onClick={() => activateShapeDrawing("rectangle")} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${isDrawingShape ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Square size={14} /> Shape <ChevronRight size={10} className="rotate-90 opacity-50" />
            </button>
             <div className={`absolute top-full left-0 mt-1 w-96 p-3 bg-white border border-slate-200 rounded-xl shadow-xl transition-all z-50 ${showShapeMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                 <div className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center justify-between">
                    <span>Shapes Palette</span>
                 </div>
                 
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                     {/* Rectangles */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Rectangles</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("rectangle")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1"><div className="w-6 h-5 border-[1.5px] border-slate-600"></div><span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Rectangle</span></button>
                             <button onClick={() => activateShapeDrawing("rounded")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1"><div className="w-6 h-5 border-[1.5px] border-slate-600 rounded"></div><span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Rounded</span></button>
                             <button onClick={() => activateShapeDrawing("circle")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1"><div className="w-5 h-5 border-[1.5px] border-slate-600 rounded-full"></div><span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Circle/Ell...</span></button>
                             <button onClick={() => activateShapeDrawing("dot")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1"><div className="w-2.5 h-2.5 bg-slate-600 rounded-full"></div><span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Dot</span></button>
                         </div>
                     </div>
                     
                     {/* Basic Shapes */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Basic Shapes</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("triangle")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L22 18H2L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Triangle</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("rightTriangle")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2V18H20L4 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Right Tri...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("parallelogram")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4H22L18 16H2L6 4Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Parallelo...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("trapezoid")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4H18L22 16H2L6 4Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Trapezoid</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("diamond")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L20 10L12 18L4 10L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Diamond</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("cross")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Cross</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("heart")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 18C12 18 3 12 3 6.5C3 3.5 5.5 2 8 2C10 2 11.5 3.5 12 5C12.5 3.5 14 2 16 2C18.5 2 21 3.5 21 6.5C21 12 12 18 12 18Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Heart</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("moon")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3C9 3 5 7 5 12C5 17 9 21 14 21C14 21 9.5 17 9.5 12C9.5 7 14 3 14 3Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Moon</span>
                             </button>
                         </div>
                     </div>

                     {/* Arrows */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Arrows</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("arrowRight")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10H20M20 10L14 4M20 10L14 16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow Ri...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("arrowLeft")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10H4M4 10L10 4M4 10L10 16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow Left</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("arrowUp")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 18V2M12 2L6 8M12 2L18 8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow Up</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("arrowDown")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V18M12 18L6 12M12 18L18 12" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow D...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("doubleH")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10H20M20 10L16 6M20 10L16 14M4 10L8 6M4 10L8 14" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Double H</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("doubleV")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V16M12 16L8 12M12 16L16 12M12 4L8 8M12 4L16 8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Double V</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("diagUpRight")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 14L16 4M16 4H10M16 4V10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Diag Up...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("diagUpLeft")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 14L8 4M8 4H14M8 4V10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Diag Up...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("diagDownRight")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L16 16M16 16H10M16 16V10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Diag Dn...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("diagDownLeft")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L8 16M8 16H14M8 16V10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Diag Dn...</span>
                             </button>
                         </div>
                     </div>

                     {/* Block Arrows */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Block Arrows</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("blockArrowRight")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8H14V4L22 10L14 16V12H4V8Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow Ri...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("blockArrowLeft")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 8H10V4L2 10L10 16V12H20V8Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow Left</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("blockArrowUp")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 18V10H4L12 2L20 10H16V18H8Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow Up</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("blockArrowDown")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2V10H4L12 18L20 10H16V2H8Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arrow D...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("blockArrowLeftRight")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8H17V5L23 10L17 15V12H7V15L1 10L7 5V8Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Left-Right</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("blockArrowUpDown")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 7V13H7L12 19L17 13H14V7H17L12 1L7 7H10Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Up-Down</span>
                             </button>
                         </div>
                     </div>

                     {/* Arcs */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Arcs</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("arc")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 16C4 10 8 6 12 6C16 6 20 10 20 16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Arc</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("doubleArc")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 16C4 10 8 6 12 6C16 6 20 10 20 16M6 16C6 11.5 9 8.5 12 8.5C15 8.5 18 11.5 18 16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Double ...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("waveBanner")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6C7 6 7 2 11 2C15 2 15 6 19 6V16C15 16 15 12 11 12C7 12 7 16 3 16V6Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Wave Ba...</span>
                             </button>
                         </div>
                     </div>

                     {/* Regular Polygons */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Regular Polygons</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("pentagon")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L20 8L17 17H7L4 8L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Pentagon</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("hexagon")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L19 6V14L12 18L5 14V6L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Hexagon</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("octagon")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3H16L21 8V16L16 21H8L3 16V8L8 3Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">Octagon</span>
                             </button>
                         </div>
                     </div>

                     {/* Stars and Banners */}
                     <div>
                         <div className="text-[10px] font-bold text-slate-600 mb-2">Stars and Banners</div>
                         <div className="grid grid-cols-5 gap-2">
                             <button onClick={() => activateShapeDrawing("star4")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14 9L21 11L14 13L12 20L10 13L3 11L10 9L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">4-Point ...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("star5")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 9H22L16 13.5L18 20.5L12 16L6 20.5L8 13.5L2 9H9.5L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">5-Point ...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("star6")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 7L20 8L16.5 12L17.5 17L12 15L6.5 17L7.5 12L4 8L9.5 7L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">6-Point ...</span>
                             </button>
                             <button onClick={() => activateShapeDrawing("star8")} className="aspect-square flex flex-col items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded gap-1">
                                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14 7L19 5L17 10L22 12L17 14L19 19L14 17L12 22L10 17L5 19L7 14L2 12L7 10L5 5L10 7L12 2Z" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span className="text-[7px] font-medium text-slate-500 truncate w-full text-center">8-Point ...</span>
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
          </div>

          <button onClick={activateTableDrawing} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${isDrawingTable ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Table size={14} /> Table
          </button>
          
          <button onClick={activateImageDrawing} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${isDrawingImage ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
            <ImageIcon size={14} /> Image
          </button>

          <div className="relative group" onMouseEnter={() => setShowSerialMenu(true)} onMouseLeave={() => setShowSerialMenu(false)}>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              <Hash size={14} /> Serial <ChevronRight size={10} className="rotate-90 opacity-50" />
            </button>
            <div className={`absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl transition-all z-50 p-4 ${showSerialMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Hash size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Running Number</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-4 leading-snug">Creates an element with an auto-incrementing placeholder for batch printing.</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Start</label>
                    <input type="number" value={serialStart} onChange={e => setSerialStart(e.target.value)} className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:border-blue-400 outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">End</label>
                    <input type="number" value={serialEnd} onChange={e => setSerialEnd(e.target.value)} className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:border-blue-400 outline-none" />
                  </div>
                  <div className="w-16">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Digits</label>
                    <input type="number" value={serialDigits} onChange={e => setSerialDigits(e.target.value)} className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:border-blue-400 outline-none" />
                  </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Element Type</label>
                    <select value={serialType} onChange={e => setSerialType(e.target.value)} className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:border-blue-400 outline-none">
                        <option value="text">Text</option>
                        <option value="barcode">Barcode</option>
                    </select>
                </div>
                <div className="text-[10px] text-blue-600 font-medium">
                  Preview: {String(serialStart).padStart(parseInt(serialDigits) || 1, '0')}, {String(parseInt(serialStart) + 1).padStart(parseInt(serialDigits) || 1, '0')}, ... {serialEnd}
                </div>
              </div>

              <button onClick={handleInsertSerial} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                + Insert Running Number
              </button>
            </div>
          </div>
        </div>

        {/* Save & Publish — right side of toolbar */}
        <div className="flex items-center gap-2 ml-auto pr-1">
          {/* Save Button */}
          <button
            id="toolbar-save-btn"
            onClick={() => handleSave()}
            disabled={userRole === 'viewer'}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            }}
            title="Save design"
          >
            <Save size={13} />
            SAVE
          </button>

          {/* Publish Button */}
          <button
            id="toolbar-publish-btn"
            onClick={handlePublish}
            disabled={isPublishing || userRole === 'viewer'}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
            style={{
              background: publishStatus === 'success'
                ? 'linear-gradient(135deg, #059669, #047857)'
                : publishStatus === 'error'
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              boxShadow: publishStatus === 'error'
                ? '0 2px 8px rgba(220,38,38,0.35)'
                : '0 2px 8px rgba(22,163,74,0.35)',
              opacity: isPublishing ? 0.85 : 1,
            }}
            title="Publish design"
          >
            {isPublishing ? (
              <><Loader size={13} className="animate-spin" /> Publishing...</>
            ) : publishStatus === 'success' ? (
              <><CheckCircle size={13} /> Published!</>
            ) : publishStatus === 'error' ? (
              <><AlertCircle size={13} /> Failed!</>
            ) : (
              <><Upload size={13} /> PUBLISH</>
            )}
          </button>
        </div>
      </div>

      {/* ─── 4. FORMAT TOOLBAR ─── */}
      <div className="flex items-center px-2 h-10 bg-slate-50 border-b border-slate-200 shrink-0 gap-3">
        <div className="flex items-center gap-2">
            <select className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none w-32 focus:border-blue-400">
                <option>Arial</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
            </select>
            <select className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none w-20 focus:border-blue-400">
                <option>14 pt</option>
                <option>12 pt</option>
                <option>10 pt</option>
                <option>8 pt</option>
            </select>
        </div>
        
        <div className="w-px h-5 bg-slate-300" />

        <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-serif font-bold">B</button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-serif italic">I</button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-serif underline">U</button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-serif line-through">S</button>
        </div>

        <div className="w-px h-5 bg-slate-300" />

        <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignLeft size={14} /></button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCenter size={14} /></button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignRight size={14} /></button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignJustify size={14} /></button>
        </div>

        <div className="w-px h-5 bg-slate-300" />

        <div className="flex items-center gap-1">
            <button onClick={() => handleAlign('left')} title="Align Left (Canvas)" className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCanvasLeftIcon /></button>
            <button onClick={() => handleAlign('center-h')} title="Align Center Horizontal (Canvas)" className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCanvasCenterHIcon /></button>
            <button onClick={() => handleAlign('right')} title="Align Right (Canvas)" className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCanvasRightIcon /></button>
            <button onClick={() => handleAlign('top')} title="Align Top (Canvas)" className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCanvasTopIcon /></button>
            <button onClick={() => handleAlign('center-v')} title="Align Middle Vertical (Canvas)" className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCanvasCenterVIcon /></button>
            <button onClick={() => handleAlign('bottom')} title="Align Bottom (Canvas)" className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded"><AlignCanvasBottomIcon /></button>
        </div>

        <div className="w-px h-5 bg-slate-300" />

        <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded" title="Palette"><Palette size={14} /></button>
            <button className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded" title="Settings"><Settings size={14} /></button>
        </div>
      </div>

      {/* ─── 5. WORKSPACE (Explorer, Canvas, Properties) ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Explorer Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 z-10">
            <div className="h-10 flex items-center justify-between px-3 border-b border-slate-200">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Explorer</span>
                <Plus size={14} className="text-slate-400" />
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="py-2">
                    <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Template Objects</div>
                    {elements.length === 0 ? (
                        <div className="m-3 p-4 border border-dashed border-slate-300 rounded text-center text-xs text-slate-400 bg-white">
                            No objects on canvas
                        </div>
                    ) : (
                        <div className="flex flex-col mt-1">
                            {[...elements].reverse().map(el => (
                                <div key={el.id} className={`flex items-center gap-2 px-4 py-1.5 text-xs cursor-pointer ${selectedElementId === el.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSelectedElementId(el.id)}>
                                    {el.type === 'text' && <Type size={12} className="opacity-50" />}
                                    {el.type === 'barcode' && <Barcode size={12} className="opacity-50" />}
                                    {el.type === 'image' && <ImageIcon size={12} className="opacity-50" />}
                                    {el.type === 'shape' && <Square size={12} className="opacity-50" />}
                                    {el.type === 'line' && <Minus size={12} className="opacity-50" />}
                                    {el.type === 'table' && <Table size={12} className="opacity-50" />}
                                    <span className="capitalize">{el.type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="py-2 border-t border-slate-200">
                    <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Templates Library</div>
                    <div className="m-3 text-center text-xs text-slate-400 italic">
                        No templates available
                    </div>
                </div>
            </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden group/workspace flex flex-col">
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
            isDrawingImage={isDrawingImage}
            setIsDrawingImage={setIsDrawingImage}
            isDrawingTable={isDrawingTable}
            setIsDrawingTable={setIsDrawingTable}
            currentShapeType={currentShapeType}
            isDrawingText={isDrawingText}
            setIsDrawingText={setIsDrawingText}
            generateId={generateId}
            selectedBarcodeType={selectedBarcodeType}
            updateElement={updateElementLocal}
            onAddElement={addElement}
            setSelectedBarcodeType={setSelectedBarcodeType}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onInteraction={() => {}}
            onElementSelected={() => {}}
          />

          {/* Chatbot and other overlays */}
          <div className="absolute right-4 bottom-4 z-20">
            <AIChatbot labelId={label?.id} />
          </div>
        </div>

        {/* ─── Inspector / Properties Panel (Always Visible) ─── */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 overflow-hidden">
            {/* Panel header */}
            <div className="h-10 flex items-center px-4 border-b border-slate-200 shrink-0 bg-slate-50/80 gap-2">
                <Settings size={12} className="text-slate-400" />
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex-1">
                  {selectedElement ? `${selectedElement.type} Settings` : 'Properties'}
                </span>
                {selectedElement && (
                  <span className="text-[9px] font-mono text-slate-300 select-none">
                    obj_{selectedElement.id?.slice(-4)}
                  </span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
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
    </div>
  );
};

export default LabelDesigner;
