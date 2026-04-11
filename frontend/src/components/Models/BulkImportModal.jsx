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
        const previewResult = await callEdgeFunction(API_URLS.GET_IMPORT_JOBS, {
          import_id: result.import.id
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-500">
      <div 
        className="w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center">
              <Package size={22} className="text-white dark:text-slate-900" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Bulk Upload Engine</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Step Dispatched Flow <span className="mx-2 text-slate-200">/</span> {label.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all">
            <X size={22} className="text-slate-400" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-10 py-5 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-50 dark:border-slate-900 flex items-center gap-10 shrink-0">
          {[
            { id: "setup", label: "Configuration" },
            { id: "preview", label: "Verification" },
            { id: "completed", label: "Dispatch" }
          ].map((s, i) => {
            const isActive = phase === s.id;
            const isDone = (phase === "preview" && s.id === "setup") || (phase === "completed");
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all ${
                  isActive ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : 
                  isDone ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  {isDone ? <Check size={14} strokeWidth={4} /> : i + 1}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                  {s.label}
                </span>
                {i < 2 && <ChevronRight size={14} className="text-slate-200" />}
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {phase === "setup" && (
            <div className="flex-1 flex flex-col lg:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Left Panel: Configuration */}
              <div className="w-full lg:w-[400px] border-r border-slate-100 dark:border-slate-800 p-10 flex flex-col justify-between bg-slate-50/30 dark:bg-slate-900/10">
                <div className="space-y-10">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Infrastructure Setup</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Select the edge connector and target printer for this dispatch stream.
                    </p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Database size={12} className="text-sky-500" /> Dispatch Node
                      </label>
                      <select 
                        value={selectedConnectorId}
                        onChange={(e) => setSelectedConnectorId(e.target.value)}
                        className="input h-14 font-bold border-2 focus:ring-4 ring-sky-500/10 transition-all rounded-2xl bg-white dark:bg-slate-900"
                      >
                        <option value="" disabled>Select Connector...</option>
                        {connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Printer size={12} className="text-sky-500" /> Print Endpoint
                      </label>
                      <select 
                        value={selectedPrinterId}
                        onChange={(e) => setSelectedPrinterId(e.target.value)}
                        className="input h-14 font-bold border-2 focus:ring-4 ring-sky-500/10 transition-all rounded-2xl bg-white dark:bg-slate-900"
                        disabled={!selectedConnectorId || printers.length === 0}
                      >
                        <option value="" disabled>{printers.length === 0 ? "No Printers Found" : "Select Printer..."}</option>
                        {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl flex items-start gap-4 animate-in shake">
                      <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Request Refused</p>
                        <p className="text-[10px] font-bold text-rose-500/80 leading-relaxed">{error}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-10">
                  <div className="p-6 bg-slate-900 dark:bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 dark:shadow-white/5 space-y-4">
                     <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Active Template</p>
                     <div className="flex items-center justify-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center">
                          <LayoutGrid size={18} className="text-sky-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-white dark:text-slate-900 truncate max-w-[150px]">{label.name}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">v{label.version_major || 1}.{label.version_minor || 0}</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Data Intake */}
              <div className="flex-1 p-10 relative flex flex-col justify-center items-center overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="w-full max-w-xl space-y-10 relative z-10">
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Initialize Data Stream</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bulk CSV records will be mapped to design placeholders</p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className={`relative group border-2 border-dashed rounded-[3rem] p-16 flex flex-col items-center gap-8 cursor-pointer transition-all duration-500 overflow-hidden ${
                      file 
                        ? "border-emerald-500/40 bg-emerald-50/5 dark:bg-emerald-500/5 shadow-2xl shadow-emerald-500/10" 
                        : "border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-slate-950 shadow-xl hover:shadow-2xl shadow-slate-200/50 dark:shadow-black"
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    
                    {/* Scanner Effect (while file selected) */}
                    {file && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full w-full bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-scan"></div>
                      </div>
                    )}

                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                      file 
                        ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-500/10" 
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/20"
                    }`}>
                      {file ? <CheckCircle size={32} /> : <Upload size={32} />}
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {file ? file.name : "Select Payload"}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {file ? `${(file.size / 1024).toFixed(1)} KB Resolved` : "Drop Bulk Manifest to Begin Processing"}
                      </p>
                    </div>

                    {file && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="p-3 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={startImport}
                    disabled={isActionLoading || !file || !selectedPrinterId}
                    className="btn btn-primary w-full h-18 rounded-[2rem] shadow-2xl shadow-sky-500/20 uppercase tracking-[0.3em] font-black text-sm active:scale-[0.98] transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {isActionLoading ? <Loader2 className="animate-spin" /> : "Initiate Verification Pipe"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "processing" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-in zoom-in-95 duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-[60px] scale-150 rounded-full animate-pulse"></div>
                <div className="w-24 h-24 rounded-3xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110">
                  <RefreshCw size={40} className="text-white dark:text-slate-900 animate-spin" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Syncing Buffer</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Mapping CSV manifests to Design Engine</p>
              </div>
            </div>
          )}

          {phase === "preview" && previewData && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
              {/* Context Bar */}
              <div className="px-10 py-5 bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl shadow-lg flex items-center justify-center">
                    <LayoutGrid size={18} className="text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Verification Matrix</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {previewData.total_pages} Units Resolved • Ready to Confirm
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="px-5 py-2.5 bg-white dark:bg-slate-900/50 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                     <span className="text-slate-400">Batch Source:</span>
                     <span className="text-sky-500">{previewData.import?.file_name}</span>
                   </div>
                </div>
              </div>

              {/* Matrix Grid */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/20 dark:bg-slate-950/20">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                  {previewData.pages.map((p, idx) => (
                    <div key={idx} className="group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                       <div className="flex items-center justify-between px-4 pb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">0{idx + 1}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Entry ID: {p.job_id?.slice(0, 8)}</span>
                       </div>
                       
                       <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                          {/* Label Canvas Area */}
                          <div className="relative aspect-video bg-white flex items-center justify-center overflow-hidden border-b border-slate-50 dark:border-slate-800 p-6">
                            <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="scale-[0.6] origin-center z-10">
                              <RenderLabel 
                                label={{
                                  ...label,
                                  elements: p.elements
                                }} 
                                noBorder={true}
                              />
                            </div>
                          </div>

                          {/* Metadata Pipe */}
                          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="grid grid-cols-1 gap-y-3">
                              {Object.entries(p.input_data || {}).slice(0, 4).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 last:border-0">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{key}</span>
                                  <span className="text-[10px] font-black text-slate-900 dark:text-white truncate" title={val}>{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Deck */}
              <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => setPhase("setup")}
                  className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  Adjust Config
                </button>
                <div className="flex items-center gap-10">
                  <div className="text-right hidden sm:block space-y-1">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Production Dispatch</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Push {previewData.total_pages} Units to {connectors.find(c => c.id === selectedConnectorId)?.name}</p>
                  </div>
                  <button 
                    onClick={confirmPrint}
                    disabled={isActionLoading}
                    className="btn btn-primary h-16 px-12 rounded-2xl shadow-2xl shadow-sky-500/20 uppercase tracking-[0.3em] font-black text-xs active:scale-[0.98] transition-all flex items-center gap-4"
                  >
                    {isActionLoading ? <Loader2 className="animate-spin" /> : <Printer size={20} />}
                    Confirm & Print All
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "completed" && completionStats && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in zoom-in-95 duration-700">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] scale-150 rounded-full animate-pulse"></div>
                <div className="w-28 h-28 bg-emerald-500 text-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30 relative z-10 border-4 border-white dark:border-slate-900">
                  <Check size={56} strokeWidth={4} />
                </div>
              </div>

              <div className="text-center space-y-3 mb-12">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dispatch Complete</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                  {completionStats.message || `${completionStats.pushed} Units successfully pushed to the production pipe.`}
                </p>
              </div>
              
              <div className="w-full max-w-2xl grid grid-cols-2 gap-8 mb-16">
                <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center shadow-xl shadow-slate-900/[0.02]">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Allocated</p>
                   <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{completionStats.total_jobs}</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 text-center shadow-xl shadow-emerald-500/[0.05]">
                   <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">Pushed</p>
                   <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{completionStats.pushed}</p>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="btn btn-primary px-16 h-18 rounded-[2rem] shadow-2xl shadow-sky-500/20 uppercase tracking-[0.4em] font-black text-sm active:scale-[0.98] transition-all"
              >
                Return to Library
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
