import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import bwipjs from "bwip-js";

export const BarcodeElement = ({ element }) => {
  const barcodeRef = useRef(null);
  const canvasRef = useRef(null);

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128", library: "jsbarcode" },
    { value: "CODE39", label: "Code 39", library: "jsbarcode" },
    { value: "EAN13", label: "EAN-13", library: "jsbarcode" },
    { value: "QR", label: "QR Code", library: "qrcode" },
    { value: "DATAMATRIX", label: "Data Matrix", library: "bwip" },
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

        // Generate barcode
        JsBarcode(svg, combinedValue, {
          format: element.barcodeType || "CODE128",
          width: element.barcodeWidth || 2,
          height: barcodeHeight,
          displayValue: true,
          fontSize: fontSize,
          margin: 0,
          background: "transparent",
          lineColor: "#000000",
        });

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
      } else if (barcodeType.library === "bwip" && canvasRef.current) {
        const containerWidth = element.width || 200;
        const containerHeight = element.height || 100;

        // Calculate appropriate scale
        const scale = Math.max(
          2,
          Math.min(containerWidth, containerHeight) / 50,
        );

        bwipjs.toCanvas(canvasRef.current, {
          bcid: "datamatrix",
          text: combinedValue,
          scale: scale,
          width: Math.floor(containerWidth / scale),
          height: Math.floor(containerHeight / scale),
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });

        // Scale canvas to fit container
        canvasRef.current.style.width = `${containerWidth}px`;
        canvasRef.current.style.height = `${containerHeight}px`;
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

  if (barcodeType?.library === "bwip") {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={barcodeRef}
      className="flex items-center justify-center w-full h-full"
      style={{ overflow: "hidden" }}
    />
  );
};

export default BarcodeElement;
