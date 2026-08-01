import React from 'react';
import { Cloud, Trash2 } from 'lucide-react';
import { PAGE_SIZES } from '../../constants/printSettings';

export default function FavoritesSidebar({
    favorites = [],
    setConfig,
    deleteFavorite,
    navigateTo
}) {
    const handleLoadFavorite = (fav) => {
        setConfig(fav.config);
        if (fav.config.isBannerMode) navigateTo('banner');
        else if (fav.config.useMosaicMode) navigateTo('mosaic');
        else if (fav.config.useCustomSize) navigateTo('custom');
        else navigateTo('grid');
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Cloud className="w-3.5 h-3.5 text-amber-500" /> Mis Favoritos
                    </h3>
                </div>

                {favorites.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                        No tienes configuraciones guardadas.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {favorites.map(fav => (
                            <li
                                key={fav.id}
                                className="flex justify-between items-center group bg-white p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all"
                            >
                                <button
                                    onClick={() => handleLoadFavorite(fav)}
                                    className="text-slate-700 font-semibold hover:text-blue-600 truncate flex-1 text-left text-xs flex flex-col cursor-pointer"
                                >
                                    <span>{fav.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                                        {fav.config.isBannerMode
                                            ? 'Texto Gigante'
                                            : (fav.config.useMosaicMode
                                                ? 'Mosaico'
                                                : (fav.config.useCustomSize ? 'Personalizado' : 'Retícula'))} - {PAGE_SIZES[fav.config.pageSize]?.name.split('(')[0]}
                                    </span>
                                </button>
                                <button
                                    onClick={() => deleteFavorite(fav.id)}
                                    className="text-slate-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                                    title="Eliminar favorito"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
