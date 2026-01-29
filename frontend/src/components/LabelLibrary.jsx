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

const LabelLibrary = ({
  labels,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
}) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E4E7] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8A9BA5]">Total Labels</p>
              <p className="text-3xl font-bold text-[#38474F] mt-1">
                {labels.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#D4EAF7] rounded-lg flex items-center justify-center">
              <Package className="text-[#39A3DD]" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E0E4E7] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8A9BA5]">
                Active Templates
              </p>
              <p className="text-3xl font-bold text-[#38474F] mt-1">
                {labels.filter((l) => l.elements?.length > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FDD7E0] rounded-lg flex items-center justify-center">
              <FileText className="text-[#E85874]" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E0E4E7] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8A9BA5]">
                With Barcodes
              </p>
              <p className="text-3xl font-bold text-[#38474F] mt-1">
                {
                  labels.filter((l) =>
                    l.elements?.some((e) => e.type === "barcode"),
                  ).length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F59FB5] rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E0E4E7] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8A9BA5]">Empty Labels</p>
              <p className="text-3xl font-bold text-[#38474F] mt-1">
                {
                  labels.filter((l) => !l.elements || l.elements.length === 0)
                    .length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-[#6BB9E5] rounded-lg flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BA5]"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search labels by name..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E0E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#39A3DD] focus:border-transparent shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9BA5] hover:text-[#38474F]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#E85874] to-[#C4455D] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Plus size={20} />
          <span>Create New Label</span>
        </button>
      </div>

      {/* Labels Grid */}
      {filteredLabels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E4E7] p-12 text-center">
          <div className="w-20 h-20 bg-[#F5F7F9] rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-[#8A9BA5]" size={40} />
          </div>
          <h3 className="text-xl font-semibold text-[#38474F] mb-2">
            {labels.length === 0 ? "No labels yet" : "No labels found"}
          </h3>
          <p className="text-[#8A9BA5] mb-6">
            {labels.length === 0
              ? "Create your first label to get started"
              : "Try adjusting your search terms"}
          </p>
          {labels.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#E85874] text-white rounded-xl font-semibold hover:bg-[#C4455D] transition-colors"
            >
              <Plus size={20} />
              <span>Create First Label</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabels.map((label) => (
            <div
              key={label.id}
              className="bg-white rounded-xl shadow-sm border border-[#E0E4E7] overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-[#F5F7F9]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#38474F] text-lg mb-1 line-clamp-1">
                      {label.name}
                    </h3>
                    <p className="text-sm text-[#8A9BA5]">
                      {label.labelSize?.width || 100} ×{" "}
                      {label.labelSize?.height || 80} mm
                    </p>
                  </div>
                  {label.attachedPdf && (
                    <span className="px-2 py-1 text-xs bg-[#FDD7E0] text-[#E85874] rounded-full font-medium">
                      PDF
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-sm text-[#8A9BA5]">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-[#38474F]">
                      {label.elements?.length || 0}
                    </span>
                    <span>elements</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-[#38474F]">
                      {label.elements?.filter((e) => e.type === "barcode")
                        .length || 0}
                    </span>
                    <span>barcodes</span>
                  </div>
                </div>
              </div>

              {/* Card Body - Preview */}
              <div className="p-6 bg-[#F5F7F9] min-h-[120px] flex items-center justify-center">
                {label.elements && label.elements.length > 0 ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#D4EAF7] rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="text-[#39A3DD]" size={28} />
                    </div>
                    <p className="text-sm text-[#8A9BA5]">
                      {label.elements.length} design elements
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#E0E4E7] rounded-full flex items-center justify-center mx-auto mb-2">
                      <Package className="text-[#8A9BA5]" size={28} />
                    </div>
                    <p className="text-sm text-[#8A9BA5]">Empty template</p>
                  </div>
                )}
              </div>

              {/* Card Footer - Actions */}
              <div className="p-4 bg-white border-t border-[#F5F7F9]">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#8A9BA5]">
                    {label.lastModified}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleImportData(label)}
                      className="p-2 text-[#39A3DD] hover:bg-[#D4EAF7] rounded-lg transition-colors"
                      title="Import Data"
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      onClick={() => handlePrint(label)}
                      className="p-2 text-[#E85874] hover:bg-[#FDD7E0] rounded-lg transition-colors"
                      title="Print"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => onEditLabel(label)}
                      className="p-2 text-[#39A3DD] hover:bg-[#D4EAF7] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${label.name}"?`,
                          )
                        ) {
                          onDeleteLabel(label.id);
                        }
                      }}
                      className="p-2 text-[#C4455D] hover:bg-[#FDD7E0] rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
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
    </div>
  );
};

export default LabelLibrary;
