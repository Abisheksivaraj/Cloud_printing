import React, { useState } from "react";
import { 
  FileText, Minus, Table, Square, Image as ImageIcon, 
  Search, Palette, Type, QrCode, Eraser, Smile, Barcode
} from "lucide-react";
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
  onActivateImageDrawing,
  isDrawingImage,
  onActivateTableDrawing,
  isDrawingTable,
  currentShapeType,
  onDeleteElement,
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
      color: "#3b82f6" // Blue
    },
    { id: "line", icon: Minus, label: "Line", type: "line", special: "line", color: "#f59e0b" }, // Amber
    {
      id: "barcode",
      icon: Barcode,
      label: "Barcode",
      type: "barcode",
      special: "barcode",
      color: "#6366f1" // Indigo
    },
    {
        id: "qr",
        icon: QrCode,
        label: "QR Code",
        type: "barcode",
        options: { barcodeType: "QR" },
        color: "#8b5cf6" // Violet
    },
    {
      id: "shape",
      icon: Square,
      label: "Shape",
      type: "shape",
      special: "shape",
      color: "#10b981" // Emerald
    },
    {
      id: "image",
      icon: ImageIcon,
      label: "Image",
      type: "image",
      draggable: false,
      color: "#ec4899" // Pink
    },
    { id: "table", icon: Table, label: "Table", type: "table", color: "#06b6d4" }, // Cyan
    {
        id: "eraser",
        icon: Eraser,
        label: "Eraser",
        type: "eraser",
        color: "#ef4444" // Red
    }
  ];

  const handleClick = (tool) => {
    if (tool.id === "eraser") {
        if (onDeleteElement) onDeleteElement();
        return;
    }

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

    if (tool.special === "barcode" || tool.id === "qr") {
      if (onActivateBarcodeDrawing) onActivateBarcodeDrawing(tool.options?.barcodeType || "CODE128");
      setSelectedTool(tool.id);
      if (onToolSelect) onToolSelect(tool.id);
      return;
    }

    if (tool.special === "shape") {
      setSelectedTool("shape");
      if (onToolSelect) onToolSelect("shape");
      return;
    }

    if (tool.type === "image") {
      if (onActivateImageDrawing) onActivateImageDrawing();
      setSelectedTool("image");
      if (onToolSelect) onToolSelect("image");
      return;
    }

    if (tool.type === "table") {
      if (onActivateTableDrawing) onActivateTableDrawing();
      setSelectedTool("table");
      if (onToolSelect) onToolSelect("table");
      return;
    }

    onAddElement(tool.type, tool.options || {});
    setSelectedTool(null);
    if (onToolSelect) onToolSelect(null);
  };

  return (
    <div
      className="w-24 flex flex-col items-center py-6 z-30 transition-all duration-500 border-r border-slate-200 shadow-sm relative"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        height: "calc(100vh - 0px)",
      }}
    >
      {/* Decorative vertical line */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

      <div className="mb-6 group cursor-default">
         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform duration-500">
            <Palette size={18} className="text-white" />
         </div>
      </div>

      <div className="grid grid-cols-2 gap-x-1 gap-y-5 flex-1 px-1.5 w-full items-start overflow-hidden">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected =
            (tool.special === "text" && isDrawingText) ||
            (tool.special === "line" && isDrawingLine) ||
            ((tool.special === "barcode" || tool.id === "qr") && isDrawingBarcode && selectedBarcodeType === (tool.options?.barcodeType || "CODE128")) ||
            (tool.special === "shape" && isDrawingShape) ||
            (tool.type === "image" && isDrawingImage) ||
            (tool.type === "table" && isDrawingTable) ||
            selectedTool === tool.type;

          const toolColor = tool.color || '#64748b';

          return (
            <div key={tool.id} className="relative group flex flex-col items-center">
                {isSelected && (
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full shadow-[4px_0_15px_rgba(59,130,246,0.3)] animate-in slide-in-from-left duration-300" style={{ backgroundColor: toolColor }} />
                )}
                
                <button
                onClick={() => handleClick(tool)}
                className={`
                    flex flex-col items-center gap-1 group transition-all duration-300 outline-none
                    ${isSelected 
                        ? 'scale-110' 
                        : 'text-slate-500 hover:scale-110'
                    }
                `}
                >
                <div 
                  className={`
                      w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300
                      ${isSelected 
                          ? 'shadow-inner' 
                          : 'bg-slate-100/50 hover:bg-white border border-slate-200'
                      }
                  `}
                  style={{
                    backgroundColor: isSelected ? `${toolColor}15` : undefined,
                    borderColor: isSelected ? `${toolColor}40` : undefined,
                  }}
                >
                    {Icon ? (
                        <Icon size={14} style={{ color: isSelected ? toolColor : toolColor + 'CC' }} className="transition-colors group-hover:opacity-100" />
                    ) : (
                        <span className="text-xs leading-none">{tool.emoji || '•'}</span>
                    )}
                </div>
                <span 
                  className={`text-[7px] font-black uppercase tracking-tight text-center transition-opacity leading-tight max-w-[40px] truncate ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                  style={{ color: isSelected ? toolColor : '#64748b' }}
                >
                    {tool.label}
                </span>
                </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsPalette;
