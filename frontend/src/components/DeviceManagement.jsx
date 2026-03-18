import React, { useState, useEffect } from "react";
import {
    Printer,
    Plus,
    Search,
    Trash2,
    Cpu,
    CheckCircle,
    X,
    Server,
    Activity,
    ChevronDown,
    FileCode,
    Settings,
    Loader2,
    RefreshCw,
    ChevronRight,
    Unplug,
    Shield,
    Wifi,
    Users,
    Layers
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

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        brand: "Honeywell",
        model: "PD45S",
        outputFormat: "zpl",
        serialNumber: ""
    });

    const fetchConnectors = async () => {
        setIsLoading(true);
        try {
            const data = await callEdgeFunction(API_URLS.LIST_CONNECTORS);
            if (data && data.connectors) {
                setConnectors(data.connectors);
            } else if (Array.isArray(data)) {
                setConnectors(data);
            }
        } catch (error) {
            console.error("Failed to fetch connectors:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPrinters = async () => {
        setIsLoading(true);
        try {
            const data = await callEdgeFunction(API_URLS.LIST_PRINTERS);
            if (data && data.printers) {
                setPrinters(data.printers);
            } else if (Array.isArray(data)) {
                setPrinters(data);
            }
        } catch (error) {
            console.error("Failed to fetch printers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchConnectors(), fetchPrinters()]);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);



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
                setFormData({
                    name: "",
                    brand: "Honeywell",
                    model: "PD45S",
                    outputFormat: "zpl",
                    serialNumber: ""
                });
                fetchConnectors();
            }
        } catch (error) {
            console.error("Failed to create connector:", error);
            alert("Failed to create device: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConnector = async (id) => {
        if (!window.confirm("Are you sure you want to remove this device?")) return;
        try {
            await callEdgeFunction(API_URLS.DELETE_CONNECTOR, { connector_id: id });
            setConnectors(connectors.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete connector:", error);
        }
    };

    const handleResetConnector = async (id) => {
        if (!window.confirm("Refreshing the API key will disconnect the current agent. Are you sure?")) return;
        setIsLoading(true);
        try {
            const result = await callEdgeFunction(API_URLS.RESET_CONNECTOR, { connector_id: id });
            if (result.success && result.api_key) {
                setGeneratedKey(result.api_key);
                setShowKeyModal(true);
            }
            fetchConnectors();
        } catch (error) {
            console.error("Failed to reset connector:", error);
            alert("Reset failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
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
        <div className="container mx-auto p-8 max-w-[1700px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Navigation Row - Scaled Down */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
                <div className="flex-1">
                    <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-baseline gap-3" style={{ color: theme.text }}>
                        DEVICE <span className="text-blue-500">NODES</span>
                    </h1>
                    <p className="text-base font-medium opacity-40 max-w-xl" style={{ color: theme.text }}>
                        Provision and manage hardware bridging nodes and enterprise print infrastructure.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    {/* Compact Search Bar */}
                    <div className="relative w-full sm:w-[400px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Filter resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 rounded-xl border outline-none transition-all focus:border-blue-500/30 font-bold text-sm"
                            style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
                        />
                    </div>

                    {/* Compact Primary Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={4} className="text-blue-500" />
                        PROVISION DEVICE
                    </button>
                </div>
            </div>

            {/* Registry Section Header - Scaled Down */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => setActiveTab("connectors")}
                        className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all relative py-2 ${activeTab === 'connectors' ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
                        style={{ color: theme.text }}
                    >
                        DEVICE NODES
                        {activeTab === 'connectors' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("printers")}
                        className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all relative py-2 ${activeTab === 'printers' ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
                        style={{ color: theme.text }}
                    >
                        ACTIVE PRINTERS
                        {activeTab === 'printers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>}
                    </button>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                    <RefreshCw
                        size={16}
                        className={`cursor-pointer hover:text-blue-500 transition-colors ${isLoading ? "animate-spin" : ""}`}
                        onClick={fetchData}
                    />
                    <Settings size={16} className="cursor-pointer hover:text-blue-500 transition-colors" />
                </div>
            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="py-40 flex flex-col items-center gap-6">
                    <Loader2 size={60} className="animate-spin text-blue-500 opacity-20" />
                    <p className="font-black text-[10px] tracking-[0.4em] uppercase opacity-20">Syncing Registry</p>
                </div>
            ) : activeTab === "connectors" ? (
                /* Connectors Table */
                <div className="rounded-[2.5rem] border overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b bg-slate-50/50 dark:bg-slate-800/50" style={{ borderColor: theme.border }}>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: theme.text }}>Connector Info</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: theme.text }}>Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: theme.text }}>API Key</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right" style={{ color: theme.text }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConnectors.map((connector) => (
                                    <tr key={connector.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" style={{ borderColor: theme.border }}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                                    <Server size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm mb-1" style={{ color: theme.text }}>{connector.name}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                                        <Cpu size={10} /> ID: {connector.id?.split('-')[0] || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-500 items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                {connector.status || 'Active'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 group/key">
                                                <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono text-[10px] tracking-widest opacity-60 w-[180px] truncate" style={{ borderColor: theme.border, color: theme.text }}>
                                                    ••••••••••••••••••••
                                                </div>
                                                <div className="flex flex-col gap-1 items-start opacity-0 group-hover/key:opacity-100 transition-opacity">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Hidden For</p>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Security</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onNavigate('add_printer', connector.id)}
                                                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <Printer size={12} />
                                                    Add Printer
                                                </button>
                                                <button
                                                    onClick={() => handleResetConnector(connector.id)}
                                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                                                >
                                                    <RefreshCw size={12} />
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteConnector(connector.id)}
                                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-slate-500 dark:text-slate-400"
                                                    title="Remove Device"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Printers Table */
                <div className="rounded-[2.5rem] border overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b bg-slate-50/50 dark:bg-slate-800/50" style={{ borderColor: theme.border }}>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: theme.text }}>Printer Name</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: theme.text }}>Network Endpoint</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: theme.text }}>Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right" style={{ color: theme.text }}>Metadata</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrinters.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <Printer size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No Printers Detected On This Network</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrinters.map((printer) => (
                                        <tr key={printer.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" style={{ borderColor: theme.border }}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                                        <Printer size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm mb-1" style={{ color: theme.text }}>{printer.name}</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                                            {printer.brand || 'Generic'} {printer.model || 'Printer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.text }}>
                                                        <Wifi size={14} className="text-blue-500" />
                                                        {printer.ip_address}
                                                    </div>
                                                    <p className="text-[10px] font-medium opacity-40 ml-5" style={{ color: theme.text }}>Port: {printer.port}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {printer.status === 'online' || printer.is_available ? (
                                                    <div className="inline-flex px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-500 items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        Online
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-[9px] font-black uppercase tracking-widest text-slate-500 items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                        Offline
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30" style={{ color: theme.text }}>Last Check</p>
                                                    <p className="text-[9px] font-bold" style={{ color: theme.text }}>
                                                        {printer.last_status_update_at ? new Date(printer.last_status_update_at).toLocaleTimeString() : 'Never'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Refined Provision Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => !isSaving && setShowAddModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/5" style={{ backgroundColor: theme.surface }}>
                        {isSaving ? (
                            /* Localized & Refined Connection Animation */
                            <div className="p-20 flex flex-col items-center justify-center min-h-[500px] text-center animate-in fade-in zoom-in-90 duration-500">
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse"></div>
                                    <div className="relative p-10 bg-blue-500/10 rounded-[3rem] border-2 border-blue-500/20 animate-bounce-subtle">
                                        <Unplug size={80} strokeWidth={1.5} className="text-blue-500 rotate-45" />
                                    </div>
                                    {/* Small Orbiting Dots */}
                                    <div className="absolute inset-[-20px] border border-blue-500/10 rounded-full animate-spin-slow"></div>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                                </div>

                                <h3 className="text-3xl font-black tracking-tight mb-4" style={{ color: theme.text }}>
                                    Connecting To <span className="text-blue-500">HOST</span>
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30" style={{ color: theme.text }}>Establishing infrastructure link</p>
                                    <div className="flex justify-center gap-1.5 pt-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Standard Form State */
                            <>
                                <div className="p-10 border-b flex items-center justify-between relative" style={{ borderColor: theme.border }}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Server size={18} className="text-blue-500" />
                                            </div>
                                            <h3 className="text-2xl font-black tracking-tight" style={{ color: theme.text }}>DEVICE <span className="text-blue-500">LINK</span></h3>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-11" style={{ color: theme.text }}>Provision Node Infrastructure</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
                                    >
                                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300 opacity-40" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateConnector} className="p-10 space-y-7 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                            <Activity size={12} className="text-blue-500" />
                                            Connector Name
                                        </label>
                                        <div className="relative group">
                                            <input
                                                required
                                                type="text"
                                                placeholder="EX: Warehouse Connector 1"
                                                className="w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all focus:border-blue-500 font-bold text-sm bg-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                style={{ borderColor: theme.border, color: theme.text }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full py-5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-500/25 mt-6 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden relative group/btn"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative z-10">Initialize Node Link</span>
                                        <RefreshCw size={16} strokeWidth={3} className="relative z-10 group-hover/btn:rotate-180 transition-transform duration-500" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* API Key Display Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowKeyModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/5 p-10 text-center" style={{ backgroundColor: theme.surface }}>
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500/20">
                            <Shield size={32} className="text-emerald-500" />
                        </div>

                        <h3 className="text-2xl font-black tracking-tight mb-2" style={{ color: theme.text }}>API <span className="text-emerald-500">KEY</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-8" style={{ color: theme.text }}>Credentials Generated Successfully</p>

                        <div className="relative group mb-8">
                            <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-colors rounded-3xl"></div>
                            <div
                                className="relative p-6 rounded-2xl border-2 border-dashed font-mono text-sm break-all cursor-pointer hover:border-emerald-500/50 transition-all active:scale-[0.98]"
                                style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey);
                                    const btn = document.getElementById('copy-indicator');
                                    if (btn) btn.innerText = 'COPIED!';
                                    setTimeout(() => { if (btn) btn.innerText = 'CLICK TO COPY'; }, 2000);
                                }}
                            >
                                {generatedKey}
                            </div>
                            <p id="copy-indicator" className="mt-3 text-[9px] font-black text-emerald-500 uppercase tracking-widest">Click key to copy</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-left mb-8">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-start gap-2 leading-relaxed">
                                <Activity size={14} className="shrink-0 mt-0.5" />
                                Please save this key immediately. For security reasons, it will not be shown again. Use it to configure your local connector agent.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowKeyModal(false)}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95"
                        >
                            I HAVE SAVED IT
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `

                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0) rotate(45deg); }
                    50% { transform: translateY(-10px) rotate(45deg); }
                }
                @keyframes spin-slow {
                    to { transform: rotate(360deg); }
                }
                .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}} />
        </div>
    );
};

export default DeviceManagement;
