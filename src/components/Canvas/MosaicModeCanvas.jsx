import React, { useMemo, useState, useEffect } from 'react';
import { Minimize, Maximize, Plus, Grid, Image as ImageIcon, Scaling, RotateCw, X } from 'lucide-react';
import { PAGE_SIZES } from '../../constants/printSettings';
import { mmToPx } from '../../utils/measurements';

export default function MosaicModeCanvas({
    zoom,
    setZoom,
    config,
    mosaicImage,
    handleContextMenu,
    isMosaicPreview,
    onUploadClick,
    onRotateMosaic,
    onToggleMosaicFit,
    onRemoveMosaic
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

    // --- ENGINE DE DISEÑO (MOSAIC) ---
    const layout = useMemo(() => {
        const pageSize = PAGE_SIZES[config.pageSize];
        const pageWidthMm = pageSize.width;
        const pageHeightMm = pageSize.height;
        const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
        const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;

        let colsP = 1, rowsP = 1;
        let totalPages = 1;

        if (mosaicImage) {
            if (config.mosaicType === 'pieces') {
                colsP = config.mosaicCols;
                rowsP = config.mosaicRows;
            } else {
                colsP = Math.ceil(config.mosaicTargetWidth / contentWidth);
                rowsP = Math.ceil(config.mosaicTargetHeight / contentHeight);
            }
            totalPages = colsP * rowsP;
        }

        const mosaicTotalW_mm = colsP * contentWidth;
        const mosaicTotalH_mm = rowsP * contentHeight;

        const totalW_px = mmToPx(mosaicTotalW_mm);
        const totalH_px = mmToPx(mosaicTotalH_mm);

        const availW = windowSize.width * 0.90;
        const availH = windowSize.height * 0.80;

        const scaleW = availW / totalW_px;
        const scaleH = availH / totalH_px;
        const fitScale = Math.min(scaleW, scaleH);

        const previewBaseW = totalW_px * fitScale;
        const previewBaseH = totalH_px * fitScale;

        let realImageW_mm = 0;
        let realImageH_mm = 0;

        if (mosaicImage) {
            if (config.mosaicType === 'size') {
                realImageW_mm = config.mosaicTargetWidth;
                realImageH_mm = config.mosaicTargetHeight;
            } else {
                const containerRatio = mosaicTotalW_mm / mosaicTotalH_mm;
                const isRotated = Math.abs(mosaicImage.rotation || 0) % 180 === 90;
                const imgNatW = isRotated ? mosaicImage.naturalHeight : mosaicImage.naturalWidth;
                const imgNatH = isRotated ? mosaicImage.naturalWidth : mosaicImage.naturalHeight;
                const imgRatio = imgNatW / imgNatH;

                if (imgRatio > containerRatio) {
                    realImageW_mm = mosaicTotalW_mm;
                    realImageH_mm = mosaicTotalW_mm / imgRatio;
                } else {
                    realImageH_mm = mosaicTotalH_mm;
                    realImageW_mm = mosaicTotalH_mm * imgRatio;
                }
            }
        }

        return {
            pageWidthMm, pageHeightMm, contentWidth, contentHeight,
            totalPages,
            colsP, rowsP, mosaicTotalW_mm, mosaicTotalH_mm,
            previewBaseW, previewBaseH,
            realImageW_mm, realImageH_mm
        };
    }, [config, mosaicImage, windowSize]);

    // Helper para renderizar cada página del mosaico (Inlined logic from MosaicCanvas)
    const renderMosaicPart = (pageIndex) => {
        const getMosaicStyle = () => {
            if (!mosaicImage) return {};

            // CASO 1: Modo 1x1
            if (config.mosaicType === 'pieces' && config.mosaicCols === 1 && config.mosaicRows === 1) {
                return {
                    width: '100%', height: '100%',
                    objectFit: mosaicImage.objectFit || 'cover',
                    transform: `rotate(${mosaicImage.rotation || 0}deg)`,
                    objectPosition: 'center center'
                };
            }

            // CASO 2: Modo Mosaico (Tiling)
            // Usamos layout.colsP ya calculado
            const colsP = layout.colsP;

            const colIndex = pageIndex % colsP;
            const rowIndex = Math.floor(pageIndex / colsP);

            const totalW = colsP * layout.contentWidth;
            const totalH = layout.rowsP * layout.contentHeight;

            // -- LÓGICA DE CENTRADO --
            let renderW, renderH, offsetX = 0, offsetY = 0;

            if (config.mosaicType === 'size') {
                renderW = config.mosaicTargetWidth;
                renderH = config.mosaicTargetHeight;
                offsetX = (totalW - renderW) / 2;
                offsetY = (totalH - renderH) / 2;
            } else {
                renderW = totalW;
                renderH = totalH;
            }

            return {
                width: `${renderW}mm`,
                height: `${renderH}mm`,
                maxWidth: 'none',
                maxHeight: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translate(${(-colIndex * layout.contentWidth) + offsetX}mm, ${(-rowIndex * layout.contentHeight) + offsetY}mm) rotate(${mosaicImage.rotation || 0}deg)`,
                transformOrigin: `${renderW / 2}mm ${renderH / 2}mm`,
                objectFit: 'contain'
            };
        };

        const style = getMosaicStyle();

        return (
            <div
                className={`w-full h-full relative border overflow-hidden mosaic-container ${config.printGuides ? 'border-purple-200' : 'border-transparent'}`}
                onContextMenu={(e) => handleContextMenu(e, 'mosaic')}
            >
                {!mosaicImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-purple-300 cursor-pointer" onClick={onUploadClick}>
                        <Plus className="w-12 h-12 mb-2" />
                        <span className="text-xs font-bold">Cargar Imagen Base</span>
                    </div>
                ) : (
                    <div className="w-full h-full relative group">
                        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                            <img src={mosaicImage.src} alt="Mosaic Part" style={style} />
                        </div>

                        {(config.mosaicType === 'pieces' && config.mosaicCols === 1 && config.mosaicRows === 1) && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors print:hidden flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                                <div className="pointer-events-auto flex gap-1">
                                    <button onClick={onToggleMosaicFit} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"><Scaling className="w-4 h-4" /></button>
                                    <button onClick={onRotateMosaic} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"><RotateCw className="w-4 h-4" /></button>
                                    <button onClick={onRemoveMosaic} className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 transition"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">

            <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl">
                <button onClick={() => setZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Minimize className="w-4 h-4" /></button>
                <input type="range" min="0.2" max="3.0" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                <button onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Maximize className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3">{Math.round(zoom * 100)}%</span>
            </div>

            <div className={`flex flex-col gap-8 print:gap-0 shrink-0 items-center p-0 print:p-0 print:block print:h-auto ${isMosaicPreview ? 'min-h-full justify-center w-full' : ''}`}>

                {isMosaicPreview || !mosaicImage ? (
                    <div className="flex flex-col items-center justify-center w-full min-h-full p-4 animate-in fade-in zoom-in-95 duration-300">

                        <div
                            className={`bg-white shadow-2xl relative border transition-all duration-150 ease-out origin-center flex items-center justify-center ${!mosaicImage ? 'border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50 cursor-pointer' : 'border-slate-400'}`}
                            style={{
                                width: `${layout.previewBaseW * zoom}px`,
                                height: `${layout.previewBaseH * zoom}px`,
                                minWidth: `${layout.previewBaseW * zoom}px`,
                                minHeight: `${layout.previewBaseH * zoom}px`,
                            }}
                            onContextMenu={(e) => {
                                if (!mosaicImage) {
                                    handleContextMenu(e, 'mosaic-empty');
                                } else {
                                    if (layout.totalPages === 1) {
                                        handleContextMenu(e, 'mosaic-1x1');
                                    } else {
                                        e.preventDefault();
                                    }
                                }
                            }}
                            onClick={!mosaicImage ? onUploadClick : undefined}
                        >
                            {!mosaicImage ? (
                                <div className="text-center p-6 text-slate-400 flex flex-col items-center select-none">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                        <Plus className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-500 mb-1">Cargar Imagen</h3>
                                    <p className="text-xs text-slate-400 max-w-[200px]">Haz clic para cargar una imagen</p>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white overflow-hidden">
                                        <img
                                            src={mosaicImage.src}
                                            alt="Mosaic Preview"
                                            style={{
                                                width: config.mosaicType === 'size' ? `${(layout.realImageW_mm / layout.mosaicTotalW_mm) * 100}%` : '100%',
                                                height: config.mosaicType === 'size' ? `${(layout.realImageH_mm / layout.mosaicTotalH_mm) * 100}%` : '100%',
                                                objectFit: 'contain',
                                                transform: `rotate(${mosaicImage.rotation || 0}deg)`
                                            }}
                                        />
                                    </div>
                                    <div className="absolute inset-0 pointer-events-none z-10">
                                        {Array.from({ length: layout.colsP - 1 }).map((_, i) => (
                                            <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l-[3px] border-dashed border-red-500 shadow-sm opacity-90" style={{ left: `${((i + 1) / layout.colsP) * 100}%` }}>
                                                <div className="absolute top-2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20 border border-white/50">Corte V</div>
                                            </div>
                                        ))}
                                        {Array.from({ length: layout.rowsP - 1 }).map((_, i) => (
                                            <div key={`h-${i}`} className="absolute left-0 right-0 border-t-[3px] border-dashed border-red-500 shadow-sm opacity-90" style={{ top: `${((i + 1) / layout.rowsP) * 100}%` }}>
                                                <div className="absolute left-2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20 border border-white/50">Corte H</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {mosaicImage && (
                            <div className="mt-6 bg-slate-800 text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-3 z-20 sticky bottom-4 backdrop-blur-md bg-slate-800/90 border border-slate-600">
                                <Grid className="w-4 h-4 text-purple-400" />
                                <span>
                                    Tamaño Final Impreso: <span className="text-purple-300 text-sm">{Math.round(layout.realImageW_mm)} x {Math.round(layout.realImageH_mm)} mm</span>
                                </span>
                                <span className="w-px h-4 bg-slate-600 mx-1"></span>
                                <span><span className="text-purple-300">{layout.colsP} x {layout.rowsP}</span> Hojas</span>
                            </div>
                        )}
                    </div>
                ) : (
                    Array.from({ length: layout.totalPages }).map((_, pageIndex) => (
                        <div key={pageIndex} className={`page-wrapper print-no-zoom-outer relative shrink-0 print:block print:overflow-visible ${pageIndex < layout.totalPages - 1 ? 'print:break-after-page' : ''}`} style={{ width: `${layout.pageWidthMm * zoom}mm`, height: `${layout.pageHeightMm * zoom}mm` }}>
                            <div className="bg-white shadow-xl print-no-zoom-inner transition-transform duration-300 origin-top-left print:shadow-none print:m-0 relative"
                                style={{
                                    width: `${layout.pageWidthMm}mm`,
                                    height: `${layout.pageHeightMm}mm`,
                                    transform: `scale(${zoom})`,
                                    paddingTop: `${config.margins.top}mm`,
                                    paddingRight: `${config.margins.right}mm`,
                                    paddingBottom: `${config.margins.bottom}mm`,
                                    paddingLeft: `${config.margins.left}mm`
                                }}>

                                {renderMosaicPart(pageIndex)}

                            </div>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-bold print:hidden">Página {pageIndex + 1} de {layout.totalPages}</div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
