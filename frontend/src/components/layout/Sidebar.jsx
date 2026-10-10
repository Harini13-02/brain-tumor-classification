import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  BarChart3, 
  Cpu, 
  Info,
  Activity,
  Layers
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'MRI Classification', path: '/predict', icon: UploadCloud },
  { name: 'Prediction History', path: '/history', icon: History },
  { name: 'Research Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Model Comparison', path: '/models', icon: Cpu },
  { name: 'About & Safety', path: '/about', icon: Info },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80
        flex flex-col transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medical-600 to-tealAccent-500 flex items-center justify-center text-white shadow-md shadow-medical-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight">NeuroScan Research</h1>
            <p className="text-[11px] text-slate-500 font-medium">Brain Tumor ML Lab</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all
                  ${isActive 
                    ? 'bg-medical-50 text-medical-700 shadow-xs border border-medical-200/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Research Pipeline Footer Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
              <Layers className="w-3.5 h-3.5 text-medical-600" />
              <span>Experiment Pipeline</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mb-2">
              Best model: <strong className="text-slate-700">Random Forest</strong> (92.45% recorded accuracy).
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>5 Models Active in Memory</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
