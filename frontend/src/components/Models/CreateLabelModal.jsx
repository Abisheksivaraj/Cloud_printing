import React, { useState, useEffect } from "react";
import { 
  X, Printer, Settings, RefreshCw, Ruler, 
  Target, Plus, Smartphone, ChevronRight, 
  Code, Info, Layout, Layers, Monitor, Move
} from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { callEdgeFunction, API_URLS, MM_TO_PX, DPI } from "../../supabaseClient";

const PRESETS = [
  { id: "100x75", name: "ATPL Logistics", width: 100, height: 75, slug: "Industrial Standard" },
  { id: "100x50", name: "ATPL Medium", width: 100, height: 50, slug: "Shipping Label" },
  { id: "50x25", name: "ATPL Compact", width: 50, height: 25, slug: "Asset Tag" },
  { id: "100x100", name: "ATPL Square", width: 100, height: 100, slug: "Large Format" },
  { id: "custom", name: "Custom Frame", width: 50.8, height: 40, slug: "User Defined" }
];

const CreateLabelModal = ({ onClose, onCreate }) => {
  const { theme, isDarkMode } = useTheme();

  // Basic Info
  const [labelName, setLabelName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("100x75");

  // Dimensions
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(75);
  const [unit, setUnit] = useState("mm");
  const [orientation, setOrientation] = useState("landscape");

  // Settings
  const [dpi, setDpi] = useState(300);
  const [margin, setMargin] = useState(2);
  const [defaultFont, setDefaultFont] = useState("Plus Jakarta Sans");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // "preview" or "tech"

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    const preset = PRESETS.find(p => p.id === catId);
    if (preset && catId !== "custom") {
      const w = orientation === "portrait" ? Math.min(preset.width, preset.height) : Math.max(preset.width, preset.height);
      const h = orientation === "portrait" ? Math.max(preset.width, preset.height) : Math.min(preset.width, preset.height);
      setWidth(w);
      setHeight(h);
    }
  };

  const handleOrientationChange = (mode) => {
    setOrientation(mode);
    if ((mode === "portrait" && width > height) || (mode === "landscape" && height > width)) {
      setWidth(height);
      setHeight(width);
    }
  };

  const currentPayload = {
    name: labelName.trim() || "Untitled Project",
    description,
    category,
    dimensions: { width, height, unit },
    orientation,
    settings: {
      dpi,
      margin,
      default_font: defaultFont
    },
    initial_elements: [
      { id: 'border-top', type: 'line', x: 0, y: 0, x1: 0, y1: 0, x2: width * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), y2: 0, borderWidth: 1, borderColor: "#000000", isSystem: true, locked: true },
      { id: 'border-bottom', type: 'line', x: 0, y: height * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), x1: 0, y1: height * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), x2: width * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), y2: height * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), borderWidth: 1, borderColor: "#000000", isSystem: true, locked: true },
      { id: 'border-left', type: 'line', x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: height * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), borderWidth: 1, borderColor: "#000000", isSystem: true, locked: true },
      { id: 'border-right', type: 'line', x: width * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), y: 0, x1: width * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), y1: 0, x2: width * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), y2: height * (unit === 'mm' ? MM_TO_PX : (unit === 'cm' ? DPI/2.54 : (unit === 'inch' ? DPI : MM_TO_PX))), borderWidth: 1, borderColor: "#000000", isSystem: true, locked: true },
    ]
  };

  const handleSubmit = async () => {
    if (!labelName.trim()) return;
    setIsSubmitting(true);
    try {
      const design = await callEdgeFunction(API_URLS.CREATE_DESIGN, currentPayload);
      if (design) {
        onCreate({ ...currentPayload, ...design });
        onClose();
      }
    } catch (error) {
      console.error("Creation failed:", error);
      alert(`Setup Error: ${error.message}`);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        
        {/* Header - Clean & Professional */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
               <Layers size={20} className="text-white dark:text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">New Design Project</h2>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Project Configuration Sheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Left: Input Dashboard */}
          <div className="flex-[1.4] overflow-y-auto p-8 space-y-10 custom-scrollbar border-r border-slate-100 dark:border-slate-900 min-h-0">
            
            {/* Identity Persistence */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Layout size={14} className="text-slate-400" />
                  <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Project Identity</h4>
               </div>

               <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Label Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={labelName}
                      onChange={(e) => setLabelName(e.target.value)}
                      placeholder="e.g. Master Logistics #1"
                      className="input py-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Internal Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter design notes or usage context..."
                      className="input py-3 min-h-[80px] resize-none"
                    />
                  </div>
               </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} className="text-slate-400" />
                    <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Media Standards</h4>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 uppercase">Zebra Certified</span>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleCategoryChange(p.id)}
                      className={`group p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${category === p.id 
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' 
                        : 'border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 hover:border-slate-300'}`}
                    >
                      <div className="relative z-10">
                        <span className="block text-[12px] font-bold tracking-tight">{p.name}</span>
                        <span className={`text-[10px] font-medium opacity-60 block mt-1 ${category === p.id ? 'text-white/80' : 'text-slate-500'}`}>{p.width} × {p.height}mm</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 block ${category === p.id ? 'text-white/40' : 'text-slate-300'}`}>{p.slug}</span>
                      </div>
                      <Printer size={32} className={`absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-125 ${category === p.id ? 'text-white' : 'text-slate-900'}`} />
                    </button>
                  ))}
               </div>
            </div>

            {/* Geometry Specification */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Ruler size={14} className="text-slate-400" />
                  <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Geometry Configuration</h4>
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Width</label>
                    <div className="relative">
                      <input type="number" step="0.1" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="input pr-10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{unit}</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Height</label>
                    <div className="relative">
                      <input type="number" step="0.1" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input pr-10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{unit}</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Unit</label>
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input appearance-none cursor-pointer">
                      <option value="mm">MM</option>
                      <option value="cm">CM</option>
                      <option value="inch">INCH</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">DPI</label>
                    <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="input appearance-none cursor-pointer">
                      <option value={203}>203</option>
                      <option value={300}>300</option>
                      <option value={600}>600</option>
                    </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Orientation</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                      <button onClick={() => handleOrientationChange("landscape")} className={`flex-1 py-2 rounded-md font-bold text-[11px] transition-all ${orientation === "landscape" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                        Landscape
                      </button>
                      <button onClick={() => handleOrientationChange("portrait")} className={`flex-1 py-2 rounded-md font-bold text-[11px] transition-all ${orientation === "portrait" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                        Portrait
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 ml-1">Safe Margin</label>
                    <div className="relative">
                      <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="input pr-10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{unit}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Right: Technical Preview */}
          <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center shrink-0 overflow-y-auto custom-scrollbar">
            <div className="w-full flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <Target size={14} className="text-slate-400" />
                  <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Blueprint Preview</span>
               </div>
               <button onClick={() => setViewMode(viewMode === "preview" ? "tech" : "preview")} className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Code size={14} /> {viewMode === "preview" ? "JSON" : "Layout"}
               </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center relative">
               {viewMode === "tech" ? (
                 <div className="w-full h-full bg-slate-900 rounded-xl p-6 overflow-auto custom-scrollbar shadow-inner border border-white/5">
                   <pre className="text-[11px] text-blue-300 font-mono leading-relaxed opacity-70">
                     {JSON.stringify(currentPayload, null, 2)}
                   </pre>
                 </div>
               ) : (
                 <div className="relative group">
                    {/* Shadow Layer for Depth */}
                    <div className="absolute inset-4 bg-black/10 blur-2xl rounded-sm translate-y-4"></div>
                    
                    {/* The Label Mockup */}
                    <div 
                      className="relative bg-white shadow-2xl border border-slate-200 transition-all duration-500 ease-in-out flex items-center justify-center overflow-hidden" 
                      style={{ 
                        width: '100%', 
                        minWidth: orientation === 'landscape' ? '380px' : '280px',
                        maxWidth: orientation === 'landscape' ? '400px' : '300px',
                        aspectRatio: `${width}/${height}`,
                        borderRadius: '2px'
                      }}
                    >
                      {/* Grid Pattern Overlay */}
                      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '10px 10px' }}></div>
                      
                      {/* Technical Guides */}
                      <div className="absolute inset-0 border-2 border-dashed border-sky-400/10 m-2"></div>
                      
                      {/* Placeholder Visuals */}
                      <div className="w-full px-10 space-y-3 opacity-[0.04]">
                         <div className="h-4 bg-slate-900 rounded-sm w-1/3"></div>
                         <div className="h-10 bg-slate-900 rounded-sm w-full"></div>
                         <div className="h-6 bg-slate-900 rounded-sm w-4/5"></div>
                         <div className="pt-2 flex gap-2">
                            <div className="h-12 bg-slate-900 rounded-sm flex-1"></div>
                            <div className="h-12 bg-slate-900 rounded-sm flex-1"></div>
                         </div>
                      </div>

                      {/* Dimensions Overlay */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400 uppercase">
                         {width} × {height} {unit}
                      </div>

                      <div className="absolute bottom-4 right-6 text-[11px] font-black uppercase tracking-[0.2em] opacity-10 text-slate-900">Blueprint v2</div>
                    </div>

                    {/* Scale Controls */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 whitespace-nowrap">
                       <div className="flex items-center gap-2">
                          <Move size={12} className="text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Automatic Scaling</span>
                       </div>
                       <div className="w-px h-3 bg-slate-200 dark:bg-slate-800"></div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{dpi} DPI Matrix</span>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Footer Persistence */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 text-slate-400">
             <Info size={16} className="text-sky-500" />
             <p className="text-[11px] font-medium leading-tight max-w-[300px]">Data verified for professional printing. Dimensions must match physical media stock.</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={onClose}
              className="btn btn-ghost text-[11px] uppercase tracking-wider h-11 px-6"
            >
              Discard
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <button
              onClick={handleSubmit}
              disabled={!labelName.trim() || isSubmitting}
              className="btn btn-primary h-11 px-10 text-[11px] uppercase tracking-[0.15em] shadow-xl shadow-sky-500/20"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Processing
                </div>
              ) : (
                <div className="flex items-center gap-2">
                   Initialize Project
                   <ChevronRight size={16} />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelModal;
