import React, { useState } from "react";
import { FileText, Minus, Table, Square, Image as ImageIcon, Search, Palette, Type } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const ToolsPalette = ({
  onAddElement,
  onActivateLineDrawing,
  isDrawingLine,
  onActivateTextDrawing,
  isDrawingText,
  onDragStart,
  onToolSelect,
  onActivateBarcodeDrawing,
  isDrawingBarcode,
  selectedBarcodeType,
  onActivateShapeDrawing,
  isDrawingShape,
  currentShapeType,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [selectedTool, setSelectedTool] = useState(null);

  const tools = [
    {
      id: "text",
      icon: Type,
      label: "Text",
      type: "text",
      special: "text",
    },
    { id: "line", icon: Minus, label: "Line", type: "line", special: "line" },
    { id: "table", icon: Table, label: "Table", type: "table" },
    {
      id: "barcode",
      icon: Search,
      label: "Barcode",
      type: "barcode",
      special: "barcode",
    },
    {
      id: "image",
      icon: ImageIcon,
      label: "Image",
      type: "image",
      draggable: false,
    },
    {
      id: "shape",
      icon: Square,
      label: "Shape",
      type: "shape",
      special: "shape",
    },
  ];

  const handleClick = (tool) => {
    if (tool.special === "text") {
      if (onActivateTextDrawing) onActivateTextDrawing();
      setSelectedTool("text");
      if (onToolSelect) onToolSelect("text");
      return;
    }

    if (tool.special === "line") {
      onActivateLineDrawing();
      setSelectedTool("line");
      return;
    }

    if (tool.special === "barcode") {
      setSelectedTool("barcode");
      if (onToolSelect) onToolSelect("barcode");
      return;
    }

    if (tool.special === "shape") {
      setSelectedTool("shape");
      if (onToolSelect) onToolSelect("shape");
      return;
    }

    if (tool.type === "table") {
      setSelectedTool(tool.type);
      if (onToolSelect) onToolSelect(tool.type);
      return;
    }

    onAddElement(tool.type);
    setSelectedTool(null);
    if (onToolSelect) onToolSelect(null);
  };

  const handleDragStart = (e, tool) => {
    if (tool.draggable) {
      e.dataTransfer.effectAllowed = "copy";
      onDragStart(tool.type);
    }
  };

  return (
    <div
      className="w-24 flex flex-col items-center py-8 z-30 transition-all duration-500 border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.1)] relative"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        height: "calc(100vh - 0px)",
      }}
    >
      {/* Decorative vertical line */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

      <div className="mb-10 group cursor-default">
         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform duration-500">
            <Palette size={24} className="text-white" />
         </div>
      </div>

      <div className="flex flex-col space-y-6 flex-1 px-4 w-full items-center">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected =
            (tool.special === "text" && isDrawingText) ||
            (tool.special === "line" && isDrawingLine) ||
            (tool.special === "barcode" && isDrawingBarcode) ||
            (tool.special === "shape" && isDrawingShape) ||
            selectedTool === tool.type;

          return (
            <div key={tool.id} className="relative group w-full flex justify-center">
                {isSelected && (
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-r-full shadow-[4px_0_15px_rgba(59,130,246,0.6)] animate-in slide-in-from-left duration-300" />
                )}
                
                <button
                onClick={() => handleClick(tool)}
                className={`
                    flex flex-col items-center gap-2 group transition-all duration-300 outline-none
                    ${isSelected 
                        ? 'text-blue-400 scale-110' 
                        : 'text-slate-500 hover:text-slate-200 hover:scale-105'
                    }
                `}
                >
                <div className={`
                    w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300
                    ${isSelected 
                        ? 'bg-blue-500/20 shadow-inner' 
                        : 'bg-slate-800/40 hover:bg-slate-800 border border-white/5'
                    }
                `}>
                    {Icon ? (
                        <Icon size={20} className={isSelected ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-100'} />
                    ) : (
                        <span className="text-lg leading-none">{tool.emoji || '•'}</span>
                    )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                    {tool.label}
                </span>
                </button>

                {/* Vertical Mode Indicator Tooltip */}
                <span className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 pointer-events-none z-50 shadow-2xl border border-white/10 whitespace-nowrap">
                    {tool.label} Mode
                </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
              <span className="text-[10px] font-black">AI</span>
          </div>
      </div>
    </div>
  );
};

export default ToolsPalette;
