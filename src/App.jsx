import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Upload, 
  Trash2, 
  RotateCw, 
  Grid, 
  Settings, 
  X, 
  Plus, 
  Copy,
  Maximize,
  Minimize,
  Save,
  Star,
  Check,
  Scaling,
} from 'lucide-react';

// --- CONFIGURACIÓN DE TAMAÑOS ---
const PAGE_SIZES = {
  carta: { name: 'Carta (Letter)', width: 215.9, height: 279.4 },
  oficio: { name: 'Oficio (Legal)', width: 215.9, height: 355.6 },
  a4: { name: 'A4', width: 210, height: 297 },
  tabloide: { name: 'Tabloide (11x17)', width: 279.4, height: 431.8 },
  fotografia: { name: '4x6" (10x15cm)', width: 101.6, height: 152.4 }
};

// --- UTILIDADES DE CONVERSIÓN ---
const UNITS = {
  mm: { label: 'mm', factor: 1, step: 1, decimals: 0 },
  cm: { label: 'cm', factor: 0.1, step: 0.1, decimals: 1 },
  in: { label: 'in', factor: 0.0393701, step: 0.05, decimals: 2 }
};

const convert = (valMm, unit) => (valMm * UNITS[unit].factor).toFixed(UNITS[unit].decimals);
const toMm = (val, unit) => val / UNITS[unit].factor;
// Factor aproximado para convertir MM a Píxeles en pantalla (96 DPI standard)
const mmToPx = (mm) => mm * 3.7795275591; 

export default function App() {
  // --- ESTADO PRINCIPAL ---
  const [unit, setUnit] = useState('mm');
  const [images, setImages] = useState([]);
  const [zoom, setZoom] = useState(0.8);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('printmaster_favs');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado para el arrastre (Panning)
  const dragRef = useRef(null); 

  // Configuración de la hoja
  const [config, setConfig] = useState({
    pageSize: 'carta',
    cols: 2,
    rows: 2,
    gap: 5, // mm
    margins: { top: 10, right: 10, bottom: 10, left: 10 }, // mm
    showGuides: true,
    printGuides: false // Nueva opción para imprimir guías
  });

  const [newFavName, setNewFavName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Cálculos de dimensiones de celda en MM (Siempre Vertical)
  const currentPage = PAGE_SIZES[config.pageSize];
  const pageWidthMm = currentPage.width;
  const pageHeightMm = currentPage.height;
  
  const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
  const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;
  const totalGapWidth = config.gap * (config.cols - 1);
  const cellWidthMm = (contentWidth - totalGapWidth) / config.cols;
  const totalGapHeight = config.gap * (config.rows - 1);
  const cellHeightMm = (contentHeight - totalGapHeight) / config.rows;

  // Cálculos de dimensiones en Píxeles (Para sincronizar Style y Drag Logic)
  const cellWidthPx = mmToPx(cellWidthMm);
  const cellHeightPx = mmToPx(cellHeightMm);

  // --- LÓGICA DE PAGINACIÓN ---
  const itemsPerPage = config.cols * config.rows;
  const totalPages = Math.max(1, Math.ceil(images.length / itemsPerPage));

  // --- MANEJO DE IMÁGENES ---
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const newImages = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      src: URL.createObjectURL(file),
      rotation: 0,
      objectFit: 'cover',
      x: 0, 
      y: 0, 
      name: file.name,
      naturalWidth: 1, 
      naturalHeight: 1
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleFileUpload = (e) => handleFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageLoad = (id, e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, naturalWidth, naturalHeight } : img
    ));
  };

  // --- LÓGICA DE ARRASTRE (PANNING) CON LÍMITES ---
  const handleMouseDown = (e, img) => {
    if (img.objectFit !== 'cover') return;
    e.preventDefault();
    
    dragRef.current = {
      id: img.id,
      startX: e.clientX,
      startY: e.clientY,
      initialImgX: img.x || 0,
      initialImgY: img.y || 0,
      imgRotation: img.rotation,
      imgNatW: img.naturalWidth,
      imgNatH: img.naturalHeight
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;

      const { id, startX, startY, initialImgX, initialImgY, imgRotation, imgNatW, imgNatH } = dragRef.current;
      
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      const cellW_px = cellWidthPx;
      const cellH_px = cellHeightPx;
      
      const isRotated90 = Math.abs(imgRotation) % 180 === 90;
      const cellRatio = cellW_px / cellH_px;
      const imgRatio = (isRotated90 ? imgNatH : imgNatW) / (isRotated90 ? imgNatW : imgNatH);

      let renderW_px, renderH_px;
      
      if (isRotated90) {
        if (imgRatio > cellRatio) {
           renderH_px = cellH_px; 
           renderW_px = cellH_px * imgRatio;
        } else {
           renderW_px = cellW_px;
           renderH_px = cellW_px / imgRatio;
        }
      } else {
        if (imgRatio > cellRatio) {
           renderH_px = cellH_px;
           renderW_px = cellH_px * imgRatio;
        } else {
           renderW_px = cellW_px;
           renderH_px = cellW_px / imgRatio;
        }
      }

      const maxX = Math.max(0, (renderW_px - cellW_px) / 2);
      const maxY = Math.max(0, (renderH_px - cellH_px) / 2);

      setImages(prev => prev.map(img => {
        if (img.id === id) {
          let nextX = initialImgX + deltaX;
          let nextY = initialImgY + deltaY;

          nextX = Math.max(-maxX, Math.min(maxX, nextX));
          nextY = Math.max(-maxY, Math.min(maxY, nextY));

          return { ...img, x: nextX, y: nextY };
        }
        return img;
      }));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoom, cellWidthPx, cellHeightPx]); 

  // --- ACCIONES DE IMAGEN ---
  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));
  
  const duplicateImage = (img) => {
    const dup = { ...img, id: crypto.randomUUID(), x: 0, y: 0 }; 
    setImages(prev => [...prev, dup]);
  };

  const rotateImage = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 } : img
    ));
  };

  // NUEVA FUNCIÓN: Rotar todas las imágenes
  const rotateAllImages = () => {
    setImages(prev => prev.map(img => ({
      ...img, 
      rotation: (img.rotation + 90) % 360, 
      x: 0, // Reset posición al rotar para evitar desbordes visuales extraños
      y: 0 
    })));
  };

  const toggleObjectFit = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { 
        ...img, 
        objectFit: img.objectFit === 'cover' ? 'contain' : 'cover',
        x: 0, 
        y: 0 
      } : img
    ));
  };

  // --- GESTIÓN DE FAVORITOS ---
  const saveConfiguration = () => {
    if (!newFavName.trim()) return;
    const newFav = { id: Date.now(), name: newFavName, config };
    const updatedFavs = [...favorites, newFav];
    setFavorites(updatedFavs);
    localStorage.setItem('printmaster_favs', JSON.stringify(updatedFavs));
    setNewFavName('');
    setShowSaveModal(false);
  };

  const loadConfiguration = (favConfig) => {
    const { orientation, ...rest } = favConfig;
    setConfig(rest);
  };

  const deleteFavorite = (id) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('printmaster_favs', JSON.stringify(updated));
  };

  // --- UTILIDADES UI ---
  const updateMargin = (side, value) => {
    const mmValue = toMm(Number(value), unit);
    setConfig(prev => ({
      ...prev,
      margins: { ...prev.margins, [side]: mmValue }
    }));
  };

  return (
    <div 
      className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col h-screen overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      
      {/* --- HEADER --- */}
      <header className="bg-blue-700 text-white p-3 shadow-md flex justify-between items-center z-20 print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="w-6 h-6" />
          <h1 className="text-lg font-bold">PrintMaster <span className="font-light opacity-80">Pro</span></h1>
        </div>

        <div className="flex gap-2 items-center">
          <button 
             onClick={() => setShowSettingsModal(true)}
             className="p-2 mr-2 text-blue-200 hover:text-white hover:bg-blue-600/50 rounded-full transition"
             title="Configuración Global"
          >
             <Settings className="w-5 h-5" />
          </button>

          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Subir Fotos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shadow-sm z-10 print:hidden">
          <div className="p-5 space-y-6 flex-1">
            
            {/* Favoritos */}
            <section className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Star className="w-3 h-3" /> Favoritos
                </h3>
                <button 
                  onClick={() => setShowSaveModal(true)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> Guardar actual
                </button>
              </div>
              
              {showSaveModal && (
                <div className="mb-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Nombre (ej. Pasaporte)" 
                    className="flex-1 text-xs border p-1 rounded"
                    value={newFavName}
                    onChange={e => setNewFavName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveConfiguration()}
                  />
                  <button onClick={saveConfiguration} className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700"><Check className="w-3 h-3"/></button>
                  <button onClick={() => setShowSaveModal(false)} className="bg-slate-200 text-slate-600 px-2 rounded hover:bg-slate-300"><X className="w-3 h-3"/></button>
                </div>
              )}

              {favorites.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay configuraciones guardadas.</p>
              ) : (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {favorites.map(fav => (
                    <li key={fav.id} className="flex justify-between items-center group text-sm">
                      <button onClick={() => loadConfiguration(fav.config)} className="text-slate-700 hover:text-blue-600 truncate flex-1 text-left">
                        {fav.name}
                      </button>
                      <button onClick={() => deleteFavorite(fav.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <hr className="border-slate-100" />

            {/* Papel */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Settings className="w-3 h-3" /> Papel
              </h3>
              <div className="space-y-3">
                <select 
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={config.pageSize}
                  onChange={(e) => setConfig({...config, pageSize: e.target.value})}
                >
                  {Object.entries(PAGE_SIZES).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Márgenes */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Maximize className="w-3 h-3" /> Márgenes ({UNITS[unit].label})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['top', 'bottom', 'left', 'right'].map(side => {
                  const labels = { top: 'Superior', bottom: 'Inferior', left: 'Izquierdo', right: 'Derecho' };
                  return (
                    <div key={side}>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">{labels[side]}</label>
                      <input 
                        type="number" 
                        step={UNITS[unit].step}
                        min="0"
                        value={convert(config.margins[side], unit)}
                        onChange={(e) => updateMargin(side, e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Retícula */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Grid className="w-3 h-3" /> Retícula
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Columnas</label>
                  <input 
                    type="number" min="1" max="10" 
                    value={config.cols}
                    onChange={(e) => setConfig({...config, cols: Math.max(1, Number(e.target.value))})}
                    className="w-full border border-slate-300 rounded p-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Filas</label>
                  <input 
                    type="number" min="1" max="10" 
                    value={config.rows}
                    onChange={(e) => setConfig({...config, rows: Math.max(1, Number(e.target.value))})}
                    className="w-full border border-slate-300 rounded p-1.5 text-sm"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">Espaciado ({UNITS[unit].label})</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="range" min="0" max="50" step="0.5"
                    value={config.gap}
                    onChange={(e) => setConfig({...config, gap: Number(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
                </div>
              </div>

              {/* OPCIÓN: IMPRIMIR GUÍAS */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <input 
                  type="checkbox" 
                  id="printGuides"
                  checked={config.printGuides}
                  onChange={(e) => setConfig({...config, printGuides: e.target.checked})}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="printGuides" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                  Imprimir líneas guía
                </label>
              </div>
            </section>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">Imágenes: {images.length}</span>
              <button 
                onClick={() => setImages([])} 
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" /> Limpiar Todo
              </button>
            </div>
            {/* Controles Globales de Ajuste */}
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'contain', x: 0, y: 0})))}
                className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600"
              >
                Todos Completa
              </button>
              <button 
                onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'cover'})))}
                className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600"
              >
                Todos Relleno
              </button>
              <button 
                onClick={rotateAllImages}
                className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600"
              >
                Rotar Todos
              </button>
            </div>
          </div>
        </aside>

        {/* --- CANVAS PRINCIPAL --- */}
        <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">
          
          {/* NUEVO CONTROL DE ZOOM TIPO WORD */}
          <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl">
            <button 
              onClick={() => setZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))))} 
              className="text-slate-400 hover:text-slate-600 transition"
              title="Alejar"
            >
              <Minimize className="w-4 h-4" />
            </button>
            
            <input 
              type="range" 
              min="0.2" 
              max="2.0" 
              step="0.1" 
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            <button 
              onClick={() => setZoom(z => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))} 
              className="text-slate-400 hover:text-slate-600 transition"
              title="Acercar"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Ajuste de espaciado y padding inferior para scroll */}
          <div className="flex flex-col gap-8 print:gap-0 shrink-0 items-center pb-32 print:pb-0">
            {/* ITERACIÓN POR PÁGINAS */}
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div 
                key={pageIndex}
                // CLASES DE RESETEO: print-no-zoom-outer elimina el ancho/alto inline en impresión
                className={`page-wrapper print-no-zoom-outer relative shrink-0 print:block print:overflow-visible ${pageIndex < totalPages - 1 ? 'print:break-after-page' : ''}`}
                style={{
                  width: `${pageWidthMm * zoom}mm`,
                  height: `${pageHeightMm * zoom}mm`
                }}
              >
                {/* La Hoja (Sheet) */}
                <div 
                  // CLASES DE RESETEO: print-no-zoom-inner elimina la transformación (zoom) en impresión
                  className="bg-white shadow-xl print-no-zoom-inner transition-transform duration-300 origin-top-left print:shadow-none print:m-0 relative"
                  style={{
                    width: `${pageWidthMm}mm`,
                    height: `${pageHeightMm}mm`,
                    transform: `scale(${zoom})`,
                    paddingTop: `${config.margins.top}mm`,
                    paddingRight: `${config.margins.right}mm`,
                    paddingBottom: `${config.margins.bottom}mm`,
                    paddingLeft: `${config.margins.left}mm`,
                  }}
                >
                  <div 
                    className={`w-full h-full grid relative ${!config.printGuides ? 'print:!border-none' : ''}`}
                    style={{
                      gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                      gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                      gap: `${config.gap}mm`,
                      border: config.showGuides ? '1px dashed #e2e8f0' : 'none'
                    }}
                  >
                    {/* CELDAS DE LA PÁGINA ACTUAL */}
                    {Array.from({ length: itemsPerPage }).map((_, cellIndex) => {
                      // Cálculo del índice global de la imagen
                      const imgIndex = pageIndex * itemsPerPage + cellIndex;
                      const img = images[imgIndex];
                      
                      const isRotated90 = img && (Math.abs(img.rotation) % 180 === 90);
                      
                      // LÓGICA DE DIMENSIONES Y ESTILOS
                      let dynamicStyle = {};
                      
                      if (img) {
                        const cellRatio = cellWidthPx / cellHeightPx;
                        const imgWidth = isRotated90 ? (img.naturalHeight || 1) : (img.naturalWidth || 1);
                        const imgHeight = isRotated90 ? (img.naturalWidth || 1) : (img.naturalHeight || 1);
                        const imgRatio = imgWidth / imgHeight;

                        dynamicStyle = {
                            transform: `translate(calc(-50% + ${img.x}px), calc(-50% + ${img.y}px)) rotate(${img.rotation}deg)`,
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            maxWidth: 'none', 
                            maxHeight: 'none',
                            cursor: img.objectFit === 'cover' ? 'grab' : 'default'
                        };

                        if (img.objectFit === 'contain') {
                            if (isRotated90) {
                              dynamicStyle.width = `${cellHeightPx}px`;
                              dynamicStyle.height = `${cellWidthPx}px`;
                            } else {
                              dynamicStyle.width = '100%';
                              dynamicStyle.height = '100%';
                              dynamicStyle.maxWidth = '100%';
                              dynamicStyle.maxHeight = '100%';
                            }
                            dynamicStyle.objectFit = 'contain';
                            dynamicStyle.objectPosition = 'center center';
                        } else {
                            // MODO RELLENO (COVER)
                            if (isRotated90) {
                              if (imgRatio > cellRatio) {
                                  dynamicStyle.width = `${cellHeightPx}px`;
                                  dynamicStyle.height = 'auto';
                              } else {
                                  dynamicStyle.height = `${cellWidthPx}px`;
                                  dynamicStyle.width = 'auto';
                              }
                            } else {
                              if (imgRatio > cellRatio) {
                                  dynamicStyle.height = `${cellHeightPx}px`;
                                  dynamicStyle.width = 'auto';
                              } else {
                                  dynamicStyle.width = `${cellWidthPx}px`;
                                  dynamicStyle.height = 'auto';
                              }
                            }
                        }
                      }

                      return (
                        <div 
                          key={cellIndex} 
                          className={`relative overflow-hidden group select-none
                            ${!img ? 'flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors' : ''}
                            ${!config.printGuides && !img ? 'print:!border-none' : ''}
                            ${!img && imgIndex === images.length && images.length === 0 ? 'animate-pulse' : ''} 
                          `}
                        >
                          {!img ? (
                            // Solo mostrar botón de carga si es el "siguiente" hueco disponible o si no hay fotos
                            (imgIndex <= images.length) ? (
                              <div 
                                className="text-slate-300 flex flex-col items-center justify-center cursor-pointer w-full h-full print:hidden"
                                onClick={() => document.querySelector('input[type="file"]').click()}
                              >
                                <Plus className="w-6 h-6 opacity-50" />
                              </div>
                            ) : null
                          ) : (
                            <>
                                <img 
                                  src={img.src} 
                                  alt={`print-${imgIndex}`}
                                  className="transition-transform duration-75 block"
                                  style={dynamicStyle}
                                  onMouseDown={(e) => handleMouseDown(e, img)}
                                  onLoad={(e) => handleImageLoad(img.id, e)}
                                  draggable={false}
                                />

                              {/* Overlay Controls */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors print:hidden flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                                <div className="pointer-events-auto flex gap-1">
                                  <button 
                                    onClick={() => toggleObjectFit(img.id)}
                                    className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"
                                    title={img.objectFit === 'cover' ? "Cambiar a Completa (Contain)" : "Cambiar a Relleno (Cover)"}
                                  >
                                    <Scaling className="w-4 h-4" />
                                  </button>

                                  <button 
                                    onClick={() => rotateImage(img.id)}
                                    className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"
                                    title="Rotar"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                  </button>
                                  
                                  <button 
                                    onClick={() => duplicateImage(img)}
                                    className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"
                                    title="Duplicar"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  
                                  <button 
                                    onClick={() => removeImage(img.id)}
                                    className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 transition"
                                    title="Eliminar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="absolute bottom-1 right-1 print:hidden opacity-0 group-hover:opacity-100 pointer-events-none">
                                  <span className="text-[9px] bg-black/50 text-white px-1 rounded backdrop-blur-sm">
                                    {img.objectFit === 'cover' ? 'Relleno' : 'Completa'}
                                  </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Número de Página (Fuera de la hoja, pero dentro del wrapper para mantener relación) */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-bold print:hidden">
                  Página {pageIndex + 1} de {totalPages}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* --- MODAL SETTINGS --- */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Configuración
                </h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unidad de Medida</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {Object.keys(UNITS).map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                          unit === u 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {UNITS[u].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Esto afectará cómo se muestran las medidas en el panel de márgenes y espaciado.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 flex justify-end">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            @page {
              size: ${config.pageSize === 'carta' ? 'letter' : config.pageSize === 'oficio' ? 'legal' : config.pageSize === 'a4' ? 'A4' : 'auto'} portrait;
              margin: 0;
            }
            
            /* RESET DE IMPRESIÓN PARA MULTIPÁGINA */
            html, body, #root {
              height: auto !important;
              overflow: visible !important;
              min-height: auto !important;
            }
            
            /* Desactivar scroll y layout de pantalla */
            main {
              height: auto !important;
              overflow: visible !important;
              display: block !important;
            }
            
            /* Asegurar que el contenedor de páginas fluya */
            .overflow-auto, .overflow-hidden {
              overflow: visible !important;
              height: auto !important;
            }

            body {
              background: white;
            }
            
            .print\\:break-after-page {
              break-after: page;
              page-break-after: always;
            }

            /* --- RESET DE ZOOM PARA IMPRESIÓN --- */
            /* El contenedor exterior debe perder sus dimensiones inline (que tienen el zoom) */
            .print-no-zoom-outer {
              width: auto !important;
              height: auto !important;
            }

            /* La hoja interior debe perder la transformación de escala */
            .print-no-zoom-inner {
              transform: none !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}