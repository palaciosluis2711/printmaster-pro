import React, { useMemo, useState, useEffect } from 'react';
import { 
  Minimize, 
  Maximize, 
  Plus, 
  Scaling, 
  RotateCw, 
  X, 
  Grid, 
  Copy 
} from 'lucide-react';

import { PAGE_SIZES } from '../../constants/printSettings';
import { mmToPx, convert } from '../../utils/measurements';
import MosaicCanvas from './MosaicCanvas';

export default function MainCanvas({ 
  zoom, 
  setZoom, 
  config, 
  images, 
  mosaicImage, 
  handleContextMenu, 
  isMosaicPreview, 
  
  // Actions from hooks
  onImageMouseDown,
  onImageLoad,
  onRemoveImage,
  onDuplicateImage,
  onRotateImage,
  onToggleObjectFit,
  onFillPage,
  onRotateMosaic,
  onToggleMosaicFit,
  onRemoveMosaic,
  
  // Actions for empty states
  onUploadClick
}) {
  
  // --- DETECTAR TAMAÑO DE PANTALLA (Para ajuste responsive preciso) ---
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

  // --- CÁLCULOS DE DISEÑO (Layout Engine) ---
  const layout = useMemo(() => {
    const pageSize = PAGE_SIZES[config.pageSize];
    const pageWidthMm = pageSize.width;
    const pageHeightMm = pageSize.height;
    const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
    const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;

    let cols, rows, cellWMm, cellHMm, itemsPerPage, totalPages;
    let colsP = 1, rowsP = 1;

    if (!config.useMosaicMode) {
      // --- Lógica Retícula ---
      if (config.useCustomSize) {
        const w = config.customWidth;
        const h = config.customHeight;
        const g = config.gap;
        const maxCols = Math.floor((contentWidth + g) / (w + g));
        const maxRows = Math.floor((contentHeight + g) / (h + g));
        cols = Math.max(1, maxCols);
        rows = Math.max(1, maxRows);
        cellWMm = w;
        cellHMm = h;
        const maxPossible = cols * rows;
        const limit = config.customMaxItems > 0 ? config.customMaxItems : maxPossible;
        itemsPerPage = Math.min(maxPossible, limit);
      } else {
        cols = config.cols;
        rows = config.rows;
        itemsPerPage = cols * rows;
        const totalGapWidth = config.gap * (config.cols - 1);
        cellWMm = (contentWidth - totalGapWidth) / config.cols;
        const totalGapHeight = config.gap * (config.rows - 1);
        cellHMm = (contentHeight - totalGapHeight) / config.rows;
      }
      totalPages = Math.max(1, Math.ceil(images.length / itemsPerPage));
    } else {
      // --- Lógica Mosaico ---
      if (mosaicImage) {
        if (config.mosaicType === 'pieces') {
          colsP = config.mosaicCols;
          rowsP = config.mosaicRows;
        } else {
          colsP = Math.ceil(config.mosaicTargetWidth / contentWidth);
          rowsP = Math.ceil(config.mosaicTargetHeight / contentHeight);
        }
        totalPages = colsP * rowsP;
        itemsPerPage = 1; 
      } else {
        itemsPerPage = 1;
        totalPages = 1; 
      }
    }

    const cellWidthPx = mmToPx(cellWMm);
    const cellHeightPx = mmToPx(cellHMm);

    // Dimensiones totales en mm
    const mosaicTotalW_mm = colsP * contentWidth;
    const mosaicTotalH_mm = rowsP * contentHeight;
    
    // --- CÁLCULO DE VISTA PREVIA RESPONSIVE ---
    // 1. Convertimos el tamaño físico total a píxeles base
    const totalW_px = mmToPx(mosaicTotalW_mm);
    const totalH_px = mmToPx(mosaicTotalH_mm);

    // 2. Definimos el espacio disponible en pantalla (ej. 90% ancho, 80% alto)
    const availW = windowSize.width * 0.90;
    const availH = windowSize.height * 0.80;

    // 3. Calculamos el factor de escala para que "quepa" sin deformarse (Fit)
    const scaleW = availW / totalW_px;
    const scaleH = availH / totalH_px;
    const fitScale = Math.min(scaleW, scaleH); // Usamos el menor para asegurar que quepa todo

    // 4. Dimensiones finales base (Zoom 1.0)
    const previewBaseW = totalW_px * fitScale;
    const previewBaseH = totalH_px * fitScale;

    return { 
        pageWidthMm, pageHeightMm, contentWidth, contentHeight, 
        cols, rows, cellWMm, cellHMm, cellWidthPx, cellHeightPx,
        itemsPerPage, totalPages,
        colsP, rowsP, mosaicTotalW_mm, mosaicTotalH_mm,
        previewBaseW, previewBaseH // Dimensiones calculadas para preview
    };
  }, [config, images.length, mosaicImage, windowSize]);

  return (
    <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">
      
      {/* ZOOM CONTROLS (Siempre visibles) */}
      <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl">
          <button onClick={() => setZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Minimize className="w-4 h-4" /></button>
          <input type="range" min="0.2" max="3.0" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          <button onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition"><Maximize className="w-4 h-4" /></button>
          <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3">{Math.round(zoom * 100)}%</span>
      </div>

      <div className={`flex flex-col gap-8 print:gap-0 shrink-0 items-center pb-32 print:pb-0 ${isMosaicPreview && config.useMosaicMode ? 'min-h-full justify-center w-full' : ''}`}>
        {/* === MODO VISTA PREVIA MOSAICO (Cortes) === */}
        {config.useMosaicMode && isMosaicPreview && mosaicImage ? (
           <div className="flex flex-col items-center justify-center w-full min-h-full p-4 animate-in fade-in zoom-in-95 duration-300">
               
               {/* CONTENEDOR RESPONSIVE CON ZOOM LINEAL (Sin deformación) */}
               <div 
                  className="bg-white shadow-2xl relative border border-slate-400 transition-all duration-150 ease-out origin-center"
                  style={{
                      // Aplicamos el tamaño base ajustado a pantalla * el zoom del usuario
                      width: `${layout.previewBaseW * zoom}px`,
                      height: `${layout.previewBaseH * zoom}px`,
                      // Esto asegura que si el zoom es alto, no se deforme, solo crezca
                      minWidth: `${layout.previewBaseW * zoom}px`, 
                      minHeight: `${layout.previewBaseH * zoom}px`,
                  }}
               >
                    {/* IMAGEN BASE: CONTAIN */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white overflow-hidden">
                        <img 
                          src={mosaicImage.src} 
                          alt="Mosaic Preview" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain', 
                            transform: `rotate(${mosaicImage.rotation || 0}deg)`
                          }} 
                        />
                    </div>

                    {/* GRIDS DE CORTE */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {/* Líneas Verticales */}
                        {Array.from({length: layout.colsP - 1}).map((_, i) => (
                           <div 
                              key={`v-${i}`} 
                              className="absolute top-0 bottom-0 border-l-[3px] border-dashed border-red-500 shadow-sm opacity-90"
                              style={{ left: `${((i + 1) / layout.colsP) * 100}%` }}
                           >
                              {/* Etiqueta de corte mejorada */}
                              <div className="absolute top-2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20 border border-white/50">
                                Corte V
                              </div>
                           </div>
                        ))}
                        
                        {/* Líneas Horizontales */}
                        {Array.from({length: layout.rowsP - 1}).map((_, i) => (
                           <div 
                              key={`h-${i}`} 
                              className="absolute left-0 right-0 border-t-[3px] border-dashed border-red-500 shadow-sm opacity-90"
                              style={{ top: `${((i + 1) / layout.rowsP) * 100}%` }}
                           >
                              <div className="absolute left-2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20 border border-white/50">
                                Corte H
                              </div>
                           </div>
                        ))}
                    </div>
               </div>

               {/* INFO TEXT */}
               <div className="mt-6 bg-slate-800 text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-3 z-20 sticky bottom-4 backdrop-blur-md bg-slate-800/90 border border-slate-600">
                    <Grid className="w-4 h-4 text-purple-400"/>
                    <span>Tamaño Final: <span className="text-purple-300">{Math.round(layout.mosaicTotalW_mm)} x {Math.round(layout.mosaicTotalH_mm)} mm</span></span>
                    <span className="w-px h-4 bg-slate-600 mx-1"></span>
                    <span><span className="text-purple-300">{layout.colsP} x {layout.rowsP}</span> Hojas</span>
               </div>
           </div>
        ) : (
          /* === MODO PÁGINAS PARA IMPRIMIR === */
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
                
                {config.useMosaicMode ? (
                   <MosaicCanvas 
                      mosaicImage={mosaicImage}
                      config={config}
                      pageIndex={pageIndex}
                      layout={layout}
                      onContextMenu={handleContextMenu}
                      onUploadClick={onUploadClick}
                      onToggleFit={onToggleMosaicFit}
                      onRotate={onRotateMosaic}
                      onRemove={onRemoveMosaic}
                   />
                ) : (
                  // --- MODO RETÍCULA (GRID) ---
                  <div className={`w-full h-full grid relative ${!config.printGuides ? 'print:!border-none' : ''}`} 
                       style={{ 
                          gridTemplateColumns: config.useCustomSize ? `repeat(${layout.cols}, ${layout.cellWMm}mm)` : `repeat(${layout.cols}, 1fr)`, 
                          gridTemplateRows: config.useCustomSize ? `repeat(${layout.rows}, ${layout.cellHMm}mm)` : `repeat(${layout.rows}, 1fr)`, 
                          gap: `${config.gap}mm`, 
                          border: config.showGuides ? '1px dashed #e2e8f0' : 'none', 
                          justifyContent: config.useCustomSize ? 'center' : 'stretch', 
                          alignContent: config.useCustomSize ? 'start' : 'stretch' 
                       }}>
                      
                      {Array.from({ length: layout.itemsPerPage }).map((_, cellIndex) => {
                        const imgIndex = pageIndex * layout.itemsPerPage + cellIndex;
                        const img = images[imgIndex];
                        const isRotated90 = img && (Math.abs(img.rotation) % 180 === 90);
                        
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
                            style={config.useCustomSize ? { width: `${layout.cellWMm}mm`, height: `${layout.cellHMm}mm` } : {}} 
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
                )}
              </div>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-bold print:hidden">Página {pageIndex + 1} de {layout.totalPages}</div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}