import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import { predictionService } from '../services/api';

export const History = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [loading, setLoading] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await predictionService.getHistory({
        page,
        page_size: pageSize,
        search: search || undefined,
        predicted_class: selectedClass !== 'all' ? selectedClass : undefined,
        model_name: selectedModel !== 'all' ? selectedModel : undefined,
        sort: sortOrder
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, pageSize, selectedClass, selectedModel, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await predictionService.deleteById(itemToDelete.id);
      setItemToDelete(null);
      if (activeModalItem?.id === itemToDelete.id) setActiveModalItem(null);
      fetchHistory();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async (id, originalFilename) => {
    try {
      const blob = await predictionService.downloadReport(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MRI_Report_${originalFilename.split('.')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download PDF report.");
    }
  };

  const getClassBadgeStyle = (cls) => {
    switch (cls?.toLowerCase()) {
      case 'glioma': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'meningioma': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'notumor': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pituitary': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-medical-600" />
            <span>Prediction History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real records saved in SQLite database. Total evaluated scans: {total}.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-medical-500 bg-white"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
            >
              <option value="all">All Classes</option>
              <option value="glioma">Glioma</option>
              <option value="meningioma">Meningioma</option>
              <option value="notumor">No Tumor</option>
              <option value="pituitary">Pituitary</option>
            </select>
          </div>

          {/* Model Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
            >
              <option value="all">All Models</option>
              <option value="Random Forest">Random Forest</option>
              <option value="Decision Tree">Decision Tree</option>
              <option value="KNN">KNN</option>
              <option value="SVM">SVM</option>
              <option value="CNN">CNN</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying database records...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Image</th>
                  <th className="py-3 px-4 font-semibold">File Name</th>
                  <th className="py-3 px-4 font-semibold">Model</th>
                  <th className="py-3 px-4 font-semibold">MRI Classification</th>
                  <th className="py-3 px-4 font-semibold">Model Confidence</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <img 
                        src={`http://localhost:8000${item.image_url}`} 
                        alt={item.original_filename}
                        className="w-10 h-10 object-cover rounded-md border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90"
                        onClick={() => setActiveModalItem(item)}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[160px] truncate" title={item.original_filename}>
                      {item.original_filename}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {item.model_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border ${getClassBadgeStyle(item.predicted_class)}`}>
                        {item.predicted_class}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.confidence.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveModalItem(item)}
                          className="p-1.5 text-slate-500 hover:text-medical-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(item.id, item.original_filename)}
                          className="p-1.5 text-slate-500 hover:text-medical-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download PDF Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No prediction records found</h4>
            <p className="text-xs text-slate-400 mt-1">
              {search || selectedClass !== 'all' || selectedModel !== 'all'
                ? "Try clearing your search filters to view records."
                : "Your prediction history will appear here once you run MRI classifications."}
            </p>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page <span className="font-semibold text-slate-800">{page}</span> of <span className="font-semibold text-slate-800">{totalPages}</span> ({total} total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Prediction Details</h3>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <img
                src={`http://localhost:8000${activeModalItem.image_url}`}
                alt="MRI Scan"
                className="w-24 h-24 object-cover rounded-xl border border-slate-200 bg-black shrink-0"
              />
              <div className="space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Original File:</div>
                <div className="font-semibold text-slate-900 truncate max-w-[240px]">{activeModalItem.original_filename}</div>
                <div className="text-slate-400 text-[11px] pt-1">Model Evaluated:</div>
                <div className="font-medium text-slate-700">{activeModalItem.model_name}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500">MRI Classification:</span>
                <span className={`ml-2 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${getClassBadgeStyle(activeModalItem.predicted_class)}`}>
                  {activeModalItem.predicted_class}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Output Confidence:</span>
                <span className="ml-1.5 font-bold text-slate-900">{activeModalItem.confidence.toFixed(2)}%</span>
              </div>
            </div>

            {/* Probability Breakdown */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Class Probability Distribution:</div>
              <div className="space-y-1.5">
                {activeModalItem.probabilities && Object.entries(activeModalItem.probabilities).map(([cname, prob]) => (
                  <div key={cname} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-600">{cname}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cname === activeModalItem.predicted_class ? 'bg-medical-600' : 'bg-slate-300'}`}
                          style={{ width: `${prob * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[11px] w-12 text-right text-slate-700 font-medium">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => handleDownloadPdf(activeModalItem.id, activeModalItem.original_filename)}
                className="px-3 py-2 bg-medical-600 text-white font-semibold rounded-lg hover:bg-medical-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Prediction Record?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete record for <strong>{itemToDelete.original_filename}</strong>? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                {deleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
