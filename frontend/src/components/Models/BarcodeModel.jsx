import React from "react";
import { X, Hash, Info, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";

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

const BarcodeModal = ({ value, setValue, barcodeType, onClose, onCreate }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                <Hash size={20} className="text-white" />
             </div>
             <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Barcode Value
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Type: <span className="text-sky-500">{barcodeTypes.find((t) => t.value === barcodeType)?.label || barcodeType}</span>
                </p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Component Identifier
              </label>
              <div className="flex items-center gap-1.5 text-sky-500">
                <Info size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Help</span>
              </div>
            </div>
            <div className="relative group">
              <input
                type="text"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && value.trim() && onCreate()}
                placeholder="Enter value (e.g. 123456789)"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-black text-sm tracking-widest outline-none transition-all focus:border-slate-900 dark:focus:border-white placeholder:text-slate-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <CheckCircle2 size={18} className="text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Discard
            </button>
            <button
              onClick={onCreate}
              disabled={!value.trim()}
              className="flex-[1.5] px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all hover:-translate-y-0.5"
            >
              Apply Binding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeModal;
