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
  Filter,
  Archive,
  ArchiveRestore
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
  userRole,
  onCreateLabel,
  onEditLabel,
  onDraftLabel,
  onDeleteLabel,
  onUpdateStatus,
  onNavigate,
  fetchFullDesign
}) => {
  // Defensive: ensure labels is always an array
  labels = Array.isArray(labels) ? labels : [];

  const { t } = useLanguage();
  const { theme, isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLabelForImport, setSelectedLabelForImport] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [labelToPrint, setLabelToPrint] = useState(null);
  const [generatedLabels, setGeneratedLabels] = useState([]);
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);

  const [showDeleted, setShowDeleted] = useState(false);

  const filteredLabels = labels.filter((label) => {
    const matchesSearch = label.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isDeleted = !!label.deleted_at;

    if (showDeleted) {
      return isDeleted && matchesSearch;
    }
    return !isDeleted && matchesSearch;
  });

  const handleImportData = async (label) => {
    setIsLoadingDesign(true);
    try {
      const fullLabel = await fetchFullDesign(label);
      setSelectedLabelForImport(fullLabel);
      setShowImportModal(true);
    } finally {
      setIsLoadingDesign(false);
    }
  };

  const handlePrint = async (label) => {
    setIsLoadingDesign(true);
    try {
      const fullLabel = await fetchFullDesign(label);
      setLabelToPrint(fullLabel);
      setShowPrintPreview(true);
    } finally {
      setIsLoadingDesign(false);
    }
  };

  const handleLabelsGenerated = (labels) => {
    setGeneratedLabels(labels);
    setShowImportModal(false);
    setShowGeneratedPreview(true);
  };

  return (
    <div className="min-h-screen p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="h1" style={{ color: theme.text }}>
              {showDeleted ? "Deleted Templates" : "Label Library"}
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              {showDeleted
                ? "Manage and restore your recently deleted label templates."
                : "Manage, design, and print your label templates with ease."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Trash Toggle */}
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`btn ${showDeleted
                ? "bg-rose-50 text-rose-600 border border-rose-100"
                : "btn-outline"
                }`}
              title={showDeleted ? "Show Active Templates" : "View Trash"}
            >
              <Trash2 size={18} className="mr-2" />
              <span className="text-sm font-bold">{showDeleted ? "Back to Library" : "Bin"}</span>
            </button>

            <div className="relative group min-w-[300px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--color-primary)]"
                size={18}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="input pl-11"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={20} className="mr-2" />
              <span>{t.createNewLabel}</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Templates", value: labels.length, icon: Package, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
            { label: "Draft Elements", value: labels.filter((l) => l.elements?.length > 0).length, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            {
              label: "Print History",
              value: "Activity",
              icon: Clock,
              color: "text-indigo-600",
              bg: "bg-indigo-50 dark:bg-indigo-950/30",
              onClick: () => onNavigate("print_history"),
              clickable: true
            },
            {
              label: "Recent Designs", value: labels.length > 0 ? labels.length : 0, 
              icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30"
            },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={stat.onClick}
              className={`card p-6 flex items-start gap-4 ${stat.clickable ? 'cursor-pointer group hover:border-[var(--color-primary)]' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stat.value}</h3>
                  {stat.clickable && <span className="text-[10px] font-bold text-indigo-500 group-hover:translate-x-1 transition-transform">VIEW →</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Labels Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="h2 flex items-center gap-3">
              <LayoutGrid size={24} className="text-[var(--color-primary)]" />
              Template Repository
            </h2>
            <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--color-primary)] transition-colors">
              <Filter size={18} />
              Sort & Filter
            </button>
          </div>

          {filteredLabels.length === 0 ? (
            <div className="py-24 card border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <Package className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {labels.length === 0 ? "No templates found" : "No matching results"}
              </h3>
              <p className="max-w-xs mb-8 text-slate-500 font-medium">
                {labels.length === 0
                  ? "Your library is empty. Let's create your first professional label template together."
                  : "We couldn't find any templates matching your current search parameters."}
              </p>
              {labels.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <Plus size={20} className="mr-2" />
                  <span>Get Started</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredLabels.map((label) => (
                <div
                  key={label.id}
                  className={`card group flex flex-col ${label.status === 'archived' ? 'opacity-60 grayscale' : ''}`}
                >
                  {/* Preview Area */}
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-sky-600/10 flex items-center justify-center backdrop-blur-[2px] z-10">
                      <button
                        onClick={() => onEditLabel(label)}
                        className="btn btn-primary scale-90 group-hover:scale-100 transition-transform"
                      >
                        Launch Designer
                      </button>
                    </div>

                    {label.elements && label.elements.length > 0 ? (
                      <div className="w-full h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 relative">
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-200 dark:bg-sky-800"></span>
                          <span className="w-2 h-2 rounded-full bg-sky-300 dark:bg-sky-700"></span>
                          <span className="w-2 h-2 rounded-full bg-sky-400 dark:bg-sky-600"></span>
                        </div>
                        <FileText className="text-sky-500/30" size={56} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Preview Available</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 dark:border-slate-700">
                          <Plus className="text-slate-300" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empty Draft</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="h3 truncate" title={label.name}>
                          {label.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                            {label.labelSize?.width || 100}×{label.labelSize?.height || 80} {label.labelSize?.unit || 'mm'}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                            label.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            label.status === 'archived' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {label.status || 'draft'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleImportData(label)}
                          disabled={label.status === 'archived'}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all disabled:opacity-20"
                          title="Import Bulk Data"
                        >
                          <Upload size={18} />
                        </button>
                        <button
                          onClick={() => handlePrint(label)}
                          disabled={label.status === 'archived'}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-20"
                          title="Quick Print"
                        >
                          <Printer size={18} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {label.deleted_at ? (
                          <button
                            onClick={() => onUpdateStatus(label.id || label.design_id, 'restored')}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                            title="Restore"
                          >
                            <ArchiveRestore size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => label.status === 'published' ? onDraftLabel(label) : onEditLabel(label)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all"
                              title="Edit Design"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => onUpdateStatus(label.id || label.design_id, label.status === 'archived' ? 'restored' : 'archived')}
                              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                              title={label.status === 'archived' ? "Unarchive" : "Archive"}
                            >
                              {label.status === 'archived' ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                            </button>
                            <button
                              onClick={() => window.confirm(`Move "${label.name}" to Trash?`) && onDeleteLabel(label.id || label.design_id)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
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
        onGenerateElements={(newElements, nextLabelSize, isNewRequest, bindingType) => {
          onCreateLabel({
            name: `AI Design - ${new Date().toLocaleTimeString()}`,
            elements: newElements.map(el => ({ ...el, binding_type: bindingType || "static" })),
            labelSize: nextLabelSize || { width: 100, height: 80 },
            binding_type: bindingType || "static"
          });
        }}
        labelSize={{ width: 100, height: 80 }}
        generateId={() => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}
      />

      {/* Loading Overlay for fetching full design details */}
      {isLoadingDesign && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[110] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 border" style={{ borderColor: theme.border }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            <p className="text-sm font-bold" style={{ color: theme.text }}>Preparing Design...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelLibrary;
