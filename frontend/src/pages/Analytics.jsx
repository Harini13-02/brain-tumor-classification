import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  GitBranch, 
  Binary, 
  Search, 
  ArrowUpDown, 
  Info, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { analyticsService } from '../services/api';

export const Analytics = () => {
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'pca', 'kmeans', 'apriori'

  const [modelComparison, setModelComparison] = useState([]);
  const [classificationReport, setClassificationReport] = useState([]);
  const [pcaData, setPcaData] = useState(null);
  const [clusterData, setClusterData] = useState(null);
  const [aprioriData, setAprioriData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Apriori table search & pagination
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleSortKey, setRuleSortKey] = useState('lift');
  const [ruleSortAsc, setRuleSortAsc] = useState(false);
  const [rulePage, setRulePage] = useState(1);
  const rulePageSize = 8;

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      setLoading(true);
      try {
        const [models, report, pca, clusters, apriori] = await Promise.all([
          analyticsService.getModelComparison(),
          analyticsService.getClassificationReport(),
          analyticsService.getPcaData(),
          analyticsService.getClustersData(),
          analyticsService.getAprioriData(),
        ]);
        setModelComparison(models);
        setClassificationReport(report);
        setPcaData(pca);
        setClusterData(clusters);
        setAprioriData(apriori);
      } catch (err) {
        console.error("Failed to load analytics artifacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllAnalytics();
  }, []);

  // Filtered & sorted Apriori rules
  const filteredRules = (aprioriData?.rules || []).filter(r => {
    if (!ruleSearch) return true;
    const term = ruleSearch.toLowerCase();
    return r.antecedents.toLowerCase().includes(term) || r.consequents.toLowerCase().includes(term);
  }).sort((a, b) => {
    const valA = a[ruleSortKey];
    const valB = b[ruleSortKey];
    return ruleSortAsc ? valA - valB : valB - valA;
  });

  const totalRulePages = Math.ceil(filteredRules.length / rulePageSize) || 1;
  const paginatedRules = filteredRules.slice((rulePage - 1) * rulePageSize, rulePage * rulePageSize);

  const toggleSort = (key) => {
    if (ruleSortKey === key) {
      setRuleSortAsc(!ruleSortAsc);
    } else {
      setRuleSortKey(key);
      setRuleSortAsc(false);
    }
  };

  // Recharts Model Comparison Data
  const modelBarData = modelComparison.map(m => ({
    name: m.model,
    Accuracy: Math.round(m.accuracy * 1000) / 10,
    Precision: Math.round(m.precision * 1000) / 10,
    Recall: Math.round(m.recall * 1000) / 10,
    'F1-Score': Math.round(m.f1_score * 1000) / 10,
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Parsing data mining & evaluation artifacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-medical-600" />
          <span>Data Mining & Evaluation Analytics</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Explore the exact empirical models evaluation metrics, PCA dimensional reduction, K-Means clustering, and Apriori association rules extracted from training features.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Tabs">
          {[
            { id: 'models', name: 'Model Evaluation & Confusion Matrix', icon: Cpu },
            { id: 'pca', name: 'PCA Dimensionality Reduction', icon: Layers },
            { id: 'kmeans', name: 'K-Means Clustering', icon: Binary },
            { id: 'apriori', name: 'Apriori Association Rules', icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all
                  ${active
                    ? 'border-medical-600 text-medical-700 bg-medical-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: MODEL EVALUATION & CONFUSION MATRIX */}
      {activeTab === 'models' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Comparison Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Comprehensive Model Evaluation Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Directly loaded from <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">evaluation/model_comparison.csv</code>
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                Random Forest achieves 92.45% Accuracy & 92.38% F1
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelBarData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[60, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip 
                    formatter={(val) => [`${val}%`]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Accuracy" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Precision" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="F1-Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto mt-4 pt-4 border-t border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Model Name</th>
                    <th className="py-2.5 px-3 font-semibold">Test Accuracy</th>
                    <th className="py-2.5 px-3 font-semibold">Precision</th>
                    <th className="py-2.5 px-3 font-semibold">Recall</th>
                    <th className="py-2.5 px-3 font-semibold">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {modelComparison.map((m) => (
                    <tr key={m.model} className={m.model === 'Random Forest' ? 'bg-medical-50/40 font-semibold' : ''}>
                      <td className="py-2.5 px-3 text-slate-900">{m.model}</td>
                      <td className="py-2.5 px-3">{(m.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-3">{(m.precision * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-3">{(m.recall * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-3">{(m.f1_score * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix & Classification Report Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Image Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recorded Confusion Matrix</h3>
                <p className="text-xs text-slate-500">
                  Rendered from <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">evaluation/confusion_matrix.png</code>
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center justify-center">
                <img
                  src={analyticsService.getConfusionMatrixUrl()}
                  alt="Confusion Matrix"
                  className="max-h-72 object-contain rounded-lg shadow-2xs"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                The normalized confusion matrix illustrates class-by-class classifications across glioma, meningioma, notumor, and pituitary test images.
              </p>
            </div>

            {/* Classification Report Table Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Per-Class Classification Report</h3>
                <p className="text-xs text-slate-500">
                  Parsed from <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">evaluation/classification_report.csv</code>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Class / Average</th>
                      <th className="py-2 px-3 font-semibold">Precision</th>
                      <th className="py-2 px-3 font-semibold">Recall</th>
                      <th className="py-2 px-3 font-semibold">F1-Score</th>
                      <th className="py-2 px-3 font-semibold">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {classificationReport.map((row, idx) => (
                      <tr key={idx} className={['accuracy', 'macro avg', 'weighted avg'].includes(row.class_name) ? 'bg-slate-50 font-semibold' : ''}>
                        <td className="py-2 px-3 capitalize font-medium text-slate-900">{row.class_name}</td>
                        <td className="py-2 px-3">{row.precision !== null ? (row.precision * 100).toFixed(1) + '%' : '-'}</td>
                        <td className="py-2 px-3">{row.recall !== null ? (row.recall * 100).toFixed(1) + '%' : '-'}</td>
                        <td className="py-2 px-3">{row.f1_score !== null ? (row.f1_score * 100).toFixed(1) + '%' : '-'}</td>
                        <td className="py-2 px-3 font-mono">{row.support !== null ? row.support : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] leading-relaxed border border-slate-200/60">
                <strong>Benchmark sample:</strong> 1,311 total test images (300 glioma, 306 meningioma, 405 notumor, 300 pituitary).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PCA DIMENSIONALITY REDUCTION */}
      {activeTab === 'pca' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="max-w-3xl space-y-2 mb-6">
              <span className="px-2.5 py-1 bg-medical-50 text-medical-700 border border-medical-200 text-xs font-bold rounded-full">
                Variance Explained: 43.26%
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Principal Component Analysis (PCA) on 128-D CNN Features
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pcaData?.description || "PCA projects 128-dimensional CNN features into two dimensions. The recorded first two components explain a combined 43.26% of the feature variance."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* High-res Image from Artifact */}
              <div className="lg:col-span-7 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center">
                <img
                  src={analyticsService.getPcaImageUrl()}
                  alt="PCA Class Visualization"
                  className="rounded-xl shadow-xs w-full max-h-[420px] object-contain"
                />
                <div className="text-[11px] text-slate-400 mt-2">
                  Source: <code className="text-slate-600">analytics/pca_class_visualization.png</code>
                </div>
              </div>

              {/* Data & Metrics Summary */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-medical-50/60 rounded-xl border border-medical-200/60 space-y-2 text-xs">
                  <h4 className="font-bold text-medical-900">Dimensionality Reduction Insights</h4>
                  <p className="text-medical-800 leading-relaxed">
                    The CNN feature extractor compresses 224×224×3 pixel arrays into a dense 128-dimensional embedding. Fitting PCA on these embeddings projects them onto orthogonal axes of maximum variance:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-medical-900/90 pt-1">
                    <li>Total training points analyzed: <strong>{pcaData?.total_points || 4571}</strong></li>
                    <li>Component 1 + Component 2 variance: <strong>43.26%</strong></li>
                    <li>Separation: <em>notumor</em> forms a distinctive cluster separate from intracranial neoplasms.</li>
                  </ul>
                </div>

                {/* Sample Coordinates preview */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
                    <span>Sample Projected Coordinates</span>
                    <span className="text-[10px] text-slate-400 font-normal">PC1 vs PC2</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {(pcaData?.data || []).slice(0, 8).map((pt, i) => (
                      <div key={i} className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                        <span className="capitalize font-semibold text-slate-700">{pt.actual_class}</span>
                        <span className="font-mono text-slate-500">PC1: {pt.pc1.toFixed(2)}, PC2: {pt.pc2.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: K-MEANS CLUSTERING */}
      {activeTab === 'kmeans' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="max-w-3xl space-y-2 mb-6">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                Adjusted Rand Index: 0.6248
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Unsupervised K-Means Feature Clustering (k=4)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {clusterData?.description || "K-Means produced four clusters in the training experiment. Clusters do not automatically correspond to tumor classes. The recorded Adjusted Rand Index is 0.6248, clearly labelled as a training clustering result."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Image Artifact */}
              <div className="lg:col-span-7 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center">
                <img
                  src={analyticsService.getClusterImageUrl()}
                  alt="KMeans Cluster Visualization"
                  className="rounded-xl shadow-xs w-full max-h-[420px] object-contain"
                />
                <div className="text-[11px] text-slate-400 mt-2">
                  Source: <code className="text-slate-600">analytics/kmeans_cluster_visualization.png</code>
                </div>
              </div>

              {/* Clustering Metrics */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-2 text-xs">
                  <h4 className="font-bold text-amber-900">Unsupervised Alignment Analysis</h4>
                  <p className="text-amber-800 leading-relaxed">
                    K-Means clustering groups the 128-dimensional features without class supervision:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-900/90 pt-1">
                    <li>Total samples partitioned: <strong>{clusterData?.total_samples || 4571}</strong></li>
                    <li>Adjusted Rand Index (ARI): <strong>0.6248</strong></li>
                    <li>Note: Clusters reflect geometric feature proximity, not clinical diagnostic boundaries.</li>
                  </ul>
                </div>

                {/* Cluster Distribution Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-700">
                    Cluster Distribution Breakdown
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Cluster ID</th>
                        <th className="py-2 px-3 font-semibold">Sample Count</th>
                        <th className="py-2 px-3 font-semibold">Proportion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(clusterData?.cluster_distribution || []).map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-medium text-slate-900">{c.cluster}</td>
                          <td className="py-2 px-3 font-mono">{c.count}</td>
                          <td className="py-2 px-3">{((c.count / (clusterData?.total_samples || 4571)) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APRIORI ASSOCIATION RULES */}
      {activeTab === 'apriori' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Apriori Frequent Itemsets & Association Rules
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Parsed from <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">analytics/apriori_association_rules.csv</code> ({aprioriData?.rules?.length || 0} discovered rules).
              </p>
            </div>

            {/* Disclaimer banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Research Note:</strong> {aprioriData?.disclaimer || "These are exploratory associations derived from training feature discretizations and are not medical or causal rules."}
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => { setRuleSearch(e.target.value); setRulePage(1); }}
                  placeholder="Filter by item, e.g. class=notumor, PC1=high..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-medical-500 bg-white"
                />
              </div>

              <div className="text-xs text-slate-500">
                Showing {filteredRules.length} matching rules (Page {rulePage} of {totalRulePages})
              </div>
            </div>

            {/* Association Rules Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Antecedents (If)</th>
                    <th className="py-2.5 px-3">Consequents (Then)</th>
                    <th 
                      onClick={() => toggleSort('support')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Support</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => toggleSort('confidence')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Confidence</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => toggleSort('lift')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Lift</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">
                        {rule.antecedents}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-medical-700 font-semibold">
                        {rule.consequents}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {(rule.support * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {(rule.confidence * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-tealAccent-700">
                        {rule.lift.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalRulePages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <div>Page {rulePage} of {totalRulePages}</div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={rulePage <= 1}
                    onClick={() => setRulePage(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={rulePage >= totalRulePages}
                    onClick={() => setRulePage(p => Math.min(totalRulePages, p + 1))}
                    className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
