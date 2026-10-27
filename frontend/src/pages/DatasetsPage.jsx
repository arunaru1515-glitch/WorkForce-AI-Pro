import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Trash2, 
  FileSpreadsheet, 
  BarChart2, 
  CheckCircle, 
  Clock, 
  X, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { datasetsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DatasetsPage() {
  const { user } = useAuth();
  const isHRorAdmin = ['ADMIN', 'HR'].includes(user?.role);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [uploadData, setUploadData] = useState({
    name: '',
    version: 'v1.1',
    description: '',
    file: null
  });

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await datasetsAPI.getAll();
      setDatasets(res.data);
    } catch (e) {
      console.error("Error loading datasets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert("Please select a CSV or Excel file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("name", uploadData.name);
    formData.append("version", uploadData.version);
    formData.append("description", uploadData.description || "");

    try {
      await datasetsAPI.upload(formData);
      setShowUploadModal(false);
      setUploadData({ name: '', version: 'v1.1', description: '', file: null });
      fetchDatasets();
      alert("Dataset uploaded and validated successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Upload error");
    }
  };

  const handleViewPreview = async (datasetId) => {
    setPreviewLoading(true);
    try {
      const res = await datasetsAPI.getPreview(datasetId);
      setSelectedPreview(res.data);
    } catch (err) {
      alert("Could not load preview: " + (err.response?.data?.detail || err.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dataset version?")) return;
    try {
      await datasetsAPI.delete(id);
      fetchDatasets();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete dataset");
    }
  };

  return (
    <div className="w-full px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dataset Management System</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage training datasets, benchmark schema distributions, version control, and data previews.
          </p>
        </div>

        {isHRorAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload Dataset
          </button>
        )}
      </div>

      {/* Dataset Versions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading datasets...</div>
        ) : datasets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No datasets uploaded yet.</div>
        ) : (
          datasets.map((ds) => (
            <div key={ds.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    {ds.version}
                  </span>
                  {isHRorAdmin && (
                    <button
                      onClick={() => handleDelete(ds.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      title="Delete Dataset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{ds.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{ds.description || "Official benchmark workforce attrition dataset."}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-600 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Total Rows:</span>
                  <span className="font-bold text-slate-800">{ds.row_count.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Columns:</span>
                  <span className="font-bold text-slate-800">{ds.column_count} features</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(ds.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleViewPreview(ds.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Preview Data
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dataset Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dataset Distribution Preview: {selectedPreview.filename}</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedPreview.total_rows.toLocaleString()} Records • {selectedPreview.total_columns} Features
                </p>
              </div>
              <button onClick={() => setSelectedPreview(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attrition Ratio & Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Attrition Split</span>
                <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                  Yes: {selectedPreview.attrition_distribution?.Yes || 0} / No: {selectedPreview.attrition_distribution?.No || 0}
                </div>
              </div>
              {Object.entries(selectedPreview.numeric_summary || {}).slice(0, 3).map(([col, stat]) => (
                <div key={col} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 font-sans font-semibold block uppercase truncate">{col}</span>
                  <div className="text-slate-800 font-bold mt-1">Mean: {stat.mean}</div>
                  <div className="text-[10px] text-slate-400 font-sans">Min: {stat.min} | Max: {stat.max}</div>
                </div>
              ))}
            </div>

            {/* Sample Table */}
            <div className="overflow-auto border border-slate-200 rounded-xl flex-1">
              <table className="w-full text-left text-[11px] whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    {selectedPreview.columns.slice(0, 10).map((col) => (
                      <th key={col} className="py-2.5 px-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedPreview.sample_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      {selectedPreview.columns.slice(0, 10).map((col) => (
                        <td key={col} className="py-2 px-3 font-mono">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Upload Benchmark HR Dataset</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Dataset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Company HR Analytics"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Dataset Version</label>
                <input
                  type="text"
                  value={uploadData.version}
                  onChange={(e) => setUploadData({...uploadData, version: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Select File (CSV or Excel)</label>
                <input
                  type="file"
                  required
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional context about the dataset source..."
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold shadow-xs cursor-pointer"
                >
                  Upload & Parse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
