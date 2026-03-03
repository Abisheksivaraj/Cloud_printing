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
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Database,
  Table,
  Columns,
  Barcode,
  ArrowDown,
  Info
} from "lucide-react";
import * as XLSX from "xlsx";
import { useTheme } from "../../ThemeContext";

/*
  ImportDataModal Component
  Refactored for premium aesthetic and consistent theming.
  Handles CSV/Excel import, data mapping, and row selection.
*/

const ImportDataModal = ({ label, onClose, onLabelsGenerated, initialData = null, initialMappings = null }) => {
  const { theme, isDarkMode } = useTheme();

  const [importFile, setImportFile] = useState(initialData ? { name: "Restored from History", size: 0, type: "history" } : null);
  const [importedData, setImportedData] = useState(initialData || []);
  const [filteredData, setFilteredData] = useState(initialData || []);
  const [isImporting, setIsImporting] = useState(false);
  const [columnMapping, setColumnMapping] = useState(initialMappings?.columnMapping || {});
  const [barcodeMultiMapping, setBarcodeMultiMapping] = useState(initialMappings?.barcodeMultiMapping || {});
  const [barcodeSeparators, setBarcodeSeparators] = useState(initialMappings?.barcodeSeparators || {});
  const [availableColumns, setAvailableColumns] = useState(initialData?.[0] ? Object.keys(initialData[0]) : []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectMode, setSelectMode] = useState(initialData ? "range" : "all"); // "all", "search", "range", "selected"
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(initialData?.length || 1);
  const [showDataTable, setShowDataTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const fileInputRef = useRef(null);

  // Get display name for barcode type
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

  const getBarcodeIcon = (barcodeType) => {
    const icons = {
      QR: "📱",
      DATAMATRIX: "🔳",
      PDF417: "📄",
      AZTEC: "💠",
      CODE128: "|||",
      CODE39: "|||",
      EAN13: "|||",
      EAN8: "|||",
      UPC: "|||",
    };
    return icons[barcodeType] || "|||";
  };

  // Search functionality
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

  // Handle row selection
  const handleRowSelect = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Select all visible rows
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

  // Get data based on selection mode
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
        importContext: {
          totalAvailable: importedData.length,
          totalSelected: dataToGenerate.length,
          rowIndex: importedData.indexOf(row) + 1,
          // Store these for re-printing from history
          sourceData: importedData,
          mappings: {
            columnMapping,
            barcodeMultiMapping,
            barcodeSeparators
          }
        }
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div
        className="rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 transition-all border"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b shrink-0 bg-white dark:bg-gray-800" style={{ borderColor: theme.border }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <Database size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight" style={{ color: theme.text }}>
                Data Import Wizard
              </h3>
            </div>
            <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
              Mapping external data to: <span className="text-[var(--color-primary)] font-bold">{label.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ color: theme.textMuted }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar" style={{ backgroundColor: theme.bg }}>
          {!importFile ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div
                className="w-full max-w-2xl border-4 border-dashed rounded-[3rem] p-16 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group cursor-pointer flex flex-col items-center justify-center relative overflow-hidden"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
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
                  className="cursor-pointer flex flex-col items-center w-full h-full z-10"
                >
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:shadow-xl bg-[var(--color-primary)] shadow-lg shadow-primary/20">
                    <Upload size={40} className="text-white" />
                  </div>
                  <h4 className="text-3xl font-black mb-4 tracking-tight" style={{ color: theme.text }}>
                    Drop your data file here
                  </h4>
                  <p className="text-base max-w-md mx-auto mb-8 font-medium leading-relaxed" style={{ color: theme.textMuted }}>
                    Supports <span className="font-bold text-[var(--color-primary)]">.CSV</span>, <span className="font-bold text-[var(--color-secondary)]">.XLSX</span>, and .XLS files.
                  </p>
                  <div className="px-8 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm uppercase tracking-wider group-hover:bg-[var(--color-primary)] dark:group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    Browse Files
                  </div>
                </label>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              {/* File Info Card */}
              <div
                className="rounded-2xl p-4 flex items-center justify-between shadow-sm border bg-white dark:bg-gray-800"
                style={{ borderColor: theme.border }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h5 className="font-bold text-lg" style={{ color: theme.text }}>{importFile.name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                        {importFile.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">{(importFile.size / 1024).toFixed(2)} KB</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-green-500 font-bold">{importedData.length} records found</span>
                    </div>
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
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors hover:scale-105 active:scale-95"
                  title="Remove File"
                >
                  <Trash2 size={24} />
                </button>
              </div>

              {isImporting ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[var(--color-primary)] mb-6"></div>
                  <p className="text-lg font-bold" style={{ color: theme.text }}>Parsing Data...</p>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Please wait while we process your file.</p>
                </div>
              ) : importedData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* Left Column: Selection & Filter */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-3xl border bg-white dark:bg-gray-800 shadow-sm" style={{ borderColor: theme.border }}>
                      <h4 className="font-black text-sm uppercase tracking-wider mb-6 flex items-center gap-2" style={{ color: theme.textMuted }}>
                        <Filter size={16} />
                        Filter & Selection
                      </h4>

                      <div className="space-y-3">
                        {[
                          { id: 'all', label: 'All Records', desc: `Process all ${importedData.length} rows` },
                          { id: 'range', label: 'Specific Range', desc: 'Select a range of rows' },
                          { id: 'search', label: 'Search Results', desc: `Use filtered results (${filteredData.length})` },
                          { id: 'selected', label: 'Manual Selection', desc: `${selectedRows.size} manually picked rows` }
                        ].map((mode) => (
                          <label
                            key={mode.id}
                            className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${selectMode === mode.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                          >
                            <div className="mt-1">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectMode === mode.id ? 'border-[var(--color-primary)]' : 'border-gray-300'}`}>
                                {selectMode === mode.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></div>}
                              </div>
                              <input type="radio" name="selectMode" value={mode.id} checked={selectMode === mode.id} onChange={(e) => setSelectMode(e.target.value)} className="hidden" />
                            </div>
                            <div className="ml-4 flex-1">
                              <span className="block text-sm font-bold" style={{ color: theme.text }}>{mode.label}</span>
                              <span className="block text-xs font-medium mt-0.5" style={{ color: theme.textMuted }}>{mode.desc}</span>

                              {selectMode === 'range' && mode.id === 'range' && (
                                <div className="flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                  <input type="number" min="1" max={importedData.length} value={rangeStart} onChange={(e) => setRangeStart(Number(e.target.value))} className="w-20 p-2 rounded-lg border text-sm font-bold text-center outline-none focus:border-[var(--color-primary)]" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
                                  <span className="text-xs font-bold uppercase" style={{ color: theme.textMuted }}>to</span>
                                  <input type="number" min={rangeStart} max={importedData.length} value={rangeEnd} onChange={(e) => setRangeEnd(Number(e.target.value))} className="w-20 p-2 rounded-lg border text-sm font-bold text-center outline-none focus:border-[var(--color-primary)]" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
                                </div>
                              )}

                              {selectMode === 'search' && mode.id === 'search' && (
                                <div className="mt-3 relative animate-in fade-in slide-in-from-top-2">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Type to search..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm font-medium outline-none focus:border-[var(--color-primary)]"
                                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                  />
                                </div>
                              )}

                              {selectMode === 'selected' && mode.id === 'selected' && (
                                <button onClick={() => setShowDataTable(true)} className="mt-3 w-full py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-[var(--color-primary)] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2" style={{ color: theme.textMuted }}>
                                  <Table size={14} /> Open Data Table
                                </button>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Column Mapping */}
                  <div className="lg:col-span-2 space-y-6">

                    {showDataTable ? (
                      <div className="p-6 rounded-3xl border bg-white dark:bg-gray-800 shadow-sm h-[600px] flex flex-col" style={{ borderColor: theme.border }}>
                        {/* Table Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="font-black text-lg flex items-center gap-2" style={{ color: theme.text }}>
                              <Eye size={20} className="text-[var(--color-primary)]" />
                              Data Preview
                            </h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Review & Select Rows</p>
                          </div>
                          <button onClick={() => setShowDataTable(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <X size={20} className="text-gray-400" />
                          </button>
                        </div>

                        {/* Table Controls */}
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center border" style={{ borderColor: theme.border }}>
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={e => handleSearch(e.target.value)}
                              placeholder="Filter table rows..."
                              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                              style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
                            />
                          </div>
                          <button onClick={handleSelectAll} className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                            <CheckCircle size={14} />
                            {selectedRows.size === filteredData.length ? "Deselect All Rows" : "Select All Visible"}
                          </button>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: theme.border }}>
                          <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-900 shadow-sm">
                              <tr>
                                <th className="p-4 w-12">
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4 cursor-pointer"
                                  />
                                </th>
                                <th className="p-4 font-black uppercase text-xs tracking-wider text-gray-500">#</th>
                                {availableColumns.map((col) => (
                                  <th key={col} className="p-4 font-black uppercase text-xs tracking-wider text-gray-500 whitespace-nowrap">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: theme.border }}>
                              {currentData.map((row) => {
                                const actualIndex = importedData.indexOf(row);
                                const isSelected = selectedRows.has(actualIndex);
                                return (
                                  <tr
                                    key={actualIndex}
                                    className={`transition-colors group ${isSelected ? 'bg-[var(--color-primary)]/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                                  >
                                    <td className="p-4">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleRowSelect(actualIndex)}
                                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4 cursor-pointer"
                                      />
                                    </td>
                                    <td className="p-4 font-mono text-gray-400 text-xs">{actualIndex + 1}</td>
                                    {availableColumns.map(col => (
                                      <td key={col} className="p-4 whitespace-nowrap font-medium" style={{ color: theme.text }}>{row[col]}</td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400">Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg border text-xs font-bold uppercase transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderColor: theme.border, color: theme.text }}
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg border text-xs font-bold uppercase transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderColor: theme.border, color: theme.text }}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8 p-1">

                        {/* Helper Banner */}
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 flex items-start gap-3">
                          <Info size={18} className="mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <p className="font-bold">Map your data columns</p>
                            <p className="opacity-80 mt-1">Match the columns from your uploaded file to the fields in your label design. </p>
                          </div>
                        </div>

                        {/* Placeholders */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 mb-4" style={{ color: theme.textMuted }}>
                            <Columns size={16} /> Text Fields
                          </h4>
                          {placeholderElements.map((element) => {
                            const fieldName = getFieldName(element.content);
                            return (
                              <div key={element.id} className="p-5 rounded-2xl border bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md hover:border-[var(--color-primary)] group" style={{ borderColor: theme.border }}>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                  <div className="w-full md:w-1/3">
                                    <div className="text-base font-bold flex items-center gap-2" style={{ color: theme.text }}>
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-serif">T</div>
                                      {fieldName}
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1 ml-10">Label Field</div>
                                  </div>

                                  <div className="hidden md:flex text-gray-300">
                                    <ArrowRight size={20} className="group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                                  </div>

                                  <div className="flex-1">
                                    <div className="relative">
                                      <select
                                        value={columnMapping[element.id] || ""}
                                        onChange={(e) => handleColumnMappingChange(element.id, e.target.value)}
                                        className="w-full p-3 pl-4 pr-10 rounded-xl border-2 font-medium text-sm outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                                        style={{ backgroundColor: theme.bg, borderColor: columnMapping[element.id] ? 'var(--color-primary)' : theme.border, color: theme.text }}
                                      >
                                        <option value="">Select a column...</option>
                                        {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                      </select>
                                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ArrowDown size={14} />
                                      </div>
                                    </div>
                                    {columnMapping[element.id] && importedData[0] && (
                                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1">
                                        <CheckCircle size={12} />
                                        <span>Preview: "{importedData[0][columnMapping[element.id]]}"</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Barcodes */}
                        {barcodeElements.length > 0 && (
                          <div className="space-y-4 pt-4 border-t" style={{ borderColor: theme.border }}>
                            <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 mb-4" style={{ color: theme.textMuted }}>
                              <Barcode size={16} /> Composite Barcodes
                            </h4>
                            {barcodeElements.map((element) => (
                              <div key={element.id} className="p-5 rounded-2xl border bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-sm" style={{ borderColor: theme.border }}>
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)]">
                                      <span className="text-xl font-black">{getBarcodeIcon(element.barcodeType)}</span>
                                    </div>
                                    <div>
                                      <div className="font-bold text-base" style={{ color: theme.text }}>{getBarcodeTypeName(element.barcodeType)}</div>
                                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Composite Data Source</div>
                                    </div>
                                  </div>
                                  <button onClick={() => handleAddBarcodeColumn(element.id)} className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95">
                                    <Plus size={14} /> Add Segment
                                  </button>
                                </div>

                                <div className="space-y-4 pl-4 md:pl-12 border-l-2 ml-4" style={{ borderColor: theme.border }}>
                                  <div className="flex items-center gap-3 mb-4">
                                    <label className="text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: theme.textMuted }}>Join Separator:</label>
                                    <input
                                      type="text"
                                      value={barcodeSeparators[element.id] || " "}
                                      onChange={(e) => handleSeparatorChange(element.id, e.target.value)}
                                      className="input py-2 px-3 w-24 text-center font-mono text-xs font-bold rounded-lg border-2 focus:border-[var(--color-secondary)]"
                                      placeholder="space"
                                      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                                    />
                                    <span className="text-xs text-gray-400">(Character between segments)</span>
                                  </div>

                                  {(barcodeMultiMapping[element.id] || []).map((selectedCol, index) => (
                                    <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                                      <div className="flex-1 relative">
                                        <select
                                          value={selectedCol}
                                          onChange={(e) => handleBarcodeColumnChange(element.id, index, e.target.value)}
                                          className="w-full p-3 rounded-xl border-2 font-medium text-sm outline-none transition-all focus:border-[var(--color-secondary)] appearance-none cursor-pointer hover:bg-white dark:hover:bg-gray-900"
                                          style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                        >
                                          <option value="">Select Segment {index + 1}...</option>
                                          {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                      </div>
                                      <button onClick={() => handleRemoveBarcodeColumn(element.id, index)} className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  ))}
                                  {(barcodeMultiMapping[element.id] || []).length === 0 && (
                                    <div className="text-sm italic opacity-50 p-2 border-2 border-dashed rounded-lg text-center" style={{ color: theme.textMuted }}>
                                      No data segments added yet. Add sources to build the barcode value.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Empty State */}
                        {placeholderElements.length === 0 && barcodeElements.length === 0 && (
                          <div className="p-8 text-center border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 opacity-60" style={{ borderColor: theme.border }}>
                            <AlertCircle size={40} className="text-gray-400" />
                            <p className="text-lg font-bold" style={{ color: theme.text }}>No dynamic fields found</p>
                            <p className="text-sm max-w-xs mx-auto" style={{ color: theme.textMuted }}>
                              This label template doesn't have any placeholders or dynamic barcodes to map data to.
                            </p>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-gray-800" style={{ borderColor: theme.border }}>
          <div>
            {importFile && (
              <span className="text-xs font-bold uppercase tracking-wider opacity-60 ml-2" style={{ color: theme.textMuted }}>
                Step {importedData.length > 0 ? (showDataTable ? '2B' : '2A') : '1'} of 2
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: theme.textMuted }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateLabels}
              disabled={importedData.length === 0 || !hasValidMapping()}
              className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
            >
              <CheckCircle size={16} />
              <span>Generate Labels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
