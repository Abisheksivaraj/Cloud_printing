import { useState } from "react";

export default function SettingsModal({ onClose }) {
  const [language, setLanguage] = useState("English");
  const [unit, setUnit] = useState("MM");

  return (
    <Modal onClose={onClose} title="System Settings">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option>English</option>
            <option>Hindi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Unit</label>
          <div className="flex gap-4 mt-1">
            <label>
              <input
                type="radio"
                checked={unit === "MM"}
                onChange={() => setUnit("MM")}
              />{" "}
              MM
            </label>
            <label>
              <input
                type="radio"
                checked={unit === "IN"}
                onChange={() => setUnit("IN")}
              />{" "}
              Inch
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
