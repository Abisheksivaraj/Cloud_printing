import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Send, Sparkles, X, Minimize2, Maximize2,
    Cpu, Zap, RefreshCw, AlertCircle, CheckCircle2,
    Save, FileText, Info
} from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { generateLabel, explainPrompt } from "./labelEngine";
import { callEdgeFunction, API_URLS } from "../../supabaseClient";

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    { icon: "🚚", label: "Shipper", prompt: "Create a shipper label of 100x150mm" },
    { icon: "📦", label: "Product", prompt: "Design a product label 80x60mm" },
    { icon: "🏥", label: "Pharma", prompt: "Create a pharmaceutical label 70x50mm for Amoxicillin 500mg" },
    { icon: "💲", label: "Price Tag", prompt: "Make a retail price tag 50x40mm" },
    { icon: "🏭", label: "Warehouse", prompt: "Design a warehouse location label 100x60mm zone A" },
    { icon: "📬", label: "Address", prompt: "Create an address label 100x55mm" },
    { icon: "🏷️", label: "Asset Tag", prompt: "Create an asset tag 90x60mm" },
];

const MSG = { USER: "user", BOT: "bot", ERROR: "error" };
let _mc = 0;
const mid = () => `m_${Date.now()}_${++_mc}`;

// ─── Component ────────────────────────────────────────────────────────────────
const AIChatbot = ({ onGenerateElements, labelSize, generateId, onCreateLabel }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([{
        id: mid(), role: MSG.BOT, type: "welcome",
        content: "Hi! I'm your **offline AI Label Designer**. I generate professional labels without any internet connection or API key.\n\nJust describe what you need — *type, size, and any special requirements*.",
    }]);

    const [pendingDesign, setPendingDesign] = useState(null); // { elements, dimensions, isNew, type }
    const [designName, setDesignName] = useState("");
    const [designDescription, setDesignDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const textareaEl = useRef(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    // Focus on open
    useEffect(() => {
        if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 200);
    }, [isOpen, isMinimized]);

    // ─── Process prompt ──────────────────────────────────────────────────────────
    const processPrompt = useCallback((text) => {
        if (!text.trim() || isLoading) return;
        setIsLoading(true);

        // Add user message instantly
        setMessages(prev => [...prev, { id: mid(), role: MSG.USER, content: text }]);
        setInput("");
        if (textareaEl.current) textareaEl.current.style.height = "auto";

        // Small delay for natural feel
        setTimeout(() => {
            try {
                // Parse & explain
                const explanation = explainPrompt(text);

                // Generate label data (pure JS, offline)
                const labelData = generateLabel(text, labelSize);

                // Remap IDs using the canvas's generateId
                const elements = labelData.elements.map(el => ({
                    ...el,
                    id: generateId ? generateId() : el.id,
                    // Ensure all required fields for canvas rendering
                    fontStyle: el.fontStyle ?? "normal",
                    textDecoration: el.textDecoration ?? "none",
                    letterSpacing: el.letterSpacing ?? 0,
                    lineHeight: el.lineHeight ?? 1.2,
                    borderRadius: el.borderRadius ?? 0,
                    lockAspectRatio: false,
                }));

                const newSize = {
                    width: Math.round(labelData.widthMm),
                    height: Math.round(labelData.heightMm),
                    unit: "mm"
                };

                // Determine if fresh canvas or additive
                const isNew = /create|make|design|generate|build|new/i.test(text);

                if (isNew) {
                    // For new designs, we ask for metadata first
                    setPendingDesign({
                        elements,
                        dimensions: newSize,
                        isNew: true,
                        type: labelData.labelType,
                        prompt: text,
                        description: labelData.description
                    });
                    setDesignName(labelData.labelType || "AI Generated Label");
                    setDesignDescription(labelData.description || "");

                    setMessages(prev => [...prev,
                    {
                        id: mid(), role: MSG.BOT, type: "explain",
                        content: explanation,
                    },
                    {
                        id: mid(), role: MSG.BOT, type: "save_prompt",
                        labelData: {
                            type: labelData.labelType,
                            size: `${labelData.widthMm}×${labelData.heightMm}mm`,
                            elementCount: elements.length,
                        }
                    }
                    ]);
                } else {
                    // For additive changes, just apply immediately
                    onGenerateElements(elements, newSize, false);

                    // Success reply
                    setMessages(prev => [...prev,
                    {
                        id: mid(), role: MSG.BOT, type: "explain",
                        content: explanation,
                    },
                    {
                        id: mid(), role: MSG.BOT, type: "success",
                        labelData: {
                            type: labelData.labelType,
                            size: `${labelData.widthMm}×${labelData.heightMm}mm`,
                            elementCount: elements.length,
                            description: labelData.description,
                        },
                    }
                    ]);
                }
            } catch (err) {
                console.error("Label engine error:", err);
                setMessages(prev => [...prev, {
                    id: mid(), role: MSG.ERROR,
                    content: `Something went wrong: ${err.message}. Try rephrasing — e.g. "Create a shipper label 100x150mm".`,
                }]);
            } finally {
                setIsLoading(false);
            }
        }, 600); // natural generation delay
    }, [isLoading, labelSize, generateId, onGenerateElements]);

    // ─── Save Workflow ───────────────────────────────────────────────────────────
    const handleSaveDesign = async () => {
        if (!pendingDesign || !designName.trim() || isSaving) return;

        setIsSaving(true);
        try {
            // 1. Create the design record
            const createPayload = {
                name: designName.trim(),
                description: designDescription || pendingDesign.description,
                dimensions: pendingDesign.dimensions,
                status: "draft",
                category: pendingDesign.type?.toLowerCase() || "custom",
                binding_type: null
            };

            const designResult = await callEdgeFunction(API_URLS.CREATE_DESIGN, createPayload);

            if (designResult) {
                // Handle different response formats (raw object or {design: {}})
                const design = designResult.design || designResult.data || designResult;
                const designId = design.design_id || design.id;

                if (!designId) throw new Error("Server did not return a design ID");

                // 2. Add elements one by one
                // We use a simple loop for now as there's no bulk endpoint
                // We do this while the chatbot shows "Saving..."
                for (let i = 0; i < pendingDesign.elements.length; i++) {
                    const el = pendingDesign.elements[i];
                    const elementPayload = {
                        design_id: designId,
                        version_major: 0,
                        version_minor: 1,
                        element_type: el.type,
                        position_x: el.x,
                        position_y: el.y,
                        width: el.width,
                        height: el.height,
                        static_content: el.content || (el.type === "image" ? (el.src || el.content) : ""),
                        properties: {
                            ...el,
                            id: undefined, // Don't send local ID to DB properties JSON
                            fontStyle: el.fontStyle || "normal",
                            textDecoration: el.textDecoration || "none",
                            fontWeight: el.fontWeight || "normal"
                        },
                        sort_order: i
                    };
                    await callEdgeFunction(API_URLS.ADD_ELEMENT, elementPayload);
                }

                // 3. Complete process: Notify parent and switch to the new design
                if (onCreateLabel) {
                    // We pass the full design so App.jsx can normalize it
                    onCreateLabel({ ...createPayload, ...design });
                } else {
                    // Fallback to local apply if top-level creation handler missing
                    onGenerateElements(pendingDesign.elements, pendingDesign.dimensions, true);
                }

                setMessages(prev => [...prev, {
                    id: mid(), role: MSG.BOT, type: "welcome",
                    content: `✨ **Excellent!** The "${designName}" has been successfully generated and saved to your library. I've placed all ${pendingDesign.elements.length} components for you.`,
                }]);

                // Reset state
                setPendingDesign(null);
                setDesignName("");
                setDesignDescription("");
            }
        } catch (error) {
            console.error("AI Save error:", error);
            setMessages(prev => [...prev, {
                id: mid(), role: MSG.ERROR,
                content: `Failed to save design: ${error.message || "Unknown error during persistence"}`,
            }]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = () => processPrompt(input);

    const handleClear = () => {
        setMessages([{ id: mid(), role: MSG.BOT, type: "welcome", content: "Chat cleared! Describe your next label." }]);
    };

    // ─── Closed state ────────────────────────────────────────────────────────────
    if (!isOpen) {
        return (
            <button
                id="ai-chatbot-open"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[150] group overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
                title="Open AI Label Designer"
            >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                    style={{ background: "var(--color-primary)" }} />
                {/* Offline badge */}
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg border-2 border-white">
                    AI
                </div>
                <Sparkles size={26} className="group-hover:rotate-12 transition-transform relative" />
            </button>
        );
    }

    // ─── Open chat panel ──────────────────────────────────────────────────────────
    return (
        <div
            id="ai-chatbot-panel"
            className={`fixed bottom-6 right-6 w-[420px] flex flex-col rounded-3xl shadow-2xl border transition-all duration-500 z-[150] overflow-hidden ${isMinimized ? "h-[68px]" : "h-[590px]"
                }`}
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div
                className="flex-shrink-0 px-5 py-3.5 flex items-center justify-between cursor-pointer select-none"
                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                            Label AI
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                                Powered by ATPL...!
                            </span>
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">· Offline</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); handleClear(); }}
                        className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/70 hover:text-white" title="Clear chat">
                        <RefreshCw size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/70 hover:text-white">
                        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/70 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────────────── */}
            {!isMinimized && (
                <>
                    {/* Offline badge */}
                    <div className="mx-4 mt-2.5 flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Works 100% offline — no API key, no internet required
                        </span>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3"
                        style={{ backgroundColor: theme.bg }}
                    >
                        {messages.map(msg => (
                            <Bubble
                                key={msg.id}
                                msg={msg}
                                theme={theme}
                                designName={designName}
                                setDesignName={setDesignName}
                                designDescription={designDescription}
                                setDesignDescription={setDesignDescription}
                                onSave={handleSaveDesign}
                                isSaving={isSaving}
                            />
                        ))}

                        {/* Generating indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div
                                    className="px-4 py-3 rounded-2xl rounded-tl-none border flex items-center gap-2 text-xs shadow-sm"
                                    style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.textMuted }}
                                >
                                    <Cpu size={12} className="text-purple-500 animate-pulse" />
                                    <span className="italic">Generating layout…</span>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick prompts */}
                    <div
                        className="flex-shrink-0 px-4 py-2 border-t overflow-x-auto"
                        style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                    >
                        <div className="flex gap-2 scrollbar-hide" style={{ minWidth: "max-content" }}>
                            {QUICK_PROMPTS.map((qp, i) => (
                                <button
                                    key={i}
                                    onClick={() => processPrompt(qp.prompt)}
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold whitespace-nowrap transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.textMuted }}
                                >
                                    <span>{qp.icon}</span><span>{qp.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div
                        className="flex-shrink-0 p-4 border-t"
                        style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                    >
                        <div className="relative flex items-end gap-2">
                            <textarea
                                ref={(el) => { inputRef.current = el; textareaEl.current = el; }}
                                id="ai-chatbot-input"
                                value={input}
                                onChange={e => {
                                    setInput(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
                                }}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="e.g. 'Create a shipper label 100x150mm for ATPL'…"
                                rows={1}
                                disabled={isLoading}
                                className="flex-1 resize-none px-4 py-3 rounded-2xl border text-xs font-medium focus:outline-none transition-all leading-relaxed"
                                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, minHeight: "44px", maxHeight: "90px" }}
                            />
                            <button
                                id="ai-chatbot-send"
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-md"
                                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
                            >
                                {isLoading ? <Zap size={16} className="text-white animate-pulse" /> : <Send size={16} className="text-white" />}
                            </button>
                        </div>
                        <p className="text-center text-[8px] font-bold uppercase tracking-widest mt-2 opacity-40" style={{ color: theme.textMuted }}>
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const Bubble = ({ msg, theme, designName, setDesignName, designDescription, setDesignDescription, onSave, isSaving }) => {
    if (msg.role === MSG.USER) {
        return (
            <div className="flex justify-end">
                <div
                    className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-none text-xs leading-relaxed text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
                >
                    {msg.content}
                </div>
            </div>
        );
    }

    if (msg.role === MSG.ERROR) {
        return (
            <div className="flex justify-start">
                <div className="max-w-[90%] px-4 py-3 rounded-2xl rounded-tl-none border text-xs leading-relaxed bg-red-500/10 border-red-500/30 text-red-500">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={12} />
                        <span className="font-black text-[9px] uppercase tracking-wider">Error</span>
                    </div>
                    {msg.content}
                </div>
            </div>
        );
    }

    if (msg.type === "save_prompt" && msg.labelData) {
        return (
            <div className="flex justify-start w-full">
                <div className="w-full rounded-2xl rounded-tl-none border overflow-hidden shadow-lg animate-in slide-in-from-bottom-2 duration-300"
                    style={{ borderColor: "var(--color-primary)", backgroundColor: theme.surface }}>
                    <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/20">
                        <Sparkles size={14} className="text-[var(--color-primary)]" />
                        <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">New Design Found</span>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
                            <Cell icon="📐" label="Size" value={msg.labelData.size} theme={theme} />
                            <Cell icon="🔢" label="Objects" value={`${msg.labelData.elementCount}`} theme={theme} />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Label Name</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                    <input
                                        type="text"
                                        value={designName}
                                        onChange={(e) => setDesignName(e.target.value)}
                                        placeholder="e.g. My Premium Label"
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-medium outline-none focus:border-[var(--color-primary)] transition-all shadow-sm"
                                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Description</label>
                                <div className="relative">
                                    <Info className="absolute left-3 top-3 text-gray-400" size={12} />
                                    <textarea
                                        value={designDescription}
                                        onChange={(e) => setDesignDescription(e.target.value)}
                                        placeholder="Briefly describe this layout..."
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-medium outline-none focus:border-[var(--color-primary)] transition-all min-h-[60px] resize-none shadow-sm"
                                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onSave}
                            disabled={!designName.trim() || isSaving}
                            className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <><Save size={14} /> Save & Create Design</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (msg.type === "success" && msg.labelData) {
        return (
            <div className="flex justify-start w-full">
                <div className="w-full rounded-2xl rounded-tl-none border overflow-hidden shadow-sm"
                    style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Label Generated</span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 text-[10px]">
                        <Cell icon="🏷️" label="Type" value={msg.labelData.type} theme={theme} />
                        <Cell icon="📐" label="Size" value={msg.labelData.size} theme={theme} />
                        <Cell icon="🔢" label="Elements" value={`${msg.labelData.elementCount} objects`} theme={theme} />
                    </div>
                    {msg.labelData.description && (
                        <p className="px-3 pb-3 text-[10px] leading-relaxed opacity-60" style={{ color: theme.text }}>
                            {msg.labelData.description}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (msg.type === "explain") {
        return (
            <div className="flex justify-start">
                <div className="max-w-[90%] px-4 py-2.5 rounded-2xl rounded-tl-none border text-xs leading-relaxed shadow-sm"
                    style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.textMuted }}>
                    <Markdown text={msg.content} />
                </div>
            </div>
        );
    }

    // Default / welcome
    return (
        <div className="flex justify-start gap-2 items-end">
            <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mb-1 opacity-20"
                style={{ backgroundColor: "var(--color-primary)" }}>
                <Sparkles size={10} style={{ color: "var(--color-primary)" }} />
            </div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-none border text-xs leading-relaxed shadow-sm"
                style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}>
                <Markdown text={msg.content} />
            </div>
        </div>
    );
};

// ─── Simple Markdown ──────────────────────────────────────────────────────────
const Markdown = ({ text = "" }) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return (
        <span>
            {parts.map((p, i) =>
                p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> :
                    p.startsWith("*") && p.endsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> :
                        p.startsWith("`") && p.endsWith("`") ? <code key={i} className="bg-black/10 px-1 rounded font-mono">{p.slice(1, -1)}</code> :
                            <span key={i}>{p}</span>
            )}
        </span>
    );
};

// ─── Info Cell ────────────────────────────────────────────────────────────────
const Cell = ({ icon, label, value, theme }) => (
    <div className="px-2.5 py-2 rounded-xl" style={{ backgroundColor: theme.bg }}>
        <div className="text-[8px] uppercase tracking-widest font-bold mb-0.5" style={{ color: theme.textMuted }}>
            {icon} {label}
        </div>
        <div className="font-black truncate text-[11px]" style={{ color: theme.text }}>{value}</div>
    </div>
);

export default AIChatbot;
