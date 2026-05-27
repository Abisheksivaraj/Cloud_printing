import React, { useState, useEffect } from "react";
import {
    Printer, Plus, Search, Trash2,
    CheckCircle, X, Server, Activity,
    Settings, Loader2,
    RefreshCw, Shield,
    Wifi, Info, Key, Monitor, Plug,
    AlertTriangle, FileX, Wind, DoorOpen,
    Scissors, Cpu, Thermometer, HardDrive,
    Layers, AlertCircle, Clock
} from "lucide-react";

const ERROR_METADATA = {
    'Media Out': { icon: FileX, color: 'text-amber-500', bg: 'bg-amber-50/50', darkBg: 'dark:bg-amber-500/10', description: 'Printer is out of labels or tags.' },
    'Ribbon Out': { icon: Wind, color: 'text-amber-500', bg: 'bg-amber-50/50', darkBg: 'dark:bg-amber-500/10', description: 'Thermal transfer ribbon is empty.' },
    'Head Open': { icon: DoorOpen, color: 'text-rose-500', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-500/10', description: 'The printhead assembly is not closed.' },
    'Paper Jam': { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-500/10', description: 'Media is stuck in the printer path.' },
    'Cutter Fault': { icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-500/10', description: 'Issue with the automatic cutter.' },
    'Head Fault': { icon: Cpu, color: 'text-rose-600', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-600/10', description: 'Critical printhead failure detected.' },
    'Motor Over Temperature': { icon: Thermometer, color: 'text-rose-600', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-600/10', description: 'Motor temperature exceeded safe limits.' },
    'Printhead Over Temperature': { icon: Thermometer, color: 'text-rose-600', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-600/10', description: 'Printhead is too hot to continue.' },
    'Memory Full': { icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50/50', darkBg: 'dark:bg-blue-500/10', description: 'Internal memory is exhausted.' },
    'Print Buffer Full': { icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50/50', darkBg: 'dark:bg-blue-500/10', description: 'The incoming data buffer is full.' }
};
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
    const [showConnectorModal, setShowConnectorModal] = useState(false);
    const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [printerForm, setPrinterForm] = useState({
        name: "",
        printerType: "lan",   // "lan" | "usb"
        ipAddress: "",
        port: "9100",
        dpi: 203,
        usbPath: "",
        usbIpAddress: "",  // optional LAN monitoring for USB printers
        usbPort: "",
        vid: "",
        pid: "",
        usb_serial: "",
        language: "zpl"
    });

    const [printerErrors, setPrinterErrors] = useState([]);
    const [selectedPrinterForErrors, setSelectedPrinterForErrors] = useState(null);
    const [isResolving, setIsResolving] = useState(false);

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
            const [connectorData, printerData, errorData] = await Promise.all([
                callEdgeFunction(API_URLS.LIST_CONNECTORS),
                callEdgeFunction(API_URLS.LIST_PRINTERS),
                callEdgeFunction(API_URLS.PRINTER_STATUS, null, { method: 'GET' })
            ]);

            if (connectorData) setConnectors(connectorData.connectors || (Array.isArray(connectorData) ? connectorData : []));
            if (printerData) setPrinters(printerData.printers || (Array.isArray(printerData) ? printerData : []));

            // Extract errors from printer-status for the Alerts column
            const statusPrinters = errorData?.printers || [];
            const flatErrors = statusPrinters.flatMap(sp =>
                (sp.current_errors || []).map(errName => ({
                    id: `${sp.id}-${errName}`,
                    printer_id: sp.id,
                    error_type: errName,
                    created_at: sp.last_error_at || new Date().toISOString(),
                }))
            );
            setPrinterErrors(flatErrors);
        } catch (error) {
            console.error("Fetch failure:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolveError = async (errorId) => {
        setIsResolving(true);
        try {
            const result = await callEdgeFunction(`${API_URLS.PRINTER_STATUS}/${errorId}/resolve`, null, { method: 'PATCH' });
            if (result.success) {
                setPrinterErrors(prev => prev.filter(e => e.id !== errorId));
            }
        } catch (error) {
            console.error("Resolution failed:", error);
            alert("Failed to resolve error: " + error.message);
        } finally {
            setIsResolving(false);
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
            const isLan = printerForm.printerType === "lan";

            // Validate USB optional LAN fields — must be both or neither
            if (!isLan && (printerForm.usbIpAddress || printerForm.usbPort)) {
                if (!printerForm.usbIpAddress || !printerForm.usbPort) {
                    alert("For LAN status monitoring of a USB printer, both IP address and port must be provided together.");
                    setIsSaving(false);
                    return;
                }
            }

            let payload;

            if (isLan) {
                payload = {
                    name: printerForm.name,
                    connector_id: connectors[0].id,
                    ip_address: printerForm.ipAddress,
                    port: parseInt(printerForm.port),
                    dpi: Number(printerForm.dpi),
                    printer_type: "lan"
                };
            } else {
                payload = {
                    name: printerForm.name,
                    connector_id: connectors[0].id,
                    usb_path: printerForm.usbPath,
                    vid: printerForm.vid,
                    pid: printerForm.pid,
                    usb_serial: printerForm.usb_serial,
                    language: printerForm.language,
                    dpi: Number(printerForm.dpi),
                    printer_type: "usb",
                    ...(printerForm.usbIpAddress && printerForm.usbPort ? {
                        ip_address: printerForm.usbIpAddress,
                        port: parseInt(printerForm.usbPort)
                    } : {})
                };
            }

            const result = await callEdgeFunction(API_URLS.ADD_PRINTER, payload);
            if (result.success || result.printer) {
                setPrinterForm({ name: "", printerType: "lan", ipAddress: "", port: "9100", dpi: 203, usbPath: "", usbIpAddress: "", usbPort: "", vid: "", pid: "", usb_serial: "", language: "zpl" });
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
        <div className="max-w-[1600px] mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-2 duration-700">

            {/* Professional Header Section */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] flex items-center justify-center text-white shadow-[var(--shadow-glow)] border border-white/20">
                        <Printer size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">Device Management</h1>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-0.5">Connected Endpoints</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="btn h-10 w-10 p-0 text-slate-500 hover:text-[var(--color-gradient-start)] hover:shadow-[var(--shadow-glow)] rounded-xl transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center group">
                        <RefreshCw size={18} className={`transition-transform duration-500 group-hover:rotate-180 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                    {primaryConnector && (
                        <button
                            onClick={() => setShowConnectorModal(true)}
                            className="btn h-10 px-4 gap-2 text-slate-700 dark:text-slate-300 hover:text-[var(--color-gradient-start)] hover:shadow-[var(--shadow-glow)] rounded-xl transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center font-black uppercase text-[10px] tracking-widest"
                        >
                            <Settings size={16} />
                            Node Settings
                        </button>
                    )}
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
                <div className="space-y-4">
                    {/* Search & Add Bar */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search printers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 py-2.5 rounded-xl border border-white/40 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-gradient-start)] focus:border-transparent transition-all shadow-inner"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddPrinterModal(true)}
                            className="btn btn-primary h-10 px-5 gap-2 text-[11px] uppercase tracking-widest whitespace-nowrap ml-auto"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Add Printer
                        </button>
                    </div>

                    {/* Card-Based Printer List */}
                    <div className="space-y-3">
                        {filteredPrinters.length > 0 ? (
                            filteredPrinters.map((p, i) => {
                                const pErrors = printerErrors.filter(e => e.printer_id === p.id);
                                const isOnline = p.status === 'online';
                                return (
                                    <div
                                        key={p.id}
                                        className="group glass-card p-5 flex items-center gap-6 hover:scale-[1.01] hover:shadow-xl transition-all duration-300 cursor-default"
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        {/* Printer Icon */}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 ${isOnline
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 text-slate-400'
                                        }`}>
                                            <Printer size={22} />
                                        </div>

                                        {/* Name & Brand */}
                                        <div className="min-w-[160px]">
                                            <p className="font-black text-[15px] text-slate-900 dark:text-white leading-tight">{p.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{p.brand || 'Generic'} {p.model || 'Matrix'}</p>
                                        </div>

                                        {/* IP Address */}
                                        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                            <Wifi size={12} className="text-[var(--color-gradient-start)]" />
                                            <span>{p.ip_address || '—'}</span>
                                            <span className="text-slate-400 text-[10px]">:{p.port || 9100}</span>
                                        </div>

                                        {/* Status Badge */}
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOnline
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {p.status || 'Offline'}
                                        </span>

                                        {/* Alerts */}
                                        {pErrors.length > 0 ? (
                                            <button
                                                onClick={() => setSelectedPrinterForErrors(p)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all hover:scale-105"
                                            >
                                                <AlertCircle size={12} className="animate-pulse" />
                                                {pErrors.length} {pErrors.length === 1 ? 'Alert' : 'Alerts'}
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest flex items-center gap-1.5">
                                                <CheckCircle size={12} />
                                                Clear
                                            </span>
                                        )}

                                        {/* Spacer */}
                                        <div className="flex-1" />

                                        {/* Last Ping */}
                                        <div className="hidden lg:block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                            {p.last_status_update_at ? new Date(p.last_status_update_at).toLocaleTimeString() : '—'}
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDeletePrinter(p.id)}
                                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="glass-panel py-20 flex flex-col items-center text-center">
                                <Printer size={40} className="mb-5 text-slate-300 dark:text-slate-700 drop-shadow-sm" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">No Endpoint Devices Connected</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Redesigned Provision Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-500">
                    <div className="w-full max-w-xl glass-panel flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">
                        {isSaving ? (
                            <div className="p-24 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] opacity-10 animate-pulse" />
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[var(--color-gradient-start)] blur-3xl rounded-full scale-150 animate-pulse opacity-20" />
                                    <RefreshCw size={64} className="text-[var(--color-gradient-start)] animate-spin relative z-10" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] mb-3">Establishing Link</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Provisioning infrastructure on core server</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-glow)]">
                                            <Server size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Provision Core Node</h3>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Infrastructure Setup</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="p-2.5 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm">
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
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-500">
                    <div className="w-full max-w-lg glass-panel flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">
                        {isSaving ? (
                            <div className="p-24 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-10 animate-pulse" />
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500 blur-3xl rounded-full scale-150 animate-pulse opacity-20" />
                                    <RefreshCw size={64} className="text-indigo-500 animate-spin relative z-10" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-3">Binding Resource</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Establishing link through node</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-[var(--color-gradient-end)] rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                            <Printer size={22} className="text-white drop-shadow-sm" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Add Printer Endpoint</h3>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Configure Hardware Link</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddPrinterModal(false)} className="p-2.5 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSavePrinter} className="p-8 space-y-5">
                                    {/* Printer Type Tabs */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Connection Type</label>
                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setPrinterForm({ ...printerForm, printerType: 'lan' })}
                                                className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-2 ${printerForm.printerType === 'lan'
                                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                <Wifi size={14} /> LAN / Network
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPrinterForm({ ...printerForm, printerType: 'usb' })}
                                                className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-2 ${printerForm.printerType === 'usb'
                                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                <Plug size={14} /> USB / Direct
                                            </button>
                                        </div>
                                    </div>

                                    {/* Common Fields */}
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

                                    {/* LAN-specific Fields */}
                                    {printerForm.printerType === 'lan' && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">IP Address <span className="text-rose-500">*</span></label>
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
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Port <span className="text-rose-500">*</span></label>
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
                                    )}

                                    {/* USB-specific Fields */}
                                    {printerForm.printerType === 'usb' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Connector ID</label>
                                                    <input
                                                        readOnly
                                                        type="text"
                                                        className="input py-3 w-full font-bold font-mono text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 cursor-not-allowed border-dashed"
                                                        value={primaryConnector?.id || "N/A"}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Language</label>
                                                    <select
                                                        className="input py-3 w-full font-bold text-xs"
                                                        value={printerForm.language}
                                                        onChange={(e) => setPrinterForm({ ...printerForm, language: e.target.value })}
                                                    >
                                                        <option value="zpl">ZPL</option>
                                                        <option value="tspl">TSPL</option>
                                                        <option value="escpos">ESC/POS</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">VID</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0x067e"
                                                        className="input py-3 w-full font-bold font-mono text-xs"
                                                        value={printerForm.vid}
                                                        onChange={(e) => setPrinterForm({ ...printerForm, vid: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">PID</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0x0042"
                                                        className="input py-3 w-full font-bold font-mono text-xs"
                                                        value={printerForm.pid}
                                                        onChange={(e) => setPrinterForm({ ...printerForm, pid: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Serial No</label>
                                                    <input
                                                        type="text"
                                                        placeholder="148C2230113"
                                                        className="input py-3 w-full font-bold font-mono text-xs"
                                                        value={printerForm.usb_serial}
                                                        onChange={(e) => setPrinterForm({ ...printerForm, usb_serial: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* DPI Selector — common to both */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Print Density (DPI) <span className="text-rose-500">*</span></label>
                                        <div className="flex gap-3">
                                            {[203, 300, 600].map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setPrinterForm({ ...printerForm, dpi: d })}
                                                    className={`flex-1 py-2.5 rounded-xl border-2 font-black text-xs transition-all ${printerForm.dpi === d
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                                                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {d} DPI
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button type="button" onClick={() => setShowAddPrinterModal(false)} className="btn btn-ghost flex-1 h-12 uppercase text-[10px] tracking-widest font-black">Discard</button>
                                        <button
                                            type="submit"
                                            disabled={
                                                !printerForm.name ||
                                                (printerForm.printerType === 'lan' && (!printerForm.ipAddress || !printerForm.port)) ||
                                                (printerForm.printerType === 'usb' && (!printerForm.vid || !printerForm.pid))
                                            }
                                            className="btn btn-primary bg-indigo-500 hover:bg-indigo-600 flex-1 h-12 uppercase text-[10px] tracking-widest font-black shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                                        >
                                            Commit Resource
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Professional Security Key Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[600] p-4 animate-in fade-in duration-500">
                    <div className="w-full max-w-md glass-panel p-10 flex flex-col items-center text-center border border-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-3xl z-0" />
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/20">
                                <Shield size={40} className="text-white drop-shadow-md" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">NODE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-300">SECURED</span></h3>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Identity Credentials Ready</p>

                            <div className="w-full relative group mb-8">
                                <div
                                    className="w-full p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-emerald-500/30 rounded-xl font-mono text-sm break-all cursor-pointer hover:border-emerald-500 transition-all text-slate-800 dark:text-slate-200 shadow-inner hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedKey);
                                    }}
                                >
                                    {generatedKey}
                                </div>
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mt-4 tracking-[0.2em]">Click to copy infrastructure token</p>
                            </div>

                            <div className="w-full p-5 bg-amber-500/10 backdrop-blur-md border border-amber-500/30 rounded-xl text-left mb-8 shadow-inner">
                                <div className="flex items-start gap-4">
                                    <Info size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-[0.1em]">CRITICAL: The key is only displayed once securely. Store it immediately.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowKeyModal(false)}
                                className="btn w-full h-14 uppercase text-xs tracking-widest font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border border-emerald-400/50 hover:scale-[1.02]"
                            >
                                Acknowledge & Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Printer Errors Modal */}
            {selectedPrinterForErrors && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[700] p-4 animate-in fade-in duration-500">
                    <div className="w-full max-w-2xl glass-panel flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">
                        <div className="absolute inset-0 bg-rose-500/5 backdrop-blur-3xl z-0 pointer-events-none" />
                        
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-white/20">
                                    <AlertTriangle size={26} className="text-white drop-shadow-md" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Terminal Alerts</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{selectedPrinterForErrors.name} • {selectedPrinterForErrors.ip_address}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPrinterForErrors(null)} className="p-3 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                            {(() => {
                                const pErrors = printerErrors.filter(e => e.printer_id === selectedPrinterForErrors.id);
                                return pErrors.length > 0 ? pErrors.map((error) => {
                                    const meta = ERROR_METADATA[error.error_type] || {
                                        icon: AlertCircle,
                                        color: 'text-slate-500',
                                        bg: 'bg-slate-50',
                                        darkBg: 'dark:bg-slate-800',
                                        description: 'An unknown hardware error occurred.'
                                    };
                                    const Icon = meta.icon;

                                    return (
                                        <div key={error.id} className="group relative flex items-start gap-5 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-rose-200 dark:hover:border-rose-900/30 transition-all duration-300">
                                            <div className={`w-12 h-12 ${meta.bg} ${meta.darkBg} rounded-xl flex items-center justify-center ${meta.color} shrink-0`}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <h4 className={`text-sm font-black uppercase tracking-wider ${meta.color}`}>{error.error_type}</h4>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                        <Clock size={10} />
                                                        {new Date(error.created_at).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                                    {meta.description}
                                                </p>
                                                <button
                                                    disabled={isResolving}
                                                    onClick={() => handleResolveError(error.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    {isResolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                    Mark as Resolved
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">All Systems Normal</h4>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">No unresolved hardware alerts found</p>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-8 border-t border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md flex justify-end relative z-10">
                            <button
                                onClick={() => setSelectedPrinterForErrors(null)}
                                className="btn btn-ghost h-12 px-8 uppercase text-[11px] tracking-widest font-black hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl"
                            >
                                Close Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connector Modal */}
            {showConnectorModal && primaryConnector && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-500">
                    <div className="w-full max-w-xl glass-panel flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-glow)]">
                                    <Server size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Node Settings</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Infrastructure Configuration</p>
                                </div>
                            </div>
                            <button onClick={() => setShowConnectorModal(false)} className="p-2.5 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{primaryConnector.name}</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">Node ID: <span className="font-mono text-slate-600 dark:text-slate-300 ml-1">{primaryConnector.id}</span></p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    Active
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Token</label>
                                    <div className="px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 font-mono text-sm tracking-[0.2em] text-slate-600 dark:text-slate-400 shadow-inner flex items-center justify-between">
                                        <span>••••••••••••••••••••••••••••</span>
                                        <button onClick={() => handleResetConnector(primaryConnector.id)} className="p-2 text-slate-500 hover:text-[var(--color-gradient-start)] hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Regenerate Key">
                                            <Key size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-2 ml-1 leading-relaxed">If you regenerate your key, any existing connected agents will immediately lose access and must be re-configured.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md flex justify-between items-center relative z-10">
                            <button
                                onClick={() => {
                                    handleDeleteConnector(primaryConnector.id);
                                    setShowConnectorModal(false);
                                }}
                                className="btn h-12 px-6 gap-2 text-rose-500 hover:text-white hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:border-rose-500 rounded-xl transition-all duration-300 bg-rose-500/10 border border-rose-500/20 font-black uppercase text-[10px] tracking-widest"
                            >
                                <Trash2 size={16} />
                                Delete Node
                            </button>
                            <button
                                onClick={() => setShowConnectorModal(false)}
                                className="btn btn-ghost h-12 px-8 uppercase text-[11px] tracking-widest font-black hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceManagement;
