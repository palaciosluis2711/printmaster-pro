import React from 'react';
import { Settings, Maximize, Link, Unlink } from 'lucide-react';
import { PAGE_SIZES, UNITS } from '../../constants/printSettings';
import { convert, toMm } from '../../utils/measurements';
import InputNumber from '../UI/ImputNumber';

// --- SECCIÓN DE PAPEL ---
export function PaperSettings({ config, setConfig }) {
    return (
        <section className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Settings className="w-3 h-3" /> Papel
            </h3>
            <div className="space-y-3">
                <select
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={config.pageSize}
                    onChange={(e) => setConfig({ ...config, pageSize: e.target.value })}
                >
                    {Object.entries(PAGE_SIZES).map(([key, val]) => (
                        <option key={key} value={key}>{val.name}</option>
                    ))}
                </select>
            </div>
        </section>
    );
}

// --- SECCIÓN DE MÁRGENES ---
export function MarginSettings({ config, setConfig, unit }) {
    // Helpers internos para actualizar márgenes
    const updateMargin = (side, value) => {
        const mm = toMm(Number(value), unit);
        setConfig(prev => ({ ...prev, margins: { ...prev.margins, [side]: mm } }));
    };

    const updateAllMargins = (value) => {
        const mm = toMm(Number(value), unit);
        setConfig(prev => ({ ...prev, margins: { top: mm, right: mm, bottom: mm, left: mm } }));
    };

    return (
        <section className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Maximize className="w-3 h-3" /> Márgenes ({UNITS[unit].label})
                </h3>
                <div className="flex items-center gap-1.5">
                    <input
                        type="checkbox" id="uniformMargins"
                        checked={config.uniformMargins}
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            const newConfig = { ...config, uniformMargins: isChecked };
                            if (isChecked) {
                                const val = config.margins.top;
                                newConfig.margins = { top: val, right: val, bottom: val, left: val };
                            }
                            setConfig(newConfig);
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <label htmlFor="uniformMargins" className="text-[10px] font-medium text-slate-500 cursor-pointer select-none flex items-center gap-1">
                        {config.uniformMargins ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />} Unificar
                    </label>
                </div>
            </div>

            {config.uniformMargins && (
                <div className="mb-3 bg-blue-50 p-2 rounded-md border border-blue-100 animate-in slide-in-from-top-2 fade-in">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-blue-700">Margen Global</label>
                        <span className="text-[10px] font-mono text-blue-600">{convert(config.margins.top, unit)}</span>
                    </div>
                    <input
                        type="range" min="0" max="50" step={UNITS[unit].step}
                        value={convert(config.margins.top, unit)}
                        onChange={(e) => updateAllMargins(e.target.value)}
                        className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
            )}

            <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${config.uniformMargins ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {['top', 'bottom', 'left', 'right'].map(side => (
                    <div key={side}>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            {{ top: 'Superior', bottom: 'Inferior', left: 'Izquierdo', right: 'Derecho' }[side]}
                        </label>
                        <InputNumber
                            valueMm={config.margins[side]}
                            unit={unit}
                            step={UNITS[unit].step}
                            onChange={(val) => updateMargin(side, val)}
                            className="w-full border border-slate-300 rounded p-1.5 text-sm"
                            disabled={config.uniformMargins}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

// --- SECCIÓN DE GUÍAS (Footer) ---
export function PrintGuidesFooter({ config, setConfig }) {
    return (
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
            <input
                type="checkbox" id="printGuides"
                checked={config.printGuides}
                onChange={(e) => setConfig({ ...config, printGuides: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="printGuides" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                Imprimir líneas guía
            </label>
        </div>
    );
}