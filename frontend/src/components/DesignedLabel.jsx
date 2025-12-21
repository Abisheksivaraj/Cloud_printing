import {
  Eye,
  X,
  Calendar,
  Archive,
  FileText,
  Download,
  Layers,
  Printer,
  Upload,
  FileUp,
  Sparkles,
} from "lucide-react";
import React, { useState, useEffect } from "react";

const DesignedLabel = () => {
  const [savedLabels, setSavedLabels] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLabelData, setPreviewLabelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [extractedPdfText, setExtractedPdfText] = useState("");

  // Load saved labels from storage on component mount
  useEffect(() => {
    loadSavedLabels();
  }, []);

  const loadSavedLabels = async () => {
    try {
      const result = await window.storage.list("label:");
      if (result && result.keys) {
        const labelPromises = result.keys.map(async (key) => {
          const data = await window.storage.get(key);
          return data ? JSON.parse(data.value) : null;
        });
        const labels = (await Promise.all(labelPromises)).filter(Boolean);
        setSavedLabels(labels);
      }
    } catch (error) {
      console.error("Error loading saved labels:", error);
    } finally {
      setLoading(false);
    }
  };

  // Preview functionality
  const showLabelPreview = (label) => {
    setPreviewLabelData(label);
    setShowPreviewModal(true);
  };

  // Print functionality
  const printLabel = (label) => {
    const printContent = generatePrintContent(label);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generatePrintContent = (label) => {
    const labelWidthPx = Math.max(400, label.dimensions.width * 3.78);
    const labelHeightPx = Math.max(300, label.dimensions.height * 3.78);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${label.name}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
            }
            .print-container { 
              width: ${labelWidthPx}px; 
              height: ${labelHeightPx}px; 
              border: 2px solid #000; 
              position: relative; 
              background: white;
              margin: 0 auto;
            }
            .element { 
              position: absolute; 
            }
            @media print {
              body { margin: 0; padding: 0; }
              .print-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${label.elements
              .map((element) => {
                const style = `
                left: ${element.x || 0}px;
                top: ${element.y || 0}px;
                width: ${element.width || 100}px;
                height: ${element.height || 30}px;
                font-family: ${element.font || "Arial"};
                font-size: ${element.fontSize || 12}px;
                font-weight: ${element.bold ? "bold" : "normal"};
                font-style: ${element.italic ? "italic" : "normal"};
                text-decoration: ${element.underline ? "underline" : "none"};
                text-align: ${element.alignment || "left"};
                line-height: 1.4;
              `;

                switch (element.type) {
                  case "text":
                    return `<div class="element" style="${style}">${element.content}</div>`;
                  case "line":
                    return `<div class="element" style="${style} background-color: black;"></div>`;
                  case "spacer":
                    return `<div class="element" style="${style}"></div>`;
                  case "logo":
                    return element.content &&
                      element.content.startsWith("data:")
                      ? `<div class="element" style="${style}"><img src="${element.content}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`
                      : `<div class="element" style="${style} border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px;">[LOGO]</div>`;
                  case "qrcode":
                  case "code128":
                  case "code39":
                    return element.generatedImage
                      ? `<div class="element" style="${style}"><img src="${element.generatedImage}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`
                      : `<div class="element" style="${style} border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px;">[${element.type.toUpperCase()}]</div>`;
                  case "placeholder":
                    return `<div class="element" style="${style} border: 1px dashed #00f; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #00f;">[PLACEHOLDER-${(
                      element.placeholderType || "TEXT"
                    ).toUpperCase()}]</div>`;
                  default:
                    return `<div class="element" style="${style}">${
                      element.content || ""
                    }</div>`;
                }
              })
              .join("")}
          </div>
        </body>
      </html>
    `;
  };

  // Delete saved label
  const deleteSavedLabel = async (labelId) => {
    if (window.confirm("Are you sure you want to delete this label?")) {
      try {
        await window.storage.delete(`label:${labelId}`);
        setSavedLabels(savedLabels.filter((label) => label.id !== labelId));
      } catch (error) {
        console.error("Error deleting label:", error);
        alert("Failed to delete label");
      }
    }
  };

  // Export label as JSON
  const exportLabel = (label) => {
    const dataStr = JSON.stringify(label, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${label.name.replace(/[^a-z0-9]/gi, "_")}_label.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle PDF file selection
  const handlePdfFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedPdfFile(file);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  // Process PDF and generate label
  const generateLabelFromPdf = async () => {
    if (!selectedPdfFile) {
      alert("Please select a PDF file first");
      return;
    }

    setPdfProcessing(true);

    try {
      // Read PDF file
      const fileData = await selectedPdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(fileData);

      // Extract text from PDF using mammoth (for simple text extraction)
      // Note: For proper PDF parsing, you'd typically use pdf.js or similar
      // Here we'll use a simple text extraction approach
      const textDecoder = new TextDecoder("utf-8");
      let extractedText = "";

      try {
        // Try to extract text content from PDF
        const pdfText = textDecoder.decode(uint8Array);
        // Basic extraction - look for text between stream objects
        const textMatches = pdfText.match(/\(([^)]+)\)/g);
        if (textMatches) {
          extractedText = textMatches
            .map((match) => match.replace(/[()]/g, ""))
            .filter((text) => text.trim().length > 0)
            .join(" ");
        }
      } catch (error) {
        console.error("Error extracting text:", error);
      }

      setExtractedPdfText(extractedText || "No text extracted from PDF");

      // Create a new label from extracted data
      const newLabel = {
        id: `label_${Date.now()}`,
        name: `Label from ${selectedPdfFile.name}`,
        dimensions: { width: 100, height: 50 },
        elements: [
          {
            id: `element_${Date.now()}_1`,
            type: "text",
            content: extractedText.substring(0, 100) || "Extracted from PDF",
            x: 10,
            y: 10,
            width: 350,
            height: 30,
            font: "Arial",
            fontSize: 14,
            bold: false,
            italic: false,
            underline: false,
            alignment: "left",
          },
        ],
        createdAt: new Date().toISOString(),
      };

      // Save the generated label
      await window.storage.set(
        `label:${newLabel.id}`,
        JSON.stringify(newLabel)
      );

      // Reload labels list
      await loadSavedLabels();

      // Close modal and reset all states
      setShowPdfImportModal(false);
      setSelectedPdfFile(null);
      setExtractedPdfText("");
      setPdfProcessing(false);
      alert("Label generated successfully from PDF!");
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to process PDF. Please try again.");
    } finally {
      setPdfProcessing(false);
    }
  };

  // Render PDF Import Modal
  const renderPdfImportModal = () => {
    if (!showPdfImportModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center">
                  <FileUp size={24} className="mr-2" />
                  Import PDF
                </h3>
                <p className="text-purple-100 text-sm">
                  Select a PDF file to extract data and generate a label
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPdfImportModal(false);
                  setSelectedPdfFile(null);
                  setExtractedPdfText("");
                }}
                className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload size={48} className="text-purple-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Click to select a PDF file
                </p>
                <p className="text-sm text-gray-500">PDF files only (.pdf)</p>
              </label>
            </div>

            {selectedPdfFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText size={20} className="text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-green-900">
                        {selectedPdfFile.name}
                      </p>
                      <p className="text-sm text-green-700">
                        {(selectedPdfFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPdfFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            {extractedPdfText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                <p className="text-sm text-blue-900 font-mono">
                  {extractedPdfText}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowPdfImportModal(false);
                  setSelectedPdfFile(null);
                  setExtractedPdfText("");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateLabelFromPdf}
                disabled={!selectedPdfFile || pdfProcessing}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                  selectedPdfFile && !pdfProcessing
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {pdfProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Generate Label</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Preview Modal
  const renderPreviewModal = () => {
    if (!showPreviewModal || !previewLabelData) return null;

    const previewLabelWidthPx = Math.max(
      400,
      previewLabelData.dimensions.width * 3.78
    );
    const previewLabelHeightPx = Math.max(
      300,
      previewLabelData.dimensions.height * 3.78
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Preview Label</h3>
                <p className="text-blue-100 text-sm">{previewLabelData.name}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => printLabel(previewLabelData)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Printer size={16} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="bg-white border-2 border-slate-400 shadow-2xl relative rounded-lg overflow-hidden"
                  style={{
                    width: `${previewLabelWidthPx}px`,
                    height: `${previewLabelHeightPx}px`,
                  }}
                >
                  {previewLabelData.elements.map((element) => {
                    const baseStyle = {
                      fontFamily: element.font || "Arial",
                      fontSize: `${element.fontSize || 12}px`,
                      fontWeight: element.bold ? "bold" : "normal",
                      fontStyle: element.italic ? "italic" : "normal",
                      textDecoration: element.underline ? "underline" : "none",
                      textAlign: element.alignment || "left",
                      position: "absolute",
                      left: `${element.x || 0}px`,
                      top: `${element.y || 0}px`,
                      width: `${element.width || 100}px`,
                      height: `${element.height || 30}px`,
                      lineHeight: "1.4",
                      overflow: "hidden",
                    };

                    switch (element.type) {
                      case "text":
                        return (
                          <div
                            key={element.id}
                            style={baseStyle}
                            className="px-2 py-1 flex items-center"
                          >
                            <div className="w-full">{element.content}</div>
                          </div>
                        );
                      case "line":
                        return (
                          <div
                            key={element.id}
                            style={{ ...baseStyle, backgroundColor: "black" }}
                          />
                        );
                      case "spacer":
                        return (
                          <div
                            key={element.id}
                            style={baseStyle}
                            className="border border-dashed border-gray-300"
                          />
                        );
                      case "logo":
                        return (
                          <div
                            key={element.id}
                            style={baseStyle}
                            className="flex items-center justify-center border border-gray-200"
                          >
                            {element.content &&
                            element.content.startsWith("data:") ? (
                              <img
                                src={element.content}
                                alt="Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 text-xs">
                                [LOGO]
                              </div>
                            )}
                          </div>
                        );
                      case "qrcode":
                      case "code128":
                      case "code39":
                        return (
                          <div
                            key={element.id}
                            style={baseStyle}
                            className="flex items-center justify-center border border-gray-200"
                          >
                            {element.generatedImage ? (
                              <img
                                src={element.generatedImage}
                                alt={element.type}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 text-xs">
                                [{element.type.toUpperCase()}]
                              </div>
                            )}
                          </div>
                        );
                      case "placeholder":
                        return (
                          <div
                            key={element.id}
                            style={baseStyle}
                            className="flex items-center justify-center border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 text-xs"
                          >
                            [PLACEHOLDER-
                            {(element.placeholderType || "TEXT").toUpperCase()}]
                          </div>
                        );
                      default:
                        return (
                          <div key={element.id} style={baseStyle}>
                            {element.content}
                          </div>
                        );
                    }
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-slate-600">Dimensions</div>
                  <div className="font-semibold">
                    {previewLabelData.dimensions.width} ×{" "}
                    {previewLabelData.dimensions.height}mm
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-600">Elements</div>
                  <div className="font-semibold">
                    {previewLabelData.elements.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-600">Created</div>
                  <div className="font-semibold">
                    {new Date(previewLabelData.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-600">Format</div>
                  <div className="font-semibold">Label Design</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading saved labels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Archive size={28} className="mr-3" />
                  Designed Labels
                </h1>
                <p className="text-blue-100 text-sm">
                  View and manage your saved label designs ({savedLabels.length}{" "}
                  labels)
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPdfImportModal(true)}
                  className="bg-purple-500 bg-opacity-90 hover:bg-opacity-100 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
                >
                  <FileUp size={16} />
                  <span>Import PDF</span>
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Archive size={16} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {savedLabels.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-slate-300 mb-6">
                  <Archive size={80} className="mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  No Saved Labels Found
                </h3>
                <p className="text-slate-500 mb-6">
                  Labels saved from the Label Designer will appear here
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> Use the Label Designer or Import
                    PDF button to create your first label design
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">
                        Label Name
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">
                        Dimensions
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">
                        Elements
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">
                        Created
                      </th>
                      <th className="text-center py-4 px-4 font-semibold text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedLabels.map((label, index) => (
                      <tr
                        key={label.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-25"
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                              <FileText size={18} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 text-lg">
                                {label.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                ID: {label.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center text-slate-600">
                            <Layers size={16} className="mr-2 text-slate-400" />
                            <span className="font-mono">
                              {label.dimensions.width} ×{" "}
                              {label.dimensions.height}mm
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                            {label.elements.length} elements
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <div className="flex items-center">
                            <Calendar
                              size={16}
                              className="mr-2 text-slate-400"
                            />
                            <div>
                              <div className="font-medium">
                                {new Date(label.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(label.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => showLabelPreview(label)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg flex items-center space-x-1"
                              title="Preview Label"
                            >
                              <Eye size={14} />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => printLabel(label)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg flex items-center space-x-1"
                              title="Print Label"
                            >
                              <Printer size={14} />
                              <span>Print</span>
                            </button>
                            <button
                              onClick={() => exportLabel(label)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg flex items-center space-x-1"
                              title="Export Label"
                            >
                              <Download size={14} />
                              <span>Export</span>
                            </button>
                            <button
                              onClick={() => deleteSavedLabel(label.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg flex items-center space-x-1"
                              title="Delete Label"
                            >
                              <X size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {savedLabels.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <strong>Total Labels:</strong> {savedLabels.length}
                  </div>
                  <div className="text-xs text-slate-500">
                    Data stored in persistent storage
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {renderPreviewModal()}
      {renderPdfImportModal()}
    </div>
  );
};

export default DesignedLabel;
