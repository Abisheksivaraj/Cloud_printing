import React, { useState, useMemo, useEffect } from "react";
import { X, Printer, Settings, RefreshCw, Check, LayoutGrid, Ruler, Type, Move, Sliders } from "lucide-react";
import { useTheme } from "../../ThemeContext";

/*
  CreateLabelModal Component
  Refactored to align with the new design system.
  Uses theme variables for consistent styling.
*/

const CreateLabelModal = ({ onClose, onCreate }) => {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("settings");
  const [labelName, setLabelName] = useState("");
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(30);

  // Printer states
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({
    paperSize: "A4",
    orientation: "portrait",
    quality: "normal",
    copies: 1,
    colorMode: "color",
  });

  // Advanced settings - Default to 2x2 grid
  const [columns, setColumns] = useState(1);
  const [rows, setRows] = useState(1);
  const [horizontalSpacing, setHorizontalSpacing] = useState(1);
  const [verticalSpacing, setVerticalSpacing] = useState(11);
  const [marginLeft, setMarginLeft] = useState(2);
  const [marginRight, setMarginRight] = useState(2);
  const [marginTop, setMarginTop] = useState(2);
  const [marginBottom, setMarginBottom] = useState(2);

  // Shape settings
  const [labelShape, setLabelShape] = useState("rectangle");
  const [cornerRadius, setCornerRadius] = useState(2);
  const [printDirection, setPrintDirection] = useState("horizontal");
  const [startCorner, setStartCorner] = useState("top-left");
  const [orientation, setOrientation] = useState(0);

  // Relocation
  const [relocateLeft, setRelocateLeft] = useState(0);
  const [relocateTop, setRelocateTop] = useState(0);

  // Predefined label sizes
  const [selectedLabelSize, setSelectedLabelSize] = useState("custom");

  // Fetch available printers on component mount
  useEffect(() => {
    fetchAvailablePrinters();
  }, []);

  const fetchAvailablePrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const response = await fetch("http://localhost:3001/api/printers");
      if (response.ok) {
        const data = await response.json();
        setAvailablePrinters(data.printers || []);
        if (data.printers && data.printers.length > 0) {
          const defaultPrinter = data.printers.find((p) => p.isDefault);
          setSelectedPrinter(defaultPrinter ? defaultPrinter.name : data.printers[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching printers:", error);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handlePrinterChange = async (printerName) => {
    setSelectedPrinter(printerName);
  };

  const labelSizePresets = [
    { id: "ATPL-100x75", name: "ATPL 100x75", width: 100, height: 75, cols: 2, rows: 1 },
    { id: "ATPL-100x50", name: "ATPL 100x50", width: 100, height: 50, cols: 2, rows: 1 },
    { id: "ATPL-50x25-2a", name: "ATPL 50x25 (2A)", width: 50, height: 25, cols: 2, rows: 2 },
    { id: "ATPL-100x100", name: "ATPL 100x100", width: 100, height: 100, cols: 1, rows: 1 },
    { id: "custom", name: "Custom", width: 50, height: 30, cols: 2, rows: 2 },
  ];

  // Calculate label order based on settings
  const getLabelOrder = useMemo(() => {
    const totalLabels = Math.min(columns * rows, 25);
    const order = [];

    for (let i = 0; i < totalLabels; i++) {
      let row, col;

      if (printDirection === "horizontal") {
        row = Math.floor(i / columns);
        col = i % columns;
      } else {
        col = Math.floor(i / rows);
        row = i % rows;
      }

      if (startCorner === "top-right") {
        col = columns - 1 - col;
      } else if (startCorner === "bottom-left") {
        row = rows - 1 - row;
      } else if (startCorner === "bottom-right") {
        col = columns - 1 - col;
        row = rows - 1 - row;
      }

      order.push({ row, col, number: i + 1 });
    }

    return order;
  }, [columns, rows, printDirection, startCorner]);

  const calculatePaperSize = () => {
    let paperWidth = width * columns + marginLeft + marginRight + horizontalSpacing * (columns - 1);
    let paperHeight = height * rows + marginTop + marginBottom + verticalSpacing * (rows - 1);

    paperWidth += Math.abs(relocateLeft);
    paperHeight += Math.abs(relocateTop);

    if (orientation === 90 || orientation === 270) {
      return { width: paperHeight, height: paperWidth };
    }

    return { width: paperWidth, height: paperHeight };
  };

  const paperSize = calculatePaperSize();

  const handleSubmit = () => {
    if (labelName.trim()) {
      onCreate({
        name: labelName.trim(),
        elements: [],
        labelSize: { width, height },
        printer: {
          name: selectedPrinter,
          displayName: availablePrinters.find((p) => p.name === selectedPrinter)?.displayName || selectedPrinter,
          settings: printerSettings,
        },
        advancedSettings: {
          columns, rows, horizontalSpacing, verticalSpacing,
          margins: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
          shape: labelShape, cornerRadius, printDirection, startCorner, orientation,
          relocation: { left: relocateLeft, top: relocateTop },
        },
      });
      onClose();
    }
  };

  const applyLabelSizePreset = (presetId) => {
    const preset = labelSizePresets.find((p) => p.id === presetId);
    if (preset) {
      setSelectedLabelSize(presetId);
      setWidth(preset.width);
      setHeight(preset.height);
      setColumns(preset.cols);
      setRows(preset.rows);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div
        className="w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: theme.surface }}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white dark:bg-gray-800" style={{ borderColor: theme.border }}>
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: theme.text }}>Create New Label</h2>
            <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: theme.textMuted }}>Configure template dimensions & layout</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Layout Container */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Preview Panel */}
          <div className="w-[40%] bg-gray-50 dark:bg-black/20 p-8 border-r flex flex-col overflow-y-auto custom-scrollbar" style={{ borderColor: theme.border }}>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div
                className="p-8 rounded-3xl w-full max-w-md shadow-xl aspect-square flex items-center justify-center relative transition-colors duration-300"
                style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 2 }}
              >
                <div
                  className="grid gap-1 relative transition-all duration-300 w-full h-full"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    aspectRatio: `${paperSize.width} / ${paperSize.height}`,
                    transform: `rotate(${orientation}deg)`,
                  }}
                >
                  {getLabelOrder.map((labelInfo) => (
                    <div
                      key={labelInfo.number}
                      className="border-2 border-dashed flex items-center justify-center text-xs font-black text-gray-400 relative transition-colors"
                      style={{
                        borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                        gridColumn: labelInfo.col + 1,
                        gridRow: labelInfo.row + 1,
                        borderRadius: labelShape === 'rounded' ? `${cornerRadius}px` : labelShape === 'ellipse' ? '50%' : '8px'
                      }}
                    >
                      {labelInfo.number}
                      {labelInfo.number === 1 && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--color-primary)] rounded-full border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border text-center transition-colors" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Paper Size</p>
                <p className="text-xl font-black" style={{ color: theme.text }}>{paperSize.width.toFixed(1)} × {paperSize.height.toFixed(1)} <span className="text-xs align-top">mm</span></p>
              </div>
              <div className="p-4 rounded-2xl border text-center transition-colors" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Label Size</p>
                <p className="text-xl font-black" style={{ color: theme.text }}>{width} × {height} <span className="text-xs align-top">mm</span></p>
              </div>
            </div>
          </div>

          {/* Right: Configuration Panel */}
          <div className="flex-1 flex flex-col" style={{ backgroundColor: theme.surface }}>
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: theme.border }}>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'settings'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab("layout")}
                className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'layout'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                Layout & Grid
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {activeTab === "settings" && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Template Name</label>
                    <div className="relative group">
                      <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                        placeholder="e.g. Shipping Label 4x6"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Target Printer</label>
                      <button
                        onClick={fetchAvailablePrinters}
                        disabled={isLoadingPrinters}
                        className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={isLoadingPrinters ? "animate-spin" : ""} /> Refresh
                      </button>
                    </div>
                    <div className="relative group">
                      <Printer size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedPrinter}
                        onChange={(e) => handlePrinterChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 appearance-none cursor-pointer"
                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      >
                        {availablePrinters.length === 0 && <option>No printers found</option>}
                        {availablePrinters.map(p => (
                          <option key={p.name} value={p.name}>{p.displayName || p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Preset Size</label>
                    <div className="relative group">
                      <Settings size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedLabelSize}
                        onChange={(e) => applyLabelSizePreset(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 appearance-none cursor-pointer"
                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      >
                        {labelSizePresets.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Width (mm)</label>
                      <div className="relative group">
                        <Ruler size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                          style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Height (mm)</label>
                      <div className="relative group">
                        <Ruler size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                          style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "layout" && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                  <div className="p-6 rounded-2xl border bg-gray-50/50 dark:bg-black/20" style={{ borderColor: theme.border }}>
                    <div className="flex items-center gap-2 mb-4 text-[var(--color-primary)]">
                      <LayoutGrid size={20} />
                      <h4 className="text-xs font-black uppercase tracking-widest">Grid Layout</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Columns</label>
                        <input
                          type="number"
                          value={columns}
                          onChange={(e) => setColumns(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                          style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
                          min="1" max="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Rows</label>
                        <input
                          type="number"
                          value={rows}
                          onChange={(e) => setRows(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                          style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
                          min="1" max="10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Move size={16} />
                        <h4 className="text-xs font-black uppercase tracking-widest">Spacing (mm)</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Horizontal</label>
                          <input
                            type="number"
                            value={horizontalSpacing}
                            onChange={(e) => setHorizontalSpacing(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Vertical</label>
                          <input
                            type="number"
                            value={verticalSpacing}
                            onChange={(e) => setVerticalSpacing(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Sliders size={16} />
                        <h4 className="text-xs font-black uppercase tracking-widest">Margins (mm)</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Left</label>
                          <input
                            type="number"
                            value={marginLeft}
                            onChange={(e) => setMarginLeft(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Top</label>
                          <input
                            type="number"
                            value={marginTop}
                            onChange={(e) => setMarginTop(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-4 text-gray-400">Label Shape</h4>
                    <div className="flex gap-4 p-1 rounded-xl bg-gray-100 dark:bg-black/20 overflow-hidden">
                      {['rectangle', 'rounded', 'ellipse'].map(shape => (
                        <button
                          key={shape}
                          onClick={() => setLabelShape(shape)}
                          className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${labelShape === shape
                            ? 'bg-white dark:bg-gray-800 text-[var(--color-primary)] shadow-sm scale-100'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 scale-95'}`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50/30 dark:bg-black/10 shrink-0" style={{ borderColor: theme.border }}>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                style={{ color: theme.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!labelName.trim()}
                className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 text-xs uppercase tracking-wider disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                Create Label
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelModal;
