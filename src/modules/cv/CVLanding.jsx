import React, { useState } from 'react';
import { Plus, FileText, Clock, Trash2, Edit3, User, Sparkles, AlertTriangle, X } from 'lucide-react';
import { CV_DEFAULT_PERSONAL_DATA } from './CVSidebar';

export default function CVLanding({
    setConfig,
    cvDrafts = [],
    deleteCVDraft
}) {
    const [draftToDelete, setDraftToDelete] = useState(null);

    const handleCreateNew = () => {
        const initialData = JSON.parse(JSON.stringify(CV_DEFAULT_PERSONAL_DATA));
        const initialSnapshot = JSON.stringify({ personalData: initialData, pageSize: 'carta' });
        setConfig(prev => ({
            ...prev,
            isCVMode: true,
            pageSize: 'carta',
            personalData: initialData,
            step: 1,
            activeDraftId: null,
            lastSavedSnapshot: initialSnapshot
        }));
    };

    const handleLoadDraft = (draft) => {
        const draftPersonal = draft.config?.personalData || JSON.parse(JSON.stringify(CV_DEFAULT_PERSONAL_DATA));
        const draftPageSize = draft.config?.pageSize || 'carta';
        const snapshot = JSON.stringify({ personalData: draftPersonal, pageSize: draftPageSize });
        
        setConfig({
            ...draft.config,
            isCVMode: true,
            pageSize: draftPageSize,
            personalData: draftPersonal,
            step: draft.config.step && draft.config.step > 0 ? draft.config.step : 2,
            activeDraftId: draft.id,
            lastSavedSnapshot: snapshot
        });
    };

    const confirmDelete = () => {
        if (draftToDelete) {
            deleteCVDraft(draftToDelete.id);
            setDraftToDelete(null);
        }
    };

    return (
        <main className="flex-1 bg-slate-200/50 flex flex-col items-stretch justify-start print:hidden px-6 sm:px-10 md:px-14 py-8 overflow-y-auto min-h-full w-full">
            {/* Modal Personalizado de Confirmación de Eliminación */}
            {draftToDelete && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setDraftToDelete(null)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setDraftToDelete(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-red-50/50">
                                <Trash2 className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-1">
                                ¿Eliminar currículum?
                            </h3>
                            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                                Esta acción eliminará permanentemente el borrador seleccionado y no se podrá recuperar.
                            </p>

                            {/* Card Resumen del CV */}
                            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100">
                                    <FileText className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-700 truncate">
                                        {draftToDelete.name || 'Curriculum sin título'}
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        Modificado el {new Date(draftToDelete.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setDraftToDelete(null)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition cursor-pointer"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Creador de Curriculum Vitae
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                            Mis Currículums
                        </h2>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Crea, organiza y edita tus currículums vitae profesionales listos para imprimir o exportar.
                        </p>
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="relative z-10 bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0 cursor-pointer text-sm"
                    >
                        <div className="bg-blue-100 p-1.5 rounded-xl">
                            <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                        <span>Crear Nuevo Curriculum</span>
                    </button>

                    {/* Decorative Background Elements */}
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute left-1/2 -top-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"></div>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Documentos Guardados ({cvDrafts.length})
                        </h3>
                    </div>

                    {cvDrafts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {cvDrafts.map((draft) => {
                                const personal = draft.config?.personalData || {};
                                const fullName = [personal.firstName, personal.secondName, personal.firstSurname, personal.secondSurname]
                                    .filter(Boolean)
                                    .join(' ');

                                return (
                                    <div
                                        key={draft.id}
                                        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {draft.config?.pageSize === 'a4' ? 'A4' : 'Carta'}
                                                </span>
                                            </div>

                                            <h4 className="font-bold text-slate-800 text-base mb-1 truncate group-hover:text-blue-600 transition-colors">
                                                {draft.name || 'Curriculum sin título'}
                                            </h4>

                                            {fullName && (
                                                <p className="text-xs text-slate-500 mb-2 truncate">
                                                    {fullName}
                                                </p>
                                            )}

                                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Modificado: {new Date(draft.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                                            <button
                                                onClick={() => handleLoadDraft(draft)}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" /> Editar
                                            </button>
                                            <button
                                                onClick={() => setDraftToDelete(draft)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                                                title="Eliminar currículum"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 opacity-60" />
                            </div>
                            <h4 className="text-base font-bold text-slate-700 mb-1">
                                No tienes currículums guardados
                            </h4>
                            <p className="text-slate-400 text-xs max-w-sm mb-6">
                                Comienza ahora creando tu primer currículum personalizado con formato profesional y listo para imprimir.
                            </p>
                            <button
                                onClick={handleCreateNew}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Crear Primer Curriculum
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
