import React from 'react';
import { Minimize, Maximize } from 'lucide-react';

export default function ZoomControls({ zoom, setZoom, min = 0.2, max = 3.0, step = 0.1, className = '' }) {
    const handleZoomOut = () => {
        setZoom(z => Math.max(min, parseFloat((z - step).toFixed(1))));
    };

    const handleZoomIn = () => {
        setZoom(z => Math.min(max, parseFloat((z + step).toFixed(1))));
    };

    return (
        <div className={`fixed bottom-6 right-8 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl ${className}`}>
            <button
                onClick={handleZoomOut}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
                title="Alejar"
            >
                <Minimize className="w-4 h-4" />
            </button>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-28 sm:w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
                onClick={handleZoomIn}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
                title="Acercar"
            >
                <Maximize className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3 select-none">
                {Math.round(zoom * 100)}%
            </span>
        </div>
    );
}
