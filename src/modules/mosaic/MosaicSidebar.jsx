import React from 'react';
import { LayoutGrid, Printer, Eye, Lock, Unlock } from 'lucide-react';
import { PaperSettings, MarginSettings, PrintGuidesFooter } from '../../components/layout/PaperMarginControls';
import InputNumber from '../../components/ui/InputNumber';
import Button from '../../components/ui/Button';
import { toMm } from '../../utils/measurements';
import { UNITS } from '../../constants/printSettings';

export default function MosaicSidebar({
    config,
    setConfig,
    unit,
    mosaicImage,
    isMosaicPreview,
    setIsMosaicPreview
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <PaperSettings config={config} setConfig={setConfig} />
            <MarginSettings config={config} setConfig={setConfig} unit={unit} />

            <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5" /> Modo de División
                </h3>

                <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                    <button
                        onClick={() => setConfig({ ...config, mosaicType: 'pieces' })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${config.mosaicType === 'pieces' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Por Piezas (Hojas)
                    </button>
                    <button
                        onClick={() => setConfig({ ...config, mosaicType: 'size' })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${config.mosaicType === 'size' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Por Tamaño Final
                    </button>
                </div>

                {config.mosaicType === 'pieces' ? (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">Columnas (Hojas)</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={config.mosaicCols || 2}
                                onChange={(e) => setConfig({ ...config, mosaicCols: Math.max(1, Number(e.target.value)) })}
                                className="w-full border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">Filas (Hojas)</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={config.mosaicRows || 2}
                                onChange={(e) => setConfig({ ...config, mosaicRows: Math.max(1, Number(e.target.value)) })}
                                className="w-full border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-700">Dimensiones Totales</span>
                            <button
                                onClick={() => setConfig({ ...config, mosaicKeepAspect: !config.mosaicKeepAspect })}
                                className={`text-xs flex items-center gap-1 font-medium px-2 py-0.5 rounded cursor-pointer ${config.mosaicKeepAspect ? 'bg-purple-50 text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {config.mosaicKeepAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                Bloquear Proporción
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1 font-medium">Ancho Total ({UNITS[unit]?.label})</label>
                                <InputNumber
                                    valueMm={config.mosaicTargetWidth || 400}
                                    unit={unit}
                                    step={UNITS[unit]?.step || 1}
                                    onChange={(val) => {
                                        const newWidthMm = toMm(val, unit);
                                        if (config.mosaicKeepAspect && mosaicImage) {
                                            const ratio = (mosaicImage.naturalWidth || 1) / (mosaicImage.naturalHeight || 1);
                                            setConfig({ ...config, mosaicTargetWidth: newWidthMm, mosaicTargetHeight: newWidthMm / ratio });
                                        } else {
                                            setConfig({ ...config, mosaicTargetWidth: newWidthMm });
                                        }
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1 font-medium">Alto Total ({UNITS[unit]?.label})</label>
                                <InputNumber
                                    valueMm={config.mosaicTargetHeight || 400}
                                    unit={unit}
                                    step={UNITS[unit]?.step || 1}
                                    onChange={(val) => {
                                        const newHeightMm = toMm(val, unit);
                                        if (config.mosaicKeepAspect && mosaicImage) {
                                            const ratio = (mosaicImage.naturalWidth || 1) / (mosaicImage.naturalHeight || 1);
                                            setConfig({ ...config, mosaicTargetHeight: newHeightMm, mosaicTargetWidth: newHeightMm * ratio });
                                        } else {
                                            setConfig({ ...config, mosaicTargetHeight: newHeightMm });
                                        }
                                    }}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* BOTÓN PROCESAR / VISTA PREVIA */}
            {mosaicImage && (
                <div className="pt-2">
                    <Button
                        variant={isMosaicPreview ? 'purple' : 'outline'}
                        size="md"
                        onClick={() => setIsMosaicPreview(!isMosaicPreview)}
                        className="w-full"
                        icon={isMosaicPreview ? Printer : Eye}
                    >
                        {isMosaicPreview ? "Procesar Páginas" : "Ajustar Cortes (Vista Previa)"}
                    </Button>
                </div>
            )}

            <PrintGuidesFooter config={config} setConfig={setConfig} color="purple" />
        </div>
    );
}
