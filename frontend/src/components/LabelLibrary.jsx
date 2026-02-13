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
} from "lucide-react";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import ImportDataModal from "../components/Models/ImportDataModal";
import PrintPreviewModal from "../components/Models/PrintPreviewModal";
import GeneratedLabelsPreview from "../components/Models/GeneratedLabelsPreview";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import AIChatbot from "./designer/AIChatbot";

const LabelLibrary = ({
  labels,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-500">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t.totalLabels, value: labels.length, icon: Package, color: "bg-[#D4EAF7]", iconColor: "text-[#39A3DD]" },
          { label: t.activeTemplates, value: labels.filter((l) => l.elements?.length > 0).length, icon: FileText, color: "bg-[#FDD7E0]", iconColor: "text-[#E85874]" },
          { label: t.withBarcodes, value: labels.filter((l) => l.elements?.some((e) => e.type === "barcode")).length, icon: "📊", color: "bg-[#F59FB5]", iconColor: "" },
          { label: t.emptyLabels, value: labels.filter((l) => !l.elements || l.elements.length === 0).length, icon: "📄", color: "bg-[#6BB9E5]", iconColor: "" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl shadow-sm border p-6 transition-all duration-500" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="text-3xl font-black mt-1" style={{ color: theme.text }}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                {typeof stat.icon === 'string' ? <span className="text-2xl">{stat.icon}</span> : <stat.icon className={stat.iconColor} size={24} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="relative flex-1 w-full max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#39A3DD]"
            style={{ color: isDarkMode ? '#475569' : '#8A9BA5' }}
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-12 pr-12 py-4 rounded-[1.25rem] border-2 border-transparent focus:outline-none transition-all text-sm font-bold shadow-sm"
            style={{ backgroundColor: theme.surface, color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-[#38474F] transition-colors"
              style={{ color: theme.textMuted }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#E85874] to-[#C4455D] text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>{t.createNewLabel}</span>
        </button>
      </div>

      {/* Labels Grid */}
      {filteredLabels.length === 0 ? (
        <div className="rounded-[2.5rem] shadow-sm border p-20 text-center transition-all duration-500" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <div className="w-24 h-24 bg-gray-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package style={{ color: theme.textMuted }} size={48} />
          </div>
          <h3 className="text-2xl font-black mb-2" style={{ color: theme.text }}>
            {labels.length === 0 ? t.noTemplates : "No results matched"}
          </h3>
          <p className="font-medium mb-8" style={{ color: theme.textMuted }}>
            {labels.length === 0
              ? t.startDesigning
              : "Try adjusting your search filters to find what you're looking for."}
          </p>
          {labels.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-3 px-10 py-4 bg-[#39A3DD] text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-[#2A7FAF] transition-all shadow-xl"
            >
              <Plus size={20} />
              <span>{t.initializeWorkspace}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLabels.map((label) => (
            <div
              key={label.id}
              className="group rounded-[2rem] shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-xl hover:scale-[1.02]"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              {/* Card Header */}
              <div className="p-8 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-xl mb-1 line-clamp-1" style={{ color: theme.text }}>
                      {label.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                      {label.labelSize?.width || 100} ×{" "}
                      {label.labelSize?.height || 80} MM UNIT
                    </p>
                  </div>
                  {label.attachedPdf && (
                    <span className="px-3 py-1 text-[10px] bg-[#E85874]/10 text-[#E85874] rounded-lg font-black uppercase tracking-widest border border-[#E85874]/20">
                      PDF ENGINE
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: theme.textMuted }}>Elements</span>
                    <span className="text-sm font-black" style={{ color: theme.text }}>{label.elements?.length || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: theme.textMuted }}>Barcodes</span>
                    <span className="text-sm font-black" style={{ color: theme.text }}>{label.elements?.filter((e) => e.type === "barcode").length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Card Body - Preview */}
              <div className="p-8 flex items-center justify-center transition-colors" style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }}>
                {label.elements && label.elements.length > 0 ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#39A3DD]/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#39A3DD]/20">
                      <FileText className="text-[#39A3DD]" size={36} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                      {label.elements.length} ACTIVE BLOCKS
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-500/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Package style={{ color: theme.textMuted }} size={36} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>BLANK TEMPLATE</p>
                  </div>
                )}
              </div>

              {/* Card Footer - Actions */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                    {label.lastModified}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleImportData(label)}
                      className="p-3 text-[#39A3DD] hover:bg-[#39A3DD]/10 rounded-xl transition-all"
                      title="Import Data"
                    >
                      <Upload size={20} />
                    </button>
                    <button
                      onClick={() => handlePrint(label)}
                      className="p-3 text-[#E85874] hover:bg-[#E85874]/10 rounded-xl transition-all"
                      title="Print"
                    >
                      <Printer size={20} />
                    </button>
                    <button
                      onClick={() => onEditLabel(label)}
                      className="p-3 text-[#39A3DD] hover:bg-[#39A3DD]/10 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `System Alert: Confirm deletion of "${label.name}"?`,
                          )
                        ) {
                          onDeleteLabel(label.id);
                        }
                      }}
                      className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          // In Library view, we create a new label with the AI elements
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
