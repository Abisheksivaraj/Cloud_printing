import React, { useState, useEffect } from "react";
import {
    Printer, Plus, Search, Trash2,
    CheckCircle, X, Server, Activity, 
    Settings, Loader2, 
    RefreshCw, Shield, 
    Wifi, Info, Key, Monitor, Plug
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
    const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [printerForm, setPrinterForm] = useState({
        name: "",
        ipAddress: "",
        port: "9100"
    });

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
        if (!window.confirm("Remove this infrastructure link? All associated endpoints will be unlinked.")) return;
        try {
            await callEdgeFunction(API_URLS.DELETE_CONNECTOR, { connector_id: id });
            setConnectors(connectors.filter(c => c.id !== id));
        } catch (error) { console.error("Delete failed:", error); }
    };

    const handleDeletePrinter = async (id) => {
        if (!window.confirm("Disconnect this printer?")) return;
        try {
            await callEdgeFunction(API_URLS.DELETE_PRINTER, { printer_id: id });
            setPrinters(printers.filter(p => p.id !== id));
        } catch (error) { console.error("Remove failed:", error); }
    };

    const handleSavePrinter = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                name: printerForm.name,
                connector_id: connectors[0].id,
                ip_address: printerForm.ipAddress,
                port: parseInt(printerForm.port)
            };
            const result = await callEdgeFunction(API_URLS.ADD_PRINTER, payload);
            if (result.success) {
                setPrinterForm({ name: "", ipAddress: "", port: "9100" });
                setShowAddPrinterModal(false);
                fetchData();
            } else {
                alert(result.message || "Failed to add printer");
            }
        } catch (error) {
            console.error("Failed to save printer:", error);
            alert("Failed to add printer: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetConnector = async (id) => {
        if (!window.confirm("Refreshing the API key will disconnect your current agent. Proceed?")) return;
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

    const primaryConnector = connectors.length > 0 ? connectors[0] : null;

    const filteredPrinters = printers.filter(p => 
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.ip_address || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Professional Header Section */}
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl">
                            <Server size={20} className="text-white dark:text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Infrastructure Node</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Device Management</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <button onClick={fetchData} className="btn h-10 w-10 p-0 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all rounded-xl border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={40} className="animate-spin text-blue-500/30" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synchronizing Infrastructure</span>
                </div>
            ) : !primaryConnector ? (
                <div className="card-premium overflow-hidden rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 py-24 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-[32px] flex items-center justify-center mb-6">
                        <Server size={40} className="text-blue-500 opacity-80" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No Infrastructure Node Active</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
                        To securely connect and bridge enterprise printers, you must provision an initial infrastructure node. This generates the necessary keys to run the agent.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary h-14 px-8 gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Provision Node Now
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* Primary Node Overview Card */}
                    <div className="card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                                <Server size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{primaryConnector.name}</h2>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Node ID: {primaryConnector.id}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:block">API Token</span>
                                <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm tracking-widest text-slate-500">
                                    ••••••••••••••••••••
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleResetConnector(primaryConnector.id)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Regenerate Key">
                                    <Key size={18} />
                                </button>
                                <button onClick={() => handleDeleteConnector(primaryConnector.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete Node">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Printers Section Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-12 mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                <Printer size={16} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Connected Endpoints</h3>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none w-full sm:w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search endpoints..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input pl-11 py-2.5 w-full text-xs shadow-sm bg-slate-50/50 dark:bg-slate-900/50"
                                />
                            </div>
                            <button
                                onClick={() => setShowAddPrinterModal(true)}
                                className="btn btn-primary h-10 px-5 gap-2 text-[10px] uppercase tracking-widest whitespace-nowrap shadow-md shadow-blue-500/15"
                            >
                                <Plus size={14} strokeWidth={3} />
                                Add Printer
                            </button>
                        </div>
                    </div>

                    {/* Endpoint Registry Table */}
                    <div className="card-premium overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Printer Model</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">IP Address</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                    {filteredPrinters.length > 0 ? (
                                        filteredPrinters.map((p) => (
                                            <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-slate-200/50 dark:border-slate-800/50">
                                                            <Printer size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.brand || 'Generic'} {p.model || 'Matrix'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <Wifi size={12} className="text-blue-500" />
                                                            {p.ip_address}
                                                        </div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Port <span className="text-slate-600 dark:text-slate-200">{p.port || 9100}</span></p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${p.status === 'online' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                        {p.status || 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                   <div className="flex items-center justify-end gap-4">
                                                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                          Last Ping: {p.last_status_update_at ? new Date(p.last_status_update_at).toLocaleTimeString() : 'Never'}
                                                       </div>
                                                       <button 
                                                           onClick={() => handleDeletePrinter(p.id)} 
                                                           className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                       >
                                                           <Trash2 size={16} />
                                                       </button>
                                                   </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center">
                                                <Printer size={32} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Endpoint Devices Connected</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Redesigned Provision Modal (Unchanged Layout but clean functionality) */}
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
                                            <Server size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Provision Core Node</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Infrastructure Setup</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateConnector} className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assign Node Name</label>
                                            <input
                                                autoFocus
                                                required
                                                type="text"
                                                placeholder="e.g. Master Branch Server"
                                                className="input py-3 w-full"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-4 items-center p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <Info size={18} className="text-blue-500 shrink-0" />
                                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                Once initialized, you will receive a secure API key required to authenticate your local bridged agent into the network.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost flex-1 h-12 uppercase text-[10px] tracking-widest font-black">Discard</button>
                                        <button type="submit" className="btn btn-primary flex-1 h-12 uppercase text-[10px] tracking-widest font-black shadow-xl shadow-blue-500/20">Initialize Now</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Add Printer Modal */}
            {showAddPrinterModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                        {isSaving ? (
                            <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                    <RefreshCw size={60} className="text-blue-500 animate-spin relative z-10" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Binding Resource</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Establishing link through node</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Printer size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Printer Endpoint</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Configure Hardware Link</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddPrinterModal(false)} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSavePrinter} className="p-8 space-y-6">
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Resource Name</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="EX: Shipping Label A1"
                                                className="input py-3 w-full font-bold"
                                                value={printerForm.name}
                                                onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Host Address</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="192.168.1.100"
                                                    className="input py-3 w-full font-bold font-mono"
                                                    value={printerForm.ipAddress}
                                                    onChange={(e) => setPrinterForm({ ...printerForm, ipAddress: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Port</label>
                                                <input
                                                    required
                                                    type="number"
                                                    placeholder="9100"
                                                    className="input py-3 w-full font-bold text-center font-mono"
                                                    value={printerForm.port}
                                                    onChange={(e) => setPrinterForm({ ...printerForm, port: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100 dark:border-slate-800">
                                        <button type="button" onClick={() => setShowAddPrinterModal(false)} className="btn btn-ghost flex-1 h-12 uppercase text-[10px] tracking-widest font-black">Discard</button>
                                        <button type="submit" disabled={!printerForm.name || !printerForm.ipAddress} className="btn btn-primary bg-indigo-500 hover:bg-indigo-600 flex-1 h-12 uppercase text-[10px] tracking-widest font-black shadow-xl shadow-indigo-500/20 disabled:opacity-50">Commit Resource</button>
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
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                            <Shield size={32} className="text-emerald-500 drop-shadow-sm" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">NODE <span className="text-emerald-500 uppercase">SECURED</span></h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Identity Credentials Ready</p>

                        <div className="w-full relative group mb-8">
                             <div 
                                className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm break-all cursor-pointer hover:border-emerald-500/40 transition-all text-slate-700 dark:text-slate-300 shadow-inner"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey);
                                    // optional toast integration if you have it available globally
                                }}
                             >
                                {generatedKey}
                             </div>
                             <p className="text-[9px] font-bold text-emerald-500 uppercase mt-3 tracking-widest">Click to copy infrastructure token</p>
                        </div>

                        <div className="w-full p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-left mb-8">
                             <div className="flex items-start gap-3">
                                 <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                 <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 leading-relaxed uppercase tracking-widest">CRITICAL: The key is only displayed once securely. Store it immediately.</p>
                             </div>
                        </div>

                        <button
                            onClick={() => setShowKeyModal(false)}
                            className="btn btn-primary w-full h-12 uppercase text-[11px] tracking-widest font-black shadow-lg shadow-blue-500/20"
                        >
                            Acknowledge & Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceManagement;
