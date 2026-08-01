import React from 'react';
import { Settings, X, Instagram } from 'lucide-react';
import { UNITS } from '../../constants/printSettings';

export default function SettingsModal({ unit, setUnit, close }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Settings className="w-4 h-4" /> Configuración</h3>
          <button onClick={close} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Unidad de Medida</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.keys(UNITS).map(u => (
                <button 
                  key={u} 
                  onClick={() => setUnit(u)} 
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${unit === u ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {UNITS[u].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Esto afectará cómo se muestran las medidas en el panel de márgenes y espaciado.</p>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Acerca de</label>
            <a href="https://www.instagram.com/luispalacios2711" target="_blank" rel="noopener noreferrer" className="group block bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 p-3 rounded-xl border border-pink-100 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-pink-600 group-hover:scale-110 transition-transform duration-300"><Instagram className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-pink-400">Desarrollado por</p>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-pink-700 transition-colors">Luis Palacios</p>
                  <p className="text-[10px] text-slate-500">@luispalacios2711</p>
                </div>
              </div>
            </a>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 flex justify-end">
          <button onClick={close} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition">Aceptar</button>
        </div>
      </div>
    </div>
  );
}