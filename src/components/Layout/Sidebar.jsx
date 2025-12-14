import React, { useState } from 'react';
import { 
  Save, Cloud, Check, X, Trash2, Settings, 
  Maximize, Link, Unlink, Grid, Ruler, 
  LayoutGrid, Plus, RotateCw, Layers, Scissors
} from 'lucide-react';

import { PAGE_SIZES, UNITS } from '../../constants/printSettings';
import { convert, toMm } from '../../utils/measurements';

export default function Sidebar({
  config,
  setConfig,
  favorites,
  setFavorites,
  unit,
  images,
  mosaicImage,
  setImages,
  setMosaicImage,
  user,
  totalPages,
  isMosaicPreview, // Nuevo prop
  setIsMosaicPreview // Nuevo prop
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newFavName, setNewFavName] = useState('');

  // --- HANDLERS INTERNOS ---

  const saveConfiguration = () => {
    if (!newFavName.trim()) return;
    const newFav = { id: Date.now(), name: newFavName, config };
    const updatedFavs = [...favorites, newFav];
    setFavorites(updatedFavs);
    setNewFavName('');
    setShowSaveModal(false);
  };

  const loadConfiguration = (favConfig) => {
    const { orientation, ...rest } = favConfig;
    setConfig({
      uniformMargins: false,
      useCustomSize: false,
      customWidth: 50,
      customHeight: 50,
      customMaxItems: 0,
      useMosaicMode: false,
      mosaicType: 'pieces',
      mosaicCols: 2,
      mosaicRows: 2,
      mosaicTargetWidth: 500,
      mosaicTargetHeight: 500,
      ...rest
    });
  };

  const deleteFavorite = (id) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const updateMargin = (side, value) => {
    const mm = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, margins: { ...prev.margins, [side]: mm } }));
  };

  const updateAllMargins = (value) => {
    const mm = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, margins: { top: mm, right: mm, bottom: mm, left: mm } }));
  };

  const updateMosaicSize = (dim, val) => {
    if (!mosaicImage) return;
    const mmVal = Number(val);
    const ratio = mosaicImage.naturalWidth / mosaicImage.naturalHeight;

    if (dim === 'width') {
      setConfig(prev => ({
        ...prev,
        mosaicTargetWidth: toMm(mmVal, unit),
        mosaicTargetHeight: toMm(mmVal / ratio, unit)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        mosaicTargetHeight: toMm(mmVal, unit),
        mosaicTargetWidth: toMm(mmVal * ratio, unit)
      }));
    }
  };

  const rotateAllImages = () => {
    setImages(prev => prev.map(img => ({ ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 })));
  };

  const updateCustomSize = (key, value) => {
    const mm = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, [key]: mm }));
  };


  return (
    <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shadow-sm z-10 print:hidden">
      <div className="p-5 space-y-6 flex-1">
        
        {/* --- SECCIÓN FAVORITOS --- */}
        <section className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Cloud className="w-3 h-3" /> Favoritos {user && <Check className="w-3 h-3 text-green-500" />}
            </h3>
            <button onClick={() => setShowSaveModal(true)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition flex items-center gap-1">
              <Save className="w-3 h-3" /> Guardar
            </button>
          </div>
          
          {showSaveModal && (
            <div className="mb-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
              <input 
                autoFocus type="text" placeholder="Nombre" 
                className="flex-1 text-xs border p-1 rounded" 
                value={newFavName} onChange={e => setNewFavName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && saveConfiguration()} 
              />
              <button onClick={saveConfiguration} className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700"><Check className="w-3 h-3"/></button>
              <button onClick={() => setShowSaveModal(false)} className="bg-slate-200 text-slate-600 px-2 rounded hover:bg-slate-300"><X className="w-3 h-3"/></button>
            </div>
          )}
          
          {favorites.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay configuraciones.</p>
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

        {/* --- SECCIÓN PAPEL --- */}
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

        {/* --- SECCIÓN MÁRGENES --- */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Maximize className="w-3 h-3" /> Márgenes ({UNITS[unit].label})
            </h3>
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" id="uniformMargins" 
                checked={config.uniformMargins} 
                onChange={(e) => { 
                  const isChecked = e.target.checked; 
                  const newConfig = { ...config, uniformMargins: isChecked }; 
                  if (isChecked) { 
                    const val = config.margins.top; 
                    newConfig.margins = { top: val, right: val, bottom: val, left: val }; 
                  } 
                  setConfig(newConfig); 
                }} 
                className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3" 
              />
              <label htmlFor="uniformMargins" className="text-[10px] font-medium text-slate-500 cursor-pointer select-none flex items-center gap-1">
                {config.uniformMargins ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />} Unificar
              </label>
            </div>
          </div>

          {config.uniformMargins && (
            <div className="mb-3 bg-blue-50 p-2 rounded-md border border-blue-100 animate-in slide-in-from-top-2 fade-in">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-blue-700">Margen Global</label>
                <span className="text-[10px] font-mono text-blue-600">{convert(config.margins.top, unit)}</span>
              </div>
              <input 
                type="range" min="0" max="50" step={UNITS[unit].step} 
                value={convert(config.margins.top, unit)} 
                onChange={(e) => updateAllMargins(e.target.value)} 
                className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              />
            </div>
          )}

          <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${config.uniformMargins ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {['top', 'bottom', 'left', 'right'].map(side => (
              <div key={side}>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  {{top:'Superior', bottom:'Inferior', left:'Izquierdo', right:'Derecho'}[side]}
                </label>
                <input 
                  type="number" step={UNITS[unit].step} min="0" 
                  value={convert(config.margins[side], unit)} 
                  onChange={(e) => updateMargin(side, e.target.value)} 
                  className="w-full border border-slate-300 rounded p-1.5 text-sm" 
                  disabled={config.uniformMargins} 
                />
              </div>
            ))}
          </div>
        </section>

        {/* --- SECCIÓN RETÍCULA / MOSAICO --- */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Grid className="w-3 h-3" /> Retícula
            </h3>
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" id="customSize" 
                checked={config.useCustomSize} disabled={config.useMosaicMode} 
                onChange={(e) => setConfig({...config, useCustomSize: e.target.checked})} 
                className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3" 
              />
              <label htmlFor="customSize" className={`text-[10px] font-medium cursor-pointer select-none flex items-center gap-1 ${config.useMosaicMode ? 'text-slate-300' : 'text-slate-500'}`}>
                <Ruler className="w-3 h-3" /> Tamaño Fijo
              </label>
            </div>
          </div>

          {/* MOSAIC TOGGLE */}
          <div className="mb-4 bg-purple-50 p-2 rounded border border-purple-100">
             <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" id="mosaicMode" 
                  checked={config.useMosaicMode} 
                  onChange={(e) => setConfig({...config, useMosaicMode: e.target.checked})} 
                  className="rounded text-purple-600 focus:ring-purple-500" 
                />
                <label htmlFor="mosaicMode" className="text-xs font-bold text-purple-700 flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3"/> Modo Mosaico (Tiling)
                </label>
             </div>
             
             {config.useMosaicMode && (
               <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                  {/* TIPO DE MOSAICO */}
                  <div className="flex bg-white rounded p-1 shadow-sm">
                     <button onClick={() => setConfig({...config, mosaicType: 'pieces'})} className={`flex-1 text-[10px] py-1 rounded ${config.mosaicType === 'pieces' ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-500'}`}>Por Piezas</button>
                     <button onClick={() => setConfig({...config, mosaicType: 'size'})} className={`flex-1 text-[10px] py-1 rounded ${config.mosaicType === 'size' ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-500'}`}>Por Tamaño</button>
                  </div>

                  {/* CONFIGURACIÓN SEGÚN TIPO */}
                  {config.mosaicType === 'pieces' ? (
                    <div className="grid grid-cols-2 gap-2">
                       <div><label className="text-[9px] text-purple-800 font-bold">Hojas Horiz.</label><input type="number" min="1" value={config.mosaicCols} onChange={(e) => setConfig({...config, mosaicCols: Number(e.target.value)})} className="w-full text-xs border border-purple-200 rounded p-1" disabled={!isMosaicPreview}/></div>
                       <div><label className="text-[9px] text-purple-800 font-bold">Hojas Vert.</label><input type="number" min="1" value={config.mosaicRows} onChange={(e) => setConfig({...config, mosaicRows: Number(e.target.value)})} className="w-full text-xs border border-purple-200 rounded p-1" disabled={!isMosaicPreview}/></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                       <div><label className="text-[9px] text-purple-800 font-bold">Ancho ({UNITS[unit].label})</label><input type="number" min="1" step={UNITS[unit].step} value={convert(config.mosaicTargetWidth, unit)} onChange={(e) => updateMosaicSize('width', e.target.value)} className="w-full text-xs border border-purple-200 rounded p-1" disabled={!isMosaicPreview}/></div>
                       <div><label className="text-[9px] text-purple-800 font-bold">Alto ({UNITS[unit].label})</label><input type="number" min="1" step={UNITS[unit].step} value={convert(config.mosaicTargetHeight, unit)} onChange={(e) => updateMosaicSize('height', e.target.value)} className="w-full text-xs border border-purple-200 rounded p-1" disabled={!isMosaicPreview}/></div>
                    </div>
                  )}
                  
                  {/* BOTÓN DE PROCESAR / EDITAR */}
                  {mosaicImage && (
                    <div className="pt-2">
                      {isMosaicPreview ? (
                        <button 
                          onClick={() => setIsMosaicPreview(false)}
                          className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded shadow hover:bg-purple-700 transition flex items-center justify-center gap-2"
                        >
                          <Scissors className="w-4 h-4" /> Procesar {totalPages} Páginas
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsMosaicPreview(true)}
                          className="w-full bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded shadow hover:bg-slate-300 transition flex items-center justify-center gap-2"
                        >
                          <Layers className="w-4 h-4" /> Ajustar Cortes
                        </button>
                      )}
                    </div>
                  )}

                  {!mosaicImage && <p className="text-[10px] text-purple-400 italic text-center">Selecciona una imagen base para comenzar.</p>}
                  
               </div>
             )}
          </div>

          {!config.useMosaicMode && (
            <>
              {config.useCustomSize ? (
                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-blue-800 block mb-1">Ancho</label><input type="number" step={UNITS[unit].step} min="1" value={convert(config.customWidth, unit)} onChange={(e) => updateCustomSize('customWidth', e.target.value)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" /></div>
                    <div><label className="text-[10px] font-bold text-blue-800 block mb-1">Alto</label><input type="number" step={UNITS[unit].step} min="1" value={convert(config.customHeight, unit)} onChange={(e) => updateCustomSize('customHeight', e.target.value)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" /></div>
                  </div>
                  <div><div className="flex justify-between"><label className="text-[10px] font-bold text-blue-800 block mb-1">Límite</label><span className="text-[9px] text-blue-500">(0 = Máx)</span></div><input type="number" min="0" max="100" value={config.customMaxItems} onChange={(e) => setConfig({...config, customMaxItems: Math.max(0, Number(e.target.value))})} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-3 animate-in slide-in-from-top-2 fade-in">
                  <div><label className="text-xs text-slate-500 block mb-1">Columnas</label><input type="number" min="1" max="10" value={config.cols} onChange={(e) => setConfig({...config, cols: Math.max(1, Number(e.target.value))})} className="w-full border border-slate-300 rounded p-1.5 text-sm" /></div>
                  <div><label className="text-xs text-slate-500 block mb-1">Filas</label><input type="number" min="1" max="10" value={config.rows} onChange={(e) => setConfig({...config, rows: Math.max(1, Number(e.target.value))})} className="w-full border border-slate-300 rounded p-1.5 text-sm" /></div>
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">Espaciado</label>
                <div className="flex gap-2 items-center">
                  <input type="range" min="0" max="50" step="0.5" value={config.gap} onChange={(e) => setConfig({...config, gap: Number(e.target.value)})} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <input type="checkbox" id="printGuides" checked={config.printGuides} onChange={(e) => setConfig({...config, printGuides: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
            <label htmlFor="printGuides" className="text-xs font-medium text-slate-600 cursor-pointer select-none">Imprimir líneas guía</label>
          </div>
        </section>
      </div>

      {/* --- FOOTER DE ACCIONES --- */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500">
            Imágenes: {config.useMosaicMode ? (mosaicImage ? 1 : 0) : images.length}
          </span>
          <button 
            onClick={() => config.useMosaicMode ? setMosaicImage(null) : setImages([])} 
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3 h-3" /> Limpiar Todo
          </button>
        </div>
        {!config.useMosaicMode && (
           <div className="flex gap-2 mt-2">
             <button onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'contain', x: 0, y: 0})))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600">Completa</button>
             <button onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'cover'})))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600">Relleno</button>
             <button onClick={rotateAllImages} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600 flex items-center justify-center gap-1"><RotateCw className="w-3 h-3"/> Rotar</button>
           </div>
        )}
      </div>
    </aside>
  );
}