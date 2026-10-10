import React, { useState, useEffect } from 'react';
import { Cpu, Award, CheckCircle, BarChart2, Layers, AlertCircle } from 'lucide-react';
import { analyticsService } from '../services/api';

export const ModelsComparison = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await analyticsService.getModelComparison();
        setModels(data);
      } catch (err) {
        console.error("Failed to load models:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const modelDescriptions = {
    'Random Forest': {
      arch: 'Ensemble of 100 decision trees operating on 128 deep feature embeddings.',
      strength: 'Highest generalizability (92.45% accuracy), robust against overfitting, balanced precision across all 4 classes.',
      badge: 'Best Performing Model'
    },
    'Decision Tree': {
      arch: 'Single decision tree estimator with Gini impurity splitting criterion.',
      strength: 'Fast inference (89.86% accuracy), highly interpretable hierarchical decision paths.',
      badge: 'High Interpretability'
    },
    'KNN': {
      arch: 'Instance-based classification with Euclidean metric, powered by StandardScaler pipeline.',
      strength: 'Strong local neighborhood clustering performance (89.70% accuracy).',
      badge: 'Non-Parametric'
    },
    'SVM': {
      arch: 'Support Vector Classifier with Radial Basis Function (RBF) kernel and StandardScaler.',
      strength: 'Effective hyper-plane margin separation in high-dimensional feature spaces (86.42% accuracy).',
      badge: 'Kernel Margin Classifier'
    },
    'CNN': {
      arch: 'Deep Convolutional Neural Network with Conv2D, MaxPooling, and Dropout layers directly trained on 224x224 RGB images.',
      strength: 'Autonomous visual spatial representation learning; acts as the primary 128-d feature extractor for traditional ML estimators.',
      badge: 'Feature Extractor Backbone'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-medical-600" />
          <span>Machine Learning Models Specification</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics, architecture descriptions, and comparative analysis of all 5 deployed classifiers.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {models.map((m) => {
          const info = modelDescriptions[m.model] || {};
          const isTop = m.model === 'Random Forest';
          return (
            <div 
              key={m.model}
              className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
                isTop ? 'border-medical-400 ring-2 ring-medical-500/20' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isTop ? 'bg-medical-100 text-medical-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {info.badge || 'Trained Estimator'}
                  </span>
                  {isTop && (
                    <Award className="w-4 h-4 text-medical-600" />
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{m.model}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {info.arch}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Test Accuracy</span>
                    <span className="text-sm font-extrabold text-slate-900">{(m.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">F1-Score</span>
                    <span className="text-sm font-extrabold text-slate-900">{(m.f1_score * 100).toFixed(2)}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Precision</span>
                    <span className="text-xs font-bold text-slate-800">{(m.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Recall</span>
                    <span className="text-xs font-bold text-slate-800">{(m.recall * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-tight">
                <strong className="text-slate-700">Strength:</strong> {info.strength}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytical Finding Notice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-medical-600" />
          <span>Research Discovery: Transfer & Hybrid ML Superiority</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          In this study, passing MRI images through the trained CNN feature extractor to produce a compact 128-dimensional embedding, followed by a Random Forest classifier, yielded a test accuracy of <strong>92.45%</strong>, significantly outperforming the end-to-end CNN (<strong>77.80%</strong>). This highlights the synergy between deep neural feature representation and ensemble decision tree partitions on medical imaging data.
        </p>
      </div>
    </div>
  );
};
