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
    Users,
    Layers
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { callEdgeFunction, API_URLS } from "../supabaseClient";

const PRINTER_DATA = {
    Honeywell: ["PD45S", "PM43", "PC42t", "PX940", "RP4f"],
    Zebra: ["ZD420", "ZT411", "GK420d", "ZT610", "ZD621"],
    TSC: ["TTP-244 Pro", "TE210", "MX240P", "MH241", "Alpha-3R"],
    Newland: ["NLS-NVH300", "NLS-HR2081", "NLS-MT90", "NLS-FM3080"]
};

const OUTPUT_FORMATS = ["zpl", "pdf", "prn"];

const DeviceManagement = () => {
    const { theme, isDarkMode } = useTheme();
    const [connectors, setConnectors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

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

    useEffect(() => {
        fetchConnectors();
    }, []);

    const handleBrandChange = (brand) => {
        setFormData({
            ...formData,
            brand,
            model: PRINTER_DATA[brand][0]
        });
    };

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

            {/* Scaled Refined Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {[
                    { label: "TOTAL ASSETS", value: connectors.length, icon: Layers, color: "text-blue-500", bg: "bg-blue-50/50" },
                    { label: "CONNECTED NODES", value: connectors.filter(c => c.status === 'active').length, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { label: "SYSTEM UPTIME", value: "99.9%", icon: Shield, color: "text-blue-500", bg: "bg-blue-50/50" },
                    { label: "ENCRYPTION", value: "AES-256", icon: Server, color: "text-slate-500", bg: "bg-slate-50/50" },
                ].map((stat, i) => (
                    <div key={i} className="p-8 rounded-3xl border shadow-sm flex flex-col items-start transition-all hover:shadow-md" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-10`}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3" style={{ color: theme.text }}>{stat.label}</p>
                        <p className="text-3xl font-black" style={{ color: theme.text }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Registry Section Header - Scaled Down */}
            <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30" style={{ color: theme.text }}>
                    ENTERPRISE REGISTRY
                </h3>
                <div className="flex items-center gap-4 text-slate-300">
                    <RefreshCw 
                        size={16} 
                        className={`cursor-pointer hover:text-blue-500 transition-colors ${isLoading ? "animate-spin" : ""}`} 
                        onClick={fetchConnectors}
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
            ) : filteredConnectors.length === 0 ? (
                <div className="py-40 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center text-center opacity-20" style={{ borderColor: theme.border }}>
                    <Cpu size={80} className="mb-6" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Zero Nodes Detected</h3>
                    <p className="text-sm font-bold mt-2">Provision a device to start managing your infrastructure.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredConnectors.map((connector) => (
                        <div 
                            key={connector.id} 
                            className="p-12 rounded-[3.5rem] border-2 group transition-all hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden" 
                            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                        >
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all duration-300">
                                    <Printer size={48} strokeWidth={1} />
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        {connector.status || 'Active'}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteConnector(connector.id)}
                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tight truncate mb-6" style={{ color: theme.text }}>{connector.name}</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>
                                        <Printer size={16} />
                                        {connector.brand} {connector.model}
                                        {!connector.brand && connector.printer_model}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>
                                        <Cpu size={16} />
                                        SN: {connector.serial_number || connector.metadata?.serial_number || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>
                                        <FileCode size={16} />
                                        Engine: {connector.output_format}
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t flex items-center justify-between" style={{ borderColor: theme.border }}>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-20" style={{ color: theme.text }}>SECURITY STATUS</p>
                                        <p className="text-[11px] font-bold text-blue-500 flex items-center gap-1.5 active:opacity-60 transition-opacity cursor-pointer" onClick={() => handleResetConnector(connector.id)}>
                                            <RefreshCw size={12} strokeWidth={3} />
                                            Reset Credentials
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                        <ChevronRight size={20} className="text-blue-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 -rotate-45 translate-x-20 -translate-y-20 group-hover:translate-x-14 group-hover:-translate-y-14 transition-transform duration-700"></div>
                        </div>
                    ))}
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
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                style={{ borderColor: theme.border, color: theme.text }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                                <Shield size={12} className="text-blue-500" />
                                                Brand
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 outline-none transition-all focus:border-blue-500 font-bold text-sm appearance-none cursor-pointer bg-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                                    value={formData.brand}
                                                    onChange={(e) => handleBrandChange(e.target.value)}
                                                    style={{ borderColor: theme.border, color: theme.text }}
                                                >
                                                    {Object.keys(PRINTER_DATA).map(brand => (
                                                        <option key={brand} value={brand} className="dark:bg-slate-900">{brand}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" size={16} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                                <Layers size={12} className="text-blue-500" />
                                                Model
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 outline-none transition-all focus:border-blue-500 font-bold text-sm appearance-none cursor-pointer bg-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                                    value={formData.model}
                                                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                                                    style={{ borderColor: theme.border, color: theme.text }}
                                                >
                                                    {PRINTER_DATA[formData.brand].map(model => (
                                                        <option key={model} value={model} className="dark:bg-slate-900">{model}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                                <Cpu size={12} className="text-blue-500" />
                                                Serial Number
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="EX: SN-00123456"
                                                className="w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all focus:border-blue-500 font-bold text-sm bg-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                                value={formData.serialNumber}
                                                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                                                style={{ borderColor: theme.border, color: theme.text }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-40 flex items-center gap-2" style={{ color: theme.text }}>
                                                <FileCode size={12} className="text-blue-500" />
                                                Print Format
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 outline-none transition-all focus:border-blue-500 font-bold text-sm appearance-none cursor-pointer bg-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                                    value={formData.outputFormat}
                                                    onChange={(e) => setFormData({...formData, outputFormat: e.target.value})}
                                                    style={{ borderColor: theme.border, color: theme.text }}
                                                >
                                                    {OUTPUT_FORMATS.map(format => (
                                                        <option key={format} value={format} className="dark:bg-slate-900">{format.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" size={16} />
                                            </div>
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

            <style dangerouslySetInnerHTML={{ __html: `

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
