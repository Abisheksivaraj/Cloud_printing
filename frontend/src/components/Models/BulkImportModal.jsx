import React, { useState, useEffect, useRef } from "react";
import { 
  X, Upload, FileText, CheckCircle, 
  AlertCircle, Printer, Database, 
  RefreshCw, Loader2, ArrowRight,
  Package, LayoutGrid, Layers,
  ChevronRight, Check
} from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { callEdgeFunction, API_URLS, normalizeDesign } from "../../supabaseClient";
import RenderLabel from "../designer/RenderLabel";

const BulkImportModal = ({ label, onClose }) => {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  // Workflow State
  const [phase, setPhase] = useState("setup"); // setup, processing, preview, completed
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [file, setFile] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState("");
  const [printers, setPrinters] = useState([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState("");

  // Response State
  const [importInfo, setImportInfo] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [completionStats, setCompletionStats] = useState(null);

  // Fetch connectivity on mount
  useEffect(() => {
    const init = async () => {
      try {
        const data = await callEdgeFunction(API_URLS.LIST_CONNECTORS, {});
        const connectorList = Array.isArray(data) ? data : (data?.connectors || []);
        setConnectors(connectorList);
        if (connectorList.length > 0) {
          setSelectedConnectorId(connectorList[0].id);
        }
      } catch (err) {
        console.error("Failed to load connectors", err);
      }
    };
    init();
  }, []);

  // Sync printers when connector changes
  useEffect(() => {
    const fetchPrinters = async () => {
      if (!selectedConnectorId) return;
      try {
        const data = await callEdgeFunction(API_URLS.LIST_PRINTERS, {
          connector_id: selectedConnectorId
        });
        const printerList = Array.isArray(data) ? data : (data?.printers || []);
        setPrinters(printerList);
        if (printerList.length > 0) {
          setSelectedPrinterId(printerList[0].id);
        }
      } catch (err) {
        console.error("Failed to load printers", err);
      }
    };
    fetchPrinters();
  }, [selectedConnectorId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please select a valid CSV file.");
      }
    }
  };

  const startImport = async () => {
    if (!file || !selectedConnectorId || !selectedPrinterId) {
      setError("Please complete all configuration fields.");
      return;
    }

    setIsActionLoading(true);
    setError(null);
    setPhase("processing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("design_id", label.design_id || label.id);
      formData.append("version_major", label.version_major ?? 1);
      formData.append("version_minor", label.version_minor ?? 0);
      formData.append("connector_id", selectedConnectorId);
      formData.append("printer_id", selectedPrinterId);

      const result = await callEdgeFunction(API_URLS.UPLOAD_IMPORT, formData);
      
      if (result.success) {
        setImportInfo(result.import);
        // User Step 8: GET /functions/v1/get-import-jobs?import_id=<import_id>
        const previewResult = await callEdgeFunction(API_URLS.GET_IMPORT_JOBS, null, {
          method: 'GET',
          queryParams: { import_id: result.import.id }
        });
        setPreviewData(previewResult);
        setPhase("preview");
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (err) {
      setError(err.message);
      setPhase("setup");
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmPrint = async () => {
    if (!previewData?.import?.id) return;
    
    setIsActionLoading(true);
    try {
      const result = await callEdgeFunction(API_URLS.CONFIRM_IMPORT, {
        import_id: previewData.import.id
      });
      setCompletionStats(result);
      setPhase("completed");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-in fade-in duration-500">
      <div 
        className="w-full max-w-4xl h-auto max-h-[95vh] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-white/10"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Bulk Upload Engine</h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label.name} • {label.labelSize?.width}x{label.labelSize?.height}{label.labelSize?.unit}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-all">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center gap-8 shrink-0">
          {[
            { id: "setup", label: "Configure" },
            { id: "preview", label: "Verify" },
            { id: "completed", label: "Done" }
          ].map((s, i) => {
            const isActive = phase === s.id;
            const isDone = (phase === "preview" && s.id === "setup") || (phase === "completed");
            return (
              <div key={s.id} className="flex items-center gap-2 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm z-10 ${
                  isActive ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20" : 
                  isDone ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}>
                  {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold z-10 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                  {s.label}
                </span>
                {i < 2 && <ChevronRight size={16} className="text-slate-300 dark:text-slate-700 ml-4" />}
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
          
          {phase === "setup" && (
            <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               {/* Infrastructure Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-md">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                      <Database size={14} className="text-indigo-500" /> Dispatch Node
                    </label>
                    <select 
                      value={selectedConnectorId}
                      onChange={(e) => setSelectedConnectorId(e.target.value)}
                      className="w-full h-10 px-3 text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/30 transition-all rounded-xl bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="" disabled>Select Connector...</option>
                      {connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 
                 <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-md">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                      <Printer size={14} className="text-indigo-500" /> Print Endpoint
                    </label>
                    <select 
                      value={selectedPrinterId}
                      onChange={(e) => setSelectedPrinterId(e.target.value)}
                      className="w-full h-10 px-3 text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/30 transition-all rounded-xl bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-white"
                      disabled={!selectedConnectorId || printers.length === 0}
                    >
                      <option value="" disabled>{printers.length === 0 ? "No Printers Found" : "Select Printer..."}</option>
                      {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
               </div>

               {error && (
                  <div className="p-3 bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 animate-in shake">
                    <AlertCircle size={16} />
                    <p className="text-xs font-medium">{error}</p>
                  </div>
               )}

               {/* File Dropzone */}
               <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`relative group border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                    file 
                      ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20" 
                      : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                    file ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {file ? <CheckCircle size={28} /> : <Upload size={28} />}
                  </div>

                  <div className="text-center space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {file ? file.name : "Upload CSV Payload"}
                    </h4>
                    <p className="text-xs font-medium text-slate-500">
                      {file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Click or drag & drop your data file here"}
                    </p>
                  </div>
               </div>

               <div className="flex justify-end pt-2">
                  <button 
                    onClick={startImport}
                    disabled={isActionLoading || !file || !selectedPrinterId}
                    className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 font-bold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    {isActionLoading ? <Loader2 className="animate-spin" size={16}/> : "Process Data"}
                    {!isActionLoading && <ArrowRight size={16} />}
                  </button>
               </div>
            </div>
          )}

          {phase === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-10 animate-in fade-in">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-700">
                <RefreshCw size={32} className="text-indigo-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Processing Data Matrix...</h3>
            </div>
          )}

          {phase === "preview" && previewData && (
             <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4">
                
                <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                   <div>
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white">Previewing Labels</h3>
                     <p className="text-xs font-medium text-slate-500 mt-1">{previewData.total_pages} units resolved from {previewData.import?.file_name}</p>
                   </div>
                   <button 
                    onClick={() => setPhase("setup")}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors"
                   >
                     Change Config
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previewData.pages.map((p, idx) => (
                    <div key={idx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      {/* Label Canvas Area */}
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-200/50 dark:border-slate-800/50 p-4">
                        <div className="scale-[0.55] origin-center z-10 pointer-events-none">
                          <RenderLabel 
                            label={{
                              ...label,
                              elements: p.elements
                            }} 
                            noBorder={true}
                          />
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="p-4 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-400">Unit #{idx + 1}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{p.job_id?.slice(0, 8)}</span>
                        </div>
                        <div className="space-y-2">
                           {Object.entries(p.input_data || {}).slice(0, 3).map(([key, val]) => (
                             <div key={key} className="flex justify-between text-xs">
                               <span className="text-slate-500 font-medium truncate pr-2">{key}</span>
                               <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[120px]">{val}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {phase === "completed" && completionStats && (
             <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <Check size={32} strokeWidth={3} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Dispatch Complete</h3>
                <p className="text-slate-500 font-medium mb-8 max-w-sm">
                  {completionStats.message || `Successfully sent ${completionStats.pushed} units to the printer.`}
                </p>
                
                <div className="flex gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 min-w-[120px] border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Allocated</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{completionStats.total_jobs}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 min-w-[120px] border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Pushed</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{completionStats.pushed}</p>
                  </div>
                </div>
             </div>
          )}

        </div>

        {/* Footer actions for Preview / Completed phases */}
        {phase === "preview" && (
           <div className="px-8 py-5 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="text-sm font-medium text-slate-500">
                Confirming will immediately send data to <span className="font-bold text-slate-900 dark:text-white">{connectors.find(c => c.id === selectedConnectorId)?.name}</span>
              </div>
              <button 
                onClick={confirmPrint}
                disabled={isActionLoading}
                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isActionLoading ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18} />}
                Confirm & Print All
              </button>
           </div>
        )}

        {phase === "completed" && (
           <div className="px-8 py-5 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-end shrink-0">
              <button 
                onClick={onClose}
                className="h-12 px-8 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl shadow-lg font-bold text-sm transition-all"
              >
                Close Window
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportModal;
