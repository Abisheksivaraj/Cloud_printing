import React, { useState, useEffect } from "react";

import {
    Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
    Search, Calendar, Printer, FileText, ChevronRight, Filter,
    Play
} from "lucide-react";

import { useTheme } from "../ThemeContext";
import GeneratedLabelsPreview from "./Models/GeneratedLabelsPreview";
import ImportDataModal from "./Models/ImportDataModal";

const PrintHistory = ({ labels = [] }) => {
    const { theme, isDarkMode } = useTheme();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // States for resuming a job
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [resumeTemplate, setResumeTemplate] = useState(null);
    const [generatedLabels, setGeneratedLabels] = useState([]);
    const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);
    const [printJobContext, setPrintJobContext] = useState(null);
    const [error, setError] = useState(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { callEdgeFunction, API_URLS } = await import("../supabaseClient");
            const data = await callEdgeFunction(API_URLS.LIST_PRINT_JOBS, {});
            console.log("Fetched print history:", data);

            // Expected format: array of job objects
            if (Array.isArray(data)) {
                setHistory(data);
            } else if (data && Array.isArray(data.jobs)) {
                setHistory(data.jobs);
            } else {
                console.warn("Unexpected response format for print history:", data);
                // Fallback to empty list or mock data for testing if needed
                // setHistory([]); 
            }
        } catch (err) {
            console.error("Error fetching print history:", err);
            setError("Failed to load print history. Please try again later.");
            // toast.error("Failed to load print history."); // If toast is available
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
            case "failed":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
            case "pending":
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            case "printing":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed": return <CheckCircle size={14} />;
            case "failed": return <XCircle size={14} />;
            case "printing": return <RefreshCw size={14} className="animate-spin" />;
            case "pending": return <Clock size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const filteredHistory = history.filter(job => {
        const matchesSearch = job.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.printerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleResumePrint = (job) => {
        // Find the template used for this job
        const template = labels.find(l => (l.id === job.templateId || l._id === job.templateId));

        if (!template) {
            alert("The original template for this job could not be found.");
            return;
        }

        setResumeTemplate(template);
        setResumeData(job);
        setShowResumeModal(true);
    };

    const handleLabelsGenerated = (newLabels, context) => {
        setGeneratedLabels(newLabels);
        setPrintJobContext({
            template: resumeTemplate,
            ...context
        });
        setShowResumeModal(false);
        setShowGeneratedPreview(true);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>
                        Print History
                    </h1>
                    <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
                        Monitor and manage your print job status and logs.
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by document, printer, or job ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text
                        }}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none appearance-none cursor-pointer"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="printing">Printing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* History Table */}
            <div className="rounded-2xl border-2 overflow-hidden shadow-xl" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b" style={{ borderColor: theme.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Job ID</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Document</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Printer</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Volume / Length</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Date</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: theme.border }}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw size={32} className="animate-spin text-blue-500" />
                                            <p className="text-sm font-bold" style={{ color: theme.textMuted }}>Loading history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <Printer size={32} />
                                            </div>
                                            <p className="font-bold">No print jobs found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((job) => (
                                    <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-[10px] font-bold" style={{ color: theme.text }}>
                                            {job.jobId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate" style={{ color: theme.text }}>{job.documentName}</p>
                                                    <p className="text-[10px] uppercase font-black opacity-50 tracking-wider">Type: {job.documentType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium" style={{ color: theme.text }}>{job.printerName}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5 font-black text-[11px] tracking-tight">
                                                    <span className="text-blue-500">{job.printedRecords || 0}</span>
                                                    <span className="opacity-30">/</span>
                                                    <span style={{ color: theme.text }}>{job.totalRecords || 1}</span>
                                                    <span className="ml-1 opacity-50 text-[9px] uppercase">Labels</span>
                                                </div>
                                                {job.printedLength > 0 && (
                                                    <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px] font-bold opacity-60">
                                                        <span>{job.printedLength} mm</span>
                                                        <span className="opacity-40">|</span>
                                                        <span>{(job.printedLength / 25.4).toFixed(2)} in</span>
                                                    </div>
                                                )}
                                                {job.totalRecords > job.printedRecords && (
                                                    <div className="mt-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                                                        Balance: {job.totalRecords - job.printedRecords}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(job.status)}`}>
                                                {getStatusIcon(job.status)}
                                                {job.status}
                                            </div>
                                            {job.status === "failed" && job.errorMessage && (
                                                <p className="text-[9px] text-red-500 mt-1 font-medium max-w-[150px] truncate" title={job.errorMessage}>
                                                    {job.errorMessage}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: theme.text }}>
                                                <Calendar size={14} className="opacity-40" />
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </div>
                                            <p className="text-[10px] font-bold opacity-40 mt-0.5">
                                                {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {job.sourceData && job.sourceData.length > 0 && (
                                                    <button
                                                        onClick={() => handleResumePrint(job)}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                                                        title="Continue Printing"
                                                    >
                                                        <Play size={12} fill="currentColor" />
                                                        Continue
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals for Resuming */}
            {showResumeModal && resumeTemplate && (
                <ImportDataModal
                    label={resumeTemplate}
                    initialData={resumeData.sourceData}
                    initialMappings={resumeData.metadata?.mappings}
                    onClose={() => setShowResumeModal(false)}
                    onLabelsGenerated={handleLabelsGenerated}
                />
            )}

            {showGeneratedPreview && generatedLabels.length > 0 && (
                <GeneratedLabelsPreview
                    labels={generatedLabels}
                    jobContext={printJobContext}
                    onClose={() => {
                        setShowGeneratedPreview(false);
                        setGeneratedLabels([]);
                        setPrintJobContext(null);
                    }}
                />
            )}
        </div>
    );
};

export default PrintHistory;
