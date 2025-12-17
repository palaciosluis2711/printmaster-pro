import React, { useState } from 'react';
import { 
  Grid, LayoutGrid, Ruler, Star, Settings, 
  ChevronLeft, Save, Trash2, Check, X,
  RotateCw, Layers, Scissors, Lock, Cloud,
  Plus, Type, Palette 
} from 'lucide-react';

import { PAGE_SIZES, UNITS } from '../../constants/printSettings';
import { convert, toMm } from '../../utils/measurements';
import InputNumber from '../UI/ImputNumber';
import { PaperSettings, MarginSettings, PrintGuidesFooter } from './SidebarSections';

export default function Sidebar({
  config,
  setConfig,
  favorites,
  setFavorites,
  unit,
  setUnit, 
  images,
  mosaicImage,
  setImages,
  setMosaicImage,
  user,
  totalPages,
  isMosaicPreview,
  setIsMosaicPreview,
  minMosaicDimensions,
  activeView,
  setActiveView,
  // Props Banner
  isBannerPreview,
  setIsBannerPreview,
  updateBannerConfig
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newFavName, setNewFavName] = useState('');

  const availableFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 
      'Arial', 'Verdana', 'Times New Roman', 'Georgia', 'Impact', 'Courier New',
      'Pacifico', 'Lobster', 'Caveat', 'Abril Fatface'
  ];

  // --- HANDLERS ---

  const navigateTo = (view) => {
    setActiveView(view);
    setShowSaveModal(false);
    if (view === 'grid') setConfig(prev => ({ ...prev, useMosaicMode: false, useCustomSize: false }));
    else if (view === 'mosaic') setConfig(prev => ({ ...prev, useMosaicMode: true }));
    else if (view === 'custom') setConfig(prev => ({ ...prev, useMosaicMode: false, useCustomSize: true }));
    else if (view === 'banner') setConfig(prev => ({ ...prev, isBannerMode: true }));
  };

  const rotateAllImages = () => {
    setImages(prev => prev.map(img => ({ ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 })));
  };

  const updateMosaicSize = (dim, val) => {
    if (!mosaicImage) return;
    const valInMm = toMm(Number(val), unit);
    const minValMm = dim === 'width' 
        ? (minMosaicDimensions ? minMosaicDimensions.width : 10) 
        : (minMosaicDimensions ? minMosaicDimensions.height : 10);
    const finalMm = Math.max(minValMm, valInMm);
    const ratio = mosaicImage.naturalWidth / mosaicImage.naturalHeight;

    if (dim === 'width') {
      const newHeight = ratio !== 0 ? finalMm / ratio : 0;
      setConfig(prev => ({ ...prev, mosaicTargetWidth: finalMm, mosaicTargetHeight: newHeight }));
    } else {
      const newWidth = finalMm * ratio;
      setConfig(prev => ({ ...prev, mosaicTargetHeight: finalMm, mosaicTargetWidth: newWidth }));
    }
  };

  const updateCustomSize = (key, value) => {
    const mm = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, [key]: mm }));
  };

  const saveConfiguration = () => {
    if (!newFavName.trim()) return;
    const newFav = { id: Date.now(), name: newFavName, config };
    setFavorites([...favorites, newFav]);
    setNewFavName('');
    setShowSaveModal(false);
  };

  const deleteFavorite = (id) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const handleBannerFontChange = (e) => {
      updateBannerConfig('bannerFont', e.target.value);
  };

  // --- COMPONENTE INTERNO: PANEL DE GUARDADO ---
  const SaveSection = () => (
    showSaveModal ? (
      <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg animate-in slide-in-from-top-2 fade-in">
        <label className="text-[10px] font-bold text-amber-700 uppercase mb-1 block">Guardar Configuración</label>
        <div className="flex gap-2">
          <input 
            autoFocus 
            type="text" 
            placeholder="Nombre..." 
            className="flex-1 text-xs border border-amber-300 p-1.5 rounded focus:outline-none focus:border-amber-500" 
            value={newFavName} 
            onChange={e => setNewFavName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && saveConfiguration()} 
          />
          <button onClick={saveConfiguration} className="bg-amber-500 text-white px-2 rounded hover:bg-amber-600"><Check className="w-4 h-4"/></button>
          <button onClick={() => setShowSaveModal(false)} className="bg-white text-amber-700 border border-amber-200 px-2 rounded hover:bg-amber-50"><X className="w-4 h-4"/></button>
        </div>
      </div>
    ) : null
  );

  // --- RENDERIZADORES DE VISTAS ---

  const renderHome = () => (
    <div className="grid grid-cols-2 gap-3 p-1">
      <button onClick={() => navigateTo('grid')} className="aspect-square bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-300 transition-all group">
        <Grid className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform"/>
        <span className="text-xs font-bold text-blue-700">Retícula</span>
      </button>
      <button onClick={() => navigateTo('mosaic')} className="aspect-square bg-purple-50 hover:bg-purple-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-purple-100 hover:border-purple-300 transition-all group">
        <LayoutGrid className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform"/>
        <span className="text-xs font-bold text-purple-700">Mosaico</span>
      </button>
      <button onClick={() => navigateTo('banner')} className="aspect-square bg-pink-50 hover:bg-pink-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-pink-100 hover:border-pink-300 transition-all group">
        <Type className="w-8 h-8 text-pink-500 group-hover:scale-110 transition-transform"/>
        <span className="text-xs font-bold text-pink-700 text-center">Texto<br/>Gigante</span>
      </button>
      <button onClick={() => navigateTo('custom')} className="aspect-square bg-emerald-50 hover:bg-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-emerald-100 hover:border-emerald-300 transition-all group">
        <Ruler className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform"/>
        <span className="text-xs font-bold text-emerald-700 text-center px-1">Retícula<br/>Personalizada</span>
      </button>
      <button onClick={() => navigateTo('favorites')} className="col-span-2 bg-amber-50 hover:bg-amber-100 rounded-xl p-4 flex items-center justify-center gap-3 border-2 border-amber-100 hover:border-amber-300 transition-all group">
        <Star className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform"/>
        <span className="text-sm font-bold text-amber-700">Favoritos Guardados</span>
      </button>
      <button onClick={() => navigateTo('settings')} className="col-span-2 bg-slate-50 hover:bg-slate-100 rounded-xl p-4 flex items-center justify-center gap-3 border-2 border-slate-100 hover:border-slate-300 transition-all group">
        <Settings className="w-5 h-5 text-slate-500 group-hover:rotate-45 transition-transform"/>
        <span className="text-sm font-bold text-slate-600">Ajustes Generales</span>
      </button>
    </div>
  );

  const renderGridMode = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      <SaveSection />
      <PaperSettings config={config} setConfig={setConfig} />
      <MarginSettings config={config} setConfig={setConfig} unit={unit} />
      
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Grid className="w-3 h-3" /> Configuración de Retícula
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="text-xs text-slate-500 block mb-1">Columnas</label><input type="number" min="1" max="10" value={config.cols} onChange={(e) => setConfig({...config, cols: Math.max(1, Number(e.target.value))})} className="w-full border border-slate-300 rounded p-1.5 text-sm" /></div>
          <div><label className="text-xs text-slate-500 block mb-1">Filas</label><input type="number" min="1" max="10" value={config.rows} onChange={(e) => setConfig({...config, rows: Math.max(1, Number(e.target.value))})} className="w-full border border-slate-300 rounded p-1.5 text-sm" /></div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-500 block mb-1">Espaciado</label>
          <div className="flex gap-2 items-center">
            <input type="range" min="0" max="50" step="0.5" value={config.gap} onChange={(e) => setConfig({...config, gap: Number(e.target.value)})} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
          </div>
        </div>
      </section>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Acciones Rápidas</h4>
         <div className="flex gap-2">
             <button onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'contain', x: 0, y: 0})))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Completa</button>
             <button onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'cover'})))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Relleno</button>
             <button onClick={rotateAllImages} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600 flex items-center justify-center gap-1"><RotateCw className="w-3 h-3"/> Rotar</button>
         </div>
      </div>

      <PrintGuidesFooter config={config} setConfig={setConfig} />
    </div>
  );

  const renderCustomMode = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      <SaveSection />
      <PaperSettings config={config} setConfig={setConfig} />
      <MarginSettings config={config} setConfig={setConfig} unit={unit} />
      
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Ruler className="w-3 h-3" /> Medidas Personalizadas
        </h3>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
                <label className="text-[10px] font-bold text-blue-800 block mb-1">Ancho</label>
                <InputNumber valueMm={config.customWidth} unit={unit} step={UNITS[unit].step} onChange={(val) => updateCustomSize('customWidth', val)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500"/>
            </div>
            <div>
                <label className="text-[10px] font-bold text-blue-800 block mb-1">Alto</label>
                <InputNumber valueMm={config.customHeight} unit={unit} step={UNITS[unit].step} onChange={(val) => updateCustomSize('customHeight', val)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500"/>
            </div>
          </div>
          <div>
            <div className="flex justify-between"><label className="text-[10px] font-bold text-blue-800 block mb-1">Límite por página</label><span className="text-[9px] text-blue-500">(0 = Sin límite)</span></div>
            <input type="number" min="0" max="100" value={config.customMaxItems} onChange={(e) => setConfig({...config, customMaxItems: Math.max(0, Number(e.target.value))})} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" />
          </div>
        </div>

        {/* --- OPCIÓN DE ESPACIADO REINCORPORADA --- */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 block mb-1">Espaciado</label>
          <div className="flex gap-2 items-center">
            <input 
                type="range" min="0" max="50" step="0.5" 
                value={config.gap} 
                onChange={(e) => setConfig(prev => ({...prev, gap: Number(e.target.value)}))} 
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
            />
            <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
          </div>
        </div>

      </section>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Acciones Rápidas</h4>
         <div className="flex gap-2">
             <button onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'contain', x: 0, y: 0})))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Completa</button>
             <button onClick={() => setImages(prev => prev.map(img => ({...img, objectFit: 'cover'})))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Relleno</button>
             <button onClick={rotateAllImages} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600 flex items-center justify-center gap-1"><RotateCw className="w-3 h-3"/> Rotar</button>
         </div>
      </div>

      <PrintGuidesFooter config={config} setConfig={setConfig} />
    </div>
  );

  const renderMosaicMode = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      <SaveSection />
      <PaperSettings config={config} setConfig={setConfig} />
      <MarginSettings config={config} setConfig={setConfig} unit={unit} />
      
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <LayoutGrid className="w-3 h-3" /> Configuración de Mosaico
        </h3>
        
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
           <div className={`flex bg-white rounded p-1 shadow-sm mb-3 ${!isMosaicPreview ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <button onClick={() => setConfig({...config, mosaicType: 'pieces'})} className={`flex-1 text-[10px] py-1 rounded ${config.mosaicType === 'pieces' ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-500'}`}>Por Piezas</button>
              <button onClick={() => setConfig({...config, mosaicType: 'size'})} className={`flex-1 text-[10px] py-1 rounded ${config.mosaicType === 'size' ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-500'}`}>Por Tamaño</button>
           </div>

           {config.mosaicType === 'pieces' ? (
             <div>
                 <label className={`text-[9px] font-bold ${!isMosaicPreview ? 'text-slate-400' : 'text-purple-800'}`}>Páginas de Ancho</label>
                 <input 
                    type="number" 
                    min="1" 
                    value={config.mosaicCols} 
                    onChange={(e) => { 
                        const val = Math.max(1, Number(e.target.value)); 
                        setConfig({...config, mosaicCols: val, mosaicRows: val }); 
                    }} 
                    className="w-full text-xs border border-purple-200 rounded p-1" 
                    disabled={!isMosaicPreview} 
                 />
                 <p className={`text-[9px] mt-1 italic text-center ${!isMosaicPreview ? 'text-slate-300' : 'text-purple-500'}`}>Equivale a una cuadrícula de {config.mosaicCols} x {config.mosaicCols}</p>
             </div>
           ) : (
             <div className="space-y-2 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 z-10 bg-purple-50 p-1 rounded-full"><Lock className="w-3 h-3" /></div>
                <div>
                    <label className={`text-[9px] font-bold ${!isMosaicPreview ? 'text-slate-400' : 'text-purple-800'}`}>Ancho ({UNITS[unit].label})</label>
                    <InputNumber 
                        valueMm={config.mosaicTargetWidth} 
                        unit={unit} 
                        step={UNITS[unit].step} 
                        min={minMosaicDimensions ? minMosaicDimensions.width : 10} 
                        onChange={(val) => updateMosaicSize('width', val)} 
                        className="w-full text-xs border border-purple-200 rounded p-1" 
                        disabled={!isMosaicPreview} 
                    />
                </div>
                <div>
                    <label className={`text-[9px] font-bold ${!isMosaicPreview ? 'text-slate-400' : 'text-purple-800'}`}>Alto ({UNITS[unit].label})</label>
                    <InputNumber 
                        valueMm={config.mosaicTargetHeight} 
                        unit={unit} 
                        step={UNITS[unit].step} 
                        min={minMosaicDimensions ? minMosaicDimensions.height : 10} 
                        onChange={(val) => updateMosaicSize('height', val)} 
                        className="w-full text-xs border border-purple-200 rounded p-1" 
                        disabled={!isMosaicPreview} 
                    />
                </div>
             </div>
           )}
           
           {mosaicImage && (
             <div className="pt-3 border-t border-purple-100 mt-3">
               {isMosaicPreview ? (
                 <button onClick={() => setIsMosaicPreview(false)} className="w-full bg-purple-600 text-white text-xs font-bold py-2.5 rounded shadow-sm hover:bg-purple-700 transition flex items-center justify-center gap-2">
                   <Scissors className="w-4 h-4" /> Procesar {totalPages} Páginas
                 </button>
               ) : (
                 <button onClick={() => setIsMosaicPreview(true)} className="w-full bg-white text-purple-700 border border-purple-200 text-xs font-bold py-2.5 rounded shadow-sm hover:bg-purple-50 transition flex items-center justify-center gap-2">
                   <Layers className="w-4 h-4" /> Ajustar Cortes
                 </button>
               )}
             </div>
           )}
           {!mosaicImage && <p className="text-[10px] text-purple-400 italic text-center mt-2">Carga una imagen para comenzar</p>}
        </div>
      </section>

      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
        <input 
          type="checkbox" id="mosaicGuides" 
          checked={config.printGuides} 
          onChange={(e) => setConfig({...config, printGuides: e.target.checked})} 
          className="rounded text-purple-600 focus:ring-purple-500" 
        />
        <label htmlFor="mosaicGuides" className="text-xs font-medium text-purple-700 cursor-pointer select-none">
          Imprimir guías de margen
        </label>
      </div>
    </div>
  );

  const renderBannerMode = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      <SaveSection />
      <PaperSettings config={config} setConfig={setConfig} />
      <MarginSettings config={config} setConfig={setConfig} unit={unit} />
      <section><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Type className="w-3 h-3" /> Configuración de Texto</h3><div className="bg-pink-50 p-3 rounded-lg border border-pink-100 space-y-4"><div><label className="text-[10px] font-bold text-pink-800 block mb-1">Tu Frase</label><textarea value={config.bannerText} onChange={(e) => updateBannerConfig('bannerText', e.target.value)} className="w-full border border-pink-200 rounded p-2 text-sm focus:ring-pink-500 resize-none h-20" placeholder="Escribe aquí..." disabled={!isBannerPreview} /></div><div><label className="text-[10px] font-bold text-pink-800 block mb-1">Tipografía</label><select value={config.bannerFont} onChange={handleBannerFontChange} className="w-full border border-pink-200 rounded p-1.5 text-sm" disabled={!isBannerPreview}>{availableFonts.map(font => (<option key={font} value={font} style={{ fontFamily: font }}>{font}</option>))}</select></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-pink-800 block mb-1">Altura Letra ({UNITS[unit].label})</label><InputNumber valueMm={config.bannerHeight} unit={unit} step={UNITS[unit].step} min={10} onChange={(val) => updateBannerConfig('bannerHeight', toMm(val, unit))} className="w-full border border-pink-200 rounded p-1.5 text-sm" disabled={!isBannerPreview}/></div><div><label className="text-[10px] font-bold text-pink-800 block mb-1">Color</label><div className="flex items-center gap-2"><input type="color" value={config.bannerColor} onChange={(e) => updateBannerConfig('bannerColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-pink-200 p-0 overflow-hidden" disabled={!isBannerPreview} /><span className="text-xs text-pink-600 font-mono">{config.bannerColor}</span></div></div></div><div className="flex gap-2"><button onClick={() => updateBannerConfig('bannerStyle', config.bannerStyle === 'bold' ? 'normal' : 'bold')} className={`flex-1 py-1.5 text-xs font-bold rounded border transition-colors ${config.bannerStyle === 'bold' ? 'bg-pink-200 border-pink-300 text-pink-800' : 'bg-white border-pink-200 text-pink-400'}`} disabled={!isBannerPreview}>Bold (N)</button><button onClick={() => updateBannerConfig('bannerStyle', config.bannerStyle === 'italic' ? 'normal' : 'italic')} className={`flex-1 py-1.5 text-xs font-bold rounded border transition-colors ${config.bannerStyle === 'italic' ? 'bg-pink-200 border-pink-300 text-pink-800' : 'bg-white border-pink-200 text-pink-400'}`} disabled={!isBannerPreview}>Italic (K)</button></div><div className="pt-3 border-t border-pink-100 mt-3">{isBannerPreview ? (<button onClick={() => setIsBannerPreview(false)} className="w-full bg-pink-600 text-white text-xs font-bold py-2.5 rounded shadow-sm hover:bg-pink-700 transition flex items-center justify-center gap-2"><Scissors className="w-4 h-4" /> Procesar {totalPages} Páginas</button>) : (<button onClick={() => setIsBannerPreview(true)} className="w-full bg-white text-pink-700 border border-pink-200 text-xs font-bold py-2.5 rounded shadow-sm hover:bg-pink-50 transition flex items-center justify-center gap-2"><Layers className="w-4 h-4" /> Ajustar Texto</button>)}</div></div></section>
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100"><input type="checkbox" id="bannerGuides" checked={config.printGuides} onChange={(e) => setConfig({...config, printGuides: e.target.checked})} className="rounded text-pink-600 focus:ring-pink-500" /><label htmlFor="bannerGuides" className="text-xs font-medium text-pink-700 cursor-pointer select-none">Imprimir guías de corte</label></div>
    </div>
  );

  const renderFavoritesMode = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Cloud className="w-3 h-3" /> Mis Favoritos
            </h3>
          </div>
          
          {favorites.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">No tienes configuraciones guardadas.</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map(fav => (
                <li key={fav.id} className="flex justify-between items-center group bg-white p-2 rounded border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all">
                  <button onClick={() => { 
                      setConfig(fav.config); 
                      if (fav.config.isBannerMode) navigateTo('banner');
                      else if (fav.config.useMosaicMode) navigateTo('mosaic');
                      else if (fav.config.useCustomSize) navigateTo('custom');
                      else navigateTo('grid');
                  }} className="text-slate-700 font-medium hover:text-blue-600 truncate flex-1 text-left text-sm flex flex-col">
                    <span>{fav.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                        {fav.config.isBannerMode ? 'Texto Gigante' : (fav.config.useMosaicMode ? 'Mosaico' : (fav.config.useCustomSize ? 'Personalizado' : 'Retícula'))} - {PAGE_SIZES[fav.config.pageSize]?.name.split('(')[0]}
                    </span>
                  </button>
                  <button onClick={() => deleteFavorite(fav.id)} className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );

  const renderSettingsMode = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Settings className="w-3 h-3" /> Preferencias
        </h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Unidad de Medida</label>
            <div className="flex bg-slate-200 p-1 rounded-lg">
              {Object.keys(UNITS).map(u => (
                <button 
                  key={u} 
                  onClick={() => setUnit(u)} 
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${unit === u ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {UNITS[u].label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
                Esta unidad se usará en todos los controles de la aplicación.
            </p>
        </div>
      </section>
    </div>
  );

  const showSaveButton = ['grid', 'custom', 'banner'].includes(activeView);

  return (
    <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shadow-sm z-10 print:hidden h-full">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur z-20">
        {activeView !== 'home' ? (
          <button onClick={() => navigateTo('home')} className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : <div className="w-7"></div>}
        
        <h2 className="text-sm font-bold text-slate-700 flex-1 text-center uppercase tracking-wide truncate px-1">
          {activeView === 'home' && 'Menú Principal'}
          {activeView === 'grid' && 'Retícula Estándar'}
          {activeView === 'mosaic' && 'Modo Mosaico'}
          {activeView === 'custom' && 'Retícula Personalizada'}
          {activeView === 'banner' && 'Texto Gigante'}
          {activeView === 'favorites' && 'Favoritos'}
          {activeView === 'settings' && 'Ajustes'}
        </h2>
        
        {showSaveButton ? (
          <button 
            onClick={() => setShowSaveModal(true)} 
            className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition"
            title="Guardar como Favorito"
          >
            <Save className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-7"></div> 
        )}
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        {activeView === 'home' && renderHome()}
        {activeView === 'grid' && renderGridMode()}
        {activeView === 'mosaic' && renderMosaicMode()}
        {activeView === 'custom' && renderCustomMode()}
        {activeView === 'banner' && renderBannerMode()}
        {activeView === 'favorites' && renderFavoritesMode()}
        {activeView === 'settings' && renderSettingsMode()}
      </div>

      {activeView === 'home' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
           <p className="text-[10px] text-slate-400">PrintMaster Pro v2.0</p>
        </div>
      )}
      
      {['grid', 'custom'].includes(activeView) && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Imágenes: {images.length}</span>
            <button onClick={() => setImages([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"><Trash2 className="w-3 h-3" /> Limpiar</button>
          </div>
      )}
      {activeView === 'mosaic' && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Imagen Base: {mosaicImage ? 'Si' : 'No'}</span>
            <button onClick={() => setMosaicImage(null)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"><Trash2 className="w-3 h-3" /> Limpiar</button>
          </div>
      )}
    </aside>
  );
}
