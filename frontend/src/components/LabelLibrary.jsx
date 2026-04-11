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
  ArchiveRestore,
  Layers,
  List
} from "lucide-react";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import ImportDataModal from "../components/Models/ImportDataModal";
import PrintPreviewModal from "../components/Models/PrintPreviewModal";
import GeneratedLabelsPreview from "../components/Models/GeneratedLabelsPreview";
import BulkImportModal from "../components/Models/BulkImportModal";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";
import { useTheme } from "../ThemeContext";
import RenderLabel from "./designer/RenderLabel";
import { convertToPx } from "../supabaseClient";

const TemplateCard = ({
  initialLabel,
  onEditLabel,
  handleImportData,
  handlePrint,
  handleBulkPrint,
  onUpdateStatus,
  onDeleteLabel,
  onDraftLabel,
  fetchFullDesign
}) => {
  const [label, setLabel] = React.useState(initialLabel);

  React.useEffect(() => {
    let isMounted = true;
    if (!initialLabel.elements || initialLabel.elements.length === 0) {
      if (initialLabel.id || initialLabel.design_id) {
        fetchFullDesign(initialLabel).then((full) => {
          if (isMounted && full) {
            setLabel(full);
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [initialLabel, fetchFullDesign]);

  const unit = label.labelSize?.unit || 'mm';
  const designW = convertToPx(label.labelSize?.width || 100, unit);
  const designH = convertToPx(label.labelSize?.height || 80, unit);

  // Scale down to fit in card (aspect ratio roughly 4:3, card width ~300px)
  const containerW = 280; // approximate internal card width
  const containerH = 210; // approximate internal card height
  const scale = Math.min(containerW / designW, containerH / designH, 0.8);

  return (
    <div className={`card group flex flex-col ${label.status === 'archived' ? 'opacity-60 grayscale' : ''}`}>
      {/* Preview Area */}
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-sky-600/10 flex items-center justify-center backdrop-blur-[2px] z-10 w-full h-full">
          <button
            onClick={() => onEditLabel(label)}
            className="btn btn-primary scale-90 group-hover:scale-100 transition-transform"
          >
            Launch Designer
          </button>
        </div>

        {/* Live Preview / Empty State */}
        <div
          className="transition-transform duration-500 group-hover:scale-105"
          style={{
            width: `${designW}px`,
            height: `${designH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          {label.elements && label.elements.length > 0 ? (
            <div className="w-full h-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 pointer-events-none rounded-lg overflow-hidden relative">
              <RenderLabel label={label} noBorder={true} />
            </div>
          ) : (
            <div className="w-full h-full bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Plus className="text-slate-300" size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Empty Draft</span>
            </div>
          )}
        </div>
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
              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border ${label.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  label.status === 'archived' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                {label.status || 'draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between z-20">
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
            <button
              onClick={() => handleBulkPrint(label)}
              disabled={label.status === 'archived'}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all disabled:opacity-20"
              title="Bulk Print & Upload"
            >
              <Layers size={18} />
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
  );
};

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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [labelForBulk, setLabelForBulk] = useState(null);

  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

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

  const handleBulkPrint = async (label) => {
    setIsLoadingDesign(true);
    try {
      const fullLabel = await fetchFullDesign(label);
      setLabelForBulk(fullLabel);
      setShowBulkModal(true);
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
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: "Total Templates", value: labels.length, icon: Package, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
            { 
              label: "Deleted Labels", 
              value: labels.filter(l => l.deleted_at).length, 
              icon: Trash2, 
              color: showDeleted ? "text-white" : "text-rose-600", 
              bg: showDeleted ? "bg-rose-500" : "bg-rose-50 dark:bg-rose-950/30",
              onClick: () => setShowDeleted(!showDeleted),
              clickable: true,
              active: showDeleted
            },
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
              className={`card p-6 flex items-start gap-4 ${stat.clickable ? 'cursor-pointer group hover:border-[var(--color-primary)]' : ''} ${stat.active ? 'border-rose-500 shadow-lg shadow-rose-500/10' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${stat.active ? 'text-rose-100' : 'text-slate-500'}`}>{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-extrabold ${stat.active ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{stat.value}</h3>
                  {stat.clickable && <span className={`text-[10px] font-bold transition-transform group-hover:translate-x-1 ${stat.active ? 'text-rose-100' : 'text-indigo-500'}`}>VIEW →</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Labels Grid Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-6">
              <h2 className="h2 flex items-center gap-3">
                <LayoutGrid size={24} className="text-[var(--color-primary)]" />
                Templates
              </h2>
              
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--color-primary)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--color-primary)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
               {/* Relocated Search */}
              <div className="relative group min-w-[250px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-primary)]"
                  size={16}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search templates..."
                  className="input h-10 pl-10 text-sm"
                />
              </div>

              <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--color-primary)] transition-colors whitespace-nowrap">
                <Filter size={18} />
                Sort & Filter
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {/* Blank Label Card - Only in active view */}
              {!showDeleted && !searchTerm && (
                <div
                  onClick={() => setShowCreateModal(true)}
                  className="card border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 bg-slate-50/50 hover:bg-white hover:border-[var(--color-primary)] hover:shadow-xl transition-all group cursor-pointer aspect-square sm:aspect-auto"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                    <Plus className="text-slate-400 group-hover:text-[var(--color-primary)]" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Blank Label</h3>
                  <p className="text-sm font-medium text-slate-400 text-center">Start a fresh professional design</p>
                </div>
              )}

              {filteredLabels.map((label) => (
                <TemplateCard
                  key={label.id}
                  initialLabel={label}
                  onEditLabel={onEditLabel}
                  handleImportData={handleImportData}
                  handlePrint={handlePrint}
                  handleBulkPrint={handleBulkPrint}
                  onUpdateStatus={onUpdateStatus}
                  onDeleteLabel={onDeleteLabel}
                  onDraftLabel={onDraftLabel}
                  fetchFullDesign={fetchFullDesign}
                />
              ))}
            </div>
          ) : (
            <div className="card-premium overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-all">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                      {["Template Name", "Dimensions", "Status", "Actions"].map((head) => (
                        <th key={head} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                    {!showDeleted && !searchTerm && (
                      <tr 
                        onClick={() => setShowCreateModal(true)}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 group-hover:text-[var(--color-primary)] transition-colors">
                              <Plus size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Blank Label</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Start a fresh design</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-slate-400 text-[11px]">-</td>
                        <td className="px-8 py-5 text-slate-400 text-[11px]">-</td>
                        <td className="px-8 py-5 text-slate-400 text-[11px]">-</td>
                      </tr>
                    )}
                    {filteredLabels.map((label) => (
                      <tr key={label.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors ${label.status === 'archived' ? 'opacity-60' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 shadow-sm group-hover:border-[var(--color-primary)] transition-colors">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate max-w-[300px]" title={label.name}>
                                {label.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                            {label.labelSize?.width || 100}×{label.labelSize?.height || 80} {label.labelSize?.unit || 'mm'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border inline-flex ${
                            label.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            label.status === 'archived' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {label.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              {label.deleted_at ? (
                                <button
                                  onClick={() => onUpdateStatus(label.id || label.design_id, 'restored')}
                                  className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all border border-transparent hover:border-emerald-100"
                                  title="Restore"
                                >
                                  <ArchiveRestore size={16} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => label.status === 'published' ? onDraftLabel(label) : onEditLabel(label)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all"
                                    title="Edit Design"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handlePrint(label)}
                                    disabled={label.status === 'archived'}
                                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-20"
                                    title="Quick Print"
                                  >
                                    <Printer size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleBulkPrint(label)}
                                    disabled={label.status === 'archived'}
                                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all disabled:opacity-20"
                                    title="Bulk Print & Upload"
                                  >
                                    <Layers size={16} />
                                  </button>
                                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                  <button
                                    onClick={() => onUpdateStatus(label.id || label.design_id, label.status === 'archived' ? 'restored' : 'archived')}
                                    className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                                    title={label.status === 'archived' ? "Unarchive" : "Archive"}
                                  >
                                    {label.status === 'archived' ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                                  </button>
                                  <button
                                    onClick={() => window.confirm(`Move "${label.name}" to Trash?`) && onDeleteLabel(label.id || label.design_id)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredLabels.length === 0 && (searchTerm || showDeleted) && (
            <div className="py-24 card border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <Package className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                No matching templates found
              </h3>
              <p className="max-w-xs mb-8 text-slate-500 font-medium">
                We couldn't find any templates matching your current parameters.
              </p>
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

      {showBulkModal && labelForBulk && (
        <BulkImportModal
          label={labelForBulk}
          onClose={() => {
            setShowBulkModal(false);
            setLabelForBulk(null);
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

