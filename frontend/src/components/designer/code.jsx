import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import bwipjs from "bwip-js";

export const BarcodeElement = ({ element }) => {
  const barcodeRef = useRef(null);
  const canvasRef = useRef(null);

  const barcodeTypes = [
    // 1D Barcodes
    { value: "CODE128", label: "Code 128", library: "jsbarcode" },
    { value: "CODE39", label: "Code 39", library: "jsbarcode" },
    { value: "EAN13", label: "EAN-13", library: "bwip" },
    { value: "ITF", label: "ITF (I2of5)", library: "bwip" },
    { value: "CODE93", label: "Code 93", library: "bwip" },
    { value: "DATABAR", label: "Databar Expanded", library: "bwip" },
    // 2D Codes
    { value: "QR", label: "QR Code", library: "qrcode" },
    { value: "DATAMATRIX", label: "Data Matrix", library: "bwip" },
    { value: "PDF417", label: "PDF417", library: "bwip" },
    { value: "AZTEC", label: "Aztec Code", library: "bwip" },
  ];

  useEffect(() => {
    const barcodeType = barcodeTypes.find(
      (t) => t.value === element.barcodeType,
    );
    if (!barcodeType) return;

    const combinedValue = element.content
      ? element.content
        .split("\n")
        .filter((line) => line.trim())
        .join(" ")
      : "123456789";

    try {
      if (barcodeType.library === "jsbarcode" && barcodeRef.current) {
        // Clear previous barcode
        barcodeRef.current.innerHTML = "";

        const containerWidth = element.width || 200;
        const containerHeight = element.height || 100;

        // Create SVG element
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        barcodeRef.current.appendChild(svg);

        // Calculate appropriate settings
        const barcodeHeight = containerHeight * 0.7;
        const fontSize = Math.max(10, containerHeight * 0.12);

        // Generate barcode with fallback logic
        const generateBarcode = (value, format) => {
          try {
            // Sanitize for CODE39 if needed
            let finalValue = value;
            if (format === "CODE39") {
              finalValue = value.toUpperCase().replace(/[^0-9A-Z\-.$ \/+%]/g, " ");
            }

            JsBarcode(svg, finalValue, {
              format: format || "CODE128",
              width: element.barcodeWidth || 2,
              height: barcodeHeight,
              displayValue: true,
              fontSize: fontSize,
              margin: 0,
              background: "transparent",
              lineColor: "#000000",
            });
            return true;
          } catch (e) {
            return false;
          }
        };

        const success = generateBarcode(combinedValue, element.barcodeType || "CODE128");

        // If it failed, try CODE128 as fallback
        if (!success && element.barcodeType !== "CODE128") {
          console.warn(`Barcode format ${element.barcodeType} failed for value "${combinedValue}", falling back to CODE128`);
          generateBarcode(combinedValue, "CODE128");
        }

        // Get the generated barcode dimensions
        const bbox = svg.getBBox();
        const barcodeWidth = bbox.width;
        const barcodeFullHeight = bbox.height;

        // Calculate scale to fit in container
        const scaleX = containerWidth / barcodeWidth;
        const scaleY = containerHeight / barcodeFullHeight;
        const scale = Math.min(scaleX, scaleY);

        // Apply dimensions and scaling
        svg.setAttribute("width", containerWidth);
        svg.setAttribute("height", containerHeight);

        // Center the barcode
        const offsetX = (containerWidth - barcodeWidth * scale) / 2;
        const offsetY = (containerHeight - barcodeFullHeight * scale) / 2;

        svg.setAttribute(
          "viewBox",
          `${-offsetX / scale} ${-offsetY / scale} ${containerWidth / scale} ${containerHeight / scale}`,
        );
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      } else if (barcodeType.library === "bwip" && barcodeRef.current) {
        const containerWidth = element.width || 200;
        const containerHeight = element.height || 100;

        // Map internal types to bwip bcid
        const bcidMap = {
          ITF: 'interleaved2of5',
          CODE93: 'code93',
          DATABAR: 'databarexpanded',
          DATAMATRIX: 'datamatrix',
          PDF417: 'pdf417',
          AZTEC: 'aztec'
        };

        try {
          if (!combinedValue) throw new Error("No data provided");

          // Map internal types to bwip bcid (standard names)
          const bcidMap = {
            ITF: 'interleaved2of5',
            CODE93: 'code93',
            DATABAR: 'databarexpanded',
            DATAMATRIX: 'datamatrix',
            PDF417: 'pdf417',
            AZTEC: 'azteccode',
            EAN13: 'ean13',
          };

          const bcid = bcidMap[element.barcodeType];
          if (!bcid) throw new Error(`Unsupported symbology: ${element.barcodeType}`);

          // Generator function to allow fallbacks
          const generateSymbol = (symId) => {
            const isEan13 = symId === 'ean13';
            const is2D = ['azteccode', 'datamatrix', 'pdf417', 'qrcode'].includes(symId);
            const isGs1 = ['databarexpanded', 'datamatrix', 'pdf417'].includes(symId);
            
            const opts = {
                bcid: symId,
                text: combinedValue,
                scale: 3,
                // Hide text for 2D codes by default as requested
                includetext: isEan13 || (element.showBarcodeText && !is2D),
                alttext: combinedValue,
                guardwhitespace: isEan13,
                parse: isGs1, // Enable GS1 parsing for expanded symbologies
            };
            
            // Only add textxalign if it's not EAN-13 to avoid BWIPP undefined error
            if (!isEan13) {
              opts.textxalign = 'center';
            }
            
            return bwipjs.toSVG(opts);
          };

          let svgContent;
          try {
            svgContent = generateSymbol(bcid);
          } catch (firstErr) {
            // Fallback for Aztec if 'azteccode' fails, try 'aztec' (and vice versa)
            if (element.barcodeType === 'AZTEC') {
               const fallbackId = bcid === 'azteccode' ? 'aztec' : 'azteccode';
               svgContent = generateSymbol(fallbackId);
            } else {
               throw firstErr;
            }
          }

          barcodeRef.current.innerHTML = svgContent;
          const svg = barcodeRef.current.querySelector('svg');
          if (svg) {
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svg.style.backgroundColor = 'transparent';
          }
        } catch (e) {
          console.error("BWIP-JS Error Details:", e);
          const errorMsg = e.message || "Invalid Data";
          barcodeRef.current.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-red-500 bg-red-50/30 p-2 rounded border border-red-100">
            <span class="text-[8px] font-black uppercase mb-1">Symbology Error</span>
            <span class="text-[7px] font-bold text-center leading-tight uppercase opacity-70">${errorMsg}</span>
          </div>`;
        }
      }
    } catch (error) {
      console.error("Barcode generation error:", error);
    }
  }, [
    element.content,
    element.barcodeType,
    element.barcodeWidth,
    element.barcodeHeight,
    element.width,
    element.height,
  ]);

  const barcodeType = barcodeTypes.find((t) => t.value === element.barcodeType);
  const combinedValue = element.content
    ? element.content
      .split("\n")
      .filter((line) => line.trim())
      .join(" ")
    : "123456789";

  if (barcodeType?.library === "qrcode") {
    // Calculate QR code size to fit container with some padding
    const qrSize = Math.min(element.width - 10, element.height - 10);

    return (
      <div className="flex items-center justify-center w-full h-full">
        <QRCodeSVG
          value={combinedValue}
          size={qrSize}
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </div>
    );
  }



  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative" style={{ overflow: "hidden" }}>
      {element.showBarcodeLabel && (
        <span 
          className="text-[10px] font-black uppercase tracking-widest mb-1 select-none"
          style={{ 
            color: element.barcodeLabelColor || "#3b82f6", // Default blue like user's image
            fontSize: `${(element.fontSize || 14) * 0.8}px`
          }}
        >
          {barcodeType?.label === "QR Code" ? "QR" : (barcodeType?.label || "Symbol")}
        </span>
      )}
      <div
        ref={barcodeRef}
        className="flex-1 w-full flex items-center justify-center overflow-hidden"
      />
    </div>
  );
};

export default BarcodeElement;
