import React, { useState } from "react";
import { FileText, Minus, Table, Square, Image as ImageIcon } from "lucide-react";
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
      icon: FileText,
      label: "Text",
      type: "text",
      special: "text",   // ← now activates draw mode
    },
    { id: "line", icon: Minus, label: "Line", type: "line", special: "line" },
    { id: "table", icon: Table, label: "Table", type: "table" },
    {
      id: "barcode",
      emoji: "📊",
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
      if (onToolSelect) onToolSelect("text"); // expand properties panel
      return;
    }

    if (tool.special === "line") {
      onActivateLineDrawing();
      setSelectedTool("line"); // highlight the button only
      // Do NOT expand properties panel — it opens after the line is drawn
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

    // image — clicking adds directly, no need to keep panel open
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
      className="w-20 border-r flex flex-col py-6 shadow-lg z-20 transition-colors duration-200"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        height: "calc(100vh - 64px)",
      }}
    >
      <div
        className="text-[10px] font-bold text-center mb-6 tracking-widest uppercase opacity-60"
        style={{ color: theme.textMuted }}
      >
        Tools
      </div>

      <div className="flex flex-col space-y-4 px-3 items-center">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected =
            (tool.special === "text" && isDrawingText) ||
            (tool.special === "line" && isDrawingLine) ||
            (tool.special === "barcode" && isDrawingBarcode) ||
            (tool.special === "shape" && isDrawingShape) ||
            selectedTool === tool.type;

          return (
            <button
              key={tool.id}
              onClick={() => handleClick(tool)}
              draggable={tool.draggable}
              onDragStart={(e) => handleDragStart(e, tool)}
              className={`
                group relative w-14 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200
                ${isSelected
                  ? 'bg-[var(--color-primary)] text-white shadow-md scale-105'
                  : 'hover:bg-[var(--color-bg-main)] hover:scale-105 text-gray-500 dark:text-gray-400'
                }
                ${tool.draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
              `}
              title={tool.special === "text" ? "Click then drag on canvas to draw text box" : tool.special ? `Click to activate ${tool.label}` : `Click to add ${tool.label}`}
            >
              {Icon ? (
                <Icon size={18} strokeWidth={1.75} />
              ) : (
                <span className="text-lg leading-none">{tool.emoji}</span>
              )}
              <span className="text-[9px] font-bold leading-none opacity-80">{tool.label}</span>

              {/* Tooltip */}
              <span className={`
                absolute left-16 px-2 py-1 rounded-lg bg-gray-900 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl
                ${isSelected ? 'hidden' : ''}
              `}>
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsPalette;
