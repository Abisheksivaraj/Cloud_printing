import React from "react";
import { X } from "lucide-react";

const barcodeTypes = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC-A" },
  { value: "QR", label: "QR Code" },
  { value: "DATAMATRIX", label: "Data Matrix" },
  { value: "PDF417", label: "PDF417" },
  { value: "AZTEC", label: "Aztec Code" },
];

const BarcodeModal = ({ value, setValue, barcodeType, onClose, onCreate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Enter Barcode Value
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Type:{" "}
              {barcodeTypes.find((t) => t.value === barcodeType)?.label ||
                barcodeType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Barcode Value
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === "Enter" && onCreate()}
            autoFocus
          />

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              disabled={!value.trim()}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                value.trim()
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BarcodeModal;
