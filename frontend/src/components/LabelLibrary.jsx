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
  ArrowRight,
  Monitor,
  CheckCircle,
  Activity
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
  onDeleteLabel,
}) => {
  const { t } = useLanguage();
  const { theme, isDarkMode } = useTheme();

  const isViewer = userRole === 'viewer';
  const isAdmin = userRole === 'admin';
  const isOperator = userRole === 'operator';
  const canEdit = isAdmin || isOperator;
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLabelForImport, setSelectedLabelForImport] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [labelToPrint, setLabelToPrint] = useState(null);
  const [generatedLabels, setGeneratedLabels] = useState([]);
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);

  const [printJobContext, setPrintJobContext] = useState(null);

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

  const handleLabelsGenerated = (newLabels, context) => {
    setGeneratedLabels(newLabels);
    setPrintJobContext({
      template: selectedLabelForImport,
      ...context
    });
    setShowImportModal(false);
    setShowGeneratedPreview(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-6 lg:p-10 transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-[1600px] mx-auto space-y-10">

        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-200 pb-10">
          <div>
            <h1 className="text-4xl font-black text-[#38474F] mb-2 tracking-tight" style={{ color: theme.text }}>
              TEMPLATE <span className="text-[#39A3DD]">REPOSITORY</span>
            </h1>
            <p className="text-[#8A9BA5] font-medium" style={{ color: theme.textMuted }}>
              Centralized management for your enterprise label architectures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BA5]" size={18} />
              <input
                type="text"
                placeholder="Search repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-10 py-3.5 bg-white border border-gray-100 rounded shadow-sm outline-none focus:border-[#39A3DD] w-full md:w-80 transition-all text-sm font-medium"
                style={{ backgroundColor: theme.surface, color: theme.text }}
              />
            </div>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-pink px-8 py-3.5 text-xs font-black uppercase tracking-widest"
              >
                <Plus size={16} />
                <span>{t.createNewLabel || "New Template"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Templates", value: labels.length, icon: Package, color: "text-[#38474F]", bg: "bg-slate-50" },
            { label: "Active Designs", value: labels.filter(l => l.elements?.length > 0).length, icon: Edit2, color: "text-[#39A3DD]", bg: "bg-blue-50" },
            { label: "Production Ready", value: labels.length, icon: CheckCircle, color: "text-[#E85874]", bg: "bg-pink-50" },
            { label: "Sync Status", value: "Verified", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
          ].map((stat, i) => (
            <div key={i} className="card-premium p-6" style={{ backgroundColor: theme.surface }}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  {typeof stat.icon === 'string' ? <span>{stat.icon}</span> : <stat.icon size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9BA5] mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-black text-[#38474F]" style={{ color: theme.text }}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-sm font-black text-[#38474F] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: theme.text }}>
              <LayoutGrid size={16} className="text-[#39A3DD]" />
              Templates Gallery
            </h2>
            <div className="flex items-center gap-4">
              <button className="text-[10px] font-black text-[#8A9BA5] uppercase tracking-widest hover:text-[#38474F] transition-colors">
                Recent First
              </button>
              <div className="h-3 w-px bg-gray-200"></div>
              <button className="text-[10px] font-black text-[#8A9BA5] uppercase tracking-widest hover:text-[#38474F] transition-colors">
                List View
              </button>
            </div>
          </div>

          {filteredLabels.length === 0 ? (
            <div className="card-premium py-24 flex flex-col items-center justify-center" style={{ backgroundColor: theme.surface }}>
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Monitor className="text-[#8A9BA5]" size={36} />
              </div>
              <h3 className="text-2xl font-black text-[#38474F] uppercase mb-2">Workspace Empty</h3>
              <p className="text-[#8A9BA5] font-bold max-w-xs text-center mb-8">Initialize your labeling workspace by creating your first design template.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-blue px-10">Begin Designing</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredLabels.map((label) => (
                <div key={label.id} className="card-premium group hover:border-[#39A3DD] transition-all hover:shadow-xl hover:shadow-[#39A3DD]/5" style={{ backgroundColor: theme.surface }}>
                  {/* Visual Preview */}
                  <div className="h-44 bg-[#F8FAFC] flex items-center justify-center relative border-b border-gray-50 overflow-hidden"
                    style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[#38474F]/40 backdrop-blur-[2px] z-10 flex items-center justify-center transition-all">
                      <button onClick={() => onEditLabel(label)} className="btn-blue py-2 px-6 text-[10px]">
                        {canEdit ? "Open Architecture" : "View Architecture"}
                      </button>
                    </div>
                    {/* Abstract design representation */}
                    <div className="w-24 h-16 bg-white border border-gray-100 shadow-sm rounded flex flex-col gap-1 p-2">
                      <div className="w-full h-1 bg-gray-100 rounded"></div>
                      <div className="w-2/3 h-1 bg-gray-50 rounded"></div>
                      <div className="mt-auto w-full h-4 bg-slate-50 rounded flex items-center justify-center gap-1 opacity-50">
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 pr-4">
                        <h3 className="text-xs font-black text-[#38474F] uppercase tracking-wider truncate mb-1" style={{ color: theme.text }}>{label.name}</h3>
                        <p className="text-[10px] font-bold text-[#8A9BA5] uppercase tracking-tighter">
                          {label.labelSize?.width || 100}W × {label.labelSize?.height || 80}H MILLIMETERS
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex-shrink-0">
                          <button onClick={() => onEditLabel(label)} className="p-2 text-[#8A9BA5] hover:text-[#39A3DD] transition-colors"><Edit2 size={14} /></button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-50" style={{ borderColor: theme.border }}>
                      <div className="flex gap-1">
                        <button onClick={() => handleImportData(label)} className="p-2.5 bg-slate-50 hover:bg-blue-50 text-[#8A9BA5] hover:text-[#39A3DD] rounded transition-all" title="Source Data"><Upload size={14} /></button>
                        <button onClick={() => handlePrint(label)} className="p-2.5 bg-slate-50 hover:bg-pink-50 text-[#8A9BA5] hover:text-[#E85874] rounded transition-all" title="Authorize Print"><Printer size={14} /></button>
                      </div>
                      {canEdit && (
                        <button onClick={() => { if (window.confirm('Delete template?')) onDeleteLabel(label.id) }}
                          className="p-2.5 text-[#8A9BA5] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legacy Modals Integration */}
      {showCreateModal && <CreateLabelModal onClose={() => setShowCreateModal(false)} onCreate={onCreateLabel} />}
      {showImportModal && selectedLabelForImport && <ImportDataModal label={selectedLabelForImport} onClose={() => { setShowImportModal(false); setSelectedLabelForImport(null); }} onLabelsGenerated={handleLabelsGenerated} />}
      {showPrintPreview && labelToPrint && <PrintPreviewModal label={labelToPrint} onClose={() => { setShowPrintPreview(false); setLabelToPrint(null); }} />}
      {showGeneratedPreview && generatedLabels.length > 0 && (
        <GeneratedLabelsPreview
          labels={generatedLabels}
          jobContext={printJobContext}
          onClose={() => {
            setShowGeneratedPreview(false);
            setGeneratedLabels([]);
            setPrintJobContext(null);
          }}
        />
      )}

      <AIChatbot
        onGenerateElements={(newElements, nextLabelSize) => {
          onCreateLabel({
            name: `AI Design ${new Date().toLocaleTimeString()}`,
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
