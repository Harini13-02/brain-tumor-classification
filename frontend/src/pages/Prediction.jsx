import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  UploadCloud, 
  FileImage, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ArrowRight,
  RefreshCw,
  Info,
  Clock,
  Layers,
  BarChart2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { predictionService } from '../services/api';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';

const MODEL_OPTIONS = [
  { id: 'Random Forest', name: 'Random Forest', accuracy: '92.45%', desc: 'Default (Highest test accuracy on 128-d features)' },
  { id: 'Decision Tree', name: 'Decision Tree', accuracy: '89.86%', desc: 'Interpretable tree classifier on features' },
  { id: 'KNN', name: 'K-Nearest Neighbors (KNN)', accuracy: '89.70%', desc: 'Instance-based classification with scaling' },
  { id: 'SVM', name: 'Support Vector Machine (SVM)', accuracy: '86.42%', desc: 'RBF kernel pipeline with feature scaling' },
  { id: 'CNN', name: 'End-to-End CNN', accuracy: '77.80%', desc: 'Deep Convolutional Neural Network' },
];

export const Prediction = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedModel, setSelectedModel] = useState('Random Forest');
  const [isDragging, setIsDragging] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setError('');
    setResult(null);

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png'].includes(ext)) {
      setError('Invalid file format. Please upload a JPG or PNG MRI image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunPrediction = async () => {
    if (!selectedFile) {
      setError('Please select an MRI image first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await predictionService.runPrediction(selectedFile, selectedModel);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Inference failed. Check image and backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result?.id) return;
    setDownloadingPdf(true);
    try {
      const blob = await predictionService.downloadReport(result.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MRI_Prediction_Report_${result.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF report.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Format probabilities for Recharts
  const probChartData = result?.probabilities ? Object.entries(result.probabilities).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    code: key,
    prob: Math.round(value * 10000) / 100, // percentage e.g. 93.97%
  })) : [];

  const getClassColor = (code) => {
    if (code === result?.predicted_class) return '#0284c7'; // Highlight winner
    return '#94a3b8';
  };

  const getClassBadgeStyle = (cls) => {
    switch (cls?.toLowerCase()) {
      case 'glioma': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'meningioma': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'notumor': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'pituitary': return 'bg-blue-100 text-blue-900 border-blue-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          MRI Classification & Risk Prediction
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload cranial MRI scans to extract 128-dimensional deep feature representations and evaluate via supervised ML estimators.
        </p>
      </div>

      {/* Prominent Educational Safety Disclaimer */}
      <MedicalDisclaimer />

      {/* Two Column Layout: Upload & Configuration vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Model Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-medical-600" />
              <span>1. Upload Cranial MRI</span>
            </h3>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px]
                ${isDragging 
                  ? 'border-medical-500 bg-medical-50/50' 
                  : selectedFile 
                    ? 'border-emerald-300 bg-emerald-50/30' 
                    : 'border-slate-300 hover:border-medical-400 hover:bg-slate-50/60'
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="hidden"
              />

              {filePreview ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="relative group">
                    <img
                      src={filePreview}
                      alt="MRI Preview"
                      className="w-28 h-28 object-cover rounded-lg shadow-sm border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-[11px] font-medium transition-opacity">
                      Click to replace
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 max-w-[220px] truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'image/jpeg'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-medical-50 text-medical-600 flex items-center justify-center mx-auto">
                    <FileImage className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-medical-700 hover:text-medical-800">
                      Click to browse
                    </span>
                    <span className="text-xs text-slate-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, JPEG, or PNG (Max 10 MB)
                  </p>
                </div>
              )}
            </div>

            {/* Model Selector Dropdown */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-medical-600" />
                  <span>2. Select Classifier</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">5 options available</span>
              </label>

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-medical-500 focus:border-medical-500 text-slate-800"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.accuracy} Test Accuracy
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500 leading-tight">
                {MODEL_OPTIONS.find(m => m.id === selectedModel)?.desc}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRunPrediction}
                disabled={loading || !selectedFile}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-medical-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Extracting & Classifying...</span>
                  </>
                ) : (
                  <>
                    <span>Run MRI Classification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {selectedFile && (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                  title="Clear file"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results Panel (7 cols) */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in duration-300">
              {/* Results Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-medical-600 uppercase">
                    Inference Complete
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    MRI Classification Result
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(result.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Top Result Banner */}
              <div className="bg-gradient-to-r from-medical-50/70 via-slate-50 to-tealAccent-50/50 p-4 rounded-xl border border-medical-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={`http://localhost:8000${result.image_url}`}
                    alt="Processed MRI"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-xs bg-black"
                  />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Predicted Tumor Class:</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-3 py-1 rounded-full text-sm font-extrabold uppercase tracking-wide border ${getClassBadgeStyle(result.predicted_class)}`}>
                        {result.predicted_class}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Evaluated using <strong className="text-slate-700">{result.model_name}</strong>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                  <div className="text-xs text-slate-500 font-medium">Model Output Confidence</div>
                  <div className="text-2xl font-black text-navy-900 tracking-tight mt-0.5">
                    {result.confidence.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Uncalibrated statistical output
                  </div>
                </div>
              </div>

              {/* Note about Notumor limitation */}
              {result.predicted_class === 'notumor' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important Safety Note:</strong> A prediction of <em>notumor</em> reflects machine learning classification on this scan and does not clinically verify the complete absence of intracranial pathology.
                  </span>
                </div>
              )}

              {/* Probability Distribution Chart */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-medical-600" />
                    <span>Four-Class Probability Distribution</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Sum ≈ 1.00</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={probChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis 
                        type="number" 
                        domain={[0, 100]} 
                        unit="%" 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        width={90}
                      />
                      <Tooltip 
                        formatter={(val) => [`${val}%`, 'Output Probability']}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
                        {probChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getClassColor(entry.code)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Probability Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {probChartData.map((item) => (
                    <div 
                      key={item.code} 
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        item.code === result.predicted_class 
                          ? 'bg-medical-50/80 border-medical-300 ring-1 ring-medical-400' 
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-600">{item.name}</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{item.prob.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Record Footer and Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-400 text-[11px]">
                  Prediction ID: <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[10px] font-mono">{result.id.slice(0, 13)}...</code>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
                  </button>

                  <Link
                    to="/history"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-2 text-medical-600 hover:text-medical-800 font-semibold"
                  >
                    <span>View in History</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl p-10 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center mb-3">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Awaiting MRI Scan</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Select an MRI image on the left panel, select your preferred ML classifier (or leave the recommended 92.45% Random Forest), and click <strong>Run MRI Classification</strong>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-400">
                <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">Glioma</span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">Meningioma</span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">No Tumor</span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">Pituitary</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
