import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, X, Minimize2, Maximize2, Terminal, Cpu, Zap } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const AIChatbot = ({ onGenerateElements, labelSize, generateId }) => {
    const { isDarkMode, theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "System initialized. I am your Label AI Architect. Describe the label you need, and I will construct the design tokens.",
            type: "text"
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const MM_TO_PX = 3.7795275591;

    const simulateAIGeneration = (prompt) => {
        setIsTyping(true);

        setTimeout(() => {
            const lowerPrompt = prompt.toLowerCase();
            let newElements = [];
            let response = "";

            // Determine if we should start fresh
            const isNewRequest = lowerPrompt.includes("create") || lowerPrompt.includes("new") || lowerPrompt.includes("design a");
            const shouldAlign = lowerPrompt.includes("align") || lowerPrompt.includes("center") || lowerPrompt.includes("proper");

            // 1. Detect Size (e.g. 100x50mm)
            const sizeMatch = lowerPrompt.match(/(\d+)\s*x\s*(\d+)\s*mm/);
            const widthMm = sizeMatch ? parseInt(sizeMatch[1]) : labelSize.width;
            const heightMm = sizeMatch ? parseInt(sizeMatch[2]) : labelSize.height;
            const widthPx = widthMm * MM_TO_PX;
            const heightPx = heightMm * MM_TO_PX;

            if (sizeMatch) {
                response += `Calibrating spatial grid to ${widthMm}x${heightMm}mm. `;
            }

            let currentY = 20;
            const padding = 15;

            // 2. Detect Header / Company Name
            const headerMatch = prompt.match(/(?:header as|company name|title|brand)\s*["']?([^"'\n,.]+)?["']?/i);
            let companyName = "ATPL"; // Default if mentioned but not specified
            if (headerMatch && headerMatch[1]) {
                companyName = headerMatch[1].trim();
            } else if (lowerPrompt.includes("atpl")) {
                companyName = "ATPL";
            }

            if (lowerPrompt.includes("header") || lowerPrompt.includes("title") || lowerPrompt.includes("atpl")) {
                newElements.push({
                    id: generateId(),
                    type: "text",
                    x: shouldAlign ? (widthPx - (widthPx - 40)) / 2 : 20,
                    y: currentY,
                    width: widthPx - 40,
                    height: 40,
                    content: companyName.toUpperCase(),
                    fontSize: 24,
                    fontFamily: "Arial",
                    textAlign: shouldAlign ? "center" : "left",
                    color: isDarkMode ? "#39A3DD" : "#2E82B1",
                    zIndex: 10,
                    fontWeight: "black"
                });
                currentY += 45 + padding;
                response += `Strategic header "${companyName}" deployed. `;
            }

            // 3. Detect Line / Separator
            if (lowerPrompt.includes("line") || lowerPrompt.includes("separator")) {
                newElements.push({
                    id: generateId(),
                    type: "rectangle",
                    x: 40,
                    y: currentY,
                    width: widthPx - 80,
                    height: 2,
                    backgroundColor: isDarkMode ? "#475569" : "#38474F",
                    zIndex: 5
                });
                currentY += 10 + padding;
                response += "Layout vector injected. ";
            }

            // 4. Detect Barcode
            if (lowerPrompt.includes("barcode")) {
                const bcWidth = 200;
                const bcHeight = 80;
                newElements.push({
                    id: generateId(),
                    type: "barcode",
                    x: shouldAlign ? (widthPx - bcWidth) / 2 : 20,
                    y: currentY,
                    width: bcWidth,
                    height: bcHeight,
                    content: "1234567890",
                    barcodeType: "CODE128",
                    zIndex: 8
                });
                currentY += bcHeight + padding;
                response += "Standard barcode module synthesized. ";
            }

            // 5. Detect QR Code
            if (lowerPrompt.includes("qr")) {
                const qrSize = 100;
                newElements.push({
                    id: generateId(),
                    type: "barcode",
                    x: shouldAlign ? (widthPx - qrSize) / 2 : (widthPx - qrSize - 20),
                    y: lowerPrompt.includes("barcode") ? currentY - 110 : currentY, // Move beside barcode if it exists
                    width: qrSize,
                    height: qrSize,
                    content: "https://atplgroup.com",
                    barcodeType: "QR",
                    zIndex: 8
                });
                if (!lowerPrompt.includes("barcode")) currentY += qrSize + padding;
                response += "QR module initialized. ";
            }

            // 6. Detect Details/Address
            if (lowerPrompt.includes("details") || lowerPrompt.includes("info") || lowerPrompt.includes("address")) {
                newElements.push({
                    id: generateId(),
                    type: "text",
                    x: 20,
                    y: currentY,
                    width: widthPx - 40,
                    height: 50,
                    content: "VERIFIED INDUSTRIAL UNIT 4\nCLOUD SOLUTIONS PARK\nREGION BETA",
                    fontSize: 9,
                    textAlign: shouldAlign ? "center" : "left",
                    color: theme.textMuted,
                    zIndex: 4,
                    fontFamily: "monospace"
                });
                currentY += 60;
                response += "Metadata block added. ";
            }

            if (newElements.length === 0) {
                response = "Prompt received. Initiating general structural blueprint.";
                newElements = [
                    {
                        id: generateId(),
                        type: "text",
                        x: 20,
                        y: 20,
                        width: widthPx - 40,
                        height: 30,
                        content: "SYSTEM_GEN_BLOCK",
                        fontSize: 14,
                        textAlign: "center",
                        zIndex: 1
                    }
                ];
            }

            setMessages(prev => [...prev, { role: "assistant", content: response, type: "text" }]);
            if (newElements.length > 0) {
                // Pass a flag if we should clear existing elements
                onGenerateElements(newElements, { width: widthMm, height: heightMm }, isNewRequest);
                setMessages(prev => [...prev, { role: "assistant", content: `Architecture ${isNewRequest ? 'reset and' : ''} deployed successfully.`, type: "system" }]);
            }
            setIsTyping(false);
        }, 1500);
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input, type: "text" };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        simulateAIGeneration(input);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-[#39A3DD] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[150] group"
            >
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">1</div>
                <Bot size={28} className="group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-8 right-8 w-96 flex flex-col rounded-[2.5rem] shadow-2xl border transition-all duration-500 z-[150] overflow-hidden ${isMinimized ? 'h-20' : 'h-[550px]'
                }`}
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-[#39A3DD] to-[#2E82B1] text-white" style={{ borderColor: theme.border }}>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Cpu size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Label Oracle</h3>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                            <span className="text-[10px] font-bold text-white/70 uppercase">Neural Link Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
                        style={{ backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }}
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-[#39A3DD] text-white rounded-tr-none'
                                        : msg.type === 'system'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20 w-full text-center font-black uppercase tracking-tighter'
                                            : 'bg-white/5 border text-current rounded-tl-none'
                                        }`}
                                    style={{
                                        backgroundColor: msg.role === 'user' ? undefined : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                                        borderColor: theme.border
                                    }}
                                >
                                    {msg.role === 'assistant' && msg.type !== 'system' && (
                                        <div className="flex items-center space-x-2 mb-2 text-[#39A3DD]">
                                            <Terminal size={14} />
                                            <span className="font-black uppercase tracking-widest text-[8px]">Processor Outcome</span>
                                        </div>
                                    )}
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div
                                    className="p-4 rounded-2xl bg-white/5 border rounded-tl-none flex items-center space-x-2 shadow-sm"
                                    style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: theme.border }}
                                >
                                    <Zap size={14} className="text-[#39A3DD] animate-bounce" />
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t" style={{ borderColor: theme.border }}>
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Send a design prompt..."
                                className="w-full pl-4 pr-12 py-4 rounded-2xl border-2 border-transparent focus:outline-none transition-all text-xs font-bold shadow-sm"
                                style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#39A3DD] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="flex items-center justify-center space-x-2 mt-4 text-[8px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>
                            <Sparkles size={10} />
                            <span>AI Augmented Design Engine v4.0</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChatbot;
