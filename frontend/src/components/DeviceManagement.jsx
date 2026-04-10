import React, { useState, useEffect } from "react";
import {
    Printer, Plus, Search, Trash2, Cpu, 
    CheckCircle, X, Server, Activity, 
    ChevronDown, FileCode, Settings, Loader2, 
    RefreshCw, ChevronRight, Unplug, Shield, 
    Wifi, Users, Layers, Info, Key, Monitor
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { callEdgeFunction, API_URLS } from "../supabaseClient";

const DeviceManagement = ({ onNavigate }) => {
    const { theme, isDarkMode } = useTheme();
    const [connectors, setConnectors] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("connectors"); // "connectors" or "printers"

    const [formData, setFormData] = useState({
        name: "",
        brand: "Honeywell",
        model: "PD45S",
        outputFormat: "zpl",
        serialNumber: ""
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [connectorData, printerData] = await Promise.all([
                callEdgeFunction(API_URLS.LIST_CONNECTORS),
                callEdgeFunction(API_URLS.LIST_PRINTERS)
            ]);
            
            if (connectorData) setConnectors(connectorData.connectors || (Array.isArray(connectorData) ? connectorData : []));
            if (printerData) setPrinters(printerData.printers || (Array.isArray(printerData) ? printerData : []));
        } catch (error) {
            console.error("Fetch failure:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateConnector = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name || `${formData.brand} ${formData.model}`,
                brand: formData.brand,
                model: formData.model,
                serial_number: formData.serialNumber,
                output_format: formData.outputFormat
            };
            const result = await callEdgeFunction(API_URLS.CREATE_CONNECTOR, payload);
            if (result.success) {
                if (result.api_key) {
                    setGeneratedKey(result.api_key);
                    setShowKeyModal(true);
                }
                setShowAddModal(false);
                setFormData({ name: "", brand: "Honeywell", model: "PD45S", outputFormat: "zpl", serialNumber: "" });
                fetchData();
            }
        } catch (error) {
            alert("Provisioning failed: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConnector = async (id) => {
        if (!window.confirm("Remove this infrastructure link?")) return;
        try {
            await callEdgeFunction(API_URLS.DELETE_CONNECTOR, { connector_id: id });
            setConnectors(connectors.filter(c => c.id !== id));
        } catch (error) { console.error("Delete failed:", error); }
    };

    const handleResetConnector = async (id) => {
        if (!window.confirm("Refreshing the API key will disconnect current agents. Proceed?")) return;
        setIsLoading(true);
        try {
            const result = await callEdgeFunction(API_URLS.RESET_CONNECTOR, { connector_id: id });
            if (result.success && result.api_key) {
                setGeneratedKey(result.api_key);
                setShowKeyModal(true);
            }
            fetchData();
        } catch (error) {
            alert("Reset Error: " + error.message);
        } finally { setIsLoading(false); }
    };

    const filteredConnectors = connectors.filter(c => 
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.printer_model || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPrinters = printers.filter(p => 
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.ip_address || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Professional Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl">
                            <Server size={20} className="text-white dark:text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Devices</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Infrastructure Control Panel</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                        Register hardware bridging nodes and manage enterprise-grade print endpoints.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Filter resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12 pr-6 py-3 min-w-[300px]"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary h-[46px] px-6 gap-2 text-[10px] uppercase tracking-widest whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Provision Node
                    </button>
                </div>
            </div>

            {/* Registry Registry Tabs */}
            <div className="flex items-center justify-between mb-8 px-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-10">
                    {['connectors', 'printers'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab === 'connectors' ? 'Infrastructure Links' : 'Endpoint Registry'}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-5 mb-4">
                    <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-500 transition-all">
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <Settings size={16} className="text-slate-400 hover:text-slate-600 transition-all cursor-pointer" />
                </div>
            </div>

            {/* Main Data View */}
            <div className="card-premium overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                {isLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={40} className="animate-spin text-blue-500/20" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synchronizing Registry</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Node Component</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{activeTab === 'connectors' ? 'Security Key' : 'Network Endpoint'}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                {activeTab === 'connectors' ? (
                                    filteredConnectors.map((c) => (
                                        <tr key={c.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                                                        <Activity size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.name}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">UUID: {c.id?.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 text-[9px] font-bold uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    {c.status || 'Verified'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] tracking-tighter text-slate-400 w-[180px] truncate">
                                                        ••••••••••••••••••••
                                                    </div>
                                                    <div className="hidden group-hover:flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-500 tracking-widest">
                                                       <Shield size={10} /> Secure Node
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => onNavigate('add_printer', c.id)} className="btn btn-ghost h-9 px-4 text-[9px] uppercase tracking-widest gap-2 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600">
                                                        <Plus size={12} strokeWidth={3} /> Add Printer
                                                    </button>
                                                    <button onClick={() => handleResetConnector(c.id)} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-amber-500 transition-colors" title="Reset Key">
                                                        <Key size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteConnector(c.id)} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 transition-colors" title="Delete Device">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredPrinters.map((p) => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                                                        <Printer size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase">{p.brand || 'Generic'} {p.model || 'Matrix'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${p.status === 'online' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {p.status || 'Offline'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        <Wifi size={12} className="text-blue-500" />
                                                        {p.ip_address}
                                                    </div>
                                                    <p className="text-[10px] font-medium text-slate-400 ml-5">Network Port: {p.port || 9100}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                  Last Ping: {p.last_status_update_at ? new Date(p.last_status_update_at).toLocaleTimeString() : 'Never'}
                                               </div>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {((activeTab === 'connectors' && filteredConnectors.length === 0) || (activeTab === 'printers' && filteredPrinters.length === 0)) && (
                                     <tr>
                                         <td colSpan="4" className="py-24 text-center">
                                             <Monitor size={48} className="mx-auto mb-4 text-slate-100 dark:text-slate-900" />
                                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No Enterprise Resources Detected</p>
                                         </td>
                                     </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Redesigned Provision Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                        {isSaving ? (
                            <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                    <RefreshCw size={60} className="text-blue-500 animate-spin relative z-10" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Establishing Link</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Provisioning infrastructure on core server</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Unplug size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Provision Node</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Device Identity</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateConnector} className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-semibold text-slate-500 ml-1">Connector Assignment Name</label>
                                            <input
                                                autoFocus
                                                required
                                                type="text"
                                                placeholder="e.g. Warehouse A / Node 1"
                                                className="input py-3"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-4 items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <Info size={18} className="text-blue-500 shrink-0" />
                                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                                Provisioning will generate a unique API security key. This key is required for the bridging agent to verify its identity.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost flex-1 h-11 uppercase text-[10px] tracking-widest font-bold">Discard</button>
                                        <button type="submit" className="btn btn-primary flex-1 h-11 uppercase text-[10px] tracking-widest font-bold shadow-xl shadow-blue-500/20">Initialize Node</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Professional Security Key Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[600] p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center border border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Shield size={32} className="text-emerald-500 text-shadow-sm" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">NODE <span className="text-emerald-500 uppercase">SECURED</span></h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Identity Credentials Package</p>

                        <div className="w-full relative group mb-8">
                             <div 
                                className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] break-all cursor-pointer hover:border-emerald-500/40 transition-all text-slate-600 dark:text-slate-300"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey);
                                    toast.success("Key copied to clipboard");
                                }}
                             >
                                {generatedKey}
                             </div>
                             <p className="text-[9px] font-bold text-emerald-500 uppercase mt-2 tracking-widest">Click key to copy infrastructure token</p>
                        </div>

                        <div className="w-full p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-left mb-8">
                             <div className="flex items-start gap-3">
                                 <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                 <p className="text-[10px] font-bold text-amber-600 leading-relaxed uppercase tracking-tighter">Critical: Key is only shown once. Provision the agent immediately or store in a secure vault.</p>
                             </div>
                        </div>

                        <button
                            onClick={() => setShowKeyModal(false)}
                            className="btn btn-primary w-full h-12 uppercase text-[11px] tracking-[0.2em] font-black"
                        >
                            Credentials Captured
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceManagement;
