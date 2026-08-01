import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil, X, FlipHorizontal, FlipVertical,
  Square, Circle, Lock, Unlock, Check,
  SlidersHorizontal, Crop, RotateCcw,
  SunMedium, Contrast, Droplet, ThermometerSun, RefreshCcw
} from 'lucide-react';

export default function EditModal({ visible, imageId, imgUrl, onClose, onSave }) {
  // --- ESTADOS GLOBALES ---
  const [activeTab, setActiveTab] = useState('view'); // 'view' | 'crop' | 'adjust'

  // --- ESTADOS DE RECORTE ---
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropShape, setCropShape] = useState('rect');
  const [keepAspectRatio, setKeepAspectRatio] = useState(false);
  const [cropSelection, setCropSelection] = useState({ x: 10, y: 10, width: 80, height: 80 });

  // --- ESTADOS DE AJUSTES ---
  const defaultAdjustments = {
    brightness: 100, // %
    contrast: 100,   // %
    saturation: 100, // %
    warmth: 0,       // % (Sepia simulation)
    blur: 0          // px
  };
  const [adjustments, setAdjustments] = useState(defaultAdjustments);

  const cropDragRef = useRef(null);

  // Reiniciar estado al abrir
  useEffect(() => {
    if (visible) {
      setFlipH(false);
      setFlipV(false);
      setCropShape('rect');
      setKeepAspectRatio(false);
      setCropSelection({ x: 10, y: 10, width: 80, height: 80 });
      setAdjustments(defaultAdjustments);
      setActiveTab('view'); // Inicia en modo vista (neutro)
    }
  }, [visible, imgUrl]);

  // --- LÓGICA DE FILTROS CSS ---
  const getFilterString = () => {
    return `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) sepia(${adjustments.warmth}%) blur(${adjustments.blur}px)`;
  };

  // --- LÓGICA DE ARRASTRE DE RECORTE ---
  const handleCropMouseDown = (e, type) => {
    if (activeTab !== 'crop') return; // Solo permitir si estamos en modo crop
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
      if (!cropDragRef.current || !visible || activeTab !== 'crop') return;

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
  }, [visible, keepAspectRatio, cropShape, activeTab]);

  // --- APLICAR EDICIÓN (Canvas Drawing) ---
  const applyEdit = () => {
    const imgElement = document.getElementById('edit-source-image');
    if (!imgElement) return;

    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;

    // 1. Canvas Temporal para Transformaciones y Filtros
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = naturalWidth;
    tempCanvas.height = naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.save();

    // Aplicar Filtros
    tempCtx.filter = getFilterString();

    // Aplicar Flip
    tempCtx.translate(flipH ? naturalWidth : 0, flipV ? naturalHeight : 0);
    tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    tempCtx.drawImage(imgElement, 0, 0);
    tempCtx.restore();

    // 2. Si estamos en modo Crop, recortamos. Si no, usamos la imagen completa.
    let finalCanvas;
    let pixelW, pixelH;

    if (activeTab === 'crop') {
      const pixelX = (cropSelection.x / 100) * naturalWidth;
      const pixelY = (cropSelection.y / 100) * naturalHeight;
      pixelW = (cropSelection.width / 100) * naturalWidth;
      pixelH = (cropSelection.height / 100) * naturalHeight;

      finalCanvas = document.createElement('canvas');
      finalCanvas.width = pixelW;
      finalCanvas.height = pixelH;
      const finalCtx = finalCanvas.getContext('2d');

      if (cropShape === 'round') {
        finalCtx.beginPath();
        finalCtx.ellipse(pixelW / 2, pixelH / 2, pixelW / 2, pixelH / 2, 0, 0, 2 * Math.PI);
        finalCtx.clip();
      }

      finalCtx.drawImage(tempCanvas, pixelX, pixelY, pixelW, pixelH, 0, 0, pixelW, pixelH);
    } else {
      // Modo Ajustes (o View): Guardamos la imagen completa con los filtros aplicados
      finalCanvas = tempCanvas;
      pixelW = naturalWidth;
      pixelH = naturalHeight;
    }

    finalCanvas.toBlob((blob) => {
      const newUrl = URL.createObjectURL(blob);
      onSave(newUrl, pixelW, pixelH);
    }, 'image/png');
  };

  // --- RENDERIZADO DE CONTROLES ---

  const renderCropControls = () => (
    <div className="flex justify-center gap-4 py-2 animate-in fade-in">
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
  );

  const SliderControl = ({ icon: Icon, label, value, onChange, min, max, defaultValue }) => (
    <div className="flex items-center gap-3 w-64">
      <Icon className="w-4 h-4 text-slate-500" />
      <div className="flex-1">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>{label}</span>
          <span>{value}</span>
        </div>
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
      <button onClick={() => onChange(defaultValue)} className="text-slate-300 hover:text-slate-500"><RotateCcw className="w-3 h-3" /></button>
    </div>
  );

  const renderAdjustControls = () => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-2 animate-in fade-in max-w-3xl mx-auto">
      <SliderControl
        icon={SunMedium} label="Brillo" value={adjustments.brightness}
        onChange={(v) => setAdjustments({ ...adjustments, brightness: v })}
        min={0} max={200} defaultValue={100}
      />
      <SliderControl
        icon={Contrast} label="Contraste" value={adjustments.contrast}
        onChange={(v) => setAdjustments({ ...adjustments, contrast: v })}
        min={0} max={200} defaultValue={100}
      />
      <SliderControl
        icon={Droplet} label="Saturación" value={adjustments.saturation}
        onChange={(v) => setAdjustments({ ...adjustments, saturation: v })}
        min={0} max={200} defaultValue={100}
      />
      <SliderControl
        icon={ThermometerSun} label="Calidez / Balance" value={adjustments.warmth}
        onChange={(v) => setAdjustments({ ...adjustments, warmth: v })}
        min={0} max={100} defaultValue={0}
      />
    </div>
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* HEADER Y PESTAÑAS */}
        <div className="bg-slate-50 border-b flex flex-col">
          <div className="p-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Pencil className="w-5 h-5" /> Editor de Imagen</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition"><X className="w-6 h-6" /></button>
          </div>

          {/* TABS DE NAVEGACIÓN */}
          <div className="flex border-t border-slate-200">
            <button
              onClick={() => setActiveTab('crop')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'crop' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <Crop className="w-4 h-4" /> Recortar y Girar
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'adjust' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Ajustes de Color
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTEXTUAL (Cambia según la pestaña) */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 min-h-[60px] flex items-center justify-center">
          {activeTab === 'view' && <span className="text-sm text-slate-400 italic">Selecciona una herramienta arriba para comenzar a editar</span>}
          {activeTab === 'crop' && renderCropControls()}
          {activeTab === 'adjust' && renderAdjustControls()}
        </div>

        {/* AREA DE TRABAJO */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-slate-800 relative overflow-hidden flex items-center justify-center p-8 user-select-none">
          <div id="crop-container" className="relative inline-block shadow-2xl">
            {/* IMAGEN DE ORIGEN CON FILTROS APLICADOS */}
            <img
              id="edit-source-image"
              src={imgUrl}
              alt="Source"
              className="max-h-[55vh] max-w-full block pointer-events-none select-none transition-all duration-100"
              style={{
                transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                filter: getFilterString() // APLICAMOS FILTROS EN TIEMPO REAL
              }}
            />
            <div className="absolute inset-0 bg-black/0 pointer-events-none"></div>

            {/* OVERLAY DE RECORTE (Solo visible en pestaña Crop) */}
            {activeTab === 'crop' && (
              <>
                <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
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

                  {/* Rejilla guía */}
                  {cropShape === 'rect' && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                      <div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
                      <div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
                      <div className="border-r border-white"></div><div className="border-r border-white"></div><div></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
          <div className="text-xs text-slate-400">
            {activeTab === 'adjust' && <button onClick={() => setAdjustments(defaultAdjustments)} className="flex items-center gap-1 hover:text-slate-600"><RefreshCcw className="w-3 h-3" /> Resetear Ajustes</button>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition">Cancelar</button>
            <button onClick={applyEdit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center gap-2"><Check className="w-4 h-4" /> Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
}