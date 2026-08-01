import React from 'react';
import { Grid, RotateCw } from 'lucide-react';
import { PaperSettings, MarginSettings, PrintGuidesFooter } from '../../components/layout/PaperMarginControls';
import Slider from '../../components/ui/Slider';
import { convert } from '../../utils/measurements';
import { UNITS } from '../../constants/printSettings';

export default function GridSidebar({
    config,
    setConfig,
    unit,
    setImages,
    rotateAllImages
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <PaperSettings config={config} setConfig={setConfig} />
            <MarginSettings config={config} setConfig={setConfig} unit={unit} />

            <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5" /> Configuración de Retícula
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">Columnas</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={config.cols || 2}
                            onChange={(e) => setConfig({ ...config, cols: Math.max(1, Number(e.target.value)) })}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">Filas</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={config.rows || 2}
                            onChange={(e) => setConfig({ ...config, rows: Math.max(1, Number(e.target.value)) })}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <Slider
                        label="Espaciado"
                        value={config.gap || 0}
                        displayValue={convert(config.gap || 0, unit)}
                        unit={UNITS[unit]?.label}
                        min={0}
                        max={50}
                        step={0.5}
                        onChange={(val) => setConfig(prev => ({ ...prev, gap: val }))}
                        color="blue"
                    />
                </div>
            </section>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Acciones Rápidas</h4>
                <div className="flex gap-2">
                    <button
                        onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'contain', x: 0, y: 0 })))}
                        className="flex-1 text-xs bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 py-1.5 rounded-lg text-slate-700 font-medium transition cursor-pointer shadow-2xs"
                    >
                        Completa
                    </button>
                    <button
                        onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'cover' })))}
                        className="flex-1 text-xs bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 py-1.5 rounded-lg text-slate-700 font-medium transition cursor-pointer shadow-2xs"
                    >
                        Relleno
                    </button>
                    <button
                        onClick={rotateAllImages}
                        className="flex-1 text-xs bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 py-1.5 rounded-lg text-slate-700 font-medium transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                        <RotateCw className="w-3 h-3" /> Rotar
                    </button>
                </div>
            </div>

            <PrintGuidesFooter config={config} setConfig={setConfig} color="blue" />
        </div>
    );
}
