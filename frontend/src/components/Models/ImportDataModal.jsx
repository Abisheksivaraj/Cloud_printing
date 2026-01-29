import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";

const ImportDataModal = ({ label, onClose, onLabelsGenerated }) => {
  const [importFile, setImportFile] = useState(null);
  const [importedData, setImportedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [columnMapping, setColumnMapping] = useState({});
  const [barcodeMultiMapping, setBarcodeMultiMapping] = useState({});
  const [barcodeSeparators, setBarcodeSeparators] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectMode, setSelectMode] = useState("all"); // "all", "search", "range", "selected"
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [showDataTable, setShowDataTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const fileInputRef = useRef(null);

  // ✅ Get display name for barcode type
  const getBarcodeTypeName = (barcodeType) => {
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
    return barcodeTypeNames[barcodeType] || "Barcode";
  };

  // ✅ Get appropriate icon for barcode type
  const getBarcodeIcon = (barcodeType) => {
    if (
      barcodeType === "QR" ||
      barcodeType === "DATAMATRIX" ||
      barcodeType === "AZTEC"
    ) {
      return "⬛";
    }
    return "📊";
  };

  // ✅ Search functionality
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);

    if (!term.trim()) {
      setFilteredData(importedData);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = importedData.filter((row, index) => {
      // Search in all columns
      return (
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchLower),
        ) || (index + 1).toString().includes(searchLower)
      ); // Also search by row number
    });

    setFilteredData(filtered);
  };

  // ✅ Handle row selection
  const handleRowSelect = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // ✅ Select all visible rows
  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = filteredData.map((_, index) =>
        importedData.indexOf(filteredData[index]),
      );
      setSelectedRows(new Set(allIndices));
    }
  };

  // ✅ Get data based on selection mode
  const getDataToGenerate = () => {
    switch (selectMode) {
      case "all":
        return importedData;

      case "search":
        return filteredData;

      case "range":
        const start = Math.max(1, Math.min(rangeStart, importedData.length));
        const end = Math.max(start, Math.min(rangeEnd, importedData.length));
        return importedData.slice(start - 1, end);

      case "selected":
        return importedData.filter((_, index) => selectedRows.has(index));

      default:
        return importedData;
    }
  };

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
        setFilteredData(data);
        setRangeEnd(data.length);

        // Auto-map columns based on placeholder names and element types
        const autoMapping = {};
        const autoMultiMapping = {};
        const autoSeparators = {};
        const placeholders = label.elements.filter(
          (el) => el.type === "placeholder",
        );

        placeholders.forEach((element) => {
          const match = element.content.match(/\{\{(.+?)\}\}/);
          if (match) {
            const fieldName = match[1].toLowerCase().trim();
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

  const handleAddBarcodeColumn = (elementId) => {
    setBarcodeMultiMapping({
      ...barcodeMultiMapping,
      [elementId]: [...(barcodeMultiMapping[elementId] || []), ""],
    });
  };

  const handleRemoveBarcodeColumn = (elementId, index) => {
    const current = barcodeMultiMapping[elementId] || [];
    const updated = current.filter((_, i) => i !== index);
    setBarcodeMultiMapping({
      ...barcodeMultiMapping,
      [elementId]: updated,
    });
  };

  const handleBarcodeColumnChange = (elementId, index, columnName) => {
    const current = barcodeMultiMapping[elementId] || [];
    const updated = [...current];
    updated[index] = columnName;
    setBarcodeMultiMapping({
      ...barcodeMultiMapping,
      [elementId]: updated,
    });
  };

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

    const dataToGenerate = getDataToGenerate();

    if (dataToGenerate.length === 0) {
      alert("No data selected for label generation");
      return;
    }

    const newLabels = dataToGenerate.map((row, index) => {
      const clonedElements = label.elements.map((el) => {
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

  const getFieldName = (content) => {
    const match = content.match(/\{\{(.+?)\}\}/);
    return match ? match[1] : content;
  };

  const placeholderElements = label.elements.filter(
    (el) => el.type === "placeholder",
  );

  const barcodeElements = label.elements.filter((el) => el.type === "barcode");

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
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
                      setFilteredData([]);
                      setColumnMapping({});
                      setBarcodeMultiMapping({});
                      setBarcodeSeparators({});
                      setAvailableColumns([]);
                      setSearchTerm("");
                      setSelectedRows(new Set());
                      setSelectMode("all");
                      setShowDataTable(false);
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
                  {/* ✅ Selection Mode Options */}
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                      <Filter size={20} className="mr-2" />
                      Selection Options
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1: All Data */}
                      <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="selectMode"
                          value="all"
                          checked={selectMode === "all"}
                          onChange={(e) => setSelectMode(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            All Data
                          </p>
                          <p className="text-xs text-gray-600">
                            Generate labels for all {importedData.length} rows
                          </p>
                        </div>
                      </label>

                      {/* Option 2: Range Selection */}
                      <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="selectMode"
                          value="range"
                          checked={selectMode === "range"}
                          onChange={(e) => setSelectMode(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            Range Selection
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Select specific row range
                          </p>
                          {selectMode === "range" && (
                            <div className="flex items-center space-x-2 mt-2">
                              <input
                                type="number"
                                min="1"
                                max={importedData.length}
                                value={rangeStart}
                                onChange={(e) =>
                                  setRangeStart(Number(e.target.value))
                                }
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="From"
                              />
                              <span className="text-gray-600">to</span>
                              <input
                                type="number"
                                min={rangeStart}
                                max={importedData.length}
                                value={rangeEnd}
                                onChange={(e) =>
                                  setRangeEnd(Number(e.target.value))
                                }
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="To"
                              />
                              <span className="text-xs text-gray-600">
                                (
                                {Math.max(
                                  0,
                                  Math.min(rangeEnd, importedData.length) -
                                    Math.max(1, rangeStart) +
                                    1,
                                )}{" "}
                                rows)
                              </span>
                            </div>
                          )}
                        </div>
                      </label>

                      {/* Option 3: Search & Filter */}
                      <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="selectMode"
                          value="search"
                          checked={selectMode === "search"}
                          onChange={(e) => setSelectMode(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            Search & Filter
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Search and generate filtered results (
                            {filteredData.length} rows)
                          </p>
                          {selectMode === "search" && (
                            <div className="relative mt-2">
                              <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={16}
                              />
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search in all columns..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </label>

                      {/* Option 4: Manual Selection */}
                      <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="selectMode"
                          value="selected"
                          checked={selectMode === "selected"}
                          onChange={(e) => setSelectMode(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            Manual Selection
                          </p>
                          <p className="text-xs text-gray-600">
                            Select specific rows from table ({selectedRows.size}{" "}
                            selected)
                          </p>
                          {selectMode === "selected" && (
                            <button
                              onClick={() => setShowDataTable(true)}
                              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
                            >
                              <Eye size={14} />
                              <span>View & Select Rows</span>
                            </button>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ✅ Data Table View (for manual selection) */}
                  {showDataTable && (
                    <div className="mb-6 bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b flex items-center justify-between">
                        <h4 className="font-bold text-gray-800 text-lg">
                          Data Table - Select Rows
                        </h4>
                        <button
                          onClick={() => setShowDataTable(false)}
                          className="text-gray-600 hover:text-gray-800 p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Search in table view */}
                      <div className="p-4 bg-gray-50 border-b">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                          />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search in all columns..."
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {selectedRows.size === filteredData.length
                              ? "Deselect All"
                              : "Select All Visible"}
                          </button>
                          <p className="text-sm text-gray-600">
                            {selectedRows.size} of {importedData.length} rows
                            selected
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedRows.size === filteredData.length &&
                                    filteredData.length > 0
                                  }
                                  onChange={handleSelectAll}
                                  className="rounded"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                #
                              </th>
                              {availableColumns.map((col, i) => (
                                <th
                                  key={i}
                                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentData.map((row, displayIndex) => {
                              const actualIndex = importedData.indexOf(row);
                              const rowNumber = actualIndex + 1;
                              const isSelected = selectedRows.has(actualIndex);

                              return (
                                <tr
                                  key={actualIndex}
                                  className={`hover:bg-blue-50 transition-colors ${
                                    isSelected ? "bg-blue-100" : ""
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        handleRowSelect(actualIndex)
                                      }
                                      className="rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {rowNumber}
                                  </td>
                                  {availableColumns.map((col, j) => (
                                    <td
                                      key={j}
                                      className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                                    >
                                      {row[col]}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1} to{" "}
                            {Math.min(endIndex, filteredData.length)} of{" "}
                            {filteredData.length} rows
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                setCurrentPage(Math.max(1, currentPage - 1))
                              }
                              disabled={currentPage === 1}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() =>
                                setCurrentPage(
                                  Math.min(totalPages, currentPage + 1),
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data Preview (condensed) */}
                  {!showDataTable && (
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                        📊 Data Preview
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          (showing first 3 rows)
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
                  )}

                  {/* Column Mapping Section */}
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
                      {barcodeElements.map((element) => {
                        const barcodeTypeName = getBarcodeTypeName(
                          element.barcodeType,
                        );
                        const barcodeIcon = getBarcodeIcon(element.barcodeType);

                        return (
                          <div
                            key={element.id}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-lg">{barcodeIcon}</span>
                                <span>{barcodeTypeName}</span>
                                <span className="text-xs font-normal text-gray-600 ml-1">
                                  ({element.content})
                                </span>
                              </label>
                              <button
                                onClick={() =>
                                  handleAddBarcodeColumn(element.id)
                                }
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
                                        .map(
                                          (col) => importedData[0][col] || "",
                                        )
                                        .filter((val) => val !== "")
                                        .join(
                                          barcodeSeparators[element.id] || " ",
                                        )}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })}
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
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                importedData.length > 0 && hasValidMapping()
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Printer size={18} />
              <span>
                {importedData.length > 0
                  ? `Generate ${getDataToGenerate().length} Label${getDataToGenerate().length !== 1 ? "s" : ""}`
                  : "Generate Labels"}
              </span>
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
