import React, { useMemo, useState, useEffect } from 'react';
import { Minimize, Maximize, Plus, Scaling, RotateCw, X, Copy, Grid } from 'lucide-react';
import { PAGE_SIZES } from '../../constants/printSettings';
import { mmToPx, convert } from '../../utils/measurements';

export default function StandardGridCanvas({
    zoom,
    setZoom,
    config,
    images,
    handleContextMenu,
    onImageMouseDown,
    onImageLoad,
    onRemoveImage,
    onDuplicateImage,
    onRotateImage,
    onToggleObjectFit,
    onFillPage,
    onUploadClick
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

    // --- ENGINE DE DISEÑO (STANDARDIZED) ---
    const layout = useMemo(() => {
        const pageSize = PAGE_SIZES[config.pageSize];
        const pageWidthMm = pageSize.width;
        const pageHeightMm = pageSize.height;
        const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
        const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;

        const cols = config.cols;
        const rows = config.rows;
        const itemsPerPage = cols * rows;
        const totalGapWidth = config.gap * (config.cols - 1);
        const cellWMm = (contentWidth - totalGapWidth) / config.cols;
        const totalGapHeight = config.gap * (config.rows - 1);
        const cellHMm = (contentHeight - totalGapHeight) / config.rows;

        const totalPages = Math.max(1, Math.ceil(images.length / itemsPerPage));

        const cellWidthPx = mmToPx(cellWMm);
        const cellHeightPx = mmToPx(cellHMm);

        return {
            pageWidthMm, pageHeightMm, contentWidth, contentHeight,
            cols, rows, cellWMm, cellHMm, cellWidthPx, cellHeightPx,
            itemsPerPage, totalPages
        };
    }, [config, images.length, windowSize]);

    return (
        <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">

            <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl">
                <button onClick={() => setZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Minimize className="w-4 h-4" /></button>
                <input type="range" min="0.2" max="3.0" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                <button onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Maximize className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex flex-col gap-8 print:gap-0 shrink-0 items-center p-0 print:p-0 print:block print:h-auto">
                {Array.from({ length: layout.totalPages }).map((_, pageIndex) => (
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

                            <div className={`w-full h-full grid relative ${!config.printGuides ? 'print:!border-none' : ''}`}
                                style={{
                                    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                                    gap: `${config.gap}mm`,
                                    border: config.showGuides ? '1px dashed #e2e8f0' : 'none',
                                    justifyContent: 'stretch',
                                    alignContent: 'stretch'
                                }}>

                                {Array.from({ length: layout.itemsPerPage }).map((_, cellIndex) => {
                                    const imgIndex = pageIndex * layout.itemsPerPage + cellIndex;
                                    const img = images[imgIndex];
                                    const isRotated90 = img && (Math.abs(img.rotation) % 180 === 90);

                                    // Estilos dinámicos para Grid
                                    let dynamicStyle = {};
                                    if (img) {
                                        const cellRatio = layout.cellWidthPx / layout.cellHeightPx;
                                        const imgWidth = isRotated90 ? (img.naturalHeight || 1) : (img.naturalWidth || 1);
                                        const imgHeight = isRotated90 ? (img.naturalWidth || 1) : (img.naturalHeight || 1);

                                        dynamicStyle = {
                                            transform: `translate(calc(-50% + ${img.x}px), calc(-50% + ${img.y}px)) rotate(${img.rotation}deg)`,
                                            position: 'absolute', top: '50%', left: '50%', maxWidth: 'none', maxHeight: 'none',
                                            cursor: img.objectFit === 'cover' ? 'grab' : 'default'
                                        };

                                        if (img.objectFit === 'contain') {
                                            if (isRotated90) { dynamicStyle.width = `${layout.cellHeightPx}px`; dynamicStyle.height = `${layout.cellWidthPx}px`; }
                                            else { dynamicStyle.width = '100%'; dynamicStyle.height = '100%'; dynamicStyle.maxWidth = '100%'; dynamicStyle.maxHeight = '100%'; }
                                            dynamicStyle.objectFit = 'contain'; dynamicStyle.objectPosition = 'center center';
                                        } else {
                                            const imgRatio = imgWidth / imgHeight;
                                            if (isRotated90) {
                                                if (imgRatio > cellRatio) { dynamicStyle.width = `${layout.cellHeightPx}px`; dynamicStyle.height = 'auto'; }
                                                else { dynamicStyle.height = `${layout.cellWidthPx}px`; dynamicStyle.width = 'auto'; }
                                            } else {
                                                if (imgRatio > cellRatio) { dynamicStyle.height = `${layout.cellHeightPx}px`; dynamicStyle.width = 'auto'; }
                                                else { dynamicStyle.width = `${layout.cellWidthPx}px`; dynamicStyle.height = 'auto'; }
                                            }
                                        }
                                    }

                                    return (
                                        <div
                                            key={cellIndex}
                                            className={`relative overflow-hidden group select-none ${!img ? 'flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors' : ''} ${!config.printGuides && !img ? 'print:!border-none' : ''} ${!img && imgIndex === images.length && images.length === 0 ? 'animate-pulse' : ''} cell-container`}
                                            onContextMenu={(e) => handleContextMenu(e, img ? img.id : null)}
                                        >
                                            <div className="absolute top-1 left-1 print:hidden opacity-0 group-hover:opacity-100 pointer-events-none z-20"><span className="text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">{convert(layout.cellWMm, 'mm')} x {convert(layout.cellHMm, 'mm')} mm</span></div>

                                            {!img ? (
                                                (imgIndex <= images.length) ? (
                                                    <div className="text-slate-300 flex flex-col items-center justify-center cursor-pointer w-full h-full print:hidden" onClick={onUploadClick}><Plus className="w-6 h-6 opacity-50" /></div>
                                                ) : null
                                            ) : (
                                                <>
                                                    <img src={img.src} alt={`print-${imgIndex}`} className="transition-transform duration-75 block" style={dynamicStyle} onMouseDown={(e) => onImageMouseDown(e, img)} onLoad={(e) => onImageLoad(img.id, e)} draggable={false} />

                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors print:hidden flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                                                        <div className="pointer-events-auto flex gap-1">
                                                            <button onClick={() => onFillPage(img, layout.itemsPerPage)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Rellenar página"><Grid className="w-4 h-4" /></button>
                                                            <button onClick={() => onToggleObjectFit(img.id)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title={img.objectFit === 'cover' ? "Completa" : "Relleno"}><Scaling className="w-4 h-4" /></button>
                                                            <button onClick={() => onRotateImage(img.id)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Rotar"><RotateCw className="w-4 h-4" /></button>
                                                            <button onClick={() => onDuplicateImage(img)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Duplicar"><Copy className="w-4 h-4" /></button>
                                                            <button onClick={() => onRemoveImage(img.id)} className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 transition" title="Eliminar"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 print:hidden opacity-0 group-hover:opacity-100 pointer-events-none"><span className="text-[9px] bg-black/50 text-white px-1 rounded backdrop-blur-sm">{img.objectFit === 'cover' ? 'Relleno' : 'Completa'}</span></div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-bold print:hidden">Página {pageIndex + 1} de {layout.totalPages}</div>
                    </div>
                ))}
            </div>
        </main>
    );
}
