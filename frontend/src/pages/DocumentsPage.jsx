import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, X } from 'lucide-react';
import { documentsAPI, employeesAPI } from '../services/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadData, setUploadData] = useState({
    employee_id: '',
    title: '',
    document_type: 'Contract',
    file: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, empRes] = await Promise.all([
        documentsAPI.getAll(),
        employeesAPI.getAll()
      ]);
      setDocuments(docRes.data);
      setEmployees(empRes.data);
      if (empRes.data.length > 0 && !uploadData.employee_id) {
        setUploadData(prev => ({ ...prev, employee_id: empRes.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert("Please select a file to upload");
      return;
    }
    const form = new FormData();
    form.append('employee_id', uploadData.employee_id);
    form.append('title', uploadData.title);
    form.append('document_type', uploadData.document_type);
    form.append('file', uploadData.file);

    try {
      await documentsAPI.upload(form);
      setShowUploadModal(false);
      setUploadData(prev => ({ ...prev, title: '', file: null }));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Upload error");
    }
  };

  const handleDelete = async (docId) => {
    if (confirm("Delete this document permanently?")) {
      await documentsAPI.delete(docId);
      fetchData();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Document Vault</h2>
          <p className="text-xs text-slate-500 mt-0.5">Central repository for employee agreements, certifications, and identification files.</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Document Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No documents stored in vault.</td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{d.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{d.employee_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {d.document_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{d.file_size_kb} KB</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(d.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={documentsAPI.downloadUrl(d.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Select Employee</label>
                <select
                  required
                  value={uploadData.employee_id}
                  onChange={(e) => setUploadData({...uploadData, employee_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-Disclosure Agreement 2026"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Document Category</label>
                <select
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData({...uploadData, document_type: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Contract">Employment Contract</option>
                  <option value="ID_Proof">Identity Proof / Passport</option>
                  <option value="Resume">Resume / CV</option>
                  <option value="Certificate">Degree / Professional Certificate</option>
                  <option value="Tax_Doc">Tax / W-4 Form</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Choose File (PDF, DOCX, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-xs cursor-pointer"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
