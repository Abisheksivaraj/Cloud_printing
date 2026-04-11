import React, { useState } from "react";
import { Trash2, Undo, Redo, Copy, Plus, Check, FileText, ArrowUp, ArrowDown, RotateCw, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, ChevronDown, ChevronUp, Layers, Image as ImageIcon, Settings, Ruler, X, Search } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { convertToPx, convertFromPx } from "../../supabaseClient";

const PropertiesPanel = ({
  selectedElement,
  updateElement,
  deleteElement,
  onBarcodeTypeChange,
  isDrawingLine,
  isDrawingBarcode,
  isDrawingShape,
  onUndo,
  onRedo,
  onDuplicate,
  canUndo,
  canRedo,
  onAddShape,
  onAddTable,
  onAddPlaceholder,
  onActivateShapeDrawing,
  showShapeSelector = false,
  showTableCreator = false,
  onActivateBarcodeDrawing,
  showBarcodeSelector = false,
  selectedBarcodeType,
  setSelectedBarcodeType,
  onBringForward,
  onSendBackward,
  labelSize,
  updateLabelSize
}) => {

  const { theme, isDarkMode } = useTheme();
  const [tableRows, setTableRows] = useState(2);
  const [tableColumns, setTableColumns] = useState(2);
  const [placeholderName, setPlaceholderName] = useState("");

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128" },
    { value: "CODE39", label: "Code 39" },
    { value: "EAN13", label: "EAN-13" },
    { value: "EAN8", label: "EAN-8" },
    { value: "UPC", label: "UPC-A" },
    { value: "QR", label: "QR Code" },
    { value: "DATAMATRIX", label: "Data Matrix" },
    { value: "PDF417", label: "PDF417" },
    { value: "AZTEC", label: "Aztec Code" },
  ];

  const shapeTypes = [
    { value: "", label: "Select Shape..." },
    { value: "rectangle", label: "Rectangle" },
    { value: "circle", label: "Circle" },
  ];

  const fontFamilies = [
    "Arial", "Arial Black", "Times New Roman", "Courier New",
    "Georgia", "Verdana", "Trebuchet MS", "Impact",
    "Inter", "Roboto", "Open Sans",
  ];

  const handleAddPlaceholder = () => {
    if (placeholderName.trim()) {
      const formattedName = placeholderName.trim().startsWith("{{")
        ? placeholderName.trim()
        : `{{${placeholderName.trim()}}}`;
      onAddPlaceholder(formattedName);
      setPlaceholderName("");
    }
  };

  const handleShapeSelection = (shapeType) => {
    if (shapeType && onActivateShapeDrawing) {
      onActivateShapeDrawing(shapeType);
    }
  };

  const handleBarcodeTypeSelection = (barcodeType) => {
    if (barcodeType && onActivateBarcodeDrawing) {
      onActivateBarcodeDrawing(barcodeType);
    }
  };

  const el = selectedElement;
  const id = el?.id;

  const unit = labelSize?.unit || "mm";

  const SectionHeader = ({ children, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-2 px-1">
      {Icon && <Icon size={12} className="text-slate-400" />}
      <h5 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex-1">
        {children}
      </h5>
      <div className="h-px bg-slate-100 flex-1" />
    </div>
  );

  const Label = ({ children, className = "" }) => (
    <label className={`text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ${className}`}>
      {children}
    </label>
  );

  const ControlGroup = ({ children, className = "" }) => (
    <div className={`p-4 rounded-xl border border-slate-100 bg-white/50 backdrop-blur-sm space-y-4 ${className}`}>
      {children}
    </div>
  );

  const NumInput = ({ label, value, onChange, min = 0, max, step = 0.01, isPx = true, prefix }) => {
    const displayValue = isPx ? convertFromPx(value, unit) : value;
    const formattedValue = isPx && unit !== 'px' ? Math.round(displayValue * 100) / 100 : displayValue;

    return (
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between px-0.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
          <span className="text-[8px] font-mono text-slate-300 lowercase">{unit}</span>
        </div>
        <div className="relative group/input">
          {prefix && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase select-none">
              {prefix}
            </div>
          )}
          <input
            type="number"
            value={formattedValue ?? 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange(isPx ? convertToPx(val, unit) : val);
            }}
            min={min}
            max={max}
            step={unit === 'px' ? 1 : 0.01}
            className={`w-full bg-slate-50/50 border border-slate-200/60 hover:border-slate-300 focus:border-slate-400 focus:bg-white text-slate-900 text-[11px] py-1.5 rounded-lg transition-all outline-none font-mono text-center ${prefix ? 'pl-7' : 'px-2'}`}
          />
        </div>
      </div>
    );
  };

  const ColorPicker = ({ label, value, onChange }) => (
    <div className="flex flex-col gap-1.5 flex-1">
      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-0.5">{label}</label>
      <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/60 bg-slate-50/50 hover:bg-white transition-all group/color">
        <div className="relative w-5 h-5 rounded-md overflow-hidden border border-slate-200 shadow-sm shrink-0">
          <input
            type="color"
            value={value === "transparent" ? "#ffffff" : (value || "#000000")}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 w-10 h-10 cursor-pointer border-0 p-0"
          />
          {value === "transparent" && <div className="absolute inset-0 bg-white flex items-center justify-center text-[10px] text-red-500 font-bold rotate-45 select-none">/</div>}
        </div>
        <input 
          type="text"
          value={value === "transparent" ? "None" : value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-0 p-0 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-tighter w-full outline-none"
        />
        {value !== "transparent" && (
          <button
            onClick={() => onChange("transparent")}
            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
            title="Set transparent"
          ><X size={10} /></button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full bg-white/90 backdrop-blur-2xl text-slate-700"
    >
      {/* Top action bar */}
      <div className="p-6 border-b border-slate-200 shrink-0 bg-slate-50/50">
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${canUndo
              ? "bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 shadow-sm active:scale-95"
              : "opacity-40 cursor-not-allowed border border-slate-200 text-slate-400 bg-slate-50"
              }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={12} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${canRedo
              ? "bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 shadow-sm active:scale-95"
              : "opacity-40 cursor-not-allowed border border-slate-200 text-slate-400 bg-slate-50"
              }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={12} />
          </button>
          <button
            onClick={onDuplicate}
            disabled={!el}
            className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${el
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95"
              : "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">

        {!el && (
          <div className="space-y-6">
            <ControlGroup>
              <SectionHeader icon={Settings}>Label Properties</SectionHeader>
              
              <div className="space-y-5">
                {/* Unit Selection */}
                <div className="flex flex-col gap-2">
                  <Label>Measurement System</Label>
                  <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                    {['mm', 'cm', 'inch', 'px'].map((u) => (
                      <button
                        key={u}
                        onClick={() => updateLabelSize({ ...labelSize, unit: u })}
                        className={`flex-1 py-1.5 rounded-md flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all ${unit === u ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label Dimensions */}
                <div className="flex gap-4">
                  <NumInput 
                    isPx={false} 
                    label="Width" 
                    value={labelSize.width} 
                    onChange={(v) => updateLabelSize({ ...labelSize, width: v })} 
                  />
                  <NumInput 
                    isPx={false} 
                    label="Height" 
                    value={labelSize.height} 
                    onChange={(v) => updateLabelSize({ ...labelSize, height: v })} 
                  />
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed italic px-1 border-l-2 border-slate-100">
                  Changing units translates all design coordinates. Pixel values assume 96 DPI standard.
                </p>
              </div>
            </ControlGroup>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              {(isDrawingLine || isDrawingBarcode || isDrawingShape) ? (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
                    <Ruler size={20} className="text-slate-400 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-[11px] uppercase tracking-widest text-slate-600">Drawing Active</p>
                    <p className="text-[10px] text-slate-400">Click and drag on the canvas paper</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 opacity-40">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
                    <Layers size={20} className="text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-[11px] uppercase tracking-widest text-slate-400">Queue Empty</p>
                    <p className="text-[10px] text-slate-400">Select an element to inspect properties</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder Widget */}
        <ControlGroup className="bg-amber-50/30 border-amber-100/50">
          <SectionHeader icon={Plus}>Placeholder</SectionHeader>
          <div className="flex gap-2">
            <input
              type="text"
              value={placeholderName}
              onChange={(e) => setPlaceholderName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddPlaceholder()}
              placeholder="field_id"
              className="flex-1 bg-white border border-amber-200/50 hover:border-amber-400 focus:border-amber-500 text-slate-900 text-[11px] font-mono py-1.5 px-3 rounded-lg transition-all outline-none"
            />
            <button
              onClick={handleAddPlaceholder}
              disabled={!placeholderName.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
        </ControlGroup>

        {/* Barcode Selector Widget */}
        {showBarcodeSelector && (
          <ControlGroup className="bg-indigo-50/30 border-indigo-100/50">
            <SectionHeader icon={Info}>Barcode Symbology</SectionHeader>
            <div className="space-y-3">
              <select
                onChange={(e) => handleBarcodeTypeSelection(e.target.value)}
                value={selectedBarcodeType || ""}
                className="w-full bg-white border border-indigo-200/50 hover:border-indigo-400 focus:border-indigo-500 text-slate-900 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                <option value="" disabled>Select Format...</option>
                {barcodeTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <div className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${!selectedBarcodeType ? 'text-amber-500/80' : 'text-indigo-500/80'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${!selectedBarcodeType ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'}`} />
                {selectedBarcodeType ? "Drawing Mode Armed" : "Symbology Required"}
              </div>
            </div>
          </ControlGroup>
        )}

        {/* Shape Selector Widget */}
        {showShapeSelector && (
          <ControlGroup className="bg-purple-50/30 border-purple-100/50">
            <SectionHeader icon={Grid}>Shape Geometry</SectionHeader>
            <select
              onChange={(e) => {
                handleShapeSelection(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="w-full bg-white border border-purple-200/50 hover:border-purple-400 focus:border-purple-500 text-slate-900 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all outline-none appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="" disabled>Choose Primitive...</option>
              {shapeTypes.filter(s => s.value).map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </ControlGroup>
        )}

        {/* Table Creator Widget */}
        {showTableCreator && (
          <ControlGroup className="bg-emerald-50/30 border-emerald-100/50">
            <SectionHeader icon={Grid}>Grid System</SectionHeader>
            <div className="flex gap-4">
              <NumInput isPx={false} label="Rows" value={tableRows} onChange={(v) => setTableRows(v)} unit="qty" />
              <NumInput isPx={false} label="Cols" value={tableColumns} onChange={(v) => setTableColumns(v)} unit="qty" />
            </div>
            <button
              onClick={() => onAddTable(tableRows, tableColumns)}
              className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]"
            >
              Generate Object
            </button>
          </ControlGroup>
        )}

        {/* ─── ELEMENT PROPERTIES ─── */}
        {el && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

            {/* Element Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  {el.type === 'text' && <FileText size={18} className="text-blue-500" />}
                  {el.type === 'image' && <ImageIcon size={18} className="text-emerald-500" />}
                  {el.type === 'barcode' && <Search size={18} className="text-indigo-500" />}
                  {el.type === 'rectangle' && <div className="w-4 h-3 border-2 border-purple-500 rounded-sm" />}
                  {el.type === 'circle' && <div className="w-4 h-4 border-2 border-purple-500 rounded-full" />}
                  {el.type === 'line' && <Minus size={18} className="text-amber-500 rotate-45" />}
                  {el.type === 'table' && <Grid size={18} className="text-cyan-500" />}
                  {el.type === 'placeholder' && <Plus size={18} className="text-amber-600" />}
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-800">
                    {el.type} <span className="text-slate-300 font-mono ml-1 font-normal select-none">/</span> <span className="text-slate-400 font-mono text-[10px] lowercase">obj_{id?.slice(-4)}</span>
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold tracking-tight mt-0.5 uppercase tracking-widest">Active Component</p>
                </div>
              </div>
              <button
                onClick={deleteElement}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                title="Destroy Object"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Layer Control */}
            <ControlGroup groupName="Arrangement">
              <SectionHeader icon={Layers}>Arrangement</SectionHeader>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onBringForward}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all active:scale-95"
                >
                  <ArrowUp size={12} /> Forward
                </button>
                <button
                  onClick={onSendBackward}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all active:scale-95"
                >
                  <ArrowDown size={12} /> Backward
                </button>
              </div>
            </ControlGroup>

            {/* Position & Size */}
            <ControlGroup>
              <SectionHeader icon={Ruler}>Geometrics</SectionHeader>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <NumInput label="X-Axis" value={el.x} onChange={(v) => updateElement(id, { x: v })} prefix="X" />
                  <NumInput label="Y-Axis" value={el.y} onChange={(v) => updateElement(id, { y: v })} prefix="Y" />
                </div>
                {el.type !== 'line' && (
                  <div className="flex gap-4">
                    <NumInput label="Width" value={el.width} onChange={(v) => updateElement(id, { width: Math.max(1, v) })} prefix="W" />
                    <NumInput label="Height" value={el.height} onChange={(v) => updateElement(id, { height: Math.max(1, v) })} prefix="H" />
                  </div>
                )}
                
                {/* Rotation */}
                {el.type !== 'line' && (
                  <div className="pt-2 border-t border-slate-100/50">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <Label className="mb-0">Orientation</Label>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{(el.rotation || 0)}°</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={el.rotation || 0}
                        onChange={(e) => updateElement(id, { rotation: Number(e.target.value) })}
                        className="flex-1 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400"
                      />
                      <button 
                        onClick={() => updateElement(id, { rotation: 0 })}
                        className="text-[9px] font-black text-slate-300 hover:text-slate-600 uppercase tracking-widest transition-colors"
                      >Reset</button>
                    </div>
                  </div>
                )}
              </div>
            </ControlGroup>

            {/* Content Editor */}
            {(['text', 'barcode', 'placeholder'].includes(el.type)) && (
              <ControlGroup>
                <SectionHeader icon={FileText}>Encoded Data</SectionHeader>
                <textarea
                  value={el.content || ""}
                  onChange={(e) => updateElement(id, { content: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200/60 focus:border-slate-400 focus:bg-white text-slate-900 text-xs py-2.5 px-3 rounded-lg transition-all outline-none font-mono min-h-[80px] leading-relaxed"
                  placeholder="Insert value..."
                />
              </ControlGroup>
            )}

            {/* Typography */}
            {(['text', 'placeholder'].includes(el.type)) && (
              <ControlGroup>
                <SectionHeader icon={Bold}>Typography</SectionHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 px-0.5">
                    <Label className="mb-0">Typeface</Label>
                    <select
                      value={el.fontFamily || "Arial"}
                      onChange={(e) => updateElement(id, { fontFamily: e.target.value })}
                      className="w-full bg-white border border-slate-200/60 hover:border-slate-400 text-slate-900 text-[11px] font-bold py-1.5 px-2 rounded-lg outline-none appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                    >
                      {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <NumInput label="Pt Size" value={el.fontSize || 14} onChange={(v) => updateElement(id, { fontSize: Math.max(1, v) })} min={1} max={500} unit="pt" isPx={false} />
                    <ColorPicker label="Fill Color" value={el.color || "#000000"} onChange={(v) => updateElement(id, { color: v })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="mb-0 px-0.5">Character Style</Label>
                      <div className="flex gap-1">
                        {[
                          { key: 'fontWeight', on: 'bold', off: 'normal', icon: <Bold size={12} />, title: 'Bold' },
                          { key: 'fontStyle', on: 'italic', off: 'normal', icon: <Italic size={12} />, title: 'Italic' },
                          { key: 'textDecoration', on: 'underline', off: 'none', icon: <Underline size={12} />, title: 'Underline' },
                        ].map(({ key, on, off, icon, title }) => (
                          <button
                            key={key}
                            title={title}
                            onClick={() => updateElement(id, { [key]: el[key] === on ? off : on })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${el[key] === on ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                          >{icon}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="mb-0 px-0.5">Alignment</Label>
                      <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                        {[
                          { val: 'left', icon: <AlignLeft size={12} /> },
                          { val: 'center', icon: <AlignCenter size={12} /> },
                          { val: 'right', icon: <AlignRight size={12} /> },
                        ].map(({ val, icon }) => (
                          <button
                            key={val}
                            onClick={() => updateElement(id, { textAlign: val })}
                            title={val}
                            className={`flex-1 py-1 rounded-md flex items-center justify-center transition-all ${(el.textAlign || 'left') === val ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-400'}`}
                          >{icon}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Spacing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="mb-0 px-0.5">Kerning</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={-2} max={15} step={0.5}
                          value={el.letterSpacing || 0}
                          onChange={(e) => updateElement(id, { letterSpacing: Number(e.target.value) })}
                          className="flex-1 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400"
                        />
                        <span className="text-[9px] w-6 text-center font-mono font-bold text-slate-400">{(el.letterSpacing || 0)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="mb-0 px-0.5">Leading</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={0.5} max={3} step={0.1}
                          value={el.lineHeight || 1.2}
                          onChange={(e) => updateElement(id, { lineHeight: Number(e.target.value) })}
                          className="flex-1 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400"
                        />
                        <span className="text-[9px] w-6 text-center font-mono font-bold text-slate-400">{(el.lineHeight || 1.2).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ControlGroup>
            )}

            {/* Barcode Parameters */}
            {el.type === "barcode" && (
              <ControlGroup>
                <SectionHeader icon={Info}>Format Details</SectionHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 px-0.5">
                    <Label className="mb-0">Symbology</Label>
                    <select
                      value={el.barcodeType || "CODE128"}
                      onChange={(e) => onBarcodeTypeChange(e.target.value)}
                      className="w-full bg-white border border-slate-200/60 hover:border-slate-400 text-slate-900 text-[11px] font-bold py-1.5 px-2 rounded-lg outline-none appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                    >
                      {barcodeTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <NumInput label="Mod Width" value={el.barcodeWidth || 2} onChange={(v) => updateElement(id, { barcodeWidth: Math.max(1, v) })} min={1} max={5} unit="px" isPx={false} />
                    <NumInput label="Ratio %" value={el.barcodeBarHeight || 70} onChange={(v) => updateElement(id, { barcodeBarHeight: Math.max(20, Math.min(100, v)) })} min={20} max={100} unit="%" isPx={false} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="mb-0 px-0.5">Value Visibility</Label>
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                      {[
                        { label: 'Shown', val: true },
                        { label: 'Hidden', val: false },
                      ].map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => updateElement(id, { showBarcodeText: opt.val })}
                          className={`flex-1 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${(el.showBarcodeText !== false ? true : false) === opt.val ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-400'}`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </ControlGroup>
            )}

            {/* Optics for Images */}
            {el.type === "image" && (
              <ControlGroup>
                <SectionHeader icon={ImageIcon}>Visual Parameters</SectionHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between px-0.5">
                      <Label className="mb-0">Opacity</Label>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{Math.round((el.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={el.opacity ?? 1}
                      onChange={(e) => updateElement(id, { opacity: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="mb-0 px-0.5">Proportion Lock</Label>
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                      {[
                        { label: 'Proportional', val: true },
                        { label: 'Freeform', val: false },
                      ].map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => updateElement(id, { lockAspectRatio: opt.val })}
                          className={`flex-1 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${(el.lockAspectRatio !== false ? true : false) === opt.val ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-400'}`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </ControlGroup>
            )}

            {/* Path Styles for Lines */}
            {el.type === "line" && (
              <ControlGroup>
                <SectionHeader icon={Minus}>Line Attributes</SectionHeader>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <NumInput label="Weight" value={el.borderWidth || 1} onChange={(v) => updateElement(id, { borderWidth: Math.max(0, v) })} min={0} max={100} prefix="T" />
                    <ColorPicker label="Stroke" value={el.borderColor || "#000000"} onChange={(v) => updateElement(id, { borderColor: v })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="mb-0 px-0.5">Dash Pattern</Label>
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                      {['solid', 'dashed', 'dotted'].map(style => (
                        <button
                          key={style}
                          onClick={() => updateElement(id, { borderStyle: style })}
                          className={`flex-1 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${(el.borderStyle || 'solid') === style ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-400'}`}
                        >{style}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </ControlGroup>
            )}

            {/* Primitive Geometry Styles */}
            {['rectangle', 'circle'].includes(el.type) && (
              <ControlGroup>
                <SectionHeader icon={Grid}>Primitive Style</SectionHeader>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <ColorPicker label="Fill" value={el.backgroundColor || "transparent"} onChange={(v) => updateElement(id, { backgroundColor: v })} />
                    <ColorPicker label="Stroke" value={el.borderColor || "#000000"} onChange={(v) => updateElement(id, { borderColor: v })} />
                  </div>
                  <div className="flex gap-4">
                    <NumInput label="Weight" value={el.borderWidth || 0} onChange={(v) => updateElement(id, { borderWidth: Math.max(0, v) })} min={0} max={100} prefix="T" />
                    {el.type === 'rectangle' && (
                      <NumInput label="Corners" value={el.borderRadius || 0} onChange={(v) => updateElement(id, { borderRadius: Math.max(0, v) })} min={0} max={200} prefix="R" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="mb-0 px-0.5">Pattern</Label>
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                      {['solid', 'dashed', 'dotted'].map(style => (
                        <button
                          key={style}
                          onClick={() => updateElement(id, { borderStyle: style })}
                          className={`flex-1 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${(el.borderStyle || 'solid') === style ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-400'}`}
                        >{style}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </ControlGroup>
            )}

            {/* Table Settings */}
            {el.type === "table" && (
              <ControlGroup>
                <SectionHeader icon={Grid}>Grid Array Parameters</SectionHeader>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <NumInput label="Cell W" value={el.cellWidth || 60} onChange={(v) => updateElement(id, { cellWidth: Math.max(1, v) })} min={1} prefix="W" />
                    <NumInput label="Cell H" value={el.cellHeight || 25} onChange={(v) => updateElement(id, { cellHeight: Math.max(1, v) })} min={1} prefix="H" />
                  </div>
                  <div className="flex gap-4">
                    <NumInput label="Weight" value={el.borderWidth || 1} onChange={(v) => updateElement(id, { borderWidth: Math.max(0, v) })} min={0} prefix="T" />
                    <ColorPicker label="Stroke" value={el.borderColor || "#000000"} onChange={(v) => updateElement(id, { borderColor: v })} />
                  </div>
                  <ColorPicker label="Cell Fill" value={el.backgroundColor || "transparent"} onChange={(v) => updateElement(id, { backgroundColor: v })} />
                </div>
              </ControlGroup>
            )}

            {/* General Aesthetics */}
            {!['line', 'rectangle', 'circle', 'table'].includes(el.type) && (
              <ControlGroup>
                <SectionHeader icon={Palette}>Global Aesthetics</SectionHeader>
                <div className="flex gap-4">
                  {!['text', 'placeholder'].includes(el.type) && (
                    <ColorPicker label="Primary" value={el.color || "#000000"} onChange={(v) => updateElement(id, { color: v })} />
                  )}
                  <ColorPicker label="Surface" value={el.backgroundColor || "transparent"} onChange={(v) => updateElement(id, { backgroundColor: v })} />
                </div>
              </ControlGroup>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
