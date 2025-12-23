import React, { useMemo, useState, useEffect } from 'react';
import { Minimize, Maximize } from 'lucide-react';
import { PAGE_SIZES } from '../../constants/printSettings';
import { mmToPx, convert } from '../../utils/measurements';

export default function BannerModeCanvas({
    zoom,
    setZoom,
    config,
    isBannerPreview,
    onTotalPagesChange
}) {

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- ENGINE DE DISEÑO (BANNER) ---
    const layout = useMemo(() => {
        const pageSize = PAGE_SIZES[config.pageSize];
        const pageWidthMm = pageSize.width;
        const pageHeightMm = pageSize.height;
        const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
        const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;

        // 1. Convertir la altura de letra deseada (mm) a píxeles
        const fontSizePx = mmToPx(config.bannerHeight || 100);

        // 2. Definir fuente
        // Removed 'bold' check, now checking for isItalic state
        const fontStyle = `${config.isItalic ? 'italic ' : ''}`;
        const fontString = `${fontStyle}${fontSizePx}px "${config.bannerFont || 'Arial'}", sans-serif`;

        // 3. Medir el texto para obtener el ancho total
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = fontString;
        const metrics = ctx.measureText(config.bannerText || 'Texto');
        const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        const bannerTotalWidthPx = metrics.width;
        // Adjust width slightly if outline is thick to prevent clipping?
        // simple approach: standard measurement. 

        const bannerTotalHeightPx = actualHeight;
        const fullLineHeightPx = fontSizePx;

        // Convertir contentWidth/Height a px para calculo de paginas
        const contentWidthPx = mmToPx(contentWidth);
        const contentHeightPx = mmToPx(contentHeight);

        // Número de hojas necesarias
        const colsP = Math.max(1, Math.ceil(bannerTotalWidthPx / contentWidthPx));
        const rowsP = Math.max(1, Math.ceil(fullLineHeightPx / contentHeightPx));
        const totalPages = colsP * rowsP;

        // --- CENTERING LOGIC ---
        // Calculate total canvas size vs content size to center
        const totalCanvasWidthPx = colsP * contentWidthPx;
        const totalCanvasHeightPx = rowsP * contentHeightPx;

        // Center Horizontally
        const centeringX = (totalCanvasWidthPx - bannerTotalWidthPx) / 2;

        // Center Vertically
        const centeringY = (totalCanvasHeightPx - fullLineHeightPx) / 2;


        // Preview Scaling
        // Updated: Base preview size on the TOTAL PAGE AREA, not just the text size.
        const totalW_px = totalCanvasWidthPx;
        const totalH_px = totalCanvasHeightPx;

        const availW = windowSize.width * 0.90;
        const availH = windowSize.height * 0.80;
        const scaleW = availW / totalW_px;
        const scaleH = availH / totalH_px;
        const fitScale = Math.min(scaleW, scaleH, 1);

        return {
            pageWidthMm, pageHeightMm, contentWidth, contentHeight, contentWidthPx, contentHeightPx,
            totalPages, colsP, rowsP,
            bannerTotalWidthPx, bannerTotalHeightPx, fullLineHeightPx,
            previewBaseW: totalW_px,
            previewBaseH: totalH_px,
            centeringX, centeringY, // Export centering values
            fitScale,
            fontString,
            fontSizePx
        };
    }, [config, windowSize]);

    // 4. Report totalPages to parent if needed
    useEffect(() => {
        if (onTotalPagesChange) {
            onTotalPagesChange(layout.totalPages);
        }
    }, [layout.totalPages, onTotalPagesChange]);

    // Helper for outline styles
    const getTextStyle = () => {
        return {
            font: layout.fontString,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            color: config.isOutline ? 'transparent' : (config.bannerColor || '#000000'),
            WebkitTextStroke: config.isOutline ? `${config.bannerStrokeWidth || 1}px ${config.bannerColor || '#000000'}` : 'none',
        };
    };

    return (
        <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">

            <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl">
                <button onClick={() => setZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Minimize className="w-4 h-4" /></button>
                <input type="range" min="0.2" max="3.0" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                <button onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Maximize className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3">{Math.round(zoom * 100)}%</span>
            </div>

            <div className={`flex flex-col gap-8 print:gap-0 shrink-0 items-center p-0 print:p-0 print:block print:h-auto ${isBannerPreview ? 'min-h-full justify-center w-full' : ''}`}>

                {isBannerPreview ? (
                    <div className="flex flex-col items-center justify-center w-full min-h-full p-4 animate-in fade-in zoom-in-95 duration-300">
                        <div
                            className="bg-white shadow-2xl relative border border-slate-300 flex overflow-hidden transition-all duration-300 ease-out"
                            style={{
                                width: `${layout.previewBaseW * layout.fitScale * zoom}px`,
                                height: `${layout.previewBaseH * layout.fitScale * zoom}px`,
                                transform: 'translateZ(0)'
                            }}
                        >
                            <div style={{
                                transform: `scale(${layout.fitScale * zoom})`,
                                transformOrigin: 'top left',
                                width: layout.previewBaseW,
                                height: layout.previewBaseH,
                                position: 'relative',
                                transition: 'transform 300ms ease-out'
                            }}>
                                <span
                                    key={`${config.bannerHeight}-${config.bannerFont}-${config.bannerText}-${config.isItalic}-${config.isOutline}-${config.bannerStrokeWidth}`}
                                    style={{
                                        ...getTextStyle(),
                                        position: 'absolute',
                                        top: layout.centeringY,
                                        left: layout.centeringX,
                                        transition: 'top 300ms ease-out, left 300ms ease-out'
                                    }}
                                >
                                    {config.bannerText || 'Texto'}
                                </span>
                            </div>

                            {/* Grid Overlay for cuts */}
                            <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300">
                                {Array.from({ length: layout.colsP - 1 }).map((_, i) => (
                                    <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l-[3px] border-dashed border-red-500 shadow-sm opacity-90 transition-all duration-300" style={{ left: `${((i + 1) / layout.colsP) * 100}%` }}>
                                        <div className="absolute top-2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20 border border-white/50">Corte V</div>
                                    </div>
                                ))}
                                {Array.from({ length: layout.rowsP - 1 }).map((_, i) => (
                                    <div key={`h-${i}`} className="absolute left-0 right-0 border-t-[3px] border-dashed border-red-500 shadow-sm opacity-90 transition-all duration-300" style={{ top: `${((i + 1) / layout.rowsP) * 100}%` }}>
                                        <div className="absolute left-2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20 border border-white/50">Corte H</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 bg-slate-800 text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-3 z-20 sticky bottom-4 backdrop-blur-md bg-slate-800/90 border border-slate-600">
                            <span>
                                Tamaño: <span className="text-purple-300 text-sm">{Math.round(convert(layout.bannerTotalWidthPx, 'px', 'mm'))} x {Math.round(convert(layout.fullLineHeightPx, 'px', 'mm'))} mm</span>
                            </span>
                            <span className="w-px h-4 bg-slate-600 mx-1"></span>
                            <span><span className="text-purple-300">{layout.colsP} x {layout.rowsP}</span> Hojas</span>
                        </div>
                    </div>
                ) : (
                    Array.from({ length: layout.totalPages }).map((_, pageIndex) => {
                        // Logic for individual page offset
                        const colIndex = pageIndex % layout.colsP;
                        const rowIndex = Math.floor(pageIndex / layout.colsP);

                        // Calculate offset based on grid position + CENTERING
                        const offsetX = -(colIndex * layout.contentWidthPx) + layout.centeringX;
                        const offsetY = -(rowIndex * layout.contentHeightPx) + layout.centeringY;

                        return (
                            <div key={pageIndex} className={`page-wrapper print-no-zoom-outer relative shrink-0 print:block print:overflow-visible ${pageIndex < layout.totalPages - 1 ? 'print:break-after-page' : ''}`} style={{ width: `${layout.pageWidthMm * zoom}mm`, height: `${layout.pageHeightMm * zoom}mm` }}>
                                <div className="bg-white shadow-xl print-no-zoom-inner transition-transform duration-300 origin-top-left print:shadow-none print:m-0 relative overflow-hidden"
                                    style={{
                                        width: `${layout.pageWidthMm}mm`,
                                        height: `${layout.pageHeightMm}mm`,
                                        transform: `scale(${zoom})`,
                                        paddingTop: `${config.margins.top}mm`,
                                        paddingRight: `${config.margins.right}mm`,
                                        paddingBottom: `${config.margins.bottom}mm`,
                                        paddingLeft: `${config.margins.left}mm`
                                    }}>

                                    {/* Content Area */}
                                    <div className="w-full h-full relative overflow-hidden bg-slate-50/10 border border-slate-100/50">
                                        {config.printGuides && <div className="absolute inset-0 border border-purple-200 pointer-events-none z-10"></div>}

                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0,
                                            transform: `translate(${offsetX}px, ${offsetY}px)`,
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none'
                                        }}>
                                            <span style={getTextStyle()}>
                                                {config.bannerText || 'Texto'}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-bold print:hidden">Página {pageIndex + 1} de {layout.totalPages}</div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
