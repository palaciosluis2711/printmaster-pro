import React from 'react';
import { LayoutGrid, Grid, Ruler, ArrowRight, Star, Type, Sparkles } from 'lucide-react';
import { PAGE_SIZES } from '../../constants/printSettings';

export default function HomeDashboard({ favorites = [], onLoadFavorite }) {
    const recentFavorites = [...favorites].reverse();

    return (
        <main className="flex-1 bg-slate-200/50 flex flex-col items-stretch justify-start print:hidden px-6 sm:px-10 md:px-14 pt-8 pb-6 h-full max-h-screen overflow-hidden w-full">
            <div className="w-full flex flex-col h-full min-h-0 animate-in fade-in zoom-in-95 duration-300">

                {/* Banner de Bienvenida (Estático, no se desplaza) */}
                <div className="shrink-0 text-center mb-6 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-semibold mb-2.5 border border-blue-100/80 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        PrintMaster Pro Studio
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                        Bienvenido a PrintMaster Pro
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                        Selecciona un modo de trabajo en el menú lateral o carga rápidamente cualquiera de tus configuraciones guardadas.
                    </p>
                </div>

                {/* Sección de Recientes */}
                {recentFavorites.length > 0 ? (
                    <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        {/* Cabecera de Recientes (Fija) */}
                        <div className="shrink-0 flex items-center justify-between mb-3.5 px-1 border-b border-slate-300/60 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/70 shadow-xs">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">
                                    Configuraciones Recientes ({recentFavorites.length})
                                </h3>
                            </div>
                            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                                Haz clic en una tarjeta para cargar la configuración
                            </span>
                        </div>

                        {/* Div contenedor con scroll dedicado para las tarjetas */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full" style={{ paddingTop: '1rem' }}>
                                {recentFavorites.map(fav => {
                                    const modeBadge = fav.config.isBannerMode
                                        ? { label: 'Texto Gigante', bg: 'bg-pink-50 text-pink-600 border-pink-100', icon: <Type className="w-5 h-5" /> }
                                        : fav.config.useMosaicMode
                                            ? { label: 'Mosaico', bg: 'bg-purple-50 text-purple-600 border-purple-100', icon: <LayoutGrid className="w-5 h-5" /> }
                                            : fav.config.useCustomSize
                                                ? { label: 'Personalizado', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <Ruler className="w-5 h-5" /> }
                                                : { label: 'Retícula', bg: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Grid className="w-5 h-5" /> };

                                    const pageSizeName = PAGE_SIZES[fav.config.pageSize]?.name.split('(')[0] || 'Carta';

                                    return (
                                        <button
                                            key={fav.id}
                                            onClick={() => onLoadFavorite(fav.config)}
                                            className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 transition-all group text-left relative overflow-hidden cursor-pointer flex flex-col justify-between w-full"
                                        >
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-xl border ${modeBadge.bg} shadow-xs`}>
                                                        {modeBadge.icon}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                    </div>
                                                </div>

                                                <h4 className="font-bold text-slate-800 text-base mb-1.5 truncate group-hover:text-blue-600 transition-colors">
                                                    {fav.name || 'Configuración guardada'}
                                                </h4>
                                            </div>

                                            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                                <span className="font-semibold text-slate-600">{modeBadge.label}</span>
                                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                                                    {pageSizeName}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
                        <div className="border-2 border-dashed border-slate-300 rounded-3xl text-center bg-white/60 max-w-xl mx-auto p-10">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500 mx-auto">
                                <Star className="w-8 h-8 opacity-40 fill-amber-500" />
                            </div>
                            <h4 className="text-base font-bold text-slate-700 mb-1">
                                No tienes configuraciones recientes
                            </h4>
                            <p className="text-slate-400 text-xs max-w-sm mx-auto">
                                Cuando guardes favoritos desde los paneles de Retícula, Mosaico o Banner, aparecerán aquí para acceso rápido.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
