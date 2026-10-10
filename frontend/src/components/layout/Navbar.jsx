import React from 'react';
import { Menu, LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-medical-50 text-medical-700 border border-medical-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-medical-600" />
            Educational Research Prototype
          </span>
          <span className="text-xs text-slate-400 font-normal">|</span>
          <span className="text-xs text-slate-500 font-medium">Dataset: 4 Classes (glioma, meningioma, notumor, pituitary)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-right">
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-900 leading-none">{user.name}</div>
                <div className="text-[11px] text-slate-500">{user.email}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-medical-100 border border-medical-300 text-medical-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user.name.charAt(0)}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Not signed in</span>
          </div>
        )}
      </div>
    </header>
  );
};
