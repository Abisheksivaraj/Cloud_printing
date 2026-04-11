import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import BarcodeElement from "../components/designer/code";
import { useTheme } from "../ThemeContext";
import { convertToPx, MM_TO_PX } from "../supabaseClient";
import { RotateCw } from "lucide-react";

const DesignCanvas = forwardRef(
  (
    {
      elements = [],
      setElements,
      selectedElementId,
      setSelectedElementId,
      labelSize = { width: 100, height: 80, unit: 'mm' },
      showGrid = true,
      isDrawingLine = false,
      setIsDrawingLine,
      isDrawingBarcode = false,
      setIsDrawingBarcode,
      isDrawingShape = false,
      setIsDrawingShape,
      isDrawingImage = false,
      setIsDrawingImage,
      isDrawingTable = false,
      setIsDrawingTable,
      currentShapeType,
      isDrawingText = false,
      setIsDrawingText,
      generateId,
      selectedBarcodeType,
      updateElement,
      setSelectedBarcodeType,
      zoom = 100,
      onZoomChange,
      onInteraction,
      onElementCreated,
      onElementSelected,
      onAddElement,
      onUpdateEnd,
    },
    ref,
  ) => {
    const { theme, isDarkMode } = useTheme();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [elementStart, setElementStart] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    const [draggedElement, setDraggedElement] = useState(null);
    const [lineDrawStart, setLineDrawStart] = useState(null);
    const [tempLine, setTempLine] = useState(null);
    const [barcodeDrawStart, setBarcodeDrawStart] = useState(null);
    const [tempBarcode, setTempBarcode] = useState(null);
    const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
    const [canvasBaseOffset] = useState({ x: 0, y: 0 });
    const [shapeDrawStart, setShapeDrawStart] = useState(null);
    const [tempShape, setTempShape] = useState(null);
    const [imageDrawStart, setImageDrawStart] = useState(null);
    const [tempImage, setTempImage] = useState(null);
    const [tableDrawStart, setTableDrawStart] = useState(null);
    const [tempTable, setTempTable] = useState(null);

    const [isDraggingLinePoint, setIsDraggingLinePoint] = useState(false);
    const [draggedLinePoint, setDraggedLinePoint] = useState(null);

    // ── Text drag-to-draw ────────────────────────────────────────────────
    const [textDrawStart, setTextDrawStart] = useState(null);
    const [tempText, setTempText] = useState(null);

    // ── Rotation ─────────────────────────────────────────────────────────
    const [isRotating, setIsRotating] = useState(false);
    const [rotationStart, setRotationStart] = useState(null);

    // ── Adaptive guidelines (while drawing lines) ────────────────────────
    const [lineMousePos, setLineMousePos] = useState(null); // { x, y } canvas coords

    // ── Inline text editing (PowerPoint-style) ──────────────────────────
    const [editingElementId, setEditingElementId] = useState(null);
    const [editingTextValue, setEditingTextValue] = useState("");
    const textareaRef = useRef(null);

    const [history, setHistory] = useState([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const RULER_SIZE = 32;

    const getCanvasPixelSize = () => {
      const width = labelSize?.width || 100;
      const height = labelSize?.height || 80;
      const unit = labelSize?.unit || 'mm';
      return {
        width: convertToPx(width, unit),
        height: convertToPx(height, unit),
      };
    };


    const displayZoom = zoom;
    const canvasPixelSize = getCanvasPixelSize();
    const displayWidth = canvasPixelSize.width * (displayZoom / 100);
    const displayHeight = canvasPixelSize.height * (displayZoom / 100);

    const saveToHistory = useCallback(
      (newElements) => {
        setHistory((prevHistory) => {
          const newHistory = prevHistory.slice(0, historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newElements)));
          return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
      },
      [historyIndex],
    );

    const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setElements(JSON.parse(JSON.stringify(history[newIndex])));
        setSelectedElementId(null);
      }
    }, [historyIndex, history, setElements, setSelectedElementId]);

    const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setElements(JSON.parse(JSON.stringify(history[newIndex])));
        setSelectedElementId(null);
      }
    }, [historyIndex, history, setElements, setSelectedElementId]);

    const handleDuplicate = useCallback(() => {
      if (!selectedElementId) return;

      const element = elements.find((el) => el.id === selectedElementId);
      if (!element) return;

      const extraProps = {
        ...element,
        x: Math.min(element.x + 10, canvasPixelSize.width - element.width),
        y: Math.min(element.y + 10, canvasPixelSize.height - element.height),
      };

      if (onAddElement) {
        onAddElement(element.type, extraProps);
      } else {
        const newElement = {
          ...extraProps,
          id: generateId(),
          zIndex: elements.length,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        setSelectedElementId(newElement.id);
        saveToHistory(newElements);
      }
    }, [
      selectedElementId,
      elements,
      generateId,
      canvasPixelSize.width,
      canvasPixelSize.height,
      setElements,
      setSelectedElementId,
      saveToHistory,
      onAddElement
    ]);

    const handleZoomIn = useCallback(() => {
      if (onZoomChange) {
        const newZoom = Math.min(zoom + 10, 400);
        onZoomChange(newZoom);
      }
    }, [zoom, onZoomChange]);

    const handleZoomOut = useCallback(() => {
      if (onZoomChange) {
        const newZoom = Math.max(zoom - 10, 10);
        onZoomChange(newZoom);
      }
    }, [zoom, onZoomChange]);

    const handleZoomReset = useCallback(() => {
      if (onZoomChange) {
        onZoomChange(100);
      }
    }, [onZoomChange]);

    const fitCanvasToScreen = useCallback(() => {
      if (!containerRef.current) {
        return;
      }

      if (!onZoomChange) {
        return;
      }

      requestAnimationFrame(() => {
        const margin = 48;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const availableWidth = containerWidth - RULER_SIZE - margin;
        const availableHeight = containerHeight - RULER_SIZE - margin;

        const canvasWidthPx = canvasPixelSize.width;
        const canvasHeightPx = canvasPixelSize.height;

        const zoomX = (availableWidth / canvasWidthPx) * 100;
        const zoomY = (availableHeight / canvasHeightPx) * 100;

        // If portrait (height > width), prioritize fitting to width for a "Big Label" scroll-down experience
        // specifically for the requested 100x150 or similar tall ratios
        const isPortrait = canvasHeightPx > canvasWidthPx;
        let fittedZoom = isPortrait ? zoomX : Math.min(zoomX, zoomY, 400);

        // Sanity check: don't let it be TOO big or too small
        const minZoom = 25;
        const maxZoom = 400;
        const finalZoom = Math.max(
          minZoom,
          Math.min(Math.floor(fittedZoom), maxZoom),
        );

        onZoomChange(finalZoom);
      });
    }, [canvasPixelSize.width, canvasPixelSize.height, onZoomChange]);

    const handleZoomToWidth = useCallback(() => {
      if (!containerRef.current || !onZoomChange) return;

      const margin = 48;
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = containerWidth - RULER_SIZE - margin;
      const canvasWidthPx = canvasPixelSize.width;

      const zoomLevel = Math.min((availableWidth / canvasWidthPx) * 100, 300);
      onZoomChange(Math.floor(zoomLevel));
    }, [canvasPixelSize.width, onZoomChange]);

    useEffect(() => {
      const timer = setTimeout(() => {
        fitCanvasToScreen();
      }, 200);

      return () => clearTimeout(timer);
    }, [labelSize.width, labelSize.height, fitCanvasToScreen]);

    useEffect(() => {
      const timer = setTimeout(() => {
        fitCanvasToScreen();
      }, 500);

      return () => clearTimeout(timer);
    }, [fitCanvasToScreen]);

    useEffect(() => {
      const handleResize = () => {
        fitCanvasToScreen();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [fitCanvasToScreen]);

    useEffect(() => {
      const handleScroll = () => {
        if (scrollContainerRef.current) {
          setScrollOffset({
            x: scrollContainerRef.current.scrollLeft,
            y: scrollContainerRef.current.scrollTop,
          });
        }
      };

      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", handleScroll);
        return () =>
          scrollContainer.removeEventListener("scroll", handleScroll);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      handleUndo,
      handleRedo,
      handleDuplicate,
      handleZoomIn,
      handleZoomOut,
      handleZoomReset,
      fitCanvasToScreen,
      handleZoomToWidth,
      containerRef,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      setDraggedElement,
    }));

    useEffect(() => {
      if (
        history.length === 1 &&
        history[0].length === 0 &&
        elements.length > 0
      ) {
        setHistory([elements]);
        setHistoryIndex(0);
      }
    }, [elements, history]);

    // Commit inline text edit
    const commitTextEdit = useCallback(() => {
      if (editingElementId) {
        updateElement(editingElementId, { content: editingTextValue });

        // Sync to backend
        if (onUpdateEnd) {
          const el = elements.find((e) => e.id === editingElementId);
          if (el) {
            onUpdateEnd(editingElementId, { ...el, content: editingTextValue });
          }
        }

        setEditingElementId(null);
        setEditingTextValue("");
      }
    }, [editingElementId, editingTextValue, updateElement, onUpdateEnd, elements]);

    // Double-click to enter inline text editing
    const handleTextDoubleClick = useCallback(
      (e, element) => {
        e.stopPropagation();
        if (isDrawingLine || isDrawingBarcode || isDrawingShape) return;
        if (!['text', 'placeholder'].includes(element.type)) return;
        setEditingElementId(element.id);
        setEditingTextValue(element.content || "");
        setIsDragging(false);
        // Focus textarea on next paint
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
          }
        }, 20);
      },
      [isDrawingLine, isDrawingBarcode, isDrawingShape],
    );

    const handleElementMouseDown = useCallback(
      (e, element) => {
        e.stopPropagation();

        // If editing another element, commit it first
        if (editingElementId && editingElementId !== element.id) {
          commitTextEdit();
        }

        if (isDrawingLine || isDrawingBarcode || isDrawingShape) {
          return;
        }

        // Don't start dragging while in text edit mode for this element
        if (editingElementId === element.id) return;

        // Skip selecting or dragging system/locked elements
        if (element.isSystem || element.locked) return;

        setSelectedElementId(element.id);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setElementStart({
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          x1: element.x1,
          y1: element.y1,
          x2: element.x2,
          y2: element.y2,
        });

        if (element.type === "barcode") {
          setSelectedBarcodeType(element.barcodeType || "CODE128");
        }

        // Auto-open properties panel when an element is selected
        if (onElementSelected) onElementSelected();
      },
      [
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        setSelectedElementId,
        setSelectedBarcodeType,
        editingElementId,
        commitTextEdit,
        onElementSelected,
      ],
    );

    const handleLinePointMouseDown = useCallback(
      (e, element, point) => {
        e.stopPropagation();

        if (isDrawingLine || isDrawingBarcode || isDrawingShape) {
          return;
        }

        setSelectedElementId(element.id);
        setIsDraggingLinePoint(true);
        setDraggedLinePoint(point);
        setDragStart({ x: e.clientX, y: e.clientY });
        setElementStart({
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          x1: element.x1,
          y1: element.y1,
          x2: element.x2,
          y2: element.y2,
        });
      },
      [isDrawingLine, isDrawingBarcode, isDrawingShape, setSelectedElementId],
    );

    const handleResizeMouseDown = useCallback(
      (e, element, handle) => {
        e.stopPropagation();

        if (isDrawingLine || isDrawingBarcode || isDrawingShape) {
          return;
        }

        setSelectedElementId(element.id);
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart({ x: e.clientX, y: e.clientY });
        setElementStart({
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        });
      },
      [isDrawingLine, isDrawingBarcode, isDrawingShape, setSelectedElementId],
    );

    // ── Rotation mouse down (called from rotation handle) ────────────────
    const handleRotateMouseDown = useCallback(
      (e, element) => {
        e.stopPropagation();
        e.preventDefault();
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const rect = canvasRef.current.getBoundingClientRect();
        const scale = displayZoom / 100;
        const mouseX = (e.clientX - rect.left) / scale;
        const mouseY = (e.clientY - rect.top) / scale;
        const startAngle = Math.atan2(mouseY - cy, mouseX - cx) * (180 / Math.PI);
        setIsRotating(true);
        setSelectedElementId(element.id);
        setRotationStart({
          cx,
          cy,
          startAngle,
          elementStartRotation: element.rotation || 0,
        });
      },
      [displayZoom, setSelectedElementId],
    );

    const handleMouseMove = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const scale = displayZoom / 100;
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;

        // ── Rotation ──────────────────────────────────────────────────────
        if (isRotating && selectedElementId && rotationStart) {
          const rect = canvasRef.current.getBoundingClientRect();
          const mouseX = (e.clientX - rect.left) / scale;
          const mouseY = (e.clientY - rect.top) / scale;
          const currentAngle =
            Math.atan2(mouseY - rotationStart.cy, mouseX - rotationStart.cx) * (180 / Math.PI);
          let newRotation = rotationStart.elementStartRotation + (currentAngle - rotationStart.startAngle);
          // Snap to 15° increments when Shift held
          if (e.shiftKey) newRotation = Math.round(newRotation / 15) * 15;
          updateElement(selectedElementId, { rotation: newRotation });
          return;
        }

        if (isDraggingLinePoint && selectedElementId && draggedLinePoint) {
          const element = elements.find((el) => el.id === selectedElementId);
          if (!element || element.type !== "line") return;

          let newX1 = elementStart.x1;
          let newY1 = elementStart.y1;
          let newX2 = elementStart.x2;
          let newY2 = elementStart.y2;

          if (draggedLinePoint === "start") {
            newX1 = Math.max(
              0,
              Math.min(elementStart.x1 + dx, canvasPixelSize.width),
            );
            newY1 = Math.max(
              0,
              Math.min(elementStart.y1 + dy, canvasPixelSize.height),
            );
          } else if (draggedLinePoint === "end") {
            newX2 = Math.max(
              0,
              Math.min(elementStart.x2 + dx, canvasPixelSize.width),
            );
            newY2 = Math.max(
              0,
              Math.min(elementStart.y2 + dy, canvasPixelSize.height),
            );
          }

          const minX = Math.min(newX1, newX2);
          const minY = Math.min(newY1, newY2);
          const maxX = Math.max(newX1, newX2);
          const maxY = Math.max(newY1, newY2);

          updateElement(selectedElementId, {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            x1: newX1,
            y1: newY1,
            x2: newX2,
            y2: newY2,
          });
        } else if (isDragging && selectedElementId) {
          const element = elements.find((el) => el.id === selectedElementId);
          if (!element) return;

          let newX = elementStart.x + dx;
          let newY = elementStart.y + dy;

          if (element.type === "line") {
            newX = Math.max(
              0,
              Math.min(newX, canvasPixelSize.width - element.width),
            );
            newY = Math.max(
              0,
              Math.min(newY, canvasPixelSize.height - element.height),
            );

            const deltaX = newX - element.x;
            const deltaY = newY - element.y;

            updateElement(selectedElementId, {
              x: newX,
              y: newY,
              x1: element.x1 + deltaX,
              y1: element.y1 + deltaY,
              x2: element.x2 + deltaX,
              y2: element.y2 + deltaY,
            });
          } else {
            newX = Math.max(
              0,
              Math.min(newX, canvasPixelSize.width - element.width),
            );
            newY = Math.max(
              0,
              Math.min(newY, canvasPixelSize.height - element.height),
            );
            updateElement(selectedElementId, { x: newX, y: newY });
          }
        } else if (isResizing && selectedElementId && resizeHandle) {
          const element = elements.find((el) => el.id === selectedElementId);
          if (!element) return;

          let updates = {};

          switch (resizeHandle) {
            case "se":
              updates = {
                width: Math.max(
                  20,
                  Math.min(
                    elementStart.width + dx,
                    canvasPixelSize.width - element.x,
                  ),
                ),
                height: Math.max(
                  20,
                  Math.min(
                    elementStart.height + dy,
                    canvasPixelSize.height - element.y,
                  ),
                ),
              };
              break;
            case "sw":
              updates = {
                x: Math.max(
                  0,
                  Math.min(
                    elementStart.x + dx,
                    elementStart.x + elementStart.width - 20,
                  ),
                ),
                width: Math.max(20, elementStart.width - dx),
                height: Math.max(
                  20,
                  Math.min(
                    elementStart.height + dy,
                    canvasPixelSize.height - element.y,
                  ),
                ),
              };
              break;
            case "ne":
              updates = {
                y: Math.max(
                  0,
                  Math.min(
                    elementStart.y + dy,
                    elementStart.y + elementStart.height - 20,
                  ),
                ),
                width: Math.max(
                  20,
                  Math.min(
                    elementStart.width + dx,
                    canvasPixelSize.width - element.x,
                  ),
                ),
                height: Math.max(20, elementStart.height - dy),
              };
              break;
            case "nw":
              updates = {
                x: Math.max(
                  0,
                  Math.min(
                    elementStart.x + dx,
                    elementStart.x + elementStart.width - 20,
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    elementStart.y + dy,
                    elementStart.y + elementStart.height - 20,
                  ),
                ),
                width: Math.max(20, elementStart.width - dx),
                height: Math.max(20, elementStart.height - dy),
              };
              break;
            case "n":
              updates = {
                y: Math.max(
                  0,
                  Math.min(
                    elementStart.y + dy,
                    elementStart.y + elementStart.height - 20,
                  ),
                ),
                height: Math.max(20, elementStart.height - dy),
              };
              break;
            case "s":
              updates = {
                height: Math.max(
                  20,
                  Math.min(
                    elementStart.height + dy,
                    canvasPixelSize.height - element.y,
                  ),
                ),
              };
              break;
            case "e":
              updates = {
                width: Math.max(
                  20,
                  Math.min(
                    elementStart.width + dx,
                    canvasPixelSize.width - element.x,
                  ),
                ),
              };
              break;
            case "w":
              updates = {
                x: Math.max(
                  0,
                  Math.min(
                    elementStart.x + dx,
                    elementStart.x + elementStart.width - 20,
                  ),
                ),
                width: Math.max(20, elementStart.width - dx),
              };
              break;
            default:
              break;
          }

          updateElement(selectedElementId, updates);

          // ── For tables: keep cellWidth/cellHeight proportional to new size ──
          const el = elements.find((el) => el.id === selectedElementId);
          if (el && el.type === 'table') {
            const newW = updates.width ?? el.width;
            const newH = updates.height ?? el.height;
            updateElement(selectedElementId, {
              cellWidth: Math.max(8, newW / (el.cols || 2)),
              cellHeight: Math.max(8, newH / (el.rows || 2)),
            });
          }
        }
      },
      [
        displayZoom,
        dragStart,
        isRotating,
        rotationStart,
        selectedElementId,
        isDraggingLinePoint,
        draggedLinePoint,
        elementStart,
        canvasPixelSize.width,
        canvasPixelSize.height,
        elements,
        updateElement,
        isDragging,
        isResizing,
        resizeHandle,
      ],
    );

    const handleMouseUp = useCallback(() => {
      if (isDragging || isResizing || isDraggingLinePoint || isRotating) {
        saveToHistory(elements);

        // Sync final position/size to backend
        if (selectedElementId && onUpdateEnd) {
          const el = elements.find((e) => e.id === selectedElementId);
          if (el) onUpdateEnd(selectedElementId, el);
        }
      }
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      setIsDraggingLinePoint(false);
      setDraggedLinePoint(null);
      setIsRotating(false);
      setRotationStart(null);
    }, [
      isDragging,
      isResizing,
      isDraggingLinePoint,
      isRotating,
      elements,
      saveToHistory,
      selectedElementId,
      onUpdateEnd,
    ]);

    const handleCanvasMouseDown = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scale = displayZoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        if (isDrawingText) {
          setTextDrawStart({ x, y });
          setTempText({ x, y, width: 0, height: 0 });
          e.stopPropagation();
        } else if (isDrawingLine) {
          setLineDrawStart({ x, y });
          setTempLine({ x1: x, y1: y, x2: x, y2: y });
          e.stopPropagation();
        } else if (isDrawingBarcode) {
          setBarcodeDrawStart({ x, y });
          setTempBarcode({ x, y, width: 0, height: 0 });
          e.stopPropagation();
        } else if (isDrawingShape && currentShapeType) {
          setShapeDrawStart({ x, y });
          setTempShape({ x, y, width: 0, height: 0, type: currentShapeType });
          e.stopPropagation();
        } else if (isDrawingImage) {
          setImageDrawStart({ x, y });
          setTempImage({ x, y, width: 0, height: 0 });
          e.stopPropagation();
        } else if (isDrawingTable) {
          setTableDrawStart({ x, y });
          setTempTable({ x, y, width: 0, height: 0 });
          e.stopPropagation();
        } else {
          // User clicked on empty canvas area — collapse properties panel
          if (onInteraction) onInteraction();
          setSelectedElementId(null);
        }
      },
      [
        isDrawingText,
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        isDrawingImage,
        isDrawingTable,
        currentShapeType,
        displayZoom,
        onInteraction,
        setSelectedElementId,
      ],
    );

    const handleCanvasMouseMove = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scale = displayZoom / 100;
        let x = (e.clientX - rect.left) / scale;
        let y = (e.clientY - rect.top) / scale;

        // Track mouse for adaptive guidelines and ruler indicators
        setLineMousePos({ x, y });

        if (isDrawingText && textDrawStart) {
          const width = Math.abs(x - textDrawStart.x);
          const height = Math.abs(y - textDrawStart.y);
          setTempText({
            x: Math.min(textDrawStart.x, x),
            y: Math.min(textDrawStart.y, y),
            width,
            height,
          });
        } else if (isDrawingLine && lineDrawStart) {
          if (e.shiftKey) {
            const dx = x - lineDrawStart.x;
            const dy = y - lineDrawStart.y;
            const angle = Math.atan2(dy, dx);
            const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const distance = Math.sqrt(dx * dx + dy * dy);
            x = lineDrawStart.x + distance * Math.cos(snapAngle);
            y = lineDrawStart.y + distance * Math.sin(snapAngle);
          }

          setTempLine({
            x1: lineDrawStart.x,
            y1: lineDrawStart.y,
            x2: x,
            y2: y,
          });
        } else if (isDrawingBarcode && barcodeDrawStart) {
          const width = Math.abs(x - barcodeDrawStart.x);
          const height = Math.abs(y - barcodeDrawStart.y);

          setTempBarcode({
            x: Math.min(barcodeDrawStart.x, x),
            y: Math.min(barcodeDrawStart.y, y),
            width,
            height,
          });
        } else if (isDrawingShape && shapeDrawStart && currentShapeType) {
          const width = Math.abs(x - shapeDrawStart.x);
          const height = Math.abs(y - shapeDrawStart.y);

          setTempShape({
            x: Math.min(shapeDrawStart.x, x),
            y: Math.min(shapeDrawStart.y, y),
            width,
            height,
            type: currentShapeType,
          });
        } else if (isDrawingImage && imageDrawStart) {
          const width = Math.abs(x - imageDrawStart.x);
          const height = Math.abs(y - imageDrawStart.y);
          setTempImage({
            x: Math.min(imageDrawStart.x, x),
            y: Math.min(imageDrawStart.y, y),
            width,
            height,
          });
        } else if (isDrawingTable && tableDrawStart) {
          const width = Math.abs(x - tableDrawStart.x);
          const height = Math.abs(y - tableDrawStart.y);
          setTempTable({
            x: Math.min(tableDrawStart.x, x),
            y: Math.min(tableDrawStart.y, y),
            width,
            height,
          });
        }
      },
      [
        isDrawingText,
        textDrawStart,
        isDrawingLine,
        lineDrawStart,
        isDrawingBarcode,
        barcodeDrawStart,
        isDrawingShape,
        shapeDrawStart,
        isDrawingImage,
        imageDrawStart,
        isDrawingTable,
        tableDrawStart,
        currentShapeType,
        displayZoom,
      ],
    );

    const handleCanvasMouseUp = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scale = displayZoom / 100;
        let x = (e.clientX - rect.left) / scale;
        let y = (e.clientY - rect.top) / scale;

        if (isDrawingText && textDrawStart) {
          const width = Math.abs(x - textDrawStart.x);
          const height = Math.abs(y - textDrawStart.y);

          const props = {
            x: Math.min(textDrawStart.x, x),
            y: Math.min(textDrawStart.y, y),
            width: width < 20 ? 120 : Math.max(width, 30),
            height: height < 10 ? 30 : Math.max(height, 20),
            content: "",
          };

          if (onAddElement) {
            onAddElement("text", props);
            setIsDrawingText(false);
            setTextDrawStart(null);
            setTempText(null);
            // We can't auto-edit because onAddElement is async and we don't have the ID yet
            // The user will have to click to edit.
          } else {
            const newElement = { ...props, id: generateId(), type: "text", zIndex: elements.length };
            const newElements = [...elements, newElement];
            setElements(newElements);
            setSelectedElementId(newElement.id);
            setIsDrawingText(false);
            setTextDrawStart(null);
            setTempText(null);
            saveToHistory(newElements);
            setTimeout(() => {
              setEditingElementId(newElement.id);
              setEditingTextValue("");
            }, 20);
          }
          return;
        }

        if (isDrawingLine && lineDrawStart) {
          if (e.shiftKey) {
            const dx = x - lineDrawStart.x;
            const dy = y - lineDrawStart.y;
            const angle = Math.atan2(dy, dx);
            const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const distance = Math.sqrt(dx * dx + dy * dy);
            x = lineDrawStart.x + distance * Math.cos(snapAngle);
            y = lineDrawStart.y + distance * Math.sin(snapAngle);
          }

          const dx = x - lineDrawStart.x;
          const dy = y - lineDrawStart.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 5) {
            setIsDrawingLine(false);
            setLineDrawStart(null);
            setTempLine(null);
            setLineMousePos(null);
            return;
          }

          const props = {
            x: Math.min(lineDrawStart.x, x),
            y: Math.min(lineDrawStart.y, y),
            width: Math.abs(dx),
            height: Math.abs(dy),
            x1: lineDrawStart.x,
            y1: lineDrawStart.y,
            x2: x,
            y2: y,
            borderWidth: 1,
            borderColor: "#000000",
            borderStyle: "solid",
          };

          if (onAddElement) {
            onAddElement("line", props);
            setIsDrawingLine(false);
            setLineDrawStart(null);
            setTempLine(null);
            setLineMousePos(null);
            if (onElementCreated) onElementCreated();
          } else {
            const newElement = { ...props, id: generateId(), type: "line", zIndex: elements.length };
            const newElements = [...elements, newElement];
            setElements(newElements);
            setSelectedElementId(newElement.id);
            setIsDrawingLine(false);
            setLineDrawStart(null);
            setTempLine(null);
            setLineMousePos(null);
            saveToHistory(newElements);
            if (onElementCreated) onElementCreated();
          }
        } else if (isDrawingBarcode && barcodeDrawStart) {
          const width = Math.abs(x - barcodeDrawStart.x);
          const height = Math.abs(y - barcodeDrawStart.y);

          if (width < 50 || height < 30) {
            setIsDrawingBarcode(false);
            setBarcodeDrawStart(null);
            setTempBarcode(null);
            return;
          }

          const isGs1 = ["DATAMATRIX", "PDF417", "DATABAR"].includes(selectedBarcodeType);
          const props = {
            x: Math.min(barcodeDrawStart.x, x),
            y: Math.min(barcodeDrawStart.y, y),
            width: Math.max(width, 100),
            height: Math.max(height, 50),
            content: isGs1 ? "(01)01234567890128" : (selectedBarcodeType === "EAN13" ? "7612345002958" : "123456789"),
            barcodeType: selectedBarcodeType || "CODE128",
          };

          if (onAddElement) {
            onAddElement("barcode", props);
            setIsDrawingBarcode(false);
            setBarcodeDrawStart(null);
            setTempBarcode(null);
          } else {
            const newElement = { ...props, id: generateId(), type: "barcode", zIndex: elements.length };
            const newElements = [...elements, newElement];
            setElements(newElements);
            setSelectedElementId(newElement.id);
            setIsDrawingBarcode(false);
            setBarcodeDrawStart(null);
            setTempBarcode(null);
            saveToHistory(newElements);
          }
        } else if (isDrawingShape && shapeDrawStart && currentShapeType) {
          const width = Math.abs(x - shapeDrawStart.x);
          const height = Math.abs(y - shapeDrawStart.y);

          if (width < 20 || height < 20) {
            setIsDrawingShape(false);
            setShapeDrawStart(null);
            setTempShape(null);
            return;
          }

          const props = {
            x: Math.min(shapeDrawStart.x, x),
            y: Math.min(shapeDrawStart.y, y),
            width: Math.max(width, 30),
            height: Math.max(height, 30),
            borderWidth: 2,
            borderColor: "#000000",
            borderStyle: "solid",
            borderRadius: currentShapeType === "rectangle" ? 0 : undefined,
            backgroundColor: "transparent",
          };

          if (onAddElement) {
            onAddElement(currentShapeType, props);
            setIsDrawingShape(false);
            setShapeDrawStart(null);
            setTempShape(null);
          } else {
            const newElement = { ...props, id: generateId(), type: currentShapeType, zIndex: elements.length };
            const newElements = [...elements, newElement];
            setElements(newElements);
            setSelectedElementId(newElement.id);
            setIsDrawingShape(false);
            setShapeDrawStart(null);
            setTempShape(null);
            saveToHistory(newElements);
          }
        } else if (isDrawingImage && imageDrawStart) {
          const width = Math.abs(x - imageDrawStart.x);
          const height = Math.abs(y - imageDrawStart.y);
          if (width < 20 || height < 20) {
            setIsDrawingImage(false);
            setImageDrawStart(null);
            setTempImage(null);
            return;
          }
          const props = {
            x: Math.min(imageDrawStart.x, x),
            y: Math.min(imageDrawStart.y, y),
            width: Math.max(width, 50),
            height: Math.max(height, 50),
          };
          if (onAddElement) {
            onAddElement("image", props);
            setIsDrawingImage(false);
            setImageDrawStart(null);
            setTempImage(null);
          }
        } else if (isDrawingTable && tableDrawStart) {
          const width = Math.abs(x - tableDrawStart.x);
          const height = Math.abs(y - tableDrawStart.y);
          if (width < 30 || height < 20) {
            setIsDrawingTable(false);
            setTableDrawStart(null);
            setTempTable(null);
            return;
          }
          const props = {
            x: Math.min(tableDrawStart.x, x),
            y: Math.min(tableDrawStart.y, y),
            width: Math.max(width, 100),
            height: Math.max(height, 60),
            rows: 2,
            cols: 2
          };
          if (onAddElement) {
            onAddElement("table", props);
            setIsDrawingTable(false);
            setTableDrawStart(null);
            setTempTable(null);
          }
        }
      },
      [
        isDrawingText,
        textDrawStart,
        isDrawingLine,
        lineDrawStart,
        isDrawingBarcode,
        barcodeDrawStart,
        isDrawingShape,
        shapeDrawStart,
        isDrawingImage,
        imageDrawStart,
        isDrawingTable,
        tableDrawStart,
        currentShapeType,
        displayZoom,
        generateId,
        elements,
        setElements,
        selectedBarcodeType,
        setSelectedElementId,
        setIsDrawingText,
        setIsDrawingLine,
        setIsDrawingBarcode,
        setIsDrawingShape,
        setIsDrawingImage,
        setIsDrawingTable,
        saveToHistory,
        onElementCreated,
        onAddElement,
      ],
    );

    const onDragOver = useCallback((e) => {
      e.preventDefault();
    }, []);

    const onDrop = useCallback(
      (e) => {
        e.preventDefault();

        if (draggedElement && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const scale = displayZoom / 100;
          const x = (e.clientX - rect.left) / scale;
          const y = (e.clientY - rect.top) / scale;

          const defaultWidth = draggedElement === "barcode" ? 60 * MM_TO_PX : 40 * MM_TO_PX; // px (calculated from mm defaults)
          const defaultHeight = draggedElement === "barcode" ? 25 * MM_TO_PX : (draggedElement === "text" ? 8 * MM_TO_PX : 40 * MM_TO_PX); // px

          const extra = {
            x: Math.max(0, Math.min(x - defaultWidth / 2, labelSize.width - defaultWidth)),
            y: Math.max(0, Math.min(y - defaultHeight / 2, labelSize.height - defaultHeight)),
            width: defaultWidth,
            height: defaultHeight,
          };

          if (onAddElement) {
            onAddElement(draggedElement, extra);
            setDraggedElement(null);
          } else {
            const newElement = {
              ...extra,
              id: generateId(),
              type: draggedElement,
              content: draggedElement === "barcode" ? "123456789" : (draggedElement === "text" ? "New Text" : ""),
              zIndex: elements.length,
              fontSize: 14,
              fontFamily: "Arial",
              rotation: 0,
            };
            const newElements = [...elements, newElement];
            setElements(newElements);
            setSelectedElementId(newElement.id);
            setDraggedElement(null);
            saveToHistory(newElements);
          }
        }
      },
      [
        draggedElement,
        displayZoom,
        canvasPixelSize.width,
        canvasPixelSize.height,
        generateId,
        elements,
        setElements,
        setSelectedElementId,
        saveToHistory,
        onAddElement
      ],
    );

    // Always-on global mouse listeners — avoids a one-render-cycle gap
    // where isRotating becomes true but listeners aren't attached yet.
    useEffect(() => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (
          document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.tagName === "SELECT"
        ) {
          return;
        }

        if (e.ctrlKey || e.metaKey) {
          if (e.key === "z" && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
          } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
            e.preventDefault();
            handleRedo();
          } else if (e.key === "d") {
            e.preventDefault();
            handleDuplicate();
          } else if (e.key === "=" || e.key === "+") {
            e.preventDefault();
            handleZoomIn();
          } else if (e.key === "-") {
            e.preventDefault();
            handleZoomOut();
          } else if (e.key === "0") {
            e.preventDefault();
            handleZoomReset();
          }
        }

        if (e.key === "Escape") {
          if (editingElementId) {
            setEditingElementId(null);
            setEditingTextValue("");
            return;
          }
          if (isDrawingText) {
            setIsDrawingText(false);
            setTextDrawStart(null);
            setTempText(null);
          }
          if (isDrawingLine) {
            setIsDrawingLine(false);
            setLineDrawStart(null);
            setTempLine(null);
          }
          if (isDrawingBarcode) {
            setIsDrawingBarcode(false);
            setBarcodeDrawStart(null);
            setTempBarcode(null);
          }
          if (isDrawingShape) {
            setIsDrawingShape(false);
            setShapeDrawStart(null);
            setTempShape(null);
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
      handleUndo,
      handleRedo,
      handleDuplicate,
      handleZoomIn,
      handleZoomOut,
      handleZoomReset,
      isDrawingText,
      isDrawingLine,
      isDrawingBarcode,
      isDrawingShape,
      setIsDrawingText,
      setIsDrawingLine,
      setIsDrawingBarcode,
      setIsDrawingShape,
    ]);

    const renderResizeHandles = useCallback(
      (element) => {
        if (element.id !== selectedElementId || element.type === "line")
          return null;

        const isDrawingAny = isDrawingText || isDrawingLine || isDrawingBarcode || isDrawingShape;
        if (isDrawingAny) return null;

        const ROTATE_OFFSET = 32;
        const handles = [
          { pos: "nw", cursor: "nw-resize", style: { left: -4, top: -4 } },
          { pos: "n", cursor: "n-resize", style: { left: "50%", top: -4, transform: "translateX(-50%)" } },
          { pos: "ne", cursor: "ne-resize", style: { right: -4, top: -4 } },
          { pos: "e", cursor: "e-resize", style: { right: -4, top: "50%", transform: "translateY(-50%)" } },
          { pos: "se", cursor: "se-resize", style: { right: -4, bottom: -4 } },
          { pos: "s", cursor: "s-resize", style: { left: "50%", bottom: -4, transform: "translateX(-50%)" } },
          { pos: "sw", cursor: "sw-resize", style: { left: -4, bottom: -4 } },
          { pos: "w", cursor: "w-resize", style: { left: -4, top: "50%", transform: "translateY(-50%)" } },
        ];

        return (
          <>
            {/* Technical Rotation Handle */}
            <div
              className="absolute left-1/2 -top-6 w-px h-3 bg-slate-400 -translate-x-1/2 pointer-events-none z-40"
            />
            <div
              title="Rotate"
              className="absolute left-1/2 -top-10 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-slate-400 shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-all z-50 group/rotate"
              onMouseDown={(e) => handleRotateMouseDown(e, element)}
            >
              <RotateCw size={14} className="text-slate-600 group-hover/rotate:rotate-180 transition-transform duration-700" />
            </div>

            {/* Resize handles — circular knots */}
            {handles.map((handle) => (
              <div
                key={handle.pos}
                className="selection-knot absolute"
                style={{
                  cursor: handle.cursor,
                  ...handle.style,
                }}
                onMouseDown={(e) => handleResizeMouseDown(e, element, handle.pos)}
              />
            ))}

            {/* Selection Outline Overlay (Technical Thin Dashed Gray) */}
            <div
              className="absolute pointer-events-none z-30 rounded-sm"
              style={{
                inset: 0,
                border: `1px dashed #94a3b8`,
                boxShadow: "none"
              }}
            />
          </>
        );
      },
      [
        selectedElementId,
        isDrawingText,
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        handleResizeMouseDown,
        handleRotateMouseDown,
      ],
    );

    const renderElement = useCallback(
      (element) => {
        const isSelected = element.id === selectedElementId;

        if (element.type === "line") {
          const x1 = element.x1 !== undefined ? element.x1 : element.x;
          const y1 = element.y1 !== undefined ? element.y1 : element.y;
          const x2 =
            element.x2 !== undefined ? element.x2 : element.x + element.width;
          const y2 =
            element.y2 !== undefined ? element.y2 : element.y + element.height;

          return (
            <svg
              key={element.id}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                zIndex: element.zIndex || 0,
                pointerEvents:
                  isDrawingLine || isDrawingBarcode || isDrawingShape || element.isSystem
                    ? "none"
                    : "all",
              }}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={element.borderColor || "#000000"}
                strokeWidth={element.borderWidth || 1}
                strokeDasharray={
                  element.borderStyle === "dashed"
                    ? `${5},${5}`
                    : element.borderStyle === "dotted"
                      ? `${2},${2}`
                      : "none"
                }
                style={{
                  cursor: isDragging ? "grabbing" : "move",
                }}
                onMouseDown={(e) => {
                  const rect = canvasRef.current.getBoundingClientRect();
                  const scale = displayZoom / 100;
                  const clickX = (e.clientX - rect.left) / scale;
                  const clickY = (e.clientY - rect.top) / scale;

                  const distToStart = Math.sqrt(
                    Math.pow(clickX - x1, 2) + Math.pow(clickY - y1, 2),
                  );
                  const distToEnd = Math.sqrt(
                    Math.pow(clickX - x2, 2) + Math.pow(clickY - y2, 2),
                  );

                  if (distToStart > 10 && distToEnd > 10) {
                    handleElementMouseDown(e, element);
                  }
                }}
              />

              {isSelected &&
                !isDrawingLine &&
                !isDrawingBarcode &&
                !isDrawingShape &&
                !element.isSystem && (
                  <>
                    <circle
                      cx={x1}
                      cy={y1}
                      r="5"
                      fill="white"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLinePointMouseDown(e, element, "start");
                      }}
                    />

                    <circle
                      cx={x2}
                      cy={y2}
                      r="5"
                      fill="white"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLinePointMouseDown(e, element, "end");
                      }}
                    />

                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--color-primary)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      pointerEvents="none"
                      opacity="0.5"
                    />
                  </>
                )}
            </svg>
          );
        }

        const style = {
          position: "absolute",
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width}px`,
          height: `${element.height}px`,
          transform: `rotate(${element.rotation || 0}deg)`,
          transformOrigin: "center center", // Ensure rotation is around center
          zIndex: element.zIndex || 0,
          cursor: isDragging
            ? "grabbing"
            : isDrawingLine || isDrawingBarcode || isDrawingShape
              ? "crosshair"
              : "move",
          borderWidth: isSelected && !isDrawingLine && !isDrawingBarcode && !isDrawingShape
            ? `2px`
            : `${((element.borderWidth || 0) || (element.type === "barcode" ? 0 : 1))}px`,
          borderStyle: isSelected && !isDrawingLine && !isDrawingBarcode && !isDrawingShape
            ? "solid"
            : (element.borderWidth > 0 ? (element.borderStyle || "solid") : "solid"),
          borderColor: isSelected && !isDrawingLine && !isDrawingBarcode && !isDrawingShape
            ? "var(--color-primary)"
            : (element.borderWidth > 0 ? element.borderColor : "transparent"),
          fontSize: `${element.fontSize || 14}px`,
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign,
          color: element.color,
          backgroundColor: element.backgroundColor,
          borderRadius: element.borderRadius
            ? `${element.borderRadius}px`
            : element.type === "circle"
              ? "50%"
              : undefined,
          userSelect: "none",
          pointerEvents:
            isDrawingLine || isDrawingBarcode || isDrawingShape || element.isSystem
              ? "none"
              : "auto",
          padding: element.type === "text" ? `0px 4px` : "0",
          boxSizing: "border-box",
        };
        switch (element.type) {
          case "placeholder":
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  border:
                    isSelected &&
                      !isDrawingLine &&
                      !isDrawingBarcode &&
                      !isDrawingShape
                      ? "none"
                      : "1px dashed rgba(0,0,0,0.2)",
                  backgroundColor: isSelected
                    ? "rgba(0,0,0,0.02)"
                    : "rgba(251,191,36,0.05)",
                  overflow: "visible",   // allow rotation handle to show above
                  display: "flex",
                  alignItems: "center",
                  fontWeight: element.fontWeight || "normal",
                  fontStyle: element.fontStyle || "normal",
                  textDecoration: element.textDecoration || "none",
                  letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
                  lineHeight: element.lineHeight || 1.2,
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="select-none"
              >
                {/* Inner clip so text doesn't overflow visually */}
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <span
                    className="whitespace-nowrap font-mono text-sm w-full overflow-hidden"
                    style={{ color: element.color || "#f59e0b" }}
                  >
                    {element.content || "{{placeholder}}"}
                  </span>
                </div>
                {renderResizeHandles(element)}
              </div>
            );
          case "text":
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  border: isSelected && !isDrawingLine && !isDrawingBarcode && !isDrawingShape
                    ? 'none'
                    : '1px dashed rgba(0,0,0,0.1)',
                  boxShadow: 'none',
                  fontWeight: element.fontWeight || "normal",
                  fontStyle: element.fontStyle || "normal",
                  textDecoration: element.textDecoration || "none",
                  letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
                  lineHeight: element.lineHeight || 1.2,
                  display: "flex",
                  alignItems: "flex-start",
                  overflow: "visible",   // ← MUST be visible so rotation handle isn't clipped
                  cursor: editingElementId === element.id ? 'text' : (isDragging ? 'grabbing' : 'move'),
                  padding: '4px 6px',
                  backgroundColor: element.backgroundColor || 'transparent',
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                onDoubleClick={(e) => handleTextDoubleClick(e, element)}
              >
                {/* Inner wrapper clips the text content while outer stays overflow:visible for handles */}
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
                  {editingElementId === element.id ? (
                    /* ── Inline textarea (PowerPoint-style) ── */
                    <textarea
                      ref={textareaRef}
                      value={editingTextValue}
                      onChange={(e) => setEditingTextValue(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setEditingElementId(null);
                          setEditingTextValue('');
                        }
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault();
                          commitTextEdit();
                        }
                      }}
                      onBlur={commitTextEdit}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        resize: 'none',
                        fontSize: element.fontSize || 14,
                        fontFamily: element.fontFamily || 'Arial',
                        fontWeight: element.fontWeight || 'normal',
                        fontStyle: element.fontStyle || 'normal',
                        textDecoration: element.textDecoration || 'none',
                        textAlign: element.textAlign || 'left',
                        letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
                        lineHeight: element.lineHeight || 1.2,
                        color: element.color || '#000000',
                        cursor: 'text',
                        padding: 0,
                        margin: 0,
                        overflow: 'hidden',
                      }}
                    />
                  ) : (
                    /* ── Regular display span ── */
                    <span
                      style={{
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: (element.lineHeight || 1) > 1.4 ? 'pre-wrap' : 'nowrap',
                        pointerEvents: 'none',
                      }}
                    >
                      {element.content || (
                        <span style={{ opacity: 0.35, fontStyle: 'italic' }}>Double-click to edit...</span>
                      )}
                    </span>
                  )}
                </div>
                {renderResizeHandles(element)}
              </div>
            );
          case "barcode":
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isSelected ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="select-none overflow-hidden"
              >
                <BarcodeElement element={element} />
                {renderResizeHandles(element)}
              </div>
            );
          case "image":
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  padding: 0,
                  overflow: "hidden",
                  opacity: element.opacity ?? 1,
                  backgroundColor: "transparent",
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="select-none"
              >
                {element.src ? (
                  <img
                    src={element.src}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: element.lockAspectRatio !== false ? "contain" : "fill", display: "block", pointerEvents: "none", userSelect: "none" }}
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">
                    🖼️ Image
                  </div>
                )}
                {renderResizeHandles(element)}
              </div>
            );
          case "table":
            return (
              <div
                key={element.id}
                style={{
                  position: "absolute",
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  zIndex: element.zIndex || 0,
                  cursor: isDragging ? "grabbing" : isDrawingLine || isDrawingBarcode || isDrawingShape ? "crosshair" : "move",
                  pointerEvents: isDrawingLine || isDrawingBarcode || isDrawingShape ? "none" : "auto",
                  userSelect: "none",
                  border: "none",
                  overflow: "visible",   // allow rotation handle above
                  boxSizing: "border-box",
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
              >
                <table
                  style={{
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    width: "100%",
                    height: "100%",
                    pointerEvents: isSelected ? "auto" : "none",
                  }}
                >
                  <tbody>
                    {Array.from({ length: element.rows || 2 }, (_, rowIdx) => (
                      <tr key={rowIdx}>
                        {Array.from({ length: element.cols || 2 }, (_, colIdx) => {
                          const cellValue = element.tableData?.[rowIdx]?.[colIdx] ?? "";
                          return (
                            <td
                              key={colIdx}
                              style={{
                                width: `${100 / (element.cols || 2)}%`,
                                height: `${100 / (element.rows || 2)}%`,
                                border: `${element.borderWidth || 1}px ${element.borderStyle || "solid"} ${element.borderColor || "#000000"}`,
                                backgroundColor: element.backgroundColor || "transparent",
                                padding: 2,
                                overflow: "hidden",
                                boxSizing: "border-box",
                              }}
                            >
                              {isSelected ? (
                                <input
                                  type="text"
                                  value={cellValue}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const newData = JSON.parse(JSON.stringify(element.tableData || []));
                                    if (!newData[rowIdx]) newData[rowIdx] = [];
                                    newData[rowIdx][colIdx] = e.target.value;
                                    updateElement(element.id, { tableData: newData });
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    fontSize: element.fontSize || 11,
                                    fontFamily: element.fontFamily || "Arial",
                                    padding: 1,
                                    cursor: "text",
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: element.fontSize || 11, fontFamily: element.fontFamily || "Arial", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {cellValue}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderResizeHandles(element)}
              </div>
            );
          case "rectangle":
          case "circle":
            return (
              <div
                key={element.id}
                style={style}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="select-none"
              >
                {renderResizeHandles(element)}
              </div>
            );
          default:
            return null;
        }
      },
      [
        selectedElementId,
        isDrawingText,
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        isDragging,
        displayZoom,
        handleElementMouseDown,
        handleLinePointMouseDown,
        renderResizeHandles,
        updateElement,
        elements,
        editingElementId,
        editingTextValue,
        handleTextDoubleClick,
        commitTextEdit,
      ],
    );

    const Ruler = useCallback(
      ({ orientation, unit = MM_TO_PX, maxLength }) => {
        const isHorizontal = orientation === "horizontal";
        const marks = [];

        const scale = displayZoom / 100;
        const endMM = Math.ceil(maxLength / (unit * scale));

        for (let i = 0; i <= endMM; i++) {
          marks.push(i);
        }

        return (
          <div
            className="flex-shrink-0 relative bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            style={{
              width: isHorizontal ? `${maxLength}px` : `${RULER_SIZE}px`,
              height: isHorizontal ? `${RULER_SIZE}px` : `${maxLength}px`,
              borderRight: isHorizontal ? "none" : "1px solid",
              borderBottom: isHorizontal ? "1px solid" : "none",
            }}
          >
            {marks.map((mark) => {
              const position = mark * unit * (displayZoom / 100);
              const absMark = Math.abs(mark);
              const isMajorMark = absMark % 10 === 0;
              const isMediumMark = absMark % 5 === 0;

              return (
                <div key={mark}>
                  <div
                    className="absolute"
                    style={{
                      ...(isHorizontal
                        ? {
                          left: `${position}px`,
                          bottom: "0",
                          width: "1.5px",
                          height: isMajorMark ? "100%" : isMediumMark ? "60%" : "30%",
                        }
                        : {
                          top: `${position}px`,
                          right: "0",
                          height: "1.5px",
                          width: isMajorMark ? "100%" : isMediumMark ? "60%" : "30%",
                        }),
                      backgroundColor: isMajorMark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)",
                    }}
                  />

                  {isMajorMark && (
                    <span
                      className="absolute text-[10px] font-medium select-none"
                      style={{
                        ... (isHorizontal
                          ? {
                            left: `${position}px`,
                            top: "2px",
                            transform: "translateX(-50%)",
                          }
                          : {
                            left: "2px",
                            top: `${position}px`,
                            transform: "translateY(-50%)",
                            width: `${RULER_SIZE - 14}px`,
                            textAlign: "right",
                          }),
                        color: theme.textMuted,
                      }}
                    >
                      {mark}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
      [labelSize, displayZoom, theme],
    );

    const maxRulerLength = Math.max(displayWidth + 2000, 3000);
    const maxRulerHeightLength = Math.max(displayHeight + 2000, 3000);
    const canvasCursor =
      isDrawingText || isDrawingLine || isDrawingBarcode || isDrawingShape
        ? "crosshair"
        : "default";

    const gridColor = isDarkMode ? "#334155" : "#e5e7eb";

    return (
      <div
        ref={containerRef}
        className="h-full w-full flex flex-col relative overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <div className="flex flex-shrink-0">
          <div
            className="flex items-center justify-center flex-shrink-0 z-10"
            style={{
              width: `${RULER_SIZE}px`,
              height: `${RULER_SIZE}px`,
              backgroundColor: "#f1f5f9",
              borderRight: `1px solid ${theme.border}`,
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <span className="text-[10px] font-bold" style={{ color: "var(--color-primary)" }}>MM</span>
          </div>

          <div className="flex-1 relative">
            <div
              style={{
                width: `100%`,
                marginLeft: `0px`,
                overflow: 'hidden'
              }}
            >
              <Ruler orientation="horizontal" maxLength={2000} />
            </div>

            {/* Mouse position indicator (horizontal) */}
            {lineMousePos && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-500 z-20 pointer-events-none"
                style={{ left: `${canvasBaseOffset.x + lineMousePos.x * (displayZoom / 100) - scrollOffset.x}px` }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className="relative flex-shrink-0">
            <div
              style={{
                height: `100%`,
                marginTop: `0px`,
                overflow: 'hidden'
              }}
            >
              <Ruler orientation="vertical" maxLength={2000} />
            </div>

            {/* Mouse position indicator (vertical) */}
            {lineMousePos && (
              <div
                className="absolute left-0 right-0 h-px bg-blue-500 z-20 pointer-events-none"
                style={{ top: `${canvasBaseOffset.y + lineMousePos.y * (displayZoom / 100) - scrollOffset.y}px` }}
              />
            )}
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 relative custom-scrollbar"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}
          >
            <div
              className="min-h-full min-w-full flex flex-col items-center justify-start p-12"
            >
              <div
                ref={canvasRef}
                className="relative bg-white shadow-xl transition-shadow"
                style={{
                  width: `${canvasPixelSize.width}px`,
                  height: `${canvasPixelSize.height}px`,
                  transform: `scale(${displayZoom / 100})`,
                  transformOrigin: "center center",
                  backgroundColor: "#ffffff", // Always white for canvas representing paper
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  backgroundImage: showGrid
                    ? `radial-gradient(${gridColor} 1px, transparent 1px)`
                    : "none",
                  backgroundSize: showGrid ? "20px 20px" : "auto",
                  cursor: canvasCursor,
                }}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onClick={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    !isDrawingText &&
                    !isDrawingLine &&
                    !isDrawingBarcode &&
                    !isDrawingShape
                  ) {
                    setSelectedElementId(null);
                  }
                }}
              >
                {elements.map(renderElement)}

                {/* ── Persistent Adaptive Guidelines (Full Canvas Crosshairs) ── */}
                <svg
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    overflow: "visible",
                    zIndex: 40,
                  }}
                >
                  {lineMousePos && (
                    <>
                      {/* X-Axis Guideline */}
                      <line
                        x1={0}
                        y1={lineMousePos.y}
                        x2={canvasPixelSize.width}
                        y2={lineMousePos.y}
                        stroke="#e74c3c"
                        strokeWidth="0.6"
                        strokeDasharray="4 3"
                        opacity="0.4"
                      />
                      {/* Y-Axis Guideline */}
                      <line
                        x1={lineMousePos.x}
                        y1={0}
                        x2={lineMousePos.x}
                        y2={canvasPixelSize.height}
                        stroke="#e74c3c"
                        strokeWidth="0.6"
                        strokeDasharray="4 3"
                        opacity="0.4"
                      />

                      {/* Global Position Badge */}
                      <foreignObject
                        x={lineMousePos.x + 8}
                        y={lineMousePos.y + 8}
                        width="80" height="24"
                      >
                        <div
                          xmlns="http://www.w3.org/1999/xhtml"
                          style={{
                            background: 'rgba(59, 130, 246, 0.9)',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: '900',
                            fontFamily: 'Inter, sans-serif',
                            padding: '1px 5px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        >
                          {Math.round(lineMousePos.x / MM_TO_PX)} × {Math.round(lineMousePos.y / MM_TO_PX)} mm
                        </div>
                      </foreignObject>
                    </>
                  )}

                  {/* Drawing-specific start point crosshair */}
                  {lineDrawStart && (
                    <>
                      <line
                        x1={0} y1={lineDrawStart.y}
                        x2={canvasPixelSize.width} y2={lineDrawStart.y}
                        stroke="#3498db" strokeWidth="0.5"
                        strokeDasharray="3 4" opacity="0.3"
                      />
                      <line
                        x1={lineDrawStart.x} y1={0}
                        x2={lineDrawStart.x} y2={canvasPixelSize.height}
                        stroke="#3498db" strokeWidth="0.5"
                        strokeDasharray="3 4" opacity="0.3"
                      />
                      <circle cx={lineDrawStart.x} cy={lineDrawStart.y} r="3" fill="#3498db" opacity="0.8" />
                    </>
                  )}

                  {/* Temp Line Preview */}
                  {tempLine && (
                    <>
                      <line
                        x1={tempLine.x1}
                        y1={tempLine.y1}
                        x2={tempLine.x2}
                        y2={tempLine.y2}
                        stroke="var(--color-primary)"
                        strokeWidth="1.5"
                        opacity="0.9"
                      />
                      {(() => {
                        const dx = tempLine.x2 - tempLine.x1;
                        const dy = tempLine.y2 - tempLine.y1;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        const angleDeg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
                        const lenMm = Math.round((len / MM_TO_PX) * 10) / 10;
                        if (len < 5) return null;
                        return (
                          <>
                            <circle cx={tempLine.x2} cy={tempLine.y2} r="3" fill="var(--color-primary)" />
                            <foreignObject
                              x={tempLine.x2 + 8}
                              y={tempLine.y2 - 14}
                              width="90" height="28"
                            >
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                style={{
                                  background: 'rgba(15,23,42,0.85)',
                                  color: '#fff',
                                  fontSize: 10,
                                  fontFamily: 'monospace',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  whiteSpace: 'nowrap',
                                  lineHeight: 1.5,
                                }}
                              >
                                {lenMm}mm &nbsp;{angleDeg}°
                              </div>
                            </foreignObject>
                          </>
                        );
                      })()}
                    </>
                  )}
                </svg>

                {tempBarcode &&
                  tempBarcode.width > 0 &&
                  tempBarcode.height > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: tempBarcode.x,
                        top: tempBarcode.y,
                        width: tempBarcode.width,
                        height: tempBarcode.height,
                        border: "2px dashed var(--color-primary)",
                        backgroundColor: "rgba(59, 130, 246, 0.1)", // Blue hint
                        pointerEvents: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <span className="text-xs font-bold text-[var(--color-primary)] bg-white/80 px-2 py-0.5 rounded shadow-sm">
                        {(() => {
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
                          return (
                            barcodeTypeNames[selectedBarcodeType] || "Barcode"
                          );
                        })()}
                      </span>
                      <span className="text-[10px] text-[var(--color-primary)] font-medium bg-white/80 px-1 rounded">
                        {Math.round(tempBarcode.width / MM_TO_PX)} ×{" "}
                        {Math.round(tempBarcode.height / MM_TO_PX)}mm
                      </span>
                    </div>
                  )}

                {tempShape && tempShape.width > 0 && tempShape.height > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: tempShape.x,
                      top: tempShape.y,
                      width: tempShape.width,
                      height: tempShape.height,
                      border: "2px dashed #9333ea",
                      backgroundColor: "rgba(147, 51, 234, 0.1)",
                      borderRadius: tempShape.type === "circle" ? "50%" : "0",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="text-[10px] text-purple-600 font-semibold bg-white/80 px-2 py-1 rounded shadow-sm">
                      {tempShape.type === "rectangle" ? "Rectangle" : "Circle"}:{" "}
                      {Math.round(tempShape.width / MM_TO_PX)} ×{" "}
                      {Math.round(tempShape.height / MM_TO_PX)}mm
                    </span>
                  </div>
                )}

                {/* ── Text draw-to-place preview ── */}
                {tempText && tempText.width > 0 && tempText.height > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: tempText.x,
                      top: tempText.y,
                      width: tempText.width,
                      height: tempText.height,
                      border: "1.5px dashed #1a73e8",
                      backgroundColor: "rgba(26, 115, 232, 0.06)",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="text-[10px] text-blue-600 font-semibold bg-white/80 px-2 py-1 rounded shadow-sm">
                      T {Math.round(tempText.width / MM_TO_PX)} × {Math.round(tempText.height / MM_TO_PX)}mm
                    </span>
                  </div>
                )}

                {/* ── Image frame draw preview ── */}
                {tempImage && tempImage.width > 0 && tempImage.height > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: tempImage.x,
                      top: tempImage.y,
                      width: tempImage.width,
                      height: tempImage.height,
                      border: "2px dashed #ec4899",
                      backgroundColor: "rgba(236, 72, 153, 0.1)",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ImageIcon size={18} className="text-pink-500 opacity-50" />
                      <span className="text-[10px] text-pink-600 font-bold bg-white/80 px-2 rounded shadow-sm">
                        IMG {Math.round(tempImage.width / MM_TO_PX)} × {Math.round(tempImage.height / MM_TO_PX)}mm
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Table grid draw preview ── */}
                {tempTable && tempTable.width > 0 && tempTable.height > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: tempTable.x,
                      top: tempTable.y,
                      width: tempTable.width,
                      height: tempTable.height,
                      border: "2px dashed #06b6d4",
                      backgroundColor: "rgba(6, 182, 212, 0.1)",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 border border-cyan-500/20" />
                    <span className="absolute text-[10px] text-cyan-600 font-bold bg-white/80 px-2 py-1 rounded shadow-sm">
                      TABLE {Math.round(tempTable.width / MM_TO_PX)} × {Math.round(tempTable.height / MM_TO_PX)}mm
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default DesignCanvas;
