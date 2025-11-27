import React, { useState, useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import bwipjs from "bwip-js";
import {
  Table,
  Save,
  Edit2,
  Trash2,
  ArrowLeft,
  Package,
  Plus,
  Search,
  FolderOpen,
  ChevronDown,
  X,
  FileText,
  Tag,
  Printer,
} from "lucide-react";

const EnhancedManager = () => {
  // Parts state
  const [partNo, setPartNo] = useState("");
  const [model, setModel] = useState("");
  const [prefix, setPrefix] = useState("");
  const [parts, setParts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Labels state
  const [labels, setLabels] = useState([]);
  const [currentLabel, setCurrentLabel] = useState(null);

  // Label Designer state
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [labelSize, setLabelSize] = useState({ width: 100, height: 80 });
  const [showGrid, setShowGrid] = useState(true);
  const canvasRef = useRef(null);
  const elementIdCounter = useRef(0);

  const MM_TO_PX = 3.7795275591;

  const getCanvasPixelSize = () => ({
    width: labelSize.width * MM_TO_PX,
    height: labelSize.height * MM_TO_PX,
  });

  const calculateAutoZoom = () => {
    const pixelSize = getCanvasPixelSize();
    const minDisplaySize = 400;
    const widthZoom = (minDisplaySize / pixelSize.width) * 100;
    const heightZoom = (minDisplaySize / pixelSize.height) * 100;
    const autoZoom = Math.max(widthZoom, heightZoom, 100);
    return Math.min(autoZoom, 300);
  };

  const displayZoom = calculateAutoZoom();

  const [showBarcodePopup, setShowBarcodePopup] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [selectedBarcodeType, setSelectedBarcodeType] = useState("CODE128");

  const [currentView, setCurrentView] = useState("parts");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLabelNameModal, setShowLabelNameModal] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelToPreview, setLabelToPreview] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printCanvasRef = useRef(null);

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128", library: "jsbarcode" },
    { value: "CODE39", label: "Code 39", library: "jsbarcode" },
    { value: "EAN13", label: "EAN-13", library: "jsbarcode" },
    { value: "EAN8", label: "EAN-8", library: "jsbarcode" },
    { value: "UPC", label: "UPC-A", library: "jsbarcode" },
    { value: "ITF14", label: "ITF-14", library: "jsbarcode" },
    { value: "MSI", label: "MSI", library: "jsbarcode" },
    { value: "pharmacode", label: "Pharmacode", library: "jsbarcode" },
    { value: "codabar", label: "Codabar", library: "jsbarcode" },
    { value: "QR", label: "QR Code", library: "qrcode" },
    { value: "DATAMATRIX", label: "Data Matrix", library: "bwip" },
    { value: "PDF417", label: "PDF417", library: "bwip" },
    { value: "AZTEC", label: "Aztec Code", library: "bwip" },
  ];

  const generateId = () => `element_${++elementIdCounter.current}`;

  const BarcodeElement = ({ element }) => {
    const barcodeRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
      const barcodeType = barcodeTypes.find(
        (t) => t.value === element.barcodeType
      );
      if (!barcodeType) return;

      try {
        if (barcodeType.library === "jsbarcode" && barcodeRef.current) {
          JsBarcode(barcodeRef.current, element.content || "123456789", {
            format: element.barcodeType || "CODE128",
            width: element.barcodeWidth || 2,
            height: element.barcodeHeight || 40,
            displayValue: true,
            fontSize: 12,
            margin: 5,
          });
        } else if (barcodeType.library === "bwip" && canvasRef.current) {
          const bcidMap = {
            DATAMATRIX: "datamatrix",
            PDF417: "pdf417",
            AZTEC: "azteccode",
          };
          bwipjs.toCanvas(canvasRef.current, {
            bcid: bcidMap[element.barcodeType] || "datamatrix",
            text: element.content || "123456789",
            scale: element.barcodeWidth || 3,
            height: element.barcodeHeight || 10,
            includetext: false,
            textxalign: "center",
          });
        }
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }, [
      element.content,
      element.barcodeType,
      element.barcodeWidth,
      element.barcodeHeight,
    ]);

    const barcodeType = barcodeTypes.find(
      (t) => t.value === element.barcodeType
    );

    if (barcodeType?.library === "qrcode") {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-2">
          <QRCodeSVG
            value={element.content || "123456789"}
            size={Math.min(element.width - 20, element.height - 40)}
          />
          <div className="text-xs mt-1 text-center font-medium break-all">
            {element.content || "123456789"}
          </div>
        </div>
      );
    }

    if (barcodeType?.library === "bwip") {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-2">
          <canvas
            ref={canvasRef}
            style={{ maxWidth: "100%", maxHeight: "calc(100% - 20px)" }}
          ></canvas>
          <div className="text-xs mt-1 text-center font-medium break-all">
            {element.content || "123456789"}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center w-full h-full">
        <svg ref={barcodeRef}></svg>
      </div>
    );
  };

  const handleSave = () => {
    if (partNo && model && prefix) {
      const currentTime = new Date().toLocaleString();
      if (editIndex !== null) {
        const updatedParts = [...parts];
        updatedParts[editIndex] = {
          partNo,
          model,
          prefix,
          createdAt: parts[editIndex].createdAt,
        };
        setParts(updatedParts);
        setEditIndex(null);
      } else {
        setParts([...parts, { partNo, model, prefix, createdAt: currentTime }]);
      }
      setPartNo("");
      setModel("");
      setPrefix("");
    }
  };

  const handleEdit = (index) => {
    const part = parts[index];
    setPartNo(part.partNo);
    setModel(part.model);
    setPrefix(part.prefix);
    setEditIndex(index);
    setCurrentView("parts");
  };

  const handleDelete = (index) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleCreateLabel = () => {
    setShowLabelNameModal(true);
    setShowAddMenu(false);
  };

  const handleLabelNameSubmit = () => {
    if (labelName.trim()) {
      const newLabel = {
        id: `label_${Date.now()}`,
        name: labelName.trim(),
        elements: [],
        labelSize: { width: 100, height: 80 },
        createdAt: new Date().toLocaleString(),
        lastModified: new Date().toLocaleString(),
      };
      setLabels([...labels, newLabel]);
      setCurrentLabel(newLabel);
      setElements([]);
      setSelectedElementId(null);
      setLabelSize({ width: 100, height: 80 });
      setCurrentView("labelDesigner");
      setLabelName("");
      setShowLabelNameModal(false);
    }
  };

  const handleEditLabel = (label) => {
    setCurrentLabel(label);
    setElements(label.elements || []);
    setLabelSize(label.labelSize || { width: 100, height: 80 });
    setSelectedElementId(null);
    setCurrentView("labelDesigner");
  };

  const handleDeleteLabel = (labelId) => {
    setLabels(labels.filter((label) => label.id !== labelId));
  };

  const handleSaveLabel = () => {
    if (currentLabel) {
      const updatedLabels = labels.map((label) =>
        label.id === currentLabel.id
          ? {
              ...label,
              elements,
              labelSize,
              lastModified: new Date().toLocaleString(),
            }
          : label
      );
      setLabels(updatedLabels);
      setCurrentLabel({ ...currentLabel, elements, labelSize });
      alert("Label saved successfully!");
      setCurrentView("labels");
    }
  };

  const handlePrintLabel = (label) => {
    setLabelToPreview(label);
    setShowPrintPreview(true);
  };

  const handleActualPrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setLabelToPreview(null);
  };

  const handleBarcodeTypeChange = (newType) => {
    if (selectedElementId) {
      setSelectedBarcodeType(newType);
      setShowBarcodePopup(true);
    }
  };

  const handleBarcodeCreate = () => {
    if (barcodeValue.trim() && selectedElementId) {
      updateElement(selectedElementId, {
        content: barcodeValue.trim(),
        barcodeType: selectedBarcodeType,
      });
      setShowBarcodePopup(false);
      setBarcodeValue("");
    }
  };

  const handleBarcodePopupClose = () => {
    setShowBarcodePopup(false);
    setBarcodeValue("");
  };

  const addElement = (type) => {
    const newElement = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 120 : type === "barcode" ? 200 : 100,
      height: type === "text" ? 30 : type === "barcode" ? 100 : 100,
      content:
        type === "text" ? "Sample Text" : type === "barcode" ? "123456789" : "",
      barcodeType: type === "barcode" ? "CODE128" : undefined,
      barcodeWidth: type === "barcode" ? 2 : undefined,
      barcodeHeight: type === "barcode" ? 40 : undefined,
      fontSize: 14,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "left",
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "#000000",
      rotation: 0,
      zIndex: elements.length,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id, updates) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = () => {
    if (selectedElementId) {
      setElements(elements.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  const onDragStart = (e, elementType) => {
    setDraggedElement(elementType);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (draggedElement) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newElement = {
        id: generateId(),
        type: draggedElement,
        x: Math.max(0, x - 50),
        y: Math.max(0, y - 25),
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
        barcodeWidth: draggedElement === "barcode" ? 2 : undefined,
        barcodeHeight: draggedElement === "barcode" ? 40 : undefined,
        fontSize: 14,
        fontFamily: "Arial",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "left",
        color: "#000000",
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "#000000",
        rotation: 0,
        zIndex: elements.length,
      };
      setElements([...elements, newElement]);
      setSelectedElementId(newElement.id);
      setDraggedElement(null);
    }
  };

  const renderElement = (element) => {
    const isSelected = element.id === selectedElementId;
    const style = {
      position: "absolute",
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      zIndex: element.zIndex,
      cursor: "move",
      border: isSelected ? "2px solid #0066cc" : "1px solid transparent",
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      fontStyle: element.fontStyle,
      textDecoration: element.textDecoration,
      textAlign: element.textAlign,
      color: element.color,
      backgroundColor: element.backgroundColor,
      borderWidth: element.borderWidth,
      borderColor: element.borderColor,
      borderStyle: element.borderWidth > 0 ? "solid" : "none",
    };

    const handleElementClick = (e) => {
      e.stopPropagation();
      setSelectedElementId(element.id);
      if (element.type === "barcode") {
        setSelectedBarcodeType(element.barcodeType || "CODE128");
      }
    };

    switch (element.type) {
      case "text":
        return (
          <div
            key={element.id}
            style={style}
            onClick={handleElementClick}
            className="flex items-center px-2 select-none"
          >
            {element.content}
          </div>
        );
      case "barcode":
        return (
          <div
            key={element.id}
            style={style}
            onClick={handleElementClick}
            className="flex items-center justify-center bg-white select-none overflow-hidden"
          >
            <BarcodeElement element={element} />
          </div>
        );
      case "image":
        return (
          <div
            key={element.id}
            style={style}
            onClick={handleElementClick}
            className="flex items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 select-none"
          >
            <Package className="text-gray-500" size={24} />
          </div>
        );
      case "rectangle":
        return (
          <div
            key={element.id}
            style={style}
            onClick={handleElementClick}
            className="border select-none"
          ></div>
        );
      case "circle":
        return (
          <div
            key={element.id}
            style={{ ...style, borderRadius: "50%" }}
            onClick={handleElementClick}
            className="border select-none"
          ></div>
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    if (currentView === "labelDesigner") {
      setCurrentView("labels");
      setCurrentLabel(null);
      setElements([]);
      setSelectedElementId(null);
    } else if (currentView === "partsTable") {
      setCurrentView("parts");
      if (editIndex !== null) {
        setEditIndex(null);
        setPartNo("");
        setModel("");
        setPrefix("");
      }
    } else if (currentView === "labels") {
      setCurrentView("parts");
    }
  };

  const filteredParts = parts.filter(
    (part) =>
      part.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.prefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFormValid = partNo && model && prefix;
  const selectedEl = elements.find((el) => el.id === selectedElementId);

  const getViewTitle = () => {
    switch (currentView) {
      case "parts":
        return editIndex !== null ? "Edit Part" : "Add Part";
      case "partsTable":
        return "Parts Inventory";
      case "labels":
        return "Label Library";
      case "labelDesigner":
        return currentLabel ? `Design: ${currentLabel.name}` : "Label Designer";
      default:
        return "Dashboard";
    }
  };

  const canvasPixelSize = getCanvasPixelSize();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {currentView !== "parts" && currentView !== "labels" && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
                  <Package className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-medium text-gray-900">
                  {getViewTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-800 hover:bg-gray-100 rounded-lg shadow"
                >
                  <Plus size={18} />
                  <ChevronDown size={16} />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <button
                      onClick={() => {
                        setCurrentView("parts");
                        setShowAddMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <Package size={18} className="text-blue-600" />
                      <span>Add Part</span>
                    </button>
                    <button
                      onClick={handleCreateLabel}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <Tag size={18} className="text-green-600" />
                      <span>Create Label</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentView("labels")}
                className="flex items-center space-x-2 px-5 py-3 text-gray-700 hover:text-blue-700 bg-white hover:bg-blue-50 border rounded-xl"
              >
                <FolderOpen size={18} />
                <span className="font-medium">Library</span>
              </button>

              {currentView === "parts" && (
                <button
                  onClick={() => setCurrentView("partsTable")}
                  className="flex items-center space-x-2 px-5 py-3 text-gray-700 hover:text-purple-700 bg-white hover:bg-purple-50 border rounded-xl"
                >
                  <Table size={18} />
                  <span className="font-medium">View All</span>
                  <span className="px-2.5 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">
                    {parts.length}
                  </span>
                </button>
              )}

              {currentView === "parts" && (
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold ${
                    isFormValid
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Save size={18} />
                  <span>
                    {editIndex !== null ? "Update Part" : "Save Part"}
                  </span>
                </button>
              )}

              {currentView === "labelDesigner" && (
                <button
                  onClick={handleSaveLabel}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold"
                >
                  <Save size={18} />
                  <span>Save Label</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden">
        {currentView === "parts" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-lg font-medium text-white">
                  {editIndex !== null
                    ? "Edit Part Details"
                    : "Enter Part Details"}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <input
                  type="text"
                  value={partNo}
                  onChange={(e) => setPartNo(e.target.value)}
                  placeholder="Part Number"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Prefix"
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {currentView === "partsTable" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search parts..."
                  className="w-full pl-10 pr-3 py-3 border rounded-lg"
                />
              </div>
              <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {filteredParts.length} of {parts.length} parts
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg">
              {filteredParts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {parts.length === 0
                      ? "No parts added yet"
                      : "No parts found"}
                  </h3>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Part Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Model
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Prefix
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Created At
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParts.map((row, index) => {
                      const originalIndex = parts.findIndex(
                        (part) =>
                          part.partNo === row.partNo &&
                          part.model === row.model &&
                          part.prefix === row.prefix &&
                          part.createdAt === row.createdAt
                      );
                      return (
                        <tr key={originalIndex} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {row.partNo}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {row.model}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {row.prefix}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {row.createdAt}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(originalIndex)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(originalIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {currentView === "labels" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search labels..."
                  className="w-full pl-10 pr-3 py-3 border rounded-lg"
                />
              </div>
              <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {filteredLabels.length} of {labels.length} labels
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg">
              {filteredLabels.length === 0 ? (
                <div className="text-center py-16">
                  <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {labels.length === 0
                      ? "No labels created yet"
                      : "No labels found"}
                  </h3>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Label Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Size (mm)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Elements
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLabels.map((label) => (
                      <tr key={label.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {label.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {label.labelSize?.width || 100} ×{" "}
                            {label.labelSize?.height || 80} mm
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {label.elements?.length || 0} elements
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePrintLabel(label)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                              title="Print"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleEditLabel(label)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(label.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {currentView === "labelDesigner" && (
          <div className="h-screen flex bg-gray-50 -m-8">
            <div className="w-24 bg-white border-r flex flex-col py-4">
              <div className="text-xs font-semibold text-gray-600 text-center mb-4">
                ELEMENTS
              </div>
              <div className="flex flex-col space-y-3 px-2">
                <button
                  draggable
                  onDragStart={(e) => onDragStart(e, "text")}
                  onClick={() => addElement("text")}
                  className="p-3 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-200 flex flex-col items-center space-y-1"
                >
                  <FileText size={24} className="text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">
                    Text
                  </span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => onDragStart(e, "barcode")}
                  onClick={() => addElement("barcode")}
                  className="p-3 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-200 flex flex-col items-center space-y-1"
                >
                  <div className="text-2xl">📊</div>
                  <span className="text-xs font-medium text-gray-600">
                    Barcode
                  </span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => onDragStart(e, "image")}
                  onClick={() => addElement("image")}
                  className="p-3 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-200 flex flex-col items-center space-y-1"
                >
                  <div className="text-2xl">🖼️</div>
                  <span className="text-xs font-medium text-gray-600">
                    Image
                  </span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => onDragStart(e, "rectangle")}
                  onClick={() => addElement("rectangle")}
                  className="p-3 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-200 flex flex-col items-center space-y-1"
                >
                  <div className="text-2xl">⬜</div>
                  <span className="text-xs font-medium text-gray-600">
                    Shape
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center items-center bg-gray-100">
              <div className="mb-4 text-sm text-gray-600">
                Label Size: {labelSize.width} × {labelSize.height} mm | Zoom:{" "}
                {Math.round(displayZoom)}%
              </div>
              <div className="bg-white shadow-xl rounded-lg p-4">
                <div
                  ref={canvasRef}
                  className="relative border-2 border-gray-300"
                  style={{
                    width: canvasPixelSize.width,
                    height: canvasPixelSize.height,
                    transform: `scale(${displayZoom / 100})`,
                    transformOrigin: "center",
                    backgroundImage: showGrid
                      ? "radial-gradient(circle, #e5e7eb 1px, transparent 1px)"
                      : "none",
                    backgroundSize: showGrid ? "20px 20px" : "auto",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onClick={() => setSelectedElementId(null)}
                >
                  {elements.map(renderElement)}
                </div>
              </div>
            </div>

            <div className="w-72 bg-white border-l flex flex-col overflow-y-auto">
              <div className="p-4 border-b">
                <h3 className="font-bold text-gray-800">Properties</h3>
              </div>
              <div className="flex-1 p-4 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Label Size (mm)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        value={labelSize.width}
                        onChange={(e) =>
                          setLabelSize({
                            ...labelSize,
                            width: Number(e.target.value),
                          })
                        }
                        min="10"
                        max="500"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        value={labelSize.height}
                        onChange={(e) =>
                          setLabelSize({
                            ...labelSize,
                            height: Number(e.target.value),
                          })
                        }
                        min="10"
                        max="500"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Auto-zoom: {Math.round(displayZoom)}%
                  </p>
                </div>

                {selectedEl && (
                  <>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Actions
                      </h4>
                      <button
                        onClick={deleteElement}
                        className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>

                    {selectedEl.type === "barcode" && (
                      <>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">
                            Barcode Type
                          </h4>
                          <select
                            value={selectedEl.barcodeType || "CODE128"}
                            onChange={(e) =>
                              handleBarcodeTypeChange(e.target.value)
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          >
                            {barcodeTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">
                            Barcode Size
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {selectedEl.barcodeType === "QR" ||
                                selectedEl.barcodeType === "DATAMATRIX" ||
                                selectedEl.barcodeType === "PDF417" ||
                                selectedEl.barcodeType === "AZTEC"
                                  ? "Scale"
                                  : "Width"}
                              </label>
                              <input
                                type="number"
                                value={selectedEl.barcodeWidth || 2}
                                onChange={(e) =>
                                  updateElement(selectedEl.id, {
                                    barcodeWidth: Number(e.target.value),
                                  })
                                }
                                min="1"
                                max="10"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Height
                              </label>
                              <input
                                type="number"
                                value={selectedEl.barcodeHeight || 40}
                                onChange={(e) =>
                                  updateElement(selectedEl.id, {
                                    barcodeHeight: Number(e.target.value),
                                  })
                                }
                                min="10"
                                max="200"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {selectedEl.barcodeType === "QR" ||
                            selectedEl.barcodeType === "DATAMATRIX" ||
                            selectedEl.barcodeType === "PDF417" ||
                            selectedEl.barcodeType === "AZTEC"
                              ? "Scale controls the barcode density"
                              : "Width controls bar width, Height controls bar height"}
                          </p>
                        </div>
                      </>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Position & Size
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            X
                          </label>
                          <input
                            type="number"
                            value={selectedEl.x}
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                x: Number(e.target.value),
                              })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Y
                          </label>
                          <input
                            type="number"
                            value={selectedEl.y}
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                y: Number(e.target.value),
                              })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Width
                          </label>
                          <input
                            type="number"
                            value={selectedEl.width}
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                width: Number(e.target.value),
                              })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Height
                          </label>
                          <input
                            type="number"
                            value={selectedEl.height}
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                height: Number(e.target.value),
                              })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {(selectedEl.type === "text" ||
                      selectedEl.type === "barcode") && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">
                          Content
                        </h4>
                        <textarea
                          value={selectedEl.content}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              content: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                          rows={3}
                          placeholder="Enter content..."
                        />
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Colors
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Text
                          </label>
                          <input
                            type="color"
                            value={selectedEl.color}
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                color: e.target.value,
                              })
                            }
                            className="w-full h-10 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Background
                          </label>
                          <input
                            type="color"
                            value={
                              selectedEl.backgroundColor === "transparent"
                                ? "#ffffff"
                                : selectedEl.backgroundColor
                            }
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                backgroundColor: e.target.value,
                              })
                            }
                            className="w-full h-10 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!selectedEl && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg mb-2">No element selected</div>
                    <div className="text-sm">Click on an element to edit</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showBarcodePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Enter Barcode Value
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Type:{" "}
                  {
                    barcodeTypes.find((t) => t.value === selectedBarcodeType)
                      ?.label
                  }
                </p>
              </div>
              <button
                onClick={handleBarcodePopupClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode Value
              </label>
              <input
                type="text"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                placeholder="Enter value..."
                className="w-full px-4 py-3 border rounded-lg"
                onKeyPress={(e) => e.key === "Enter" && handleBarcodeCreate()}
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleBarcodePopupClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBarcodeCreate}
                  disabled={!barcodeValue.trim()}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    barcodeValue.trim()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLabelNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Label
              </h3>
              <button
                onClick={() => {
                  setShowLabelNameModal(false);
                  setLabelName("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Name
              </label>
              <input
                type="text"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="Enter label name..."
                className="w-full px-4 py-3 border rounded-lg"
                onKeyPress={(e) => e.key === "Enter" && handleLabelNameSubmit()}
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowLabelNameModal(false);
                    setLabelName("");
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLabelNameSubmit}
                  disabled={!labelName.trim()}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    labelName.trim()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAddMenu(false)}
        />
      )}

      {showPrintPreview && labelToPreview && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Print Preview: {labelToPreview.name}
                </h3>
                <button
                  onClick={handleClosePrintPreview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 text-sm text-gray-600">
                  Label Size: {labelToPreview.labelSize?.width || 100} ×{" "}
                  {labelToPreview.labelSize?.height || 80} mm
                </div>
                <div className="flex justify-center bg-gray-50 p-8 border-2 border-dashed border-gray-300">
                  <div
                    className="bg-white shadow-lg border"
                    style={{
                      width: `${
                        (labelToPreview.labelSize?.width || 100) * MM_TO_PX
                      }px`,
                      height: `${
                        (labelToPreview.labelSize?.height || 80) * MM_TO_PX
                      }px`,
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    {(labelToPreview.elements || []).map((element) => {
                      const style = {
                        position: "absolute",
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        fontSize: element.fontSize,
                        fontFamily: element.fontFamily,
                        color: element.color,
                        backgroundColor: element.backgroundColor,
                      };
                      if (element.type === "text")
                        return (
                          <div
                            key={element.id}
                            style={style}
                            className="flex items-center px-2"
                          >
                            {element.content}
                          </div>
                        );
                      if (element.type === "barcode")
                        return (
                          <div
                            key={element.id}
                            style={style}
                            className="flex items-center justify-center"
                          >
                            <BarcodeElement element={element} />
                          </div>
                        );
                      return null;
                    })}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleClosePrintPreview}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActualPrint}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                  >
                    <Printer size={18} />
                    <span>Print Label</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden print:block">
            <div
              ref={printCanvasRef}
              className="bg-white"
              style={{
                width: `${
                  (labelToPreview.labelSize?.width || 100) * MM_TO_PX
                }px`,
                height: `${
                  (labelToPreview.labelSize?.height || 80) * MM_TO_PX
                }px`,
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {(labelToPreview.elements || []).map((element) => {
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
                  borderStyle: element.borderWidth > 0 ? "solid" : "none",
                };
                if (element.type === "text")
                  return (
                    <div
                      key={element.id}
                      style={style}
                      className="flex items-center px-2"
                    >
                      {element.content}
                    </div>
                  );
                if (element.type === "barcode")
                  return (
                    <div
                      key={element.id}
                      style={style}
                      className="flex items-center justify-center bg-white"
                    >
                      <BarcodeElement element={element} />
                    </div>
                  );
                if (element.type === "rectangle")
                  return <div key={element.id} style={style}></div>;
                if (element.type === "circle")
                  return (
                    <div
                      key={element.id}
                      style={{ ...style, borderRadius: "50%" }}
                    ></div>
                  );
                return null;
              })}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page {
            size: ${
              labelToPreview
                ? `${labelToPreview.labelSize?.width || 100}mm ${
                    labelToPreview.labelSize?.height || 80
                  }mm`
                : "auto"
            };
            margin: 0;
          }
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedManager;
