import React from 'react';
import { ShieldAlert, BookOpen, Database, Code, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';

export const About = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-medical-600" />
          <span>Research Documentation & Medical Safety Principles</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Architectural overview, ethical constraints, and educational guidelines for the Brain Tumor Classification system.
        </p>
      </div>

      {/* Prominent Safety Notice */}
      <MedicalDisclaimer />

      {/* Medical Safety Protocols */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Clinical Safety & Non-Diagnostic Constraints</span>
        </h3>
        
        <p className="text-xs text-slate-600 leading-relaxed">
          In strict compliance with clinical software safety standards and healthcare AI ethics, this platform enforces explicit guardrails:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-1">
            <span className="font-bold text-red-900">No Risk Scores or Staging</span>
            <p className="text-red-800 text-[11px] leading-relaxed">
              The system does not predict patient tumor stages, malignancy grades, survival prognoses, or numerical clinical risk scores.
            </p>
          </div>

          <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-1">
            <span className="font-bold text-red-900">No Absence Guarantees</span>
            <p className="text-red-800 text-[11px] leading-relaxed">
              A model prediction of <em>notumor</em> indicates visual similarity to healthy scan training patterns, never a guaranteed absence of pathology.
            </p>
          </div>

          <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-1">
            <span className="font-bold text-red-900">No Treatment Advice</span>
            <p className="text-red-800 text-[11px] leading-relaxed">
              The application explicitly forbids recommending pharmacotherapy, surgical resection, radiation, or oncology interventions.
            </p>
          </div>

          <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-1">
            <span className="font-bold text-red-900">Uncalibrated Confidence</span>
            <p className="text-red-800 text-[11px] leading-relaxed">
              Confidence percentages represent raw softmax output probabilities, not calibrated biological or statistical diagnostic certainty.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Architecture */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-medical-600" />
          <span>Inference Pipeline Architecture</span>
        </h3>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-medical-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
            <div>
              <strong className="text-slate-800">Image Validation & Preprocessing:</strong> Uploaded DICOM-converted JPG/PNG images are decoded via Pillow, converted to RGB, verified for size constraints (&lt;10 MB), and bilinearly scaled to 224×224 pixels.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-medical-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
            <div>
              <strong className="text-slate-800">Deep Feature Extraction:</strong> For traditional ML estimators (Random Forest, SVM, KNN, Decision Tree), the image batch passes through <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">cnn_feature_extractor.keras</code> to generate a 128-dimensional dense feature representation.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-medical-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
            <div>
              <strong className="text-slate-800">Classification & Probability Calibration:</strong> Features are passed to the chosen scikit-learn estimator (SVM & KNN utilize integrated StandardScaler pipelines; Random Forest & Decision Tree operate on dense embeddings). All 4 class output probabilities are returned.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-medical-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">4</div>
            <div>
              <strong className="text-slate-800">Audit Logging & PDF Reporting:</strong> Prediction results and probability breakdowns are recorded with user ownership in SQLite, allowing on-demand PDF report generation via ReportLab.
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Code className="w-4 h-4 text-medical-600" />
          <span>Technology Stack</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block">Frontend</span>
            <span className="text-slate-500 text-[11px]">React 18, Vite, Tailwind CSS, Recharts</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block">Backend</span>
            <span className="text-slate-500 text-[11px]">Python FastAPI, Uvicorn, REST API</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block">Machine Learning</span>
            <span className="text-slate-500 text-[11px]">TensorFlow/Keras, Scikit-Learn, Joblib</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block">Database & Auth</span>
            <span className="text-slate-500 text-[11px]">SQLite, SQLAlchemy, JWT, Bcrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
