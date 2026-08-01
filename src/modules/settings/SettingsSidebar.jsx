import React from 'react';
import { Settings } from 'lucide-react';
import { UNITS } from '../../constants/printSettings';

export default function SettingsSidebar({
    unit,
    setUnit
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" /> Preferencias
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Unidad de Medida</label>
                    <div className="flex bg-slate-200 p-1 rounded-lg">
                        {Object.keys(UNITS).map(u => (
                            <button
                                key={u}
                                onClick={() => setUnit(u)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${unit === u ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {UNITS[u].label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 text-center">
                        Esta unidad se usará en todos los controles de la aplicación.
                    </p>
                </div>
            </section>
        </div>
    );
}
