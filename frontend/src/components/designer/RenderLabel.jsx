import React from "react";
import BarcodeElement from "./code";
import { convertToPx } from "../../supabaseClient";

/* =========================
   RENDER LABEL - SHARED COMPONENT
   ========================= */
const RenderLabel = ({ label, noBorder = false }) => {
  const width = label.labelSize?.width || 100;
  const height = label.labelSize?.height || 80;
  const unit = label.labelSize?.unit || 'mm';

  // Use canvas_width if available (legacy), otherwise use unit conversion
  const labelW = label.settings?.canvas_width || convertToPx(width, unit);
  const labelH = label.settings?.canvas_width 
    ? (label.settings.canvas_width * (height / width)) 
    : convertToPx(height, unit);

  return (
    <div
      className="render-label-container"
      style={{
        width: `${labelW}px`,
        height: `${labelH}px`,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        border: noBorder ? "none" : "1px solid #000000",
        backgroundColor: "#ffffff",
      }}
    >
      {(label.elements || []).map((element, elIndex) => {
        // Elements are already normalized to pixels in supabaseClient.js
        const style = {
          position: "absolute",
          left: `${element.x || 0}px`,
          top: `${element.y || 0}px`,
          width: `${element.width || 0}px`,
          height: `${element.height || 0}px`,
          fontSize: `${element.fontSize || 14}px`,
          fontFamily: element.fontFamily || "Arial",
          fontWeight: element.fontWeight || "normal",
          fontStyle: element.fontStyle || "normal",
          textAlign: element.textAlign || "left",
          color: element.color || "#000000",
          backgroundColor: element.backgroundColor || "transparent",
          borderWidth: `${element.borderWidth || 0}px`,
          borderColor: element.borderColor || "#000000",
          borderStyle: (element.borderWidth > 0) ? (element.borderStyle || "solid") : "none",
          borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
          boxSizing: "border-box",
          transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        };

        // Handle different element types
        if (element.type === "text" || element.type === "placeholder") {
          return (
            <div
              key={elIndex}
              style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  element.textAlign === "center"
                    ? "center"
                    : element.textAlign === "right"
                      ? "flex-end"
                      : "flex-start",
                padding: "0 4px",
                lineHeight: "1.2",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {element.resolved_content || element.content}
              </span>
            </div>
          );
        }

        if (element.type === "barcode") {
          return (
            <div
              key={elIndex}
              style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                padding: 0,
              }}
            >
              <BarcodeElement element={element} />
            </div>
          );
        }

        if (element.type === "line") {
          const x1 = element.x1 !== undefined ? element.x1 : element.x;
          const y1 = element.y1 !== undefined ? element.y1 : element.y;
          const x2 =
            element.x2 !== undefined ? element.x2 : element.x + element.width;
          const y2 =
            element.y2 !== undefined ? element.y2 : element.y + element.height;

          return (
            <svg
              key={elIndex}
              style={{
                position: "absolute",
                left: Math.min(x1, x2),
                top: Math.min(y1, y2),
                width: Math.max(1, Math.abs(x2 - x1)),
                height: Math.max(1, Math.abs(y2 - y1)),
                overflow: "visible",
              }}
            >
              <line
                x1={x1 < x2 ? 0 : Math.abs(x2 - x1)}
                y1={y1 < y2 ? 0 : Math.abs(y2 - y1)}
                x2={x1 < x2 ? Math.abs(x2 - x1) : 0}
                y2={y1 < y2 ? Math.abs(y2 - y1) : 0}
                stroke={element.borderColor || "#000000"}
                strokeWidth={element.borderWidth || 2}
                strokeDasharray={
                  element.borderStyle === "dashed"
                    ? "5,5"
                    : element.borderStyle === "dotted"
                      ? "2,2"
                      : "none"
                }
              />
            </svg>
          );
        }

        if (element.type === "image") {
          return (
            <div key={elIndex} style={style}>
              <img
                src={element.src}
                crossOrigin="anonymous"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                }}
              />
            </div>
          );
        }

        if (element.type === "rectangle" || element.type === "square") {
          return <div key={elIndex} style={style}></div>;
        }

        if (element.type === "circle" || element.type === "ellipse") {
          return (
            <div key={elIndex} style={{ ...style, borderRadius: "50%" }}></div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default RenderLabel;
