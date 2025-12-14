import React from 'react';
import { Plus, Scaling, RotateCw, X } from 'lucide-react';

export default function MosaicCanvas({ 
  mosaicImage, 
  config, 
  pageIndex, 
  layout, // { contentWidth, contentHeight } recibidos del layout padre
  
  // Actions
  onContextMenu,
  onUploadClick,
  onToggleFit,
  onRotate,
  onRemove
}) {

  // --- LÓGICA DE CÁLCULO DE RECORTE (TILING) ---
  const getMosaicStyle = () => {
    if (!mosaicImage) return {};
    
    // CASO 1: Modo 1x1 (Comportamiento de imagen normal "single page")
    if (config.mosaicType === 'pieces' && config.mosaicCols === 1 && config.mosaicRows === 1) {
       return {
          width: '100%',
          height: '100%',
          objectFit: mosaicImage.objectFit || 'cover',
          transform: `rotate(${mosaicImage.rotation || 0}deg)`,
          objectPosition: 'center center' 
       };
    }

    // CASO 2: Modo Multi-Página (Estirado/Recorte Gigante)
    let colsP, rowsP;
    
    // Determinar cuántas columnas y filas totales tiene el mosaico
    if (config.mosaicType === 'pieces') {
        colsP = config.mosaicCols;
        rowsP = config.mosaicRows;
    } else {
        // En modo "Por Tamaño", calculamos cuántas páginas caben
        colsP = Math.ceil(config.mosaicTargetWidth / layout.contentWidth);
        rowsP = Math.ceil(config.mosaicTargetHeight / layout.contentHeight);
    }
    
    // Calcular qué "trozo" le toca a esta página (pageIndex)
    const colIndex = pageIndex % colsP;
    const rowIndex = Math.floor(pageIndex / colsP);
    
    // Tamaño total de la imagen gigante en mm
    const totalW = colsP * layout.contentWidth;
    const totalH = rowsP * layout.contentHeight;
    
    return {
       width: `${totalW}mm`,
       height: `${totalH}mm`,
       maxWidth: 'none',
       maxHeight: 'none',
       position: 'absolute',
       top: 0,
       left: 0,
       // Movemos la imagen gigante hacia la izquierda/arriba para mostrar solo el trozo actual
       transform: `translate(-${colIndex * layout.contentWidth}mm, -${rowIndex * layout.contentHeight}mm) rotate(${mosaicImage.rotation || 0}deg)`,
       transformOrigin: `${(totalW/2)}mm ${(totalH/2)}mm`, 
       objectFit: 'fill' 
    };
  };

  const style = getMosaicStyle();

  return (
    <div 
        className="w-full h-full relative border border-purple-200 overflow-hidden" 
        onContextMenu={(e) => onContextMenu(e, 'mosaic')}
    >
        {!mosaicImage ? (
            // ESTADO VACÍO
            <div className="w-full h-full flex flex-col items-center justify-center text-purple-300 cursor-pointer" onClick={onUploadClick}>
                <Plus className="w-12 h-12 mb-2" />
                <span className="text-xs font-bold">Cargar Imagen Base</span>
            </div>
        ) : (
            <div className="w-full h-full relative group">
                {/* IMAGEN RENDERIZADA */}
                <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                    <img src={mosaicImage.src} alt="Mosaic Part" style={style} />
                    
                    {/* GUÍAS VISUALES (Solo en modo multipágina) */}
                    {config.showGuides && config.mosaicType !== 'pieces' && (
                        <div className="absolute inset-0 border border-dashed border-purple-300 opacity-50 pointer-events-none"></div>
                    )}
                </div>
                
                {/* CONTROLES FLOTANTES (Solo visibles en modo 1x1) */}
                {(config.mosaicType === 'pieces' && config.mosaicCols === 1 && config.mosaicRows === 1) && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors print:hidden flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                        <div className="pointer-events-auto flex gap-1">
                            <button onClick={onToggleFit} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title={mosaicImage.objectFit === 'cover' ? "Completa" : "Relleno"}>
                                <Scaling className="w-4 h-4" />
                            </button>
                            <button onClick={onRotate} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Rotar">
                                <RotateCw className="w-4 h-4" />
                            </button>
                            <button onClick={onRemove} className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 transition" title="Eliminar">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}

