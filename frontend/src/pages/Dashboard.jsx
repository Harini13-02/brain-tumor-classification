import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  UploadCloud, 
  History, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Brain,
  Layers,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { predictionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await predictionService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard stats error:", err);
        setError("Failed to load dashboard statistics from backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Format model comparison data for Recharts
  const chartData = stats?.model_comparison?.map((m) => ({
    name: m.model,
    accuracy: Math.round(m.accuracy * 10000) / 100, // percentage e.g. 92.45
    f1: Math.round(m.f1_score * 10000) / 100
  })) || [];

  const getModelColor = (name) => {
    if (name === 'Random Forest') return '#0284c7'; // Top performer
    if (name === 'Decision Tree' || name === 'KNN') return '#0d9488';
    if (name === 'SVM') return '#6366f1';
    return '#94a3b8'; // CNN
  };

  const getClassBadgeColor = (className) => {
    switch (className?.toLowerCase()) {
      case 'glioma': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'meningioma': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'notumor': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pituitary': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading research analytics and session history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-medical-50 text-medical-700 border border-medical-200">
              Welcome back
            </span>
            <span className="text-xs text-slate-400 font-medium">Session ID: active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Research Workspace: {user?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Evaluate brain tumor MRIs across five supervised classifiers (CNN, SVM, Random Forest, KNN, Decision Tree) and examine PCA / Apriori training data mining patterns.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-medical-600/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Classify New MRI</span>
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Brain className="w-4 h-4" />
            <span>Data Mining</span>
          </Link>
        </div>
      </div>

      {/* Prominent Medical Safety Notice */}
      <MedicalDisclaimer />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Scans</span>
            <div className="p-2 bg-medical-50 text-medical-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_predictions ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Processed in this account</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700">Glioma</span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.class_counts?.glioma ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Predictions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">Meningioma</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.class_counts?.meningioma ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Predictions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700">No Tumor</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.class_counts?.notumor ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Predictions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-700">Pituitary</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.class_counts?.pituitary ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Predictions</div>
        </div>
      </div>

      {/* Model Performance Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Accuracy Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-medical-600" />
                <span>Recorded Test Accuracy Comparison</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated on 1,311 test MRIs using 128-d extracted CNN features (scikit-learn test experiment).
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-semibold text-medical-700 bg-medical-50 px-2.5 py-1 rounded-full border border-medical-200">
              Random Forest: 92.45% (Highest)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[60, 100]} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  unit="%"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Accuracy']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getModelColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-100 text-center">
            {stats?.model_comparison?.map((m) => (
              <div key={m.model} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-600 truncate">{m.model}</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{(m.accuracy * 100).toFixed(2)}%</div>
                <div className="text-[10px] text-slate-400">F1: {(m.f1_score * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Experiment Limitations Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Experiment Limitations</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                <span><strong>Recorded test set:</strong> Accuracy figures reflect the specific fixed test benchmark (1,311 images) and are not guaranteed future clinical performance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                <span><strong>CNN vs Random Forest:</strong> Deep CNN alone achieved 77.80% test accuracy, while Random Forest operating on CNN-extracted features achieved 92.45%.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                <span><strong>Uncalibrated Confidence:</strong> Softmax and ensemble voting confidences are statistical model outputs, not calibrated biological probabilities.</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              to="/about"
              className="text-xs font-semibold text-medical-600 hover:text-medical-800 flex items-center justify-between group"
            >
              <span>Read research methodology</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-medical-600" />
              <span>Recent MRI Scans</span>
            </h3>
            <p className="text-xs text-slate-500">Your most recently evaluated images</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-medical-600 hover:text-medical-800 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {stats?.recent_predictions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/70">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Image</th>
                  <th className="py-2.5 px-3 font-semibold">File Name</th>
                  <th className="py-2.5 px-3 font-semibold">Model Used</th>
                  <th className="py-2.5 px-3 font-semibold">MRI Classification</th>
                  <th className="py-2.5 px-3 font-semibold">Output Confidence</th>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats.recent_predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <img 
                        src={`http://localhost:8000${p.image_url}`} 
                        alt={p.original_filename}
                        className="w-9 h-9 object-cover rounded-md border border-slate-200 bg-slate-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[140px] truncate" title={p.original_filename}>
                      {p.original_filename}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.model_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${getClassBadgeColor(p.predicted_class)}`}>
                        {p.predicted_class}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {p.confidence.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to="/history"
                        className="text-medical-600 hover:text-medical-800 font-semibold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-700">No predictions recorded yet</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto mb-3">
              Upload a cranial MRI image to test the classification models and build your session history.
            </p>
            <Link
              to="/predict"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-medical-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-medical-700"
            >
              <span>Classify First MRI</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
