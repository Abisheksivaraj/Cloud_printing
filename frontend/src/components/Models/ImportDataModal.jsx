import React, { useState, useRef } from "react";
import { X, Upload, FileText, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

const ImportDataModal = ({ label, onClose, onLabelsGenerated }) => {
  const [importFile, setImportFile] = useState(null);
  const [importedData, setImportedData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [columnMapping, setColumnMapping] = useState({});
  const [barcodeMultiMapping, setBarcodeMultiMapping] = useState({});
  const [barcodeSeparators, setBarcodeSeparators] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx", "xls"].includes(fileExtension)) {
      alert("Please select a CSV or Excel file (.xlsx, .xls)");
      return;
    }

    setIsImporting(true);
    setImportFile({
      name: file.name,
      size: file.size,
      type: fileExtension,
    });

    try {
      let data = [];
      let columns = [];

      if (fileExtension === "csv") {
        data = await parseCSV(file);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        data = await parseExcel(file);
      }

      if (data.length > 0) {
        columns = Object.keys(data[0]);
        setAvailableColumns(columns);
        setImportedData(data);

        // Auto-map columns based on placeholder names and element types
        const autoMapping = {};
        const autoMultiMapping = {};
        const autoSeparators = {};
        const placeholders = label.elements.filter(
          (el) => el.type === "placeholder",
        );

        placeholders.forEach((element) => {
          // Extract field name from {{fieldname}}
          const match = element.content.match(/\{\{(.+?)\}\}/);
          if (match) {
            const fieldName = match[1].toLowerCase().trim();

            // Try to find matching column
            const matchingColumn = columns.find(
              (col) =>
                col.toLowerCase().trim() === fieldName ||
                col.toLowerCase().replace(/[_\s]/g, "") ===
                  fieldName.replace(/[_\s]/g, ""),
            );

            if (matchingColumn) {
              autoMapping[element.id] = matchingColumn;
            }
          }
        });

        // Initialize barcode elements with multi-mapping
        label.elements.forEach((element) => {
          if (element.type === "barcode") {
            autoMultiMapping[element.id] = [];
            autoSeparators[element.id] = " ";
          }
        });

        setColumnMapping(autoMapping);
        setBarcodeMultiMapping(autoMultiMapping);
        setBarcodeSeparators(autoSeparators);
      }
    } catch (error) {
      console.error("Error importing file:", error);
      alert("Error reading file. Please try again.");
    }

    setIsImporting(false);
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split("\n").filter((line) => line.trim());

          if (lines.length < 2) {
            reject(new Error("CSV file is empty or has no data rows"));
            return;
          }

          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/^"|"$/g, ""));
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i]
              .split(",")
              .map((v) => v.trim().replace(/^"|"$/g, ""));
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            data.push(row);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      if (typeof XLSX === "undefined") {
        alert(
          "Excel parsing requires the XLSX library. Please save your file as CSV and try again.",
        );
        reject(new Error("XLSX library not available"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            raw: false,
          });

          if (jsonData.length < 2) {
            reject(new Error("Excel file must have header row and data rows"));
            return;
          }

          const headers = jsonData[0].map((h, i) => h || `Column${i + 1}`);
          const parsedData = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length === 0 || row.every((cell) => !cell)) continue;

            const rowObj = {};
            headers.forEach((header, index) => {
              rowObj[header] =
                row[index] !== undefined ? String(row[index]).trim() : "";
            });
            parsedData.push(rowObj);
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleColumnMappingChange = (elementId, columnName) => {
    setColumnMapping({
      ...columnMapping,
      [elementId]: columnName,
    });
  };

  // Add column to barcode multi-mapping
  const handleAddBarcodeColumn = (elementId) => {
    setBarcodeMultiMapping({
      ...barcodeMultiMapping,
      [elementId]: [...(barcodeMultiMapping[elementId] || []), ""],
    });
  };

  // Remove column from barcode multi-mapping
  const handleRemoveBarcodeColumn = (elementId, index) => {
    const current = barcodeMultiMapping[elementId] || [];
    const updated = current.filter((_, i) => i !== index);
    setBarcodeMultiMapping({
      ...barcodeMultiMapping,
      [elementId]: updated,
    });
  };

  // Update specific barcode column mapping
  const handleBarcodeColumnChange = (elementId, index, columnName) => {
    const current = barcodeMultiMapping[elementId] || [];
    const updated = [...current];
    updated[index] = columnName;
    setBarcodeMultiMapping({
      ...barcodeMultiMapping,
      [elementId]: updated,
    });
  };

  // Update separator for barcode
  const handleSeparatorChange = (elementId, separator) => {
    setBarcodeSeparators({
      ...barcodeSeparators,
      [elementId]: separator,
    });
  };

  const handleGenerateLabels = () => {
    if (!label || importedData.length === 0) {
      alert("No data imported");
      return;
    }

    const newLabels = importedData.map((row, index) => {
      const clonedElements = label.elements.map((el) => {
        // Handle barcode with multiple columns
        if (el.type === "barcode" && barcodeMultiMapping[el.id]) {
          const selectedColumns = barcodeMultiMapping[el.id].filter(
            (col) => col !== "",
          );
          const separator = barcodeSeparators[el.id] || " ";

          if (selectedColumns.length > 0) {
            const combinedValue = selectedColumns
              .map((col) => row[col] || "")
              .filter((val) => val !== "")
              .join(separator);

            return { ...el, content: combinedValue };
          }
        }

        // Handle placeholder - replace with actual value
        if (el.type === "placeholder" && columnMapping[el.id]) {
          const columnName = columnMapping[el.id];
          const importedValue = row[columnName] || "";
          return {
            ...el,
            content: importedValue,
            type: "text",
          };
        }

        return { ...el };
      });

      return {
        labelSize: label.labelSize,
        elements: clonedElements,
        value: row[Object.keys(row)[0]] || `Row ${index + 1}`,
        templateName: label.name,
      };
    });

    onLabelsGenerated(newLabels);
  };

  const hasValidMapping = () => {
    const placeholders = label.elements.filter(
      (el) => el.type === "placeholder",
    );
    const barcodes = label.elements.filter((el) => el.type === "barcode");

    const hasPlaceholderMapping = placeholders.every(
      (el) => columnMapping[el.id],
    );
    const hasBarcodeMapping =
      barcodes.length === 0 ||
      barcodes.some(
        (el) =>
          barcodeMultiMapping[el.id] &&
          barcodeMultiMapping[el.id].some((col) => col !== ""),
      );

    return hasPlaceholderMapping && hasBarcodeMapping;
  };

  // Extract clean field name from placeholder
  const getFieldName = (content) => {
    const match = content.match(/\{\{(.+?)\}\}/);
    return match ? match[1] : content;
  };

  const placeholderElements = label.elements.filter(
    (el) => el.type === "placeholder",
  );

  const barcodeElements = label.elements.filter((el) => el.type === "barcode");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Import Data for Label Generation
            </h3>
            <p className="text-sm text-gray-500 mt-1">Template: {label.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {!importFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors bg-gradient-to-br from-gray-50 to-blue-50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="import-data-input"
              />
              <label
                htmlFor="import-data-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload size={40} className="text-blue-600" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-2">
                  Upload Data File
                </p>
                <p className="text-sm text-gray-600">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Click to browse or drag and drop
                </p>
              </label>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText size={24} className="text-green-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 text-lg">
                        {importFile.name}
                      </p>
                      <p className="text-sm text-green-700">
                        {(importFile.size / 1024).toFixed(2)} KB •{" "}
                        {importedData.length} rows
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setImportFile(null);
                      setImportedData([]);
                      setColumnMapping({});
                      setBarcodeMultiMapping({});
                      setBarcodeSeparators({});
                      setAvailableColumns([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100 p-2 rounded-lg transition-colors"
                    title="Remove File"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {isImporting ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">
                    Processing file...
                  </p>
                </div>
              ) : importedData.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                      📊 Data Preview
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (showing first 3 of {importedData.length} rows)
                      </span>
                    </h4>
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            {availableColumns.map((col, i) => (
                              <th
                                key={i}
                                className="px-4 py-2 text-left font-bold text-gray-800 whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importedData.slice(0, 3).map((row, i) => (
                            <tr key={i} className="border-b border-gray-200">
                              {availableColumns.map((col, j) => (
                                <td
                                  key={j}
                                  className="px-4 py-2 text-gray-700 whitespace-nowrap"
                                >
                                  {row[col]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-4 text-lg">
                      🔗 Map Your Data Columns
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Match each label field with a column from your file:
                    </p>

                    <div className="space-y-3">
                      {/* Placeholder Elements */}
                      {placeholderElements.map((element) => {
                        const fieldName = getFieldName(element.content);
                        return (
                          <div
                            key={element.id}
                            className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 w-1/3">
                                <label className="text-sm font-semibold text-gray-700">
                                  {fieldName}
                                </label>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Label field
                                </p>
                              </div>

                              <div className="flex-shrink-0 text-gray-400">
                                <span className="text-xl">→</span>
                              </div>

                              <div className="flex-1">
                                <select
                                  value={columnMapping[element.id] || ""}
                                  onChange={(e) =>
                                    handleColumnMappingChange(
                                      element.id,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">
                                    -- Select column from file --
                                  </option>
                                  {availableColumns.map((col) => (
                                    <option key={col} value={col}>
                                      {col}
                                    </option>
                                  ))}
                                </select>
                                {columnMapping[element.id] &&
                                  importedData[0] && (
                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                      ✓ Example: "
                                      {
                                        importedData[0][
                                          columnMapping[element.id]
                                        ]
                                      }
                                      "
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Barcode Elements */}
                      {barcodeElements.map((element) => (
                        <div
                          key={element.id}
                          className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-gray-800">
                              📊 Barcode: {element.content}
                            </label>
                            <button
                              onClick={() => handleAddBarcodeColumn(element.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Plus size={14} />
                              <span>Add Column</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {/* Separator Input */}
                            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-purple-200">
                              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                Separator:
                              </label>
                              <input
                                type="text"
                                value={barcodeSeparators[element.id] || " "}
                                onChange={(e) =>
                                  handleSeparatorChange(
                                    element.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Space"
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                maxLength={5}
                              />
                              <span className="text-xs text-gray-500">
                                (e.g., " ", "-", ", ")
                              </span>
                            </div>

                            {/* Column Selections */}
                            {(barcodeMultiMapping[element.id] || []).map(
                              (selectedCol, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2"
                                >
                                  <div className="flex-1">
                                    <select
                                      value={selectedCol}
                                      onChange={(e) =>
                                        handleBarcodeColumnChange(
                                          element.id,
                                          index,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                      <option value="">
                                        -- Select Column {index + 1} --
                                      </option>
                                      {availableColumns.map((col) => (
                                        <option key={col} value={col}>
                                          {col}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleRemoveBarcodeColumn(
                                        element.id,
                                        index,
                                      )
                                    }
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Remove Column"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ),
                            )}

                            {/* Preview of combined value */}
                            {barcodeMultiMapping[element.id] &&
                              barcodeMultiMapping[element.id].some(
                                (col) => col !== "",
                              ) && (
                                <div className="bg-white p-3 rounded-lg border border-purple-300">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    Preview (First Row):
                                  </p>
                                  <p className="text-sm text-purple-900 font-mono">
                                    {barcodeMultiMapping[element.id]
                                      .filter((col) => col !== "")
                                      .map((col) => importedData[0][col] || "")
                                      .filter((val) => val !== "")
                                      .join(
                                        barcodeSeparators[element.id] || " ",
                                      )}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {placeholderElements.length === 0 &&
                      barcodeElements.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <p className="text-gray-600">
                            No placeholder or barcode fields found in this label
                            template.
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Add placeholders or barcodes to your label design to
                            map data.
                          </p>
                        </div>
                      )}
                  </div>
                </>
              ) : null}
            </>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateLabels}
              disabled={importedData.length === 0 || !hasValidMapping()}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                importedData.length > 0 && hasValidMapping()
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {importedData.length > 0
                ? `Generate ${importedData.length} Label${importedData.length !== 1 ? "s" : ""}`
                : "Generate Labels"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImportDataModal;
