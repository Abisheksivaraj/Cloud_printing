import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import BarcodeElement from "../components/designer/code";

const DesignCanvas = forwardRef(
  (
    {
      elements = [],
      setElements,
      selectedElementId,
      setSelectedElementId,
      labelSize = { width: 100, height: 80 },
      showGrid = true,
      isDrawingLine = false,
      setIsDrawingLine,
      isDrawingBarcode = false,
      setIsDrawingBarcode,
      isDrawingShape = false,
      setIsDrawingShape,
      currentShapeType,
      generateId,
      updateElement,
      setSelectedBarcodeType,
      zoom = 100,
      onZoomChange,
    },
    ref,
  ) => {
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
    const [shapeDrawStart, setShapeDrawStart] = useState(null);
    const [tempShape, setTempShape] = useState(null);

    const [isDraggingLinePoint, setIsDraggingLinePoint] = useState(false);
    const [draggedLinePoint, setDraggedLinePoint] = useState(null);

    const [history, setHistory] = useState([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const MM_TO_PX = 3.7795275591;
    const RULER_SIZE = 40;

    const getCanvasPixelSize = () => {
      const width = labelSize?.width || 100;
      const height = labelSize?.height || 80;
      return {
        width: width * MM_TO_PX,
        height: height * MM_TO_PX,
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

      const newElement = {
        ...element,
        id: generateId(),
        x: Math.min(element.x + 10, canvasPixelSize.width - element.width),
        y: Math.min(element.y + 10, canvasPixelSize.height - element.height),
        zIndex: elements.length,
      };

      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedElementId(newElement.id);
      saveToHistory(newElements);
    }, [
      selectedElementId,
      elements,
      generateId,
      canvasPixelSize.width,
      canvasPixelSize.height,
      setElements,
      setSelectedElementId,
      saveToHistory,
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
        const margin = 100;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const availableWidth = containerWidth - RULER_SIZE - margin;
        const availableHeight = containerHeight - RULER_SIZE - margin;

        const canvasWidthPx = canvasPixelSize.width;
        const canvasHeightPx = canvasPixelSize.height;

        const zoomX = (availableWidth / canvasWidthPx) * 100;
        const zoomY = (availableHeight / canvasHeightPx) * 100;

        const fittedZoom = Math.min(zoomX, zoomY, 400);

        const minZoom = 120;
        const finalZoom = Math.max(
          minZoom,
          Math.min(Math.floor(fittedZoom), 300),
        );

        onZoomChange(finalZoom);
      });
    }, [canvasPixelSize.width, canvasPixelSize.height, onZoomChange]);

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

    const handleElementMouseDown = useCallback(
      (e, element) => {
        e.stopPropagation();

        if (isDrawingLine || isDrawingBarcode || isDrawingShape) {
          return;
        }

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
      },
      [
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        setSelectedElementId,
        setSelectedBarcodeType,
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

    const handleMouseMove = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const scale = displayZoom / 100;
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;

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
        }
      },
      [
        displayZoom,
        dragStart,
        isDraggingLinePoint,
        selectedElementId,
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
      if (isDragging || isResizing || isDraggingLinePoint) {
        saveToHistory(elements);
      }
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      setIsDraggingLinePoint(false);
      setDraggedLinePoint(null);
    }, [isDragging, isResizing, isDraggingLinePoint, elements, saveToHistory]);

    const handleCanvasMouseDown = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scale = displayZoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        if (isDrawingLine) {
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
        }
      },
      [
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        currentShapeType,
        displayZoom,
      ],
    );

    const handleCanvasMouseMove = useCallback(
      (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scale = displayZoom / 100;
        let x = (e.clientX - rect.left) / scale;
        let y = (e.clientY - rect.top) / scale;

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
        }
      },
      [
        isDrawingLine,
        lineDrawStart,
        isDrawingBarcode,
        barcodeDrawStart,
        isDrawingShape,
        shapeDrawStart,
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
            return;
          }

          const newElement = {
            id: generateId(),
            type: "line",
            x: Math.min(lineDrawStart.x, x),
            y: Math.min(lineDrawStart.y, y),
            width: Math.abs(dx),
            height: Math.abs(dy),
            x1: lineDrawStart.x,
            y1: lineDrawStart.y,
            x2: x,
            y2: y,
            content: "",
            fontSize: 14,
            fontFamily: "Arial",
            color: "#000000",
            backgroundColor: "#000000",
            borderWidth: 2,
            borderColor: "#000000",
            borderStyle: "solid",
            rotation: 0,
            zIndex: elements.length,
          };

          const newElements = [...elements, newElement];
          setElements(newElements);
          setSelectedElementId(newElement.id);
          setIsDrawingLine(false);
          setLineDrawStart(null);
          setTempLine(null);
          saveToHistory(newElements);
        } else if (isDrawingBarcode && barcodeDrawStart) {
          const width = Math.abs(x - barcodeDrawStart.x);
          const height = Math.abs(y - barcodeDrawStart.y);

          if (width < 50 || height < 30) {
            setIsDrawingBarcode(false);
            setBarcodeDrawStart(null);
            setTempBarcode(null);
            return;
          }

          const newElement = {
            id: generateId(),
            type: "barcode",
            x: Math.min(barcodeDrawStart.x, x),
            y: Math.min(barcodeDrawStart.y, y),
            width: Math.max(width, 100),
            height: Math.max(height, 50),
            content: "123456789",
            barcodeType: "CODE128",
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

          const newElements = [...elements, newElement];
          setElements(newElements);
          setSelectedElementId(newElement.id);
          setSelectedBarcodeType("CODE128");
          setIsDrawingBarcode(false);
          setBarcodeDrawStart(null);
          setTempBarcode(null);
          saveToHistory(newElements);
        } else if (isDrawingShape && shapeDrawStart && currentShapeType) {
          const width = Math.abs(x - shapeDrawStart.x);
          const height = Math.abs(y - shapeDrawStart.y);

          if (width < 20 || height < 20) {
            setIsDrawingShape(false);
            setShapeDrawStart(null);
            setTempShape(null);
            return;
          }

          const newElement = {
            id: generateId(),
            type: currentShapeType,
            x: Math.min(shapeDrawStart.x, x),
            y: Math.min(shapeDrawStart.y, y),
            width: Math.max(width, 30),
            height: Math.max(height, 30),
            borderWidth: 2,
            borderColor: "#000000",
            borderStyle: "solid",
            borderRadius: currentShapeType === "rectangle" ? 0 : undefined,
            backgroundColor: "transparent",
            rotation: 0,
            zIndex: elements.length,
          };

          const newElements = [...elements, newElement];
          setElements(newElements);
          setSelectedElementId(newElement.id);
          setIsDrawingShape(false);
          setShapeDrawStart(null);
          setTempShape(null);
          saveToHistory(newElements);
        }
      },
      [
        isDrawingLine,
        lineDrawStart,
        isDrawingBarcode,
        barcodeDrawStart,
        isDrawingShape,
        shapeDrawStart,
        currentShapeType,
        displayZoom,
        generateId,
        elements,
        setElements,
        setSelectedElementId,
        setSelectedBarcodeType,
        setIsDrawingLine,
        setIsDrawingBarcode,
        setIsDrawingShape,
        saveToHistory,
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

          const newElement = {
            id: generateId(),
            type: draggedElement,
            x: Math.max(0, Math.min(x - 50, canvasPixelSize.width - 100)),
            y: Math.max(0, Math.min(y - 25, canvasPixelSize.height - 50)),
            width:
              draggedElement === "text"
                ? 120
                : draggedElement === "barcode"
                  ? 200
                  : 100,
            height:
              draggedElement === "text"
                ? 30
                : draggedElement === "barcode"
                  ? 100
                  : 100,
            content:
              draggedElement === "text"
                ? "New Text"
                : draggedElement === "barcode"
                  ? "123456789"
                  : "",
            barcodeType: draggedElement === "barcode" ? "CODE128" : undefined,
            fontSize: 14,
            fontFamily: "Arial",
            color: "#000000",
            backgroundColor: "transparent",
            borderWidth: 0,
            borderColor: "#000000",
            borderStyle: "solid",
            rotation: 0,
            zIndex: elements.length,
          };
          const newElements = [...elements, newElement];
          setElements(newElements);
          setSelectedElementId(newElement.id);
          setDraggedElement(null);
          saveToHistory(newElements);
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
      ],
    );

    useEffect(() => {
      if (isDragging || isResizing || isDraggingLinePoint) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [
      isDragging,
      isResizing,
      isDraggingLinePoint,
      handleMouseMove,
      handleMouseUp,
    ]);

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
      isDrawingLine,
      isDrawingBarcode,
      isDrawingShape,
      setIsDrawingLine,
      setIsDrawingBarcode,
      setIsDrawingShape,
    ]);

    const renderResizeHandles = useCallback(
      (element) => {
        if (element.id !== selectedElementId || element.type === "line")
          return null;

        const handles = [
          { pos: "nw", cursor: "nw-resize", style: { left: -4, top: -4 } },
          {
            pos: "n",
            cursor: "n-resize",
            style: { left: "50%", top: -4, transform: "translateX(-50%)" },
          },
          { pos: "ne", cursor: "ne-resize", style: { right: -4, top: -4 } },
          {
            pos: "e",
            cursor: "e-resize",
            style: { right: -4, top: "50%", transform: "translateY(-50%)" },
          },
          { pos: "se", cursor: "se-resize", style: { right: -4, bottom: -4 } },
          {
            pos: "s",
            cursor: "s-resize",
            style: { left: "50%", bottom: -4, transform: "translateX(-50%)" },
          },
          { pos: "sw", cursor: "sw-resize", style: { left: -4, bottom: -4 } },
          {
            pos: "w",
            cursor: "w-resize",
            style: { left: -4, top: "50%", transform: "translateY(-50%)" },
          },
        ];

        return handles.map((handle) => (
          <div
            key={handle.pos}
            className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm z-50"
            style={{
              ...handle.style,
              cursor: handle.cursor,
              pointerEvents:
                isDrawingLine || isDrawingBarcode || isDrawingShape
                  ? "none"
                  : "auto",
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, element, handle.pos)}
          />
        ));
      },
      [
        selectedElementId,
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        handleResizeMouseDown,
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
                  isDrawingLine || isDrawingBarcode || isDrawingShape
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
                strokeWidth={element.borderWidth || 2}
                strokeDasharray={
                  element.borderStyle === "dashed"
                    ? "5,5"
                    : element.borderStyle === "dotted"
                      ? "2,2"
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
                !isDrawingShape && (
                  <>
                    <circle
                      cx={x1}
                      cy={y1}
                      r="6"
                      fill="white"
                      stroke="#0066cc"
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
                      r="6"
                      fill="white"
                      stroke="#0066cc"
                      strokeWidth="2"
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLinePointMouseDown(e, element, "end");
                      }}
                    />

                    <rect
                      x={Math.min(x1, x2) - 2}
                      y={Math.min(y1, y2) - 2}
                      width={Math.abs(x2 - x1) + 4}
                      height={Math.abs(y2 - y1) + 4}
                      fill="none"
                      stroke="#0066cc"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      pointerEvents="none"
                    />
                  </>
                )}
            </svg>
          );
        }

        const style = {
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation || 0}deg)`,
          zIndex: element.zIndex || 0,
          cursor: isDragging
            ? "grabbing"
            : isDrawingLine || isDrawingBarcode || isDrawingShape
              ? "crosshair"
              : "move",
          border:
            isSelected && !isDrawingLine && !isDrawingBarcode && !isDrawingShape
              ? "2px solid #0066cc"
              : "1px solid transparent",
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign,
          color: element.color,
          backgroundColor: element.backgroundColor,
          borderWidth:
            !isSelected && element.borderWidth > 0
              ? element.borderWidth
              : undefined,
          borderColor:
            !isSelected && element.borderWidth > 0
              ? element.borderColor
              : undefined,
          borderStyle:
            !isSelected && element.borderWidth > 0
              ? element.borderStyle || "solid"
              : undefined,
          borderRadius: element.borderRadius
            ? `${element.borderRadius}px`
            : element.type === "circle"
              ? "50%"
              : undefined,
          userSelect: "none",
          pointerEvents:
            isDrawingLine || isDrawingBarcode || isDrawingShape
              ? "none"
              : "auto",
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
                      ? "2px dashed #0066cc"
                      : "none",
                  backgroundColor: "transparent",
                  overflow: "visible",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="select-none"
              >
                <span
                  className="whitespace-nowrap"
                  style={{
                    overflow: "visible",
                    display: "inline-block",
                    lineHeight: "normal",
                  }}
                >
                  {element.content || "{{placeholder}}"}
                </span>
                {renderResizeHandles(element)}
              </div>
            );
          case "text":
            return (
              <div
                key={element.id}
                style={style}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="flex items-center px-2 select-none overflow-hidden"
              >
                <span className="whitespace-nowrap overflow-hidden w-full">
                  {element.content}
                </span>
                {renderResizeHandles(element)}
              </div>
            );
          case "barcode":
            return (
              <div
                key={element.id}
                style={style}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                className="flex items-center justify-center bg-white select-none overflow-hidden"
              >
                <BarcodeElement element={element} />
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
        isDrawingLine,
        isDrawingBarcode,
        isDrawingShape,
        isDragging,
        displayZoom,
        handleElementMouseDown,
        handleLinePointMouseDown,
        renderResizeHandles,
      ],
    );

    const Ruler = useCallback(
      ({ orientation, unit = MM_TO_PX, maxLength }) => {
        const isHorizontal = orientation === "horizontal";
        const marks = [];

        const actualLengthMM = isHorizontal
          ? labelSize?.width || 100
          : labelSize?.height || 80;

        for (let i = 0; i <= actualLengthMM; i++) {
          marks.push(i);
        }

        return (
          <div
            className="bg-gray-50 relative flex-shrink-0"
            style={{
              width: isHorizontal ? `${maxLength}px` : `${RULER_SIZE}px`,
              height: isHorizontal ? `${RULER_SIZE}px` : `${maxLength}px`,
              borderRight: isHorizontal ? "none" : "1px solid #d1d5db",
              borderBottom: isHorizontal ? "1px solid #d1d5db" : "none",
            }}
          >
            {marks.map((mark) => {
              const position = mark * unit * (displayZoom / 100);
              const isMajorMark = mark % 10 === 0;
              const isMediumMark = mark % 5 === 0;

              return (
                <div key={mark}>
                  <div
                    className="absolute bg-gray-600"
                    style={
                      isHorizontal
                        ? {
                            left: `${position}px`,
                            bottom: "0",
                            width: "1px",
                            height: isMajorMark
                              ? "16px"
                              : isMediumMark
                                ? "10px"
                                : "6px",
                          }
                        : {
                            top: `${position}px`,
                            right: "0",
                            height: "1px",
                            width: isMajorMark
                              ? "16px"
                              : isMediumMark
                                ? "10px"
                                : "6px",
                          }
                    }
                  />

                  {isMajorMark && (
                    <span
                      className="absolute text-xs text-gray-700 font-medium select-none"
                      style={
                        isHorizontal
                          ? {
                              left: `${position}px`,
                              top: "4px",
                              transform: "translateX(-50%)",
                            }
                          : {
                              left: "2px",
                              top: `${position}px`,
                              transform: "translateY(-50%)",
                              width: `${RULER_SIZE - 18}px`,
                              textAlign: "right",
                            }
                      }
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
      [labelSize, displayZoom],
    );

    const maxRulerLength = Math.max(displayWidth + 2000, 3000);
    const maxRulerHeightLength = Math.max(displayHeight + 2000, 3000);
    const canvasCursor =
      isDrawingLine || isDrawingBarcode || isDrawingShape
        ? "crosshair"
        : "default";

    return (
      <div
        ref={containerRef}
        className="h-full w-full flex flex-col bg-gray-200 relative overflow-hidden"
      >
        <div className="flex flex-shrink-0">
          <div
            className="bg-gray-50 border-r border-b border-gray-300 flex items-center justify-center flex-shrink-0"
            style={{
              width: `${RULER_SIZE}px`,
              height: `${RULER_SIZE}px`,
            }}
          >
            <span className="text-xs font-bold text-blue-600">MM</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div
              style={{
                width: `${maxRulerLength}px`,
                marginLeft: `-${scrollOffset.x}px`,
              }}
            >
              <Ruler orientation="horizontal" maxLength={maxRulerLength} />
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="overflow-hidden relative flex-shrink-0">
            <div
              style={{
                height: `${maxRulerHeightLength}px`,
                marginTop: `-${scrollOffset.y}px`,
              }}
            >
              <Ruler orientation="vertical" maxLength={maxRulerHeightLength} />
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-gray-200"
            style={{
              scrollbarWidth: "thin",
            }}
          >
            <div
              style={{
                padding: "200px",
                paddingTop: "calc(200px - 8rem)",
                minWidth: "100%",
                minHeight: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                ref={canvasRef}
                className="relative bg-white"
                style={{
                  width: `${canvasPixelSize.width}px`,
                  height: `${canvasPixelSize.height}px`,
                  transform: `scale(${displayZoom / 100})`,
                  transformOrigin: "center center",
                  border: "2px solid #666",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
                  backgroundImage: showGrid
                    ? "radial-gradient(circle, #e5e7eb 1px, transparent 1px)"
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
                    !isDrawingLine &&
                    !isDrawingBarcode &&
                    !isDrawingShape
                  ) {
                    setSelectedElementId(null);
                  }
                }}
              >
                {elements.map(renderElement)}

                {tempLine && (
                  <svg
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  >
                    <line
                      x1={tempLine.x1}
                      y1={tempLine.y1}
                      x2={tempLine.x2}
                      y2={tempLine.y2}
                      stroke="#0066cc"
                      strokeWidth="2"
                      opacity="0.7"
                    />
                  </svg>
                )}

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
                        border: "2px dashed #0066cc",
                        backgroundColor: "rgba(0, 102, 204, 0.1)",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="text-xs text-blue-600 font-semibold">
                        Barcode: {Math.round(tempBarcode.width / MM_TO_PX)} ×{" "}
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
                    <span className="text-xs text-purple-600 font-semibold">
                      {tempShape.type === "rectangle" ? "Rectangle" : "Circle"}:{" "}
                      {Math.round(tempShape.width / MM_TO_PX)} ×{" "}
                      {Math.round(tempShape.height / MM_TO_PX)}mm
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
