import React, { useState, useEffect } from "react";
import { X, Printer, Settings, RefreshCw, Check, Ruler, Type, Sliders, Hash, Info, Target, Plus, Smartphone, AlignLeft, ChevronRight, ChevronLeft, Code } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { callEdgeFunction, API_URLS } from "../../supabaseClient";

const PRESETS = [
  { id: "100x75", name: "ATPL 100x75", width: 100, height: 75 },
  { id: "100x50", name: "ATPL 100x50", width: 100, height: 50 },
  { id: "50x25", name: "ATPL 50x25 (2A)", width: 50, height: 25 },
  { id: "100x100", name: "ATPL 100x100", width: 100, height: 100 },
  { id: "custom", name: "Custom", width: 50.806, height: 39.952 }
];

const CreateLabelModal = ({ onClose, onCreate }) => {
  const { theme, isDarkMode } = useTheme();

  // Basic Info
  const [labelName, setLabelName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");

  // Dimensions
  const [width, setWidth] = useState(50.806);
  const [height, setHeight] = useState(39.952);
  const [unit, setUnit] = useState("mm");
  const [rotation, setRotation] = useState(90);
  const [orientation, setOrientation] = useState("landscape");

  // Settings
  const [dpi, setDpi] = useState(300);
  const [margin, setMargin] = useState(2);
  const [defaultFont, setDefaultFont] = useState("Arial");

  // Printer states
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewJson, setIsPreviewJson] = useState(false);

  // Fetch available printers on component mount
  useEffect(() => {
    fetchAvailablePrinters();
  }, []);

  const fetchAvailablePrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch("http://localhost:3001/api/printers", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setAvailablePrinters(data.printers || []);
        if (data.printers && data.printers.length > 0) {
          const defaultPrinter = data.printers.find((p) => p.isDefault);
          setSelectedPrinter(defaultPrinter ? defaultPrinter.name : data.printers[0].name);
        }
      }
    } catch (error) {
      // Local printer server not running — fail silently
      console.warn("Printer server not available (localhost:3001). Skipping printer discovery.");
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    const preset = PRESETS.find(p => p.id === catId);
    if (preset && catId !== "custom") {
      if (orientation === "portrait") {
        setWidth(Math.min(preset.width, preset.height));
        setHeight(Math.max(preset.width, preset.height));
      } else {
        setWidth(Math.max(preset.width, preset.height));
        setHeight(Math.min(preset.width, preset.height));
      }
    }
  };

  const handleOrientationChange = (mode) => {
    setOrientation(mode);
    if (mode === "portrait" && width > height) {
      setWidth(height);
      setHeight(width);
    } else if (mode === "landscape" && height > width) {
      setWidth(height);
      setHeight(width);
    }
  };

  const currentPayload = {
    name: labelName.trim(),
    description,
    category,
    dimensions: { width, height, unit },
    rotation,
    orientation,
    binding_type: null,
    settings: {
      dpi,
      margin,
      default_font: defaultFont
    }
  };

  const handleSubmit = async () => {
    if (!labelName.trim()) return;

    setIsSubmitting(true);
    try {
      // Create design via Edge Function
      const design = await callEdgeFunction(API_URLS.CREATE_DESIGN, currentPayload);

      if (design) {
        onCreate({
          ...currentPayload,
          ...design,
          printer: {
            name: selectedPrinter,
            displayName: availablePrinters.find((p) => p.name === selectedPrinter)?.displayName || selectedPrinter,
          }
        });
        onClose();
      }
    } catch (error) {
      console.error("Failed to create design:", error);
      alert(`Create failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div
        className="w-full max-w-6xl h-full max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: theme.surface }}
      >
        {/* Header - Zebra Style */}
        <div className="flex items-center justify-between px-8 py-5 border-b shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>New Label Setup Wizard</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Sub-Header */}
        <div className="px-10 py-4 bg-gray-50/50 dark:bg-black/10 border-b" style={{ borderColor: theme.border }}>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Specify the Label Dimensions</h3>
          <p className="text-xs text-gray-500 mt-1">These dimensions define the physical boundaries and output parameters of your print job.</p>
        </div>

        {/* Main Body - Layout Swapped */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Scrollable Configuration Panel */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar" style={{ backgroundColor: theme.surface }}>

            {/* Identity Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Template Name</label>
                <input
                  autoFocus
                  type="text"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  placeholder="e.g. Product Label A"
                  className="w-full px-4 py-3 rounded-xl border-2 font-medium outline-none transition-all focus:border-[var(--color-primary)]"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Label Type (Category)</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 font-medium outline-none transition-all focus:border-[var(--color-primary)] appearance-none cursor-pointer"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                >
                  {PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Area */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Main product label for inventory..."
                className="w-full px-4 py-3 rounded-xl border-2 font-medium outline-none transition-all focus:border-[var(--color-primary)] min-h-[80px] resize-none"
                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
              />
            </div>

            {/* Dimensions Group */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[var(--color-primary)] tracking-[0.2em] border-b pb-2" style={{ borderColor: theme.border }}>Dimensions & Scaling</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Width</label>
                  <input
                    type="number"
                    step="0.001"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 font-medium outline-none focus:border-[var(--color-primary)]"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Height</label>
                  <input
                    type="number"
                    step="0.001"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 font-medium outline-none focus:border-[var(--color-primary)]"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 font-medium focus:border-[var(--color-primary)] appearance-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  >
                    <option value="mm">mm</option>
                    <option value="in">in</option>
                    <option value="px">px</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Rotation</label>
                  <select
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 font-medium focus:border-[var(--color-primary)] appearance-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Orientation</label>
                <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit gap-1">
                  <button
                    type="button"
                    onClick={() => handleOrientationChange("portrait")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${orientation === "portrait" ? "bg-white dark:bg-gray-800 shadow-sm text-[var(--color-primary)]" : "text-gray-400"}`}
                  >
                    <Smartphone size={16} />
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrientationChange("landscape")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${orientation === "landscape" ? "bg-white dark:bg-gray-800 shadow-sm text-[var(--color-primary)]" : "text-gray-400"}`}
                  >
                    <Smartphone size={16} className="rotate-90" />
                    Landscape
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Safe Margin ({unit})</label>
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 font-medium outline-none focus:border-[var(--color-primary)]"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                />
              </div>
            </div>

            {/* Printer & DPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t" style={{ borderColor: theme.border }}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Target Printer</label>
                  <button type="button" onClick={fetchAvailablePrinters} className="text-[9px] font-black text-[var(--color-primary)] uppercase">Sync</button>
                </div>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 font-medium focus:border-[var(--color-primary)]"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                >
                  {availablePrinters.length === 0 && <option>No printers found</option>}
                  {availablePrinters.map(p => (
                    <option key={p.name} value={p.name}>{p.displayName || p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Output Resolution</label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 font-medium focus:border-[var(--color-primary)]"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                >
                  <option value={203}>203 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: Small Fixed Preview Box like Image 3 */}
          <div className="w-[32%] bg-gray-50/50 dark:bg-black/20 p-8 border-l flex flex-col items-center shrink-0" style={{ borderColor: theme.border }}>

            {/* Toggle Preview Mode */}
            <div className="w-full flex justify-end mb-4">
              <button
                onClick={() => setIsPreviewJson(!isPreviewJson)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-[var(--color-primary)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                title={isPreviewJson ? "Switch to Visual" : "Switch to JSON"}
              >
                <Code size={14} />
                {isPreviewJson ? "Visual" : "JSON"}
              </button>
            </div>

            {/* Warning/Status box like in Zebra Wizard */}
            {!isPreviewJson && (
              <div className="w-full p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg mb-8">
                <div className="flex gap-3 text-red-600 dark:text-red-400">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">The dimensions specified will be used to initialize the design canvas. Ensure these match your physical media.</p>
                </div>
              </div>
            )}

            <div className="flex-1 w-full flex flex-col items-center justify-start py-4 group overflow-hidden">
              {isPreviewJson ? (
                <div className="w-full h-full bg-gray-900 rounded-xl p-4 overflow-auto custom-scrollbar shadow-inner border border-white/5">
                  <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
                    {JSON.stringify(currentPayload, null, 2)}
                  </pre>
                </div>
              ) : (
                <>
                  <div
                    className="relative bg-white shadow-[8px_8px_0px_rgba(0,0,0,0.1)] border-[4px] border-black transition-all duration-500 ease-out flex items-center justify-center overflow-hidden"
                    style={{
                      width: width >= height ? '100%' : 'auto',
                      height: height > width ? '100%' : 'auto',
                      aspectRatio: `${width}/${height}`,
                      maxWidth: '100%',
                      maxHeight: '260px',
                      minHeight: '120px'
                    }}
                  >
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                      backgroundImage: `linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)`,
                      backgroundSize: '16px 16px'
                    }}></div>

                    <div
                      className="font-black text-4xl tracking-tighter opacity-[0.2] select-none transition-transform duration-500"
                      style={{
                        color: '#000',
                        transform: `rotate(${rotation}deg)`
                      }}
                    >
                      ATPL
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Live Preview</span>
                    <p className="text-xs font-bold" style={{ color: theme.textMuted }}>{width} x {height} {unit}</p>
                  </div>
                </>
              )}
            </div>

            {!isPreviewJson && (
              <div className="w-full pt-6 border-t" style={{ borderColor: theme.border }}>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <span>Orientation</span>
                  <span className="text-[var(--color-primary)]">{orientation}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Zebra Wizard Style */}
        <div className="px-8 py-6 border-t flex justify-between items-center bg-gray-50/50 dark:bg-black/20 shrink-0" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuration Step 1 of 1</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!labelName.trim() || isSubmitting}
              className="px-10 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Finish
                  <Check size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelModal;
