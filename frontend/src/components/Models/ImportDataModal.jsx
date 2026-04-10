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
  Info,
  Edit2,
  RefreshCw,
  ChevronRight,
  Code
} from "lucide-react";
import * as XLSX from "xlsx";
import { useTheme } from "../../ThemeContext";

/*
  ImportDataModal Component
  Modernized for "Studio" aesthetic while preserving complex logic.
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
  const [importMethod, setImportMethod] = useState("upload"); // "upload" or "manual"
  const [manualRows, setManualRows] = useState([{}]);
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
        const placeholders = (label?.elements || []).filter(
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

        (label?.elements || []).forEach((element) => {
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
    const dataToGenerate = importMethod === 'manual' ? manualRows : getDataToGenerate();

    if (!label || dataToGenerate.length === 0) {
      alert("No data available");
      return;
    }

    const newLabels = dataToGenerate.map((row, index) => {
      const clonedElements = (label?.elements || []).map((el) => {
        // Manual mode: match column by placeholder name directly if mapping is missing
        const columnName = importMethod === 'manual' ? getFieldName(el.content) : columnMapping[el.id];

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
          } else if (importMethod === 'manual') {
            // Check if manual row has a direct match for a barcode if it's treated as a single field
            const manualBarcodeVal = row['Barcode'] || row[el.content];
            if (manualBarcodeVal) return { ...el, content: manualBarcodeVal };
          }
        }

        if (el.type === "placeholder" && columnName) {
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
          templateId: label.id || label._id,
          totalAvailable: dataToGenerate.length,
          totalSelected: dataToGenerate.length,
          rowIndex: index + 1,
          importMethod,
          sourceData: dataToGenerate,
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
    if (importMethod === 'manual') return true; // Always valid in manual mode for now
    const placeholders = (label?.elements || []).filter(
      (el) => el.type === "placeholder",
    );
    const barcodes = (label?.elements || []).filter((el) => el.type === "barcode");

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

  const placeholderElements = (label?.elements || []).filter(
    (el) => el.type === "placeholder",
  );

  const barcodeElements = (label?.elements || []).filter((el) => el.type === "barcode");

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-500">
      <div
        className="w-full max-w-7xl h-[90vh] bg-white dark:bg-slate-950 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-12 py-10 border-b border-slate-50 dark:border-slate-900 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-900/10 dark:shadow-white/5">
               <Database size={24} className="text-white dark:text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Data Engine</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">External Content Mapping <span className="mx-2 text-slate-200">/</span> {label.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X size={26} />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="px-12 py-6 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-50 dark:border-slate-900 flex items-center justify-center shrink-0">
           <div className="flex p-1.5 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setImportMethod("upload")}
                className={`flex items-center gap-3 px-8 py-3 rounded-[1rem] font-black text-[11px] uppercase tracking-widest transition-all ${importMethod === "upload" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
              >
                <Upload size={16} /> File Import
              </button>
              <button
                onClick={() => {
                  setImportMethod("manual");
                  if (Object.keys(manualRows[0]).length === 0) {
                    const initialRow = {};
                    placeholderElements.forEach(el => initialRow[getFieldName(el.content)] = "");
                    setManualRows([initialRow]);
                  }
                }}
                className={`flex items-center gap-3 px-8 py-3 rounded-[1rem] font-black text-[11px] uppercase tracking-widest transition-all ${importMethod === "manual" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
              >
                <Edit2 size={16} /> Manual Matrix
              </button>
           </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {importMethod === 'manual' ? (
            <div className="p-12 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h4 className="text-[13px] font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-3">
                       <Table size={18} /> Matrix Input Phase
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400">Directly encode label values into the local buffer</p>
                  </div>
                  <button
                    onClick={() => {
                      const newRow = {};
                      placeholderElements.forEach(el => newRow[getFieldName(el.content)] = "");
                      setManualRows([...manualRows, newRow]);
                    }}
                    className="p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center gap-3 hover:-translate-y-0.5 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                  >
                    <Plus size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Append Row</span>
                  </button>
               </div>

               <div className="flex-1 overflow-auto rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 custom-scrollbar shadow-inner">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                      <tr>
                        <th className="p-6 w-16 text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                        {placeholderElements.map((el) => (
                          <th key={el.id} className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             {getFieldName(el.content)}
                          </th>
                        ))}
                        <th className="p-6 w-16 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Op</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {manualRows.map((row, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-6 text-[11px] font-black text-slate-300">{idx + 1}</td>
                          {placeholderElements.map((el) => {
                            const field = getFieldName(el.content);
                            return (
                              <td key={el.id} className="p-4">
                                <input
                                  type="text"
                                  value={row[field] || ""}
                                  onChange={(e) => {
                                    const updated = [...manualRows];
                                    updated[idx][field] = e.target.value;
                                    setManualRows(updated);
                                  }}
                                  placeholder={`Enter ${field}...`}
                                  className="w-full px-5 py-3.5 bg-transparent border-2 border-transparent rounded-xl font-black text-[13px] text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700"
                                />
                              </td>
                            );
                          })}
                          <td className="p-6 text-center">
                            <button
                              onClick={() => idx > 0 && setManualRows(manualRows.filter((_, i) => i !== idx))}
                              disabled={manualRows.length === 1}
                              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-0"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          ) : !importFile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
               <div className="w-full max-w-2xl group flex flex-col items-center">
                   <div 
                      onClick={() => fileInputRef.current.click()}
                      className="w-full aspect-[2/1] border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-8 cursor-pointer hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-500 relative overflow-hidden"
                   >
                     <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                     <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-900/10 group-hover:scale-110 transition-transform duration-500">
                        <Upload size={32} className="text-white dark:text-slate-900" />
                     </div>
                     <div className="text-center">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Initialize Data Feed</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-12">Drop matrix source <span className="text-slate-200">(.csv, .xlsx)</span> to begin mapping</p>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </div>
                   <div className="mt-12 flex items-center gap-4 py-3 px-6 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting for source input...</span>
                   </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
               {/* Source Overview */}
               <div className="px-12 py-8 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                        <FileText size={28} className="text-slate-400" />
                     </div>
                     <div>
                        <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{importFile.name}</h5>
                        <div className="flex items-center gap-4">
                           <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest">{importFile.type}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{importedData.length} RECORDS FOUND</span>
                           <span className="text-[10px] font-bold text-slate-200">|</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{(importFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                     </div>
                  </div>
                  <button
                    onClick={() => { setImportFile(null); setImportedData([]); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all active:scale-95"
                  >
                    <Trash2 size={14} /> Eject Source
                  </button>
               </div>

               {/* Mapping Workspace */}
               <div className="flex-1 overflow-hidden flex">
                  
                  {/* Sidebar: Filters & Scope */}
                  <div className="w-80 border-r border-slate-50 dark:border-slate-900 p-10 space-y-10 overflow-y-auto custom-scrollbar shrink-0">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white"></div>
                           <h4 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">Selection Scope</h4>
                        </div>
                        <div className="space-y-3">
                           {[
                             { id: 'all', label: 'Absolute Buffer', icon: <CheckCircle size={14} /> },
                             { id: 'range', label: 'Linear Range', icon: <Filter size={14} /> },
                             { id: 'search', label: 'Dynamic Filter', icon: <Search size={14} /> },
                             { id: 'selected', label: 'Manual Lock', icon: <Table size={14} /> }
                           ].map((mode) => (
                             <button
                               key={mode.id}
                               onClick={() => setSelectMode(mode.id)}
                               className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${selectMode === mode.id ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'border-slate-50 dark:border-slate-900 text-slate-400 hover:border-slate-200 tracking-tight'}`}
                             >
                               <div className="flex items-center gap-3">
                                  {mode.icon}
                                  <span className="text-[11px] font-black uppercase tracking-wider">{mode.label}</span>
                               </div>
                               {selectMode === mode.id && <ArrowRight size={14} />}
                             </button>
                           ))}
                        </div>

                        {selectMode === 'range' && (
                          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-center gap-2">
                                <input type="number" value={rangeStart} onChange={(e) => setRangeStart(Number(e.target.value))} className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-slate-900 dark:focus:border-white" />
                                <span className="text-[9px] font-black text-slate-300 uppercase">to</span>
                                <input type="number" value={rangeEnd} onChange={(e) => setRangeEnd(Number(e.target.value))} className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-slate-900 dark:focus:border-white" />
                             </div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Relative Indices</p>
                          </div>
                        )}

                        {selectMode === 'search' && (
                           <div className="relative animate-in fade-in slide-in-from-top-2">
                              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Matrix search..."
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-xs outline-none focus:border-slate-900 dark:focus:border-white"
                              />
                           </div>
                        )}

                        {selectMode === 'selected' && (
                           <button onClick={() => setShowDataTable(true)} className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white">
                              Inspect Map Matrix
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Main Mapping Engine */}
                  <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-slate-950/20">
                     {showDataTable ? (
                        <div className="h-full flex flex-col animate-in zoom-in-95">
                           <div className="flex items-center justify-between mb-8">
                             <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white"></div>
                                <h4 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">Source Buffer Inspection</h4>
                             </div>
                             <div className="flex items-center gap-4">
                                <button onClick={handleSelectAll} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                   {selectedRows.size === filteredData.length ? "Clear All" : "Select Global"}
                                </button>
                                <button onClick={() => setShowDataTable(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                                   <X size={18} />
                                </button>
                             </div>
                           </div>
                           
                           <div className="flex-1 overflow-auto rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
                              <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                  <tr>
                                    <th className="p-6 w-14">
                                       <div className="flex items-center justify-center">
                                          <input type="checkbox" checked={selectedRows.size === filteredData.length && filteredData.length > 0} onChange={handleSelectAll} className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-0" />
                                       </div>
                                    </th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Idx</th>
                                    {availableColumns.map((col) => (
                                      <th key={col} className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                  {currentData.map((row) => {
                                    const actualIndex = importedData.indexOf(row);
                                    const isSelected = selectedRows.has(actualIndex);
                                    return (
                                      <tr key={actualIndex} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors ${isSelected ? 'bg-slate-900/[0.02] dark:bg-white/[0.02]' : ''}`}>
                                        <td className="p-6">
                                          <div className="flex items-center justify-center">
                                             <input type="checkbox" checked={isSelected} onChange={() => handleRowSelect(actualIndex)} className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-0 cursor-pointer" />
                                          </div>
                                        </td>
                                        <td className="p-6 text-[11px] font-black text-slate-300">{actualIndex + 1}</td>
                                        {availableColumns.map(col => (
                                          <td key={col} className="p-6 whitespace-nowrap text-[13px] font-bold text-slate-900 dark:text-slate-200">{row[col]}</td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                           </div>
                           
                           {totalPages > 1 && (
                             <div className="mt-8 flex items-center justify-between px-4">
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global Page {currentPage} / {totalPages}</span>
                               <div className="flex gap-3">
                                 <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-900 transition-all disabled:opacity-20">
                                    <ArrowRight size={18} className="rotate-180" />
                                 </button>
                                 <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-900 transition-all disabled:opacity-20">
                                    <ArrowRight size={18} />
                                 </button>
                               </div>
                             </div>
                           )}
                        </div>
                     ) : (
                        <div className="space-y-12">
                           {/* Text Field Mapping */}
                           <div className="space-y-8">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white"></div>
                                  <h4 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">Text Mapping Matrix</h4>
                                </div>
                                <span className="text-[9px] font-black text-slate-300 uppercase">Input-to-Buffer Logic</span>
                             </div>

                             <div className="grid grid-cols-1 gap-4">
                               {placeholderElements.map((element) => {
                                 const fieldName = getFieldName(element.content);
                                 const isMapped = !!columnMapping[element.id];
                                 return (
                                   <div key={element.id} className="group relative p-8 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-slate-900 dark:hover:border-white transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-slate-900/5">
                                      <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                                         <div className="lg:w-1/3">
                                            <div className="flex items-center gap-4 mb-3">
                                               <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-serif text-slate-400 text-lg">T</div>
                                               <span className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{fieldName}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-14">Studio Field</p>
                                         </div>

                                         <div className="hidden lg:flex flex-1 items-center justify-center">
                                            <div className={`w-full h-px bg-slate-100 dark:bg-slate-800 relative ${isMapped ? 'bg-slate-900 dark:bg-white' : ''}`}>
                                               <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all ${isMapped ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : ''}`}>
                                                  <ArrowRight size={14} className={isMapped ? 'text-slate-900 dark:text-white' : 'text-slate-200'} />
                                               </div>
                                            </div>
                                         </div>

                                         <div className="lg:w-1/3 space-y-3">
                                            <div className="relative">
                                              <select
                                                value={columnMapping[element.id] || ""}
                                                onChange={(e) => handleColumnMappingChange(element.id, e.target.value)}
                                                className={`w-full p-4.5 pl-6 pr-12 rounded-2xl border-2 font-black text-[11px] uppercase tracking-wider outline-none transition-all appearance-none cursor-pointer ${isMapped ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                                              >
                                                <option value="">Link Source Column...</option>
                                                {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                              </select>
                                              <ArrowDown size={14} className={`absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none ${isMapped ? 'text-white dark:text-slate-900' : 'text-slate-300'}`} />
                                            </div>
                                            {isMapped && importedData[0] && (
                                              <div className="flex items-center gap-2 px-4 py-2 bg-green-50/50 dark:bg-green-900/10 rounded-xl animate-in slide-in-from-top-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 truncate">BUFFER PREVIEW: "{importedData[0][columnMapping[element.id]]}"</span>
                                              </div>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>

                           {/* Barcode Mapping Matrix */}
                           {barcodeElements.length > 0 && (
                             <div className="space-y-8 pt-12 border-t border-slate-50 dark:border-slate-900">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white"></div>
                                    <h4 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">Composite Barcode Logic</h4>
                                  </div>
                                  <span className="text-[9px] font-black text-slate-300 uppercase">Multivariate Encoding</span>
                               </div>

                               <div className="grid grid-cols-1 gap-6">
                                  {barcodeElements.map((element) => (
                                    <div key={element.id} className="p-10 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 flex flex-col gap-10">
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-5">
                                             <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                {getBarcodeIcon(element.barcodeType)}
                                             </div>
                                             <div>
                                                <h5 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{getBarcodeTypeName(element.barcodeType)}</h5>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Multi-Segment Source</p>
                                             </div>
                                          </div>
                                          <button 
                                            onClick={() => handleAddBarcodeColumn(element.id)} 
                                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:-translate-y-0.5 transition-all"
                                          >
                                            <Plus size={16} className="mr-2" /> Add Data Segment
                                          </button>
                                       </div>

                                       <div className="space-y-8 pl-10 border-l-2 border-slate-100 dark:border-slate-800">
                                          <div className="flex items-center gap-6 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 w-fit">
                                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Glue Fragment:</span>
                                             <input
                                               type="text"
                                               value={barcodeSeparators[element.id] || " "}
                                               onChange={(e) => handleSeparatorChange(element.id, e.target.value)}
                                               className="w-16 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl text-center font-mono text-[13px] font-black text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white border-2 border-transparent transition-all"
                                               placeholder="SPC"
                                             />
                                             <span className="text-[9px] font-bold text-slate-300 uppercase mr-4">Raw Sequence Joining</span>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             {(barcodeMultiMapping[element.id] || []).map((selectedCol, index) => (
                                               <div key={index} className="group flex gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                                                  <div className="flex-1 relative">
                                                    <select
                                                      value={selectedCol}
                                                      onChange={(e) => handleBarcodeColumnChange(element.id, index, e.target.value)}
                                                      className="w-full p-4 pl-6 pr-12 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.25rem] font-black text-[11px] uppercase tracking-wider text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white outline-none appearance-none transition-all cursor-pointer"
                                                    >
                                                      <option value="">SEGMENT #{index + 1}...</option>
                                                      {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                                    </select>
                                                    <ArrowDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300" />
                                                  </div>
                                                  <button onClick={() => handleRemoveBarcodeColumn(element.id, index)} className="w-14 h-14 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 transition-all">
                                                    <Trash2 size={20} />
                                                  </button>
                                               </div>
                                             ))}
                                          </div>
                                          {(barcodeMultiMapping[element.id] || []).length === 0 && (
                                            <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-center">
                                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">No dynamic segments defined for this composite barcode.<br/>Initialize segments to build the encoded buffer.</p>
                                            </div>
                                          )}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                             </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer Persistence */}
        <div className="px-12 py-10 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between shrink-0 bg-white dark:bg-slate-950">
           <div className="flex items-center gap-4 text-slate-300">
             <Info size={18} />
             <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
               {importFile ? `Buffer Synchronization Active • ${importedData.length} records available` : "System awaiting data source initialization"}
             </p>
           </div>
           
           <div className="flex gap-6 items-center">
             <button
               onClick={onClose}
               className="px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
             >
               Discard Matrix
             </button>
             <div className="h-12 w-px bg-slate-50 dark:bg-slate-900"></div>
             <button
               onClick={handleGenerateLabels}
               disabled={(importMethod === 'upload' ? importedData.length === 0 : manualRows.length === 0) || !hasValidMapping()}
               className="px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3"
             >
               <CheckCircle size={18} /> Process Label Stream
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
