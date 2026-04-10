import React, { useState } from "react";
import { X, Check, Database, Link, Calculator } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const BINDING_TYPES = [
  { id: "static", label: "Static Content", desc: "Fixed text, images, or shapes that do not change.", icon: <Database size={18} /> },
  { id: "dynamic", label: "Dynamic Data", desc: "Content populated automatically from a database or API.", icon: <Link size={18} /> },
  { id: "computational", label: "Computational", desc: "Value derived dynamically using a formula.", icon: <Calculator size={18} /> }
];

const BindingTypeModal = ({ isOpen, onClose, onSave, defaultType = "static" }) => {
  const { theme, isDarkMode } = useTheme();
  const [selectedType, setSelectedType] = useState(defaultType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4 animate-in fade-in duration-300">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Data Source</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select element binding logic</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-4">
          <div className="space-y-3">
            {BINDING_TYPES.map((type) => {
              const isActive = selectedType === type.id;
              return (
                <label
                  key={type.id}
                  className={`
                    group relative flex items-start gap-5 p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300
                    ${isActive
                      ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/50 shadow-lg shadow-slate-900/5"
                      : "border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                    }
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isActive ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}
                  `}>
                    {type.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-[13px] uppercase tracking-tight text-slate-900 dark:text-white">
                        {type.label}
                      </span>
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
                           <Check size={12} className="text-white dark:text-slate-900" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-snug">{type.desc}</p>
                  </div>
                  
                  <input
                    type="radio"
                    name="bindingType"
                    value={type.id}
                    checked={isActive}
                    onChange={() => setSelectedType(type.id)}
                    className="hidden"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedType)}
            className="flex-1 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-center"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BindingTypeModal;
