import React, { useState } from "react";
import {
  Trash2, Undo, Redo, Copy, Plus, Check,
  FileText, ArrowUp, ArrowDown, RotateCw,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  ChevronDown, ChevronUp, Layers, Image as ImageIcon,
} from "lucide-react";
import { useTheme } from "../../ThemeContext";

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

  // Section header style
  const SectionHeader = ({ children, color = "var(--color-primary)" }) => (
    <h5 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color }}>
      {children}
    </h5>
  );

  const Label = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 block uppercase tracking-widest">
      {children}
    </label>
  );

  const NumInput = ({ label, value, onChange, min = 0, max, step = 1 }) => (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="input text-xs py-1.5 w-full"
      />
    </div>
  );

  const ColorPicker = ({ label, value, onChange }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 p-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-main)]">
        <input
          type="color"
          value={value === "transparent" ? "#ffffff" : (value || "#000000")}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0"
        />
        <span className="text-[10px] font-mono opacity-70 truncate">{value === "transparent" ? "None" : value}</span>
        {value !== "transparent" && (
          <button
            onClick={() => onChange("transparent")}
            className="text-[9px] text-gray-400 hover:text-red-400 ml-auto shrink-0"
            title="Set transparent"
          >✕</button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="w-80 border-l flex flex-col overflow-hidden shadow-lg z-20 transition-colors duration-200"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      {/* Top action bar */}
      <div className="p-3 border-b shrink-0" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
        <h3 className="font-black text-[10px] uppercase tracking-widest mb-2.5 px-1" style={{ color: theme.textMuted }}>
          Properties
        </h3>

        <div className="flex gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold transition-all ${canUndo
              ? "hover:bg-blue-500/10 text-blue-600 border border-blue-500/20 active:scale-95"
              : "opacity-20 cursor-not-allowed border border-[var(--color-border)]"
              }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={13} /> Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold transition-all ${canRedo
              ? "hover:bg-blue-500/10 text-blue-600 border border-blue-500/20 active:scale-95"
              : "opacity-20 cursor-not-allowed border border-[var(--color-border)]"
              }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={13} /> Redo
          </button>
          <button
            onClick={onDuplicate}
            disabled={!el}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold transition-all ${el
              ? "hover:bg-green-500/10 text-green-600 border border-green-500/20 active:scale-95"
              : "opacity-20 cursor-not-allowed border border-[var(--color-border)]"
              }`}
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={13} /> Copy
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* No selection state */}
        {!el && (
          <div className="flex flex-col items-center justify-center h-36 text-center text-gray-400 opacity-60">
            {(isDrawingLine || isDrawingBarcode || isDrawingShape) ? (
              <>
                <div className="animate-pulse mb-2 text-2xl">✏️</div>
                <p className="font-bold text-xs">Drawing Mode Active</p>
                <p className="text-[10px] mt-1">Click and drag on the canvas</p>
              </>
            ) : (
              <>
                <div className="mb-2 text-2xl">🖱️</div>
                <p className="font-bold text-xs">No Element Selected</p>
                <p className="text-[10px] mt-1">Click an element on the canvas</p>
              </>
            )}
          </div>
        )}

        {/* Placeholder Widget */}
        <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            📦 Add Placeholder
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={placeholderName}
              onChange={(e) => setPlaceholderName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddPlaceholder()}
              placeholder="field_name"
              className="input text-xs py-1.5 h-8 w-full"
            />
            <button
              onClick={handleAddPlaceholder}
              disabled={!placeholderName.trim()}
              className="btn btn-primary h-8 w-8 p-0 flex items-center justify-center shrink-0 text-xs"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Barcode Selector Widget */}
        {showBarcodeSelector && (
          <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.25)' }}>
            <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              📊 Barcode Type
            </h4>
            <select
              onChange={(e) => handleBarcodeTypeSelection(e.target.value)}
              value={selectedBarcodeType || ""}
              className="input text-sm"
            >
              <option value="" disabled>Select Type...</option>
              {barcodeTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <div className={`mt-2 text-[10px] flex items-center gap-1.5 ${!selectedBarcodeType ? 'text-orange-500' : 'text-blue-500'}`}>
              {selectedBarcodeType ? (
                <><Check size={10} /> Ready — drag on canvas to place</>
              ) : (
                <><span className="animate-pulse">●</span> Select type first to enable drawing</>
              )}
            </div>
          </div>
        )}

        {/* Shape Selector Widget */}
        {showShapeSelector && (
          <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(147,51,234,0.05)', borderColor: 'rgba(147,51,234,0.25)' }}>
            <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              ⬜ Shape Type
            </h4>
            <select
              onChange={(e) => {
                handleShapeSelection(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="input text-sm"
            >
              {shapeTypes.map((type) => (
                <option key={type.value} value={type.value} disabled={!type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table Creator Widget */}
        {showTableCreator && (
          <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              📋 Insert Table
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label>Rows</Label>
                <input type="number" value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} min="1" max="20" className="input text-sm py-1" />
              </div>
              <div>
                <Label>Cols</Label>
                <input type="number" value={tableColumns} onChange={(e) => setTableColumns(Number(e.target.value))} min="1" max="20" className="input text-sm py-1" />
              </div>
            </div>
            <button
              onClick={() => onAddTable(tableRows, tableColumns)}
              className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              ＋ Create {tableRows}×{tableColumns} Table
            </button>
          </div>
        )}

        {/* ─── ELEMENT PROPERTIES ─── */}
        {el && (
          <div className="space-y-4">

            {/* Element Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
              <div>
                <h4 className="font-black text-sm capitalize flex items-center gap-2" style={{ color: theme.text }}>
                  {el.type === 'text' && <FileText size={15} className="text-blue-500" />}
                  {el.type === 'image' && <ImageIcon size={15} className="text-green-500" />}
                  {el.type === 'barcode' && <span className="text-sm">📊</span>}
                  {el.type === 'rectangle' && <span className="text-sm">▭</span>}
                  {el.type === 'circle' && <span className="text-sm">⭕</span>}
                  {el.type === 'line' && <span className="text-sm">╱</span>}
                  {el.type === 'table' && <span className="text-sm">⊞</span>}
                  {el.type === 'placeholder' && <span className="text-sm">📦</span>}
                  {el.type}
                </h4>
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">#{id?.slice(-8)}</p>
              </div>
              <button
                onClick={deleteElement}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Element (Del)"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Layer Control */}
            <div className="rounded-lg p-3 border" style={{ borderColor: theme.border }}>
              <SectionHeader><Layers size={10} className="mr-0.5" /> Layer Order</SectionHeader>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onBringForward}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40"
                  style={{ borderColor: theme.border, color: theme.text }}
                  title="Bring Forward"
                >
                  <ArrowUp size={12} /> Bring Up
                </button>
                <button
                  onClick={onSendBackward}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40"
                  style={{ borderColor: theme.border, color: theme.text }}
                  title="Send Backward"
                >
                  <ArrowDown size={12} /> Send Back
                </button>
              </div>
            </div>

            {/* Position & Size */}
            <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
              <SectionHeader>Position & Size</SectionHeader>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="X (px)" value={Math.round(el.x)} onChange={(v) => updateElement(id, { x: v })} />
                <NumInput label="Y (px)" value={Math.round(el.y)} onChange={(v) => updateElement(id, { y: v })} />
                {el.type !== 'line' && (
                  <>
                    <NumInput label="Width (px)" value={Math.round(el.width)} onChange={(v) => updateElement(id, { width: Math.max(10, v) })} min={10} />
                    <NumInput label="Height (px)" value={Math.round(el.height)} onChange={(v) => updateElement(id, { height: Math.max(10, v) })} min={10} />
                  </>
                )}
              </div>
              {/* Rotation */}
              {el.type !== 'line' && (
                <div>
                  <Label>Rotation (°)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={el.rotation || 0}
                      onChange={(e) => updateElement(id, { rotation: Number(e.target.value) })}
                      className="flex-1 h-1.5 accent-[var(--color-primary)]"
                    />
                    <input
                      type="number"
                      value={el.rotation || 0}
                      onChange={(e) => updateElement(id, { rotation: Number(e.target.value) })}
                      min={-180}
                      max={180}
                      className="input text-xs py-1 w-16 text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Editor */}
            {(['text', 'barcode', 'placeholder'].includes(el.type)) && (
              <div className="rounded-lg p-3 border space-y-2" style={{ borderColor: theme.border }}>
                <SectionHeader>Content</SectionHeader>
                <textarea
                  value={el.content || ""}
                  onChange={(e) => updateElement(id, { content: e.target.value })}
                  className="input min-h-[70px] text-sm resize-none"
                  placeholder="Enter content..."
                />
              </div>
            )}

            {/* ── TEXT TYPOGRAPHY ── */}
            {(['text', 'placeholder'].includes(el.type)) && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader><FileText size={10} className="mr-0.5" /> Typography</SectionHeader>

                {/* Font Family */}
                <div>
                  <Label>Font Family</Label>
                  <select
                    value={el.fontFamily || "Arial"}
                    onChange={(e) => updateElement(id, { fontFamily: e.target.value })}
                    className="input text-xs py-1.5"
                  >
                    {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Size + Color row */}
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="Font Size (pt)" value={el.fontSize || 14} onChange={(v) => updateElement(id, { fontSize: Math.max(6, v) })} min={6} max={200} />
                  <ColorPicker label="Text Color" value={el.color || "#000000"} onChange={(v) => updateElement(id, { color: v })} />
                </div>

                {/* Style toggles */}
                <div>
                  <Label>Style</Label>
                  <div className="flex gap-1.5">
                    {[
                      { key: 'fontWeight', on: 'bold', off: 'normal', icon: <Bold size={13} />, title: 'Bold' },
                      { key: 'fontStyle', on: 'italic', off: 'normal', icon: <Italic size={13} />, title: 'Italic' },
                      { key: 'textDecoration', on: 'underline', off: 'none', icon: <Underline size={13} />, title: 'Underline' },
                    ].map(({ key, on, off, icon, title }) => (
                      <button
                        key={key}
                        title={title}
                        onClick={() => updateElement(id, { [key]: el[key] === on ? off : on })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${el[key] === on ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >{icon}</button>
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <Label>Alignment</Label>
                  <div className="flex bg-[var(--color-bg-main)] p-0.5 rounded-lg border border-[var(--color-border)]">
                    {[
                      { val: 'left', icon: <AlignLeft size={13} /> },
                      { val: 'center', icon: <AlignCenter size={13} /> },
                      { val: 'right', icon: <AlignRight size={13} /> },
                    ].map(({ val, icon }) => (
                      <button
                        key={val}
                        onClick={() => updateElement(id, { textAlign: val })}
                        title={val}
                        className={`flex-1 py-1.5 rounded flex items-center justify-center transition-all ${(el.textAlign || 'left') === val ? 'bg-white dark:bg-gray-700 shadow-sm text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                      >{icon}</button>
                    ))}
                  </div>
                </div>

                {/* Spacing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Letter Spacing</Label>
                    <div className="flex items-center gap-1">
                      <input
                        type="range" min={-3} max={20} step={0.5}
                        value={el.letterSpacing || 0}
                        onChange={(e) => updateElement(id, { letterSpacing: Number(e.target.value) })}
                        className="flex-1 h-1.5 accent-[var(--color-primary)]"
                      />
                      <span className="text-[10px] w-7 text-center font-mono">{el.letterSpacing || 0}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Line Height</Label>
                    <div className="flex items-center gap-1">
                      <input
                        type="range" min={0.8} max={3} step={0.1}
                        value={el.lineHeight || 1.2}
                        onChange={(e) => updateElement(id, { lineHeight: Number(e.target.value) })}
                        className="flex-1 h-1.5 accent-[var(--color-primary)]"
                      />
                      <span className="text-[10px] w-7 text-center font-mono">{(el.lineHeight || 1.2).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BARCODE EXTENDED ── */}
            {el.type === "barcode" && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader>📊 Barcode Settings</SectionHeader>
                <div>
                  <Label>Symbology</Label>
                  <select
                    value={el.barcodeType || "CODE128"}
                    onChange={(e) => onBarcodeTypeChange(e.target.value)}
                    className="input text-sm"
                  >
                    {barcodeTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput
                    label="Bar Width"
                    value={el.barcodeWidth || 2}
                    onChange={(v) => updateElement(id, { barcodeWidth: Math.max(1, v) })}
                    min={1} max={5}
                  />
                  <NumInput
                    label="Bar Height %"
                    value={el.barcodeBarHeight || 70}
                    onChange={(v) => updateElement(id, { barcodeBarHeight: Math.max(20, Math.min(100, v)) })}
                    min={20} max={100}
                  />
                </div>
                <div>
                  <Label>Show Value Text</Label>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => updateElement(id, { showBarcodeText: opt === 'Yes' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${(el.showBarcodeText !== false ? 'Yes' : 'No') === opt ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── IMAGE PROPERTIES ── */}
            {el.type === "image" && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader><ImageIcon size={10} className="mr-0.5" /> Image Settings</SectionHeader>
                <div>
                  <Label>Opacity ({Math.round((el.opacity ?? 1) * 100)}%)</Label>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={el.opacity ?? 1}
                    onChange={(e) => updateElement(id, { opacity: Number(e.target.value) })}
                    className="w-full h-1.5 accent-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <Label>Lock Aspect Ratio</Label>
                  <div className="flex gap-2">
                    {['Locked', 'Free'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => updateElement(id, { lockAspectRatio: opt === 'Locked' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${(el.lockAspectRatio !== false ? 'Locked' : 'Free') === opt ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── LINE STYLE ── */}
            {el.type === "line" && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader>╱ Stroke Style</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="Thickness (px)" value={el.borderWidth || 1} onChange={(v) => updateElement(id, { borderWidth: Math.max(1, v) })} min={1} max={50} />
                  <ColorPicker label="Color" value={el.borderColor || "#000000"} onChange={(v) => updateElement(id, { borderColor: v })} />
                </div>
                <div>
                  <Label>Line Style</Label>
                  <div className="flex gap-2">
                    {['solid', 'dashed', 'dotted'].map(style => (
                      <button
                        key={style}
                        onClick={() => updateElement(id, { borderStyle: style })}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border capitalize transition-all ${(el.borderStyle || 'solid') === style ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                      >{style}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SHAPE STYLE ── */}
            {['rectangle', 'circle'].includes(el.type) && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader>◻ Shape Style</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker label="Fill Color" value={el.backgroundColor || "transparent"} onChange={(v) => updateElement(id, { backgroundColor: v })} />
                  <ColorPicker label="Border Color" value={el.borderColor || "#000000"} onChange={(v) => updateElement(id, { borderColor: v })} />
                  <NumInput label="Border Width" value={el.borderWidth || 0} onChange={(v) => updateElement(id, { borderWidth: Math.max(0, v) })} min={0} max={50} />
                  {el.type === 'rectangle' && (
                    <NumInput label="Corner Radius" value={el.borderRadius || 0} onChange={(v) => updateElement(id, { borderRadius: Math.max(0, v) })} min={0} max={100} />
                  )}
                </div>
                <div>
                  <Label>Border Style</Label>
                  <div className="flex gap-2">
                    {['solid', 'dashed', 'dotted'].map(style => (
                      <button
                        key={style}
                        onClick={() => updateElement(id, { borderStyle: style })}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border capitalize transition-all ${(el.borderStyle || 'solid') === style ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                      >{style}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TABLE SETTINGS ── */}
            {el.type === "table" && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader>⊞ Table Style</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="Cell Width (px)" value={el.cellWidth || 60} onChange={(v) => updateElement(id, { cellWidth: Math.max(20, v) })} min={20} />
                  <NumInput label="Cell Height (px)" value={el.cellHeight || 25} onChange={(v) => updateElement(id, { cellHeight: Math.max(10, v) })} min={10} />
                  <NumInput label="Border Width" value={el.borderWidth || 1} onChange={(v) => updateElement(id, { borderWidth: Math.max(0, v) })} min={0} />
                  <ColorPicker label="Border Color" value={el.borderColor || "#000000"} onChange={(v) => updateElement(id, { borderColor: v })} />
                </div>
                <ColorPicker label="Background" value={el.backgroundColor || "transparent"} onChange={(v) => updateElement(id, { backgroundColor: v })} />
              </div>
            )}

            {/* ── GENERAL COLOURS (text/placeholder/barcode bg) ── */}
            {!['line', 'rectangle', 'circle', 'table'].includes(el.type) && (
              <div className="rounded-lg p-3 border space-y-3" style={{ borderColor: theme.border }}>
                <SectionHeader>🎨 Appearance</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  {!['text', 'placeholder'].includes(el.type) && (
                    <ColorPicker label="Foreground" value={el.color || "#000000"} onChange={(v) => updateElement(id, { color: v })} />
                  )}
                  <ColorPicker label="Background" value={el.backgroundColor || "transparent"} onChange={(v) => updateElement(id, { backgroundColor: v })} />
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
