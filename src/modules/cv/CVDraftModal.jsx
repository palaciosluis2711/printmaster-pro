import React from 'react';
import { Save } from 'lucide-react';

export default function CVDraftModal({
    isOpen,
    draftName,
    setDraftName,
    onSaveAndExit,
    onExitWithoutSave,
    onCancel
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-in-95 animate-in zoom-in-95 duration-200">
                <div className="bg-blue-600 p-4 text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Save className="w-5 h-5" /> Guardar Borrador
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-4">
                        Estás a punto de salir. ¿Deseas guardar tu progreso en un borrador para continuar después?
                    </p>
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre del Borrador</label>
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: Mi CV 2024..."
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onSaveAndExit}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                            <Save className="w-4 h-4" /> Guardar y Salir
                        </button>
                        <button
                            onClick={onExitWithoutSave}
                            className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                            Salir sin guardar
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full text-slate-400 hover:text-slate-600 text-xs font-medium py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancelar (Quedarse)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
