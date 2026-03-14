import React, { useState } from "react";
import { 
    ArrowLeft, 
    Search, 
    Wifi, 
    Server, 
    CheckCircle, 
    Loader2, 
    Printer as PrinterIcon,
    AlertCircle
} from "lucide-react";
import { useTheme } from "../ThemeContext";

const AddPrinter = ({ onBack }) => {
    const { theme } = useTheme();
    const [ipAddress, setIpAddress] = useState("");
    const [port, setPort] = useState("9100");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null); // 'success', 'error', or null
    const [isSaving, setIsSaving] = useState(false);

    const handleSearchClick = (e) => {
        e.preventDefault();
        if (!ipAddress) return;
        
        setIsSearching(true);
        setSearchResult(null);
        
        // Mocking a network search request
        setTimeout(() => {
            setIsSearching(false);
            // Simulate success 80% of the time for demo
            if (Math.random() > 0.2) {
                setSearchResult('success');
            } else {
                setSearchResult('error');
            }
        }, 2500);
    };

    const handleSavePrinter = (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Mock save flow
        setTimeout(() => {
            setIsSaving(false);
            onBack();
        }, 1000);
    };

    return (
        <div className="container mx-auto p-6 md:p-12 w-full max-w-2xl min-h-[calc(100vh-100px)] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Header & Back Action */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group shrink-0"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight" style={{ color: theme.text }}>
                        Add Printer
                    </h1>
                    <p className="text-xs font-semibold opacity-40 mt-0.5" style={{ color: theme.text }}>
                        Connect via Network IP
                    </p>
                </div>
            </div>

            {/* Main Form Card */}
            <form onSubmit={handleSavePrinter} className="p-8 md:p-12 rounded-[2.5rem] border shadow-sm relative overflow-hidden bg-white dark:bg-slate-900 transition-colors" style={{ borderColor: theme.border }}>
                
                {/* Visual Header */}
                <div className="flex flex-col items-center justify-center text-center mb-10 pb-10 border-b border-slate-100 dark:border-slate-800" style={{ borderColor: theme.border }}>
                    <div className="relative mb-6 group cursor-default">
                        <div className="absolute inset-0 bg-blue-500/10 blur-[30px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none relative z-10 transition-transform duration-500 group-hover:scale-105">
                            <Wifi size={32} className="text-blue-500" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-1" style={{ color: theme.text }}>Network Setup</h3>
                    <p className="text-xs font-medium opacity-50 max-w-[250px]" style={{ color: theme.text }}>
                        Enter the endpoint details to link your device.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Compact IP Address Field */}
                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 mb-2 opacity-40 flex items-center gap-1.5 transition-opacity group-focus-within:opacity-100 group-focus-within:text-blue-500" style={{ color: theme.text }}>
                            <Server size={12} /> IP Address
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="192.168.1.100"
                            className="w-full px-5 py-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 font-semibold text-sm hover:border-slate-300 dark:hover:border-slate-700"
                            value={ipAddress}
                            onChange={(e) => setIpAddress(e.target.value)}
                            style={{ borderColor: theme.border, color: theme.text }}
                            disabled={isSearching}
                        />
                    </div>

                    {/* Compact Port Field */}
                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 mb-2 opacity-40 flex items-center gap-1.5 transition-opacity group-focus-within:opacity-100 group-focus-within:text-blue-500" style={{ color: theme.text }}>
                            <PrinterIcon size={12} /> Port Number
                        </label>
                        <input
                            required
                            type="number"
                            placeholder="9100"
                            className="w-full px-5 py-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/20 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 font-semibold text-sm hover:border-slate-300 dark:hover:border-slate-700"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            style={{ borderColor: theme.border, color: theme.text }}
                            disabled={isSearching}
                        />
                    </div>

                    {/* Integrated Search Status Area */}
                    <div className={`mt-6 overflow-hidden transition-all duration-500 ease-in-out ${isSearching || searchResult ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {isSearching ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                                <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Scanning Endpoint...</p>
                                    <p className="text-[10px] text-slate-500 truncate">Pinging {ipAddress}:{port}</p>
                                </div>
                            </div>
                        ) : searchResult === 'success' ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">Device Found</p>
                                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 truncate">Ready to link on {ipAddress}:{port}</p>
                                </div>
                            </div>
                        ) : searchResult === 'error' ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="text-red-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 truncate">Connection Failed</p>
                                    <p className="text-[10px] text-red-600/70 dark:text-red-500/70 truncate">No response from {ipAddress}:{port}</p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Actions Group */}
                    <div className="pt-6 mt-6 flex gap-3">
                         <button
                            type="button"
                            onClick={handleSearchClick}
                            disabled={!ipAddress || isSearching}
                            className="flex-1 py-4 border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                            style={{ borderColor: theme.border }}
                        >
                            <Search size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                            Search
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving || !ipAddress || !port || isSearching}
                            className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-slate-900 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <><Loader2 size={14} className="animate-spin" /> Saving...</>
                            ) : searchResult === 'success' ? (
                                'Link Device'
                            ) : (
                                'Add Printer'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddPrinter;
