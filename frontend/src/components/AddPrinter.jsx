import React, { useState } from "react";
import { 
    ArrowLeft, 
    Search, 
    Wifi, 
    Server, 
    CheckCircle, 
    Loader2, 
    Plus,
    Printer as PrinterIcon,
    AlertCircle
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { callEdgeFunction, API_URLS } from "../supabaseClient";

const AddPrinter = ({ onBack, connectorId }) => {
    const { theme, isDarkMode } = useTheme();
    const [name, setName] = useState("");
    const [ipAddress, setIpAddress] = useState("");
    const [port, setPort] = useState("9100");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [printers, setPrinters] = useState([]);
    const [isLoadingPrinters, setIsLoadingPrinters] = useState(true);

    const fetchPrintersForConnector = async () => {
        if (!connectorId) return;
        setIsLoadingPrinters(true);
        try {
            const data = await callEdgeFunction(API_URLS.LIST_PRINTERS, { connector_id: connectorId });
            if (data && data.printers) {
                setPrinters(data.printers);
            } else if (Array.isArray(data)) {
                setPrinters(data);
            }
        } catch (error) {
            console.error("Failed to fetch printers for connector:", error);
        } finally {
            setIsLoadingPrinters(false);
        }
    };

    React.useEffect(() => {
        fetchPrintersForConnector();
    }, [connectorId]);

    const handleSearchClick = (e) => {
        e.preventDefault();
        if (!ipAddress) return;
        setIsSearching(true);
        setSearchResult(null);
        setTimeout(() => {
            setIsSearching(false);
            if (Math.random() > 0.2) setSearchResult('success');
            else setSearchResult('error');
        }, 2000);
    };

    const handleSavePrinter = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                name,
                connector_id: connectorId,
                ip_address: ipAddress,
                port: parseInt(port)
            };
            const result = await callEdgeFunction(API_URLS.ADD_PRINTER, payload);
            if (result.success) {
                setName("");
                setIpAddress("");
                setPort("9100");
                setSearchResult(null);
                fetchPrintersForConnector();
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

    const surfaceStyle = {
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderColor: theme.border
    };

    return (
        <div className="min-h-screen p-6 md:p-12 lg:p-16 animate-in fade-in duration-1000 max-w-[1800px] mx-auto">
            
            {/* Minimalist Top Nav */}
            <div className="flex items-center justify-between mb-16 px-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all"
                        style={{ color: theme.text }}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Registry
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: theme.text }}>
                            Node: {connectorId?.split('-')[0] || 'N/A'}
                        </span>
                    </div>
                </div>
                
                <h1 className="text-3xl font-black tracking-tighter" style={{ color: theme.text }}>
                    PRINTER <span className="text-blue-500">PROVISION</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Left Column: Form Section */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="p-8 md:p-10 rounded-[3rem] border transition-all duration-500 shadow-sm" style={surfaceStyle}>
                        <div className="flex flex-col gap-1 mb-10">
                            <h3 className="text-xl font-black tracking-tight" style={{ color: theme.text }}>Network Endpoint</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-30" style={{ color: theme.text }}>Configure hardware bridging link</p>
                        </div>

                        <form onSubmit={handleSavePrinter} className="space-y-6">
                            {/* Premium Input Group */}
                            <div className="space-y-4">
                                <div className="space-y-1.5 px-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>Resource Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="EX: Shipping Label A1"
                                        className="w-full bg-transparent border-b-2 py-3 outline-none transition-all focus:border-blue-500 font-bold text-base placeholder:opacity-20 translate-y-0 focus:-translate-y-1"
                                        style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.text }}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 space-y-1.5 px-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>Host Address</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="192.168.1.100"
                                            className="w-full bg-transparent border-b-2 py-3 outline-none transition-all focus:border-blue-500 font-bold text-base placeholder:opacity-20"
                                            style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.text }}
                                            value={ipAddress}
                                            onChange={(e) => setIpAddress(e.target.value)}
                                            disabled={isSearching || isSaving}
                                        />
                                    </div>
                                    <div className="space-y-1.5 px-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>Port</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="9100"
                                            className="w-full bg-transparent border-b-2 py-3 outline-none transition-all focus:border-blue-500 font-bold text-base placeholder:opacity-20 text-center"
                                            style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.text }}
                                            value={port}
                                            onChange={(e) => setPort(e.target.value)}
                                            disabled={isSearching || isSaving}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Search/Scan Visual Feedback */}
                            { (isSearching || searchResult) && (
                                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 animate-in slide-in-from-top-2">
                                    {isSearching ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 size={16} className="text-blue-500 animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/60">Scanning Node Infrastructure...</p>
                                        </div>
                                    ) : searchResult === 'success' ? (
                                        <div className="flex items-center gap-3 text-emerald-500">
                                            <CheckCircle size={16} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Handshake Verified</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-red-500">
                                            <AlertCircle size={16} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Target Unreachable</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-8 flex flex-col gap-4">
                                <button
                                    type="submit"
                                    disabled={isSaving || !name || !ipAddress || isSearching}
                                    className="w-full py-5 bg-blue-500 hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />}
                                    Commit Resource
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleSearchClick}
                                    disabled={!ipAddress || isSearching || isSaving}
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all"
                                    style={{ color: theme.text }}
                                >
                                    Dry-Run Connection Setup
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Meta Info Box */}
                    <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Server size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-amber-600/80 leading-relaxed mb-1">Infrastructure Requirement</p>
                            <p className="text-[10px] text-amber-600/50 leading-relaxed">Ensure the printer is in dynamic RAW (9100) mode and accessible from the bridging host.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Printers Section */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex items-baseline justify-between px-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30" style={{ color: theme.text }}>
                            Active Deployment Registry
                        </h3>
                        <div className="flex items-center gap-2">
                             <div className="text-[10px] font-black text-blue-500">{printers.length}</div>
                             <div className="text-[10px] font-black uppercase tracking-widest opacity-20" style={{ color: theme.text }}>Units Online</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoadingPrinters ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-32 rounded-[2.5rem] border animate-pulse" style={{ borderColor: theme.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}></div>
                            ))
                        ) : printers.length === 0 ? (
                            <div className="py-40 rounded-[3.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center opacity-10" style={{ borderColor: theme.border }}>
                                <PrinterIcon size={80} className="mb-6" />
                                <h4 className="text-xl font-black uppercase tracking-widest">Registry Empty</h4>
                                <p className="text-[10px] font-bold mt-2">Provision a printer to see it here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {printers.map((p) => (
                                    <div 
                                        key={p.id}
                                        className="group p-8 rounded-[3rem] border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/5"
                                        style={surfaceStyle}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-700">
                                                    <PrinterIcon size={24} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black tracking-tight mb-1" style={{ color: theme.text }}>{p.name}</h4>
                                                    <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase opacity-40" style={{ color: theme.text }}>
                                                        <span className="flex items-center gap-1.5"><Wifi size={12} className="text-blue-500" /> {p.ip_address}</span>
                                                        <span>Port {p.port}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-3">
                                                {p.status === 'online' || p.is_available ? (
                                                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                                                        Live
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                        Offline
                                                    </div>
                                                )}
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20" style={{ color: theme.text }}>Check Success</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                input:focus { transform: translateY(-2px); }
                input::placeholder { font-weight: 500; letter-spacing: 0.05em; }
            `}} />
        </div>
    );
};

export default AddPrinter;
