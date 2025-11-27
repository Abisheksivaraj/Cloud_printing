import React, { useState } from "react";
import {
  Table,
  Save,
  Edit2,
  Trash2,
  ArrowLeft,
  Package,
  Plus,
  Search,
} from "lucide-react";

const AddModel = () => {
  const [partNo, setPartNo] = useState("");
  const [model, setModel] = useState("");
  const [prefix, setPrefix] = useState("");
  const [parts, setParts] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSave = () => {
    if (partNo && model && prefix) {
      const currentTime = new Date().toLocaleString();

      if (editIndex !== null) {
        const updatedParts = [...parts];
        updatedParts[editIndex] = {
          partNo,
          model,
          prefix,
          createdAt: parts[editIndex].createdAt,
        };
        setParts(updatedParts);
        setEditIndex(null);
      } else {
        setParts([...parts, { partNo, model, prefix, createdAt: currentTime }]);
      }

      setPartNo("");
      setModel("");
      setPrefix("");
    }
  };

  const handleEdit = (index) => {
    const part = parts[index];
    setPartNo(part.partNo);
    setModel(part.model);
    setPrefix(part.prefix);
    setEditIndex(index);
    setShowTable(false);
  };

  const handleDelete = (index) => {
    const updatedParts = parts.filter((_, i) => i !== index);
    setParts(updatedParts);
  };

  const handleBack = () => {
    setShowTable(false);
    if (editIndex !== null) {
      setEditIndex(null);
      setPartNo("");
      setModel("");
      setPrefix("");
    }
  };

  const filteredParts = parts.filter(
    (part) =>
      part.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.prefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {showTable && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Back</span>
                </button>
              )}
              <Package className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">
                {showTable
                  ? "Parts Inventory"
                  : editIndex !== null
                  ? "Edit Part"
                  : "Add Part"}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {!showTable && (
                <button
                  onClick={() => setShowTable(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <Table size={18} />
                  <span>View All ({parts.length})</span>
                </button>
              )}

              {!showTable && (
                <button
                  onClick={handleSave}
                  disabled={!partNo || !model || !prefix}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Save size={18} />
                  <span>{editIndex !== null ? "Update" : "Save"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showTable ? (
          /* Form View */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Plus size={20} />
                  <span>
                    {editIndex !== null
                      ? "Edit Part Details"
                      : "Enter Part Details"}
                  </span>
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={partNo}
                      onChange={(e) => setPartNo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter part number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter model name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefix
                    </label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter prefix"
                    />
                  </div>
                </div>

                {editIndex !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> You are editing an existing part.
                      Click "Update" to save changes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center justify-between">
              <div className="relative max-w-md">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search parts..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredParts.length} of {parts.length} parts
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {filteredParts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {parts.length === 0
                      ? "No parts added yet"
                      : "No parts found"}
                  </h3>
                  <p className="text-gray-500">
                    {parts.length === 0
                      ? "Start by adding your first part using the form."
                      : "Try adjusting your search criteria."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Part Number
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prefix
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredParts.map((row, index) => {
                        const originalIndex = parts.findIndex(
                          (part) =>
                            part.partNo === row.partNo &&
                            part.model === row.model &&
                            part.prefix === row.prefix &&
                            part.createdAt === row.createdAt
                        );

                        return (
                          <tr
                            key={originalIndex}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {row.partNo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row.prefix}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {row.createdAt}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEdit(originalIndex)}
                                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Edit part"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(originalIndex)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Delete part"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddModel;
