import React from 'react';
import { Grid, LayoutGrid, Ruler, Star, Settings, Type, User } from 'lucide-react';

export default function HomeMenu({ navigateTo }) {
    return (
        <div className="grid grid-cols-2 gap-3 p-1">
            <button
                onClick={() => navigateTo('grid')}
                className="aspect-square bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-300 transition-all group cursor-pointer shadow-sm hover:shadow"
            >
                <Grid className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-blue-700">Retícula</span>
            </button>

            <button
                onClick={() => navigateTo('mosaic')}
                className="aspect-square bg-purple-50 hover:bg-purple-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-purple-100 hover:border-purple-300 transition-all group cursor-pointer shadow-sm hover:shadow"
            >
                <LayoutGrid className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-purple-700">Mosaico</span>
            </button>

            <button
                onClick={() => navigateTo('banner')}
                className="aspect-square bg-pink-50 hover:bg-pink-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-pink-100 hover:border-pink-300 transition-all group cursor-pointer shadow-sm hover:shadow"
            >
                <Type className="w-8 h-8 text-pink-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-pink-700 text-center leading-tight">Texto<br />Gigante</span>
            </button>

            <button
                onClick={() => navigateTo('custom')}
                className="aspect-square bg-emerald-50 hover:bg-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-emerald-100 hover:border-emerald-300 transition-all group cursor-pointer shadow-sm hover:shadow"
            >
                <Ruler className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-emerald-700 text-center leading-tight px-1">Retícula<br />Personalizada</span>
            </button>

            <button
                onClick={() => navigateTo('cv')}
                className="bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-300 transition-all group aspect-square cursor-pointer shadow-sm hover:shadow col-span-2 sm:col-span-1"
            >
                <User className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-blue-700 text-center leading-tight">Crear<br />Curriculum</span>
            </button>

            <button
                onClick={() => navigateTo('favorites')}
                className="col-span-2 bg-amber-50 hover:bg-amber-100 rounded-xl p-4 flex items-center justify-center gap-3 border-2 border-amber-100 hover:border-amber-300 transition-all group cursor-pointer shadow-sm hover:shadow"
            >
                <Star className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform fill-amber-500/20" />
                <span className="text-sm font-bold text-amber-700">Favoritos Guardados</span>
            </button>

            <button
                onClick={() => navigateTo('settings')}
                className="col-span-2 bg-slate-50 hover:bg-slate-100 rounded-xl p-4 flex items-center justify-center gap-3 border-2 border-slate-100 hover:border-slate-300 transition-all group cursor-pointer shadow-sm hover:shadow"
            >
                <Settings className="w-5 h-5 text-slate-500 group-hover:rotate-45 transition-transform" />
                <span className="text-sm font-bold text-slate-600">Ajustes Generales</span>
            </button>
        </div>
    );
}
