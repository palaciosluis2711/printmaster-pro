import React, { useState, useRef, useEffect } from 'react';
import { 
  Pencil, X, FlipHorizontal, FlipVertical, 
  Square, Circle, Lock, Unlock, Check 
} from 'lucide-react';

export default function EditModal({ visible, imageId, imgUrl, onClose, onSave }) {
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropShape, setCropShape] = useState('rect');
  const [keepAspectRatio, setKeepAspectRatio] = useState(false);
  const [cropSelection, setCropSelection] = useState({ x: 10, y: 10, width: 80, height: 80 });
  
  const cropDragRef = useRef(null);

  // Reiniciar estado al abrir
  useEffect(() => {
    if (visible) {
      setFlipH(false);
      setFlipV(false);
      setCropShape('rect');
      setKeepAspectRatio(false);
      setCropSelection({ x: 10, y: 10, width: 80, height: 80 });
    }
  }, [visible, imgUrl]);

  // --- LÓGICA DE ARRASTRE DE RECORTE ---
  const handleCropMouseDown = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    cropDragRef.current = { 
      type, 
      startX: e.clientX, 
      startY: e.clientY, 
      startSel: { ...cropSelection } 
    };
  };

  useEffect(() => {
    const handleCropMouseMove = (e) => {
      if (!cropDragRef.current || !visible) return;
      
      const { type, startX, startY, startSel } = cropDragRef.current;
      const container = document.getElementById('crop-container');
      const imgElement = document.getElementById('edit-source-image');
      
      if (!container || !imgElement) return;

      const rect = container.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - startY) / rect.height) * 100;
      const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
      
      let newSel = { ...startSel };
      
      const applySquareRatio = (sel, anchor) => {
         if (anchor === 'width') { sel.height = sel.width * imgRatio; } 
         else { sel.width = sel.height / imgRatio; }
         return sel;
      };

      if (type === 'move') {
        newSel.x = Math.max(0, Math.min(100 - newSel.width, startSel.x + deltaXPercent));
        newSel.y = Math.max(0, Math.min(100 - newSel.height, startSel.y + deltaYPercent));
      } else {
        // Redimensionamiento
        if (type === 'se') { 
            newSel.width = Math.max(5, Math.min(100 - newSel.x, startSel.width + deltaXPercent)); 
            newSel.height = Math.max(5, Math.min(100 - newSel.y, startSel.height + deltaYPercent)); 
        } 
        else if (type === 'sw') { 
            const newX = Math.min(startSel.x + startSel.width - 5, Math.max(0, startSel.x + deltaXPercent)); 
            newSel.width = startSel.width + (startSel.x - newX); 
            newSel.x = newX; 
            newSel.height = Math.max(5, Math.min(100 - newSel.y, startSel.height + deltaYPercent)); 
        } 
        else if (type === 'ne') { 
            newSel.width = Math.max(5, Math.min(100 - newSel.x, startSel.width + deltaXPercent)); 
            const newY = Math.min(startSel.y + startSel.height - 5, Math.max(0, startSel.y + deltaYPercent)); 
            newSel.height = startSel.height + (startSel.y - newY); 
            newSel.y = newY; 
        } 
        else if (type === 'nw') { 
            const newX = Math.min(startSel.x + startSel.width - 5, Math.max(0, startSel.x + deltaXPercent)); 
            const newY = Math.min(startSel.y + startSel.height - 5, Math.max(0, startSel.y + deltaYPercent)); 
            newSel.width = startSel.width + (startSel.x - newX); 
            newSel.height = startSel.height + (startSel.y - newY); 
            newSel.x = newX; 
            newSel.y = newY; 
        }
        
        if (keepAspectRatio || cropShape === 'round') { 
            newSel = applySquareRatio(newSel, 'width'); 
        }
      }
      setCropSelection(newSel);
    };

    const handleCropMouseUp = () => { cropDragRef.current = null; };
    
    if (visible) { 
        window.addEventListener('mousemove', handleCropMouseMove); 
        window.addEventListener('mouseup', handleCropMouseUp); 
    }
    
    return () => { 
        window.removeEventListener('mousemove', handleCropMouseMove); 
        window.removeEventListener('mouseup', handleCropMouseUp); 
    };
  }, [visible, keepAspectRatio, cropShape]);

  // --- APLICAR EDICIÓN (Canvas Drawing) ---
  const applyEdit = () => {
    const imgElement = document.getElementById('edit-source-image');
    if (!imgElement) return;

    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;
    
    // 1. Aplicar transformaciones (Flip)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = naturalWidth; 
    tempCanvas.height = naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.save();
    tempCtx.translate(flipH ? naturalWidth : 0, flipV ? naturalHeight : 0);
    tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    tempCtx.drawImage(imgElement, 0, 0);
    tempCtx.restore();

    // 2. Aplicar Recorte
    const finalCanvas = document.createElement('canvas');
    const pixelX = (cropSelection.x / 100) * naturalWidth;
    const pixelY = (cropSelection.y / 100) * naturalHeight;
    const pixelW = (cropSelection.width / 100) * naturalWidth;
    const pixelH = (cropSelection.height / 100) * naturalHeight;
    
    finalCanvas.width = pixelW; 
    finalCanvas.height = pixelH;
    const finalCtx = finalCanvas.getContext('2d');

    if (cropShape === 'round') {
      finalCtx.beginPath();
      finalCtx.ellipse(pixelW / 2, pixelH / 2, pixelW / 2, pixelH / 2, 0, 0, 2 * Math.PI);
      finalCtx.clip(); 
    }
    
    finalCtx.drawImage(tempCanvas, pixelX, pixelY, pixelW, pixelH, 0, 0, pixelW, pixelH);

    finalCanvas.toBlob((blob) => {
      const newUrl = URL.createObjectURL(blob);
      onSave(newUrl, pixelW, pixelH); // Retornar al padre
    }, 'image/png');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="p-3 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Pencil className="w-5 h-5" /> Editor de Imagen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition"><X className="w-6 h-6" /></button>
        </div>
        
        {/* TOOLBAR */}
        <div className="bg-slate-100 p-2 flex justify-center gap-4 border-b border-slate-200">
          <div className="flex gap-2 border-r border-slate-300 pr-4">
            <button onClick={() => setFlipH(!flipH)} className={`p-2 rounded hover:bg-white hover:shadow-sm transition flex flex-col items-center gap-1 ${flipH ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`} title="Espejo Horizontal"><FlipHorizontal className="w-5 h-5" /><span className="text-[10px] font-bold">Horiz.</span></button>
            <button onClick={() => setFlipV(!flipV)} className={`p-2 rounded hover:bg-white hover:shadow-sm transition flex flex-col items-center gap-1 ${flipV ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`} title="Espejo Vertical"><FlipVertical className="w-5 h-5" /><span className="text-[10px] font-bold">Vert.</span></button>
          </div>
          <div className="flex gap-2 border-r border-slate-300 pr-4">
             <button onClick={() => { setCropShape('rect'); setKeepAspectRatio(false); }} className={`p-2 rounded hover:bg-white hover:shadow-sm transition flex flex-col items-center gap-1 ${cropShape === 'rect' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`} title="Recorte Rectangular"><Square className="w-5 h-5" /><span className="text-[10px] font-bold">Rect.</span></button>
             <button onClick={() => { setCropShape('round'); setKeepAspectRatio(true); }} className={`p-2 rounded hover:bg-white hover:shadow-sm transition flex flex-col items-center gap-1 ${cropShape === 'round' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`} title="Recorte Circular"><Circle className="w-5 h-5" /><span className="text-[10px] font-bold">Circ.</span></button>
          </div>
          <div className="flex gap-2 items-center">
              <button onClick={() => setKeepAspectRatio(!keepAspectRatio)} className={`p-2 rounded hover:bg-white hover:shadow-sm transition flex flex-col items-center gap-1 ${keepAspectRatio ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`} title="Mantener Proporción 1:1">{keepAspectRatio ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}<span className="text-[10px] font-bold">1:1</span></button>
          </div>
        </div>

        {/* AREA DE TRABAJO */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-slate-800 relative overflow-hidden flex items-center justify-center p-8 user-select-none">
          <div id="crop-container" className="relative inline-block shadow-2xl">
            <img 
              id="edit-source-image" 
              src={imgUrl} 
              alt="Source" 
              className="max-h-[55vh] max-w-full block pointer-events-none select-none transition-transform duration-200" 
              style={{ transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }} 
            />
            <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
            
            {/* OVERLAY DE RECORTE */}
            <div 
              className={`absolute border-2 border-white box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move ${cropShape === 'round' ? 'rounded-full' : ''}`} 
              style={{ left: `${cropSelection.x}%`, top: `${cropSelection.y}%`, width: `${cropSelection.width}%`, height: `${cropSelection.height}%` }} 
              onMouseDown={(e) => handleCropMouseDown(e, 'move')}
            >
              {/* Nodos de redimensión */}
              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-blue-500 border-2 border-white cursor-nw-resize rounded-full shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleCropMouseDown(e, 'nw')}></div>
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 border-2 border-white cursor-ne-resize rounded-full shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleCropMouseDown(e, 'ne')}></div>
              <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-blue-500 border-2 border-white cursor-sw-resize rounded-full shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleCropMouseDown(e, 'sw')}></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 border-2 border-white cursor-se-resize rounded-full shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleCropMouseDown(e, 'se')}></div>
              
              {/* Rejilla guía (Regla de tercios) */}
              {cropShape === 'rect' && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                    <div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
                    <div className="border-r border-white"></div><div className="border-r border-white"></div><div></div>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition">Cancelar</button>
          <button onClick={applyEdit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center gap-2"><Check className="w-4 h-4"/> Aplicar Cambios</button>
        </div>
      </div>
    </div>
  );
}