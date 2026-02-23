import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Upload,
  X,
  FileText,
  Package,
  Clock,
  LayoutGrid,
  Filter
} from "lucide-react";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import ImportDataModal from "../components/Models/ImportDataModal";
import PrintPreviewModal from "../components/Models/PrintPreviewModal";
import GeneratedLabelsPreview from "../components/Models/GeneratedLabelsPreview";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";
import { useTheme } from "../ThemeContext";

const LabelLibrary = ({
  labels,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
}) => {
  const { t } = useLanguage();
  const { theme, isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLabelForImport, setSelectedLabelForImport] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [labelToPrint, setLabelToPrint] = useState(null);
  const [generatedLabels, setGeneratedLabels] = useState([]);
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);

  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleImportData = (label) => {
    setSelectedLabelForImport(label);
    setShowImportModal(true);
  };

  const handlePrint = (label) => {
    setLabelToPrint(label);
    setShowPrintPreview(true);
  };

  const handleLabelsGenerated = (labels) => {
    setGeneratedLabels(labels);
    setShowImportModal(false);
    setShowGeneratedPreview(true);
  };

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: theme.text }}>
              Label Library
            </h1>
            <p className="text-lg" style={{ color: theme.textMuted }}>
              Manage, design, and print your label templates with ease.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--color-primary)]"
                size={18}
                style={{ color: theme.textMuted }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all outline-none focus:ring-4 focus:ring-primary/10"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                  style={{ color: theme.textMuted }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              <span>{t.createNewLabel}</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Labels", value: labels.length, icon: Package, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Active", value: labels.filter((l) => l.elements?.length > 0).length, icon: FileText, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "Barcodes", value: labels.filter((l) => l.elements?.some((e) => e.type === "barcode")).length, icon: "📊", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
            {
              label: "Recent", value: labels.filter((l) => {
                // Pseudo-logic for recent, assuming we track last modified eventually
                return true;
              }).length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20"
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border transition-all hover:shadow-md"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  {typeof stat.icon === 'string' ? <span className="text-xl">{stat.icon}</span> : <stat.icon size={24} />}
                </div>
                {i === 0 && <div className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">All Time</div>}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Labels Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <LayoutGrid size={20} className="text-[var(--color-primary)]" />
              Templates Gallery
            </h2>
            <button className="flex items-center gap-2 text-sm font-medium hover:text-[var(--color-primary)] transition-colors" style={{ color: theme.textMuted }}>
              <Filter size={16} />
              Filter & Sort
            </button>
          </div>

          {filteredLabels.length === 0 ? (
            <div
              className="py-16 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center"
              style={{
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(248, 250, 252, 0.8)',
                borderColor: theme.border,
              }}
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Package className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>
                {labels.length === 0 ? "No templates yet" : "No matching results"}
              </h3>
              <p className="max-w-sm mb-6 text-sm" style={{ color: theme.textMuted }}>
                {labels.length === 0
                  ? "Click \"Create New Label\" above to design your first label template."
                  : "Try a different search term."}
              </p>
              {labels.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>New Label</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLabels.map((label) => (
                <div
                  key={label.id}
                  className="group rounded-2xl overflow-hidden border transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b" style={{ borderColor: theme.border }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-bold text-lg truncate mb-1" style={{ color: theme.text }}>
                          {label.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                            {label.labelSize?.width || 100} × {label.labelSize?.height || 80}mm
                          </span>
                        </div>
                      </div>
                      {label.attachedPdf && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 rounded-md">
                          PDF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview Area */}
                  <div className="h-48 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center p-6 relative overflow-hidden group-hover:bg-gray-100 dark:group-hover:bg-gray-900 transition-colors">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-primary)]/5 flex items-center justify-center backdrop-blur-sm z-10">
                      <button
                        onClick={() => onEditLabel(label)}
                        className="bg-white dark:bg-gray-800 text-[var(--color-primary)] px-6 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                      >
                        Open Editor
                      </button>
                    </div>

                    {label.elements && label.elements.length > 0 ? (
                      <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center bg-white dark:bg-gray-800 shadow-sm relative">
                        <div className="absolute top-2 right-2 flex gap-1">
                          {[...Array(Math.min(3, label.elements.length))].map((_, idx) => (
                            <div key={idx} className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          ))}
                        </div>
                        <FileText className="text-[var(--color-primary)] opacity-40 mb-2" size={40} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Preview</span>
                      </div>
                    ) : (
                      <div className="text-center opacity-50">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Plus className="text-gray-400" size={20} />
                        </div>
                        <span className="text-xs font-semibold">Empty</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between gap-2 border-t" style={{ borderColor: theme.border }}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleImportData(label)}
                        className="p-2 text-gray-500 hover:text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Import Data"
                      >
                        <Upload size={18} />
                      </button>
                      <button
                        onClick={() => handlePrint(label)}
                        className="p-2 text-gray-500 hover:text-[var(--color-secondary)] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Print"
                      >
                        <Printer size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditLabel(label)}
                        className="p-2 text-gray-500 hover:text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${label.name}"?`)) {
                            onDeleteLabel(label.id);
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateLabelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateLabel}
        />
      )}

      {showImportModal && selectedLabelForImport && (
        <ImportDataModal
          label={selectedLabelForImport}
          onClose={() => {
            setShowImportModal(false);
            setSelectedLabelForImport(null);
          }}
          onLabelsGenerated={handleLabelsGenerated}
        />
      )}

      {showPrintPreview && labelToPrint && (
        <PrintPreviewModal
          label={labelToPrint}
          onClose={() => {
            setShowPrintPreview(false);
            setLabelToPrint(null);
          }}
        />
      )}

      {showGeneratedPreview && generatedLabels.length > 0 && (
        <GeneratedLabelsPreview
          labels={generatedLabels}
          onClose={() => {
            setShowGeneratedPreview(false);
            setGeneratedLabels([]);
          }}
        />
      )}

      {/* AI Assistant Chatbot */}
      <AIChatbot
        onGenerateElements={(newElements, nextLabelSize, isNewRequest) => {
          onCreateLabel({
            name: `AI Design - ${new Date().toLocaleTimeString()}`,
            elements: newElements,
            labelSize: nextLabelSize || { width: 100, height: 80 }
          });
        }}
        labelSize={{ width: 100, height: 80 }}
        generateId={() => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}
      />
    </div>
  );
};

export default LabelLibrary;
