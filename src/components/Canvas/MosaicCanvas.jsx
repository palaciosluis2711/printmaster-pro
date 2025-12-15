import React from 'react';
import { Plus, Scaling, RotateCw, X } from 'lucide-react';

export default function MosaicCanvas({
    mosaicImage,
    config,
    pageIndex,
    layout,
    onContextMenu,
    onUploadClick,
    onToggleFit,
    onRotate,
    onRemove
}) {

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
        let colsP, rowsP;
        if (config.mosaicType === 'pieces') {
            colsP = config.mosaicCols;
            rowsP = config.mosaicRows;
        } else {
            colsP = Math.ceil(config.mosaicTargetWidth / layout.contentWidth);
            rowsP = Math.ceil(config.mosaicTargetHeight / layout.contentHeight);
        }

        const colIndex = pageIndex % colsP;
        const rowIndex = Math.floor(pageIndex / colsP);

        const totalW = colsP * layout.contentWidth;
        const totalH = rowsP * layout.contentHeight;

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
            // AÑADIDO: 'mosaic-container' para control de impresión en App.jsx
            className="w-full h-full relative border border-purple-200 overflow-hidden mosaic-container"
            onContextMenu={(e) => onContextMenu(e, 'mosaic')}
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
                        {config.showGuides && config.mosaicType !== 'pieces' && (
                            <div className="absolute inset-0 border border-dashed border-purple-300 opacity-50 pointer-events-none"></div>
                        )}
                    </div>

                    {(config.mosaicType === 'pieces' && config.mosaicCols === 1 && config.mosaicRows === 1) && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors print:hidden flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                            <div className="pointer-events-auto flex gap-1">
                                <button onClick={onToggleFit} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"><Scaling className="w-4 h-4" /></button>
                                <button onClick={onRotate} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"><RotateCw className="w-4 h-4" /></button>
                                <button onClick={onRemove} className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 transition"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


