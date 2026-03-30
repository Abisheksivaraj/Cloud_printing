import React, { useState } from "react";
import { X, Check, Database, Link, Calculator } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const BINDING_TYPES = [
  { id: "static", label: "Static Content", desc: "Fixed text, images, or shapes that do not change.", icon: <Database size={16} /> },
  { id: "dynamic", label: "Dynamic Data", desc: "Content populated automatically from a database or API.", icon: <Link size={16} /> },
  { id: "computational", label: "Computational", desc: "Value derived dynamically using a formula.", icon: <Calculator size={16} /> }
];

const BindingTypeModal = ({ onClose, onSave, defaultType = "static" }) => {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState(defaultType);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50 dark:bg-white/5" style={{ borderColor: theme.border }}>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: theme.text }}>Select Binding Type</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-[var(--color-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm font-medium text-gray-500">How should this element's data be populated?</p>

          <div className="space-y-3">
            {BINDING_TYPES.map((type) => (
              <label
                key={type.id}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedType === type.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-transparent bg-gray-50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="radio"
                    name="bindingType"
                    value={type.id}
                    checked={selectedType === type.id}
                    onChange={() => setSelectedType(type.id)}
                    className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={selectedType === type.id ? "text-[var(--color-primary)]" : "text-gray-500"}>
                      {type.icon}
                    </span>
                    <span className="font-bold text-sm" style={{ color: theme.text }}>{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{type.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t flex justify-end gap-3" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedType)}
            className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <Check size={16} />
            Save & Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default BindingTypeModal;
