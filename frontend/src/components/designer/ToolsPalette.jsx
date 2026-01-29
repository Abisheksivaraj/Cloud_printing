import React, { useState } from "react";
import { FileText, Minus, Table, Square } from "lucide-react";
import { brandColors } from "../../brandColors";

const ToolsPalette = ({
  onAddElement,
  onActivateLineDrawing,
  isDrawingLine,
  onDragStart,
  onToolSelect,
  onActivateBarcodeDrawing,
  isDrawingBarcode,
  onActivateShapeDrawing, // ✅ NEW: Shape drawing activation
  isDrawingShape, // ✅ NEW: Shape drawing state
  currentShapeType, // ✅ NEW: Current shape being drawn
}) => {
  const [selectedTool, setSelectedTool] = useState(null);

  const tools = [
    {
      id: "text",
      icon: FileText,
      label: "Text",
      type: "text",
      draggable: true,
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
      emoji: "🖼️",
      label: "Image",
      type: "image",
      draggable: true,
    },
    {
      id: "shape",
      icon: Square,
      label: "Shape",
      type: "shape",
      special: "shape", // ✅ NEW: Make shape a special tool for drawing mode
    },
  ];

  const handleClick = (tool) => {
    // ✅ Handle special tools (line, barcode, and shape)
    if (tool.special === "line") {
      onActivateLineDrawing();
      setSelectedTool(null);
      return;
    }

    if (tool.special === "barcode") {
      onActivateBarcodeDrawing();
      setSelectedTool(null);
      return;
    }

    if (tool.special === "shape") {
      // ✅ NEW: Activate shape drawing mode - opens shape selector in properties panel
      setSelectedTool("shape");
      if (onToolSelect) {
        onToolSelect("shape");
      }
      return;
    }

    // Set selected tool for table
    if (tool.type === "table") {
      setSelectedTool(tool.type);
      if (onToolSelect) {
        onToolSelect(tool.type);
      }
      return;
    }

    // For draggable items, clicking also adds them
    if (tool.draggable) {
      onAddElement(tool.type);
      setSelectedTool(null);
      if (onToolSelect) {
        onToolSelect(null);
      }
    }
  };

  const handleDragStart = (e, tool) => {
    if (tool.draggable) {
      e.dataTransfer.effectAllowed = "copy";
      onDragStart(tool.type);
    }
  };

  return (
    <div
      className="w-24 bg-white border-r flex flex-col py-6 shadow-lg"
      style={{
        position: "sticky",
        top: "64px",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      <div
        className="text-xs font-bold text-center mb-6 tracking-wider"
        style={{ color: brandColors.darkGray }}
      >
        TOOLS
      </div>

      <div className="flex flex-col space-y-3 px-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected =
            (tool.special === "line" && isDrawingLine) ||
            (tool.special === "barcode" && isDrawingBarcode) ||
            (tool.special === "shape" && isDrawingShape) || // ✅ NEW: Highlight when drawing shape
            selectedTool === tool.type;

          return (
            <button
              key={tool.id}
              onClick={() => handleClick(tool)}
              draggable={tool.draggable && !tool.special}
              onDragStart={(e) => handleDragStart(e, tool)}
              className={`p-3 rounded-xl border-2 flex flex-col items-center space-y-2 transition-all hover:scale-105 ${
                tool.draggable && !tool.special
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-pointer"
              }`}
              style={{
                borderColor: isSelected
                  ? brandColors.primaryPink
                  : brandColors.lightGray,
                backgroundColor: isSelected
                  ? brandColors.lightPink
                  : brandColors.white,
              }}
              title={`${tool.special ? "Click to draw " : tool.draggable ? "Click or drag to add " : "Click to add "}${tool.label}`}
            >
              {Icon ? (
                <Icon size={22} style={{ color: brandColors.darkGray }} />
              ) : (
                <div className="text-2xl">{tool.emoji}</div>
              )}

              <span
                className="text-xs font-semibold"
                style={{ color: brandColors.darkGray }}
              >
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
