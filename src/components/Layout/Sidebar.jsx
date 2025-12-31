import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid, LayoutGrid, Ruler, Star, Settings, ChevronLeft, ArrowRight,
  Save, Trash2, Check, X, RotateCw, Layers, Scissors,
  Lock, Cloud, Plus, Type, Palette, Minimize, Maximize,
  Heart, Globe, Monitor, FileType, Filter, User,
  FileText, Clock
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

  totalPages,
  isMosaicPreview,
  setIsMosaicPreview,
  minMosaicDimensions,
  activeView,
  setActiveView,
  // Props Banner
  isBannerPreview,
  setIsBannerPreview,
  updateBannerConfig,
  // CV Props
  cvDrafts, saveCVDraft, deleteCVDraft
}) {
  // --- GESTIÓN DE FUENTES ---
  const DEFAULT_FONTS = [
    { name: 'Roboto', type: 'web' }, { name: 'Open Sans', type: 'web' },
    { name: 'Lato', type: 'web' }, { name: 'Montserrat', type: 'web' },
    { name: 'Oswald', type: 'web' }, { name: 'Arial', type: 'system' },
    { name: 'Verdana', type: 'system' }, { name: 'Times New Roman', type: 'system' },
    { name: 'Georgia', type: 'system' }, { name: 'Impact', type: 'system' },
    { name: 'Courier New', type: 'system' }, { name: 'Pacifico', type: 'web' },
    { name: 'Lobster', type: 'web' }, { name: 'Caveat', type: 'web' },
    { name: 'Abril Fatface', type: 'web' }
  ];

  const [fontList, setFontList] = useState(DEFAULT_FONTS);
  const [favFonts, setFavFonts] = useState([]);
  const [fontFilter, setFontFilter] = useState('all'); // all, web, system, custom, favorites
  const [googleFontName, setGoogleFontName] = useState('');
  const [showFontInput, setShowFontInput] = useState(false);

  // Load favorites from local storage
  useEffect(() => {
    const savedFavs = localStorage.getItem('printmaster_fav_fonts');
    if (savedFavs) {
      setFavFonts(JSON.parse(savedFavs));
    }
  }, []);

  const toggleFavorite = (fontName) => {
    const newFavs = favFonts.includes(fontName)
      ? favFonts.filter(f => f !== fontName)
      : [...favFonts, fontName];
    setFavFonts(newFavs);
    localStorage.setItem('printmaster_fav_fonts', JSON.stringify(newFavs));
  };

  // 1. Cargar desde Google Fonts
  const addGoogleFont = () => {
    if (!googleFontName.trim()) return;
    const fontName = googleFontName.trim();

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    if (!fontList.find(f => f.name === fontName)) {
      setFontList(prev => [{ name: fontName, type: 'web' }, ...prev]);
    }
    updateBannerConfig('bannerFont', fontName);
    setGoogleFontName('');
    setShowFontInput(false);
  };

  // 2. Cargar archivo local
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const fontName = file.name.split('.')[0];
      const font = new FontFace(fontName, buffer);

      await font.load();
      document.fonts.add(font);

      if (!fontList.find(f => f.name === fontName)) {
        setFontList(prev => [{ name: fontName, type: 'custom' }, ...prev]);
      }
      updateBannerConfig('bannerFont', fontName);
    } catch (err) {
      console.error("Error cargando fuente:", err);
      alert("Error al cargar la fuente.");
    }
  };

  // 3. Detectar fuentes del sistema
  const handleSystemFonts = async () => {
    try {
      if (!window.queryLocalFonts) {
        alert("Tu navegador no soporta esta función.");
        return;
      }
      const available = await window.queryLocalFonts();
      const names = [...new Set(available.map(f => f.family))];

      const newSystemFonts = names.map(name => ({ name, type: 'system' }));

      // Merge avoiding duplicates
      setFontList(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const uniqueNew = newSystemFonts.filter(f => !existingNames.has(f.name));
        return [...uniqueNew, ...prev];
      });

      alert(`Detectadas ${names.length} fuentes.`);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Filter Logic
  const filteredFonts = useMemo(() => {
    if (fontFilter === 'favorites') {
      return fontList.filter(f => favFonts.includes(f.name));
    }
    if (fontFilter === 'all') return fontList;
    return fontList.filter(f => f.type === fontFilter);
  }, [fontList, fontFilter, favFonts]);

  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const selectFilter = async (type) => {
    if (type === 'system') {
      // Si seleccionamos sistema, intentamos cargar las fuentes si no hay muchas ya cargadas
      // O simplemente llamamos a handleSystemFonts para asegurar permisos
      await handleSystemFonts();
    }
    setFontFilter(type);
    setShowFilterMenu(false);
  };



  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newFavName, setNewFavName] = useState('');

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
          <button onClick={saveConfiguration} className="bg-amber-500 text-white px-2 rounded hover:bg-amber-600"><Check className="w-4 h-4" /></button>
          <button onClick={() => setShowSaveModal(false)} className="bg-white text-amber-700 border border-amber-200 px-2 rounded hover:bg-amber-50"><X className="w-4 h-4" /></button>
        </div>
      </div>
    ) : null
  );

  // --- COMPONENT CONSTANTS MOVED OUTSIDE/MEMOIZED ---
  // To avoid lint purity errors, we define these outside or memoize.
  // Since they are static defaults, we can just define them inside but use static ID for phone.
  const DEFAULT_BASE = {
    pageSize: 'carta',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    showGuides: true,
    printGuides: false,
    uniformMargins: false,
    gap: 5,
    cols: 2, rows: 2,
    customWidth: 50, customHeight: 50, customMaxItems: 0,
    mosaicCols: 1, mosaicRows: 1, mosaicTargetWidth: 200, mosaicTargetHeight: 200,
    mosaicType: 'pieces',
    bannerText: 'TEXTO',
    bannerHeight: 100,
    bannerFont: 'Arial',
    bannerColor: '#000000',
    isItalic: false,
    isOutline: false,
    bannerStrokeWidth: 1,
    // Ensure flags are reset
    useMosaicMode: false,
    useCustomSize: false,
    isBannerMode: false,
    isCVMode: false,
    personalData: {
      firstName: '', secondName: '', firstSurname: '', secondSurname: '',
      sex: 'Masculino', dob: '', age: '', manualAge: false,
      dui: '', nit: '', showNit: true,
      civilStatus: 'Soltero', showCivilStatus: true,
      isss: '', isssNA: false,
      afp: '', afpNA: false,
      phones: [{ id: 1, number: '', type: 'mobile', hasWhatsapp: true }],
      email: '', emailNA: false,
      others: []
    }
  };

  const DEFAULTS = {
    grid: { ...DEFAULT_BASE, useMosaicMode: false, useCustomSize: false },
    mosaic: { ...DEFAULT_BASE, useMosaicMode: true, useCustomSize: false },
    custom: { ...DEFAULT_BASE, useMosaicMode: false, useCustomSize: true },
    banner: { ...DEFAULT_BASE, isBannerMode: true },
    cv: { ...DEFAULT_BASE, isCVMode: true, step: 0, cvPageSize: 'carta' }
  };


  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  const [draftName, setDraftName] = useState('');

  // --- EXIT CONFIRMATION MODAL ---
  const renderExitConfirmationModal = () => (
    showExitPrompt ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-in-95 animate-in zoom-in-95 duration-200">
          <div className="bg-blue-600 p-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Save className="w-5 h-5" /> Guardar Borrador
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
              Estás a punto de salir. ¿Deseas guardar tu progreso en un borrador para continuar después?
            </p>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre del Borrador</label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej: Mi CV 2024..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  try {
                    saveCVDraft(draftName, config);
                  } catch (e) {
                    console.error("Save failed", e);
                  }
                  performNavigation(pendingView);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar y Salir
              </button>
              <button
                onClick={() => performNavigation(pendingView)}
                className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-2.5 rounded-xl transition-colors"
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => { setShowExitPrompt(false); setPendingView(null); }}
                className="w-full text-slate-400 hover:text-slate-600 text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Cancelar (Quedarse)
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );

  const performNavigation = (view) => {
    // Helper to actually execute navigation
    if (activeView === 'home' && DEFAULTS[view]) {
      // Reset on entry if coming from home, EXCEPT if we are entering 'cv' mode intentionally via "Borradores" load (which handles its own config setting).
      // But if entering via clicking the main menu button, we want default state.
      // The main menu buttons call this.

      // For CV, we default to Step 0 (Menu). Ideally we don't reset "all" if we want to keep some persistent settings?
      // User requirement: "Cada vez que se entre a 'Crear nuevo CV' los campos estarán vacios".
      // This implies when entering the MODE itself or the SUB-feature?
      // The "Crear Curriculum" MAIN MENU button leads here.
      setConfig(prev => ({ ...prev, ...DEFAULTS[view] }));
    } else {
      // Switching modes directly
      if (view === 'grid') setConfig(prev => ({ ...prev, useMosaicMode: false, useCustomSize: false }));
      else if (view === 'mosaic') setConfig(prev => ({ ...prev, useMosaicMode: true }));
      else if (view === 'custom') setConfig(prev => ({ ...prev, useMosaicMode: false, useCustomSize: true }));
      else if (view === 'banner') setConfig(prev => ({ ...prev, isBannerMode: true }));
      else if (view === 'cv') setConfig(prev => ({ ...prev, isCVMode: true, step: 0, cvPageSize: 'carta' }));
    }
    setActiveView(view);
    setShowSaveModal(false);
    setShowExitPrompt(false);
    setPendingView(null);
  };

  const navigateTo = (view) => {
    // INTERCEPT EXIT FROM CV MODE
    if (activeView === 'cv' && view !== 'cv' && (config.personalData?.firstName || config.personalData?.phones?.length > 1)) {
      setDraftName(`${config.personalData.firstName || 'Sin Nombre'} - ${new Date().toLocaleDateString()}`);
      setPendingView(view);
      setShowExitPrompt(true);
      return;
    }
    performNavigation(view);
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


  // --- RENDERIZADORES DE VISTAS ---

  const renderHome = () => (
    <div className="grid grid-cols-2 gap-3 p-1">
      <button onClick={() => navigateTo('grid')} className="aspect-square bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-300 transition-all group">
        <Grid className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold text-blue-700">Retícula</span>
      </button>
      <button onClick={() => navigateTo('mosaic')} className="aspect-square bg-purple-50 hover:bg-purple-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-purple-100 hover:border-purple-300 transition-all group">
        <LayoutGrid className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold text-purple-700">Mosaico</span>
      </button>
      <button onClick={() => navigateTo('banner')} className="aspect-square bg-pink-50 hover:bg-pink-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-pink-100 hover:border-pink-300 transition-all group">
        <Type className="w-8 h-8 text-pink-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold text-pink-700 text-center">Texto<br />Gigante</span>
      </button>
      <button onClick={() => navigateTo('custom')} className="aspect-square bg-emerald-50 hover:bg-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-emerald-100 hover:border-emerald-300 transition-all group">
        <Ruler className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold text-emerald-700 text-center px-1">Retícula<br />Personalizada</span>
      </button>
      <button onClick={() => navigateTo('cv')} className="bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-300 transition-all group aspect-square">
        <User className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold text-blue-700 text-center">Crear<br />Curriculum</span>
      </button>
      <button onClick={() => navigateTo('favorites')} className="col-span-2 bg-amber-50 hover:bg-amber-100 rounded-xl p-4 flex items-center justify-center gap-3 border-2 border-amber-100 hover:border-amber-300 transition-all group">
        <Star className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold text-amber-700">Favoritos Guardados</span>
      </button>
      <button onClick={() => navigateTo('settings')} className="col-span-2 bg-slate-50 hover:bg-slate-100 rounded-xl p-4 flex items-center justify-center gap-3 border-2 border-slate-100 hover:border-slate-300 transition-all group">
        <Settings className="w-5 h-5 text-slate-500 group-hover:rotate-45 transition-transform" />
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
          <div><label className="text-xs text-slate-500 block mb-1">Columnas</label><input type="number" min="1" max="10" value={config.cols} onChange={(e) => setConfig({ ...config, cols: Math.max(1, Number(e.target.value)) })} className="w-full border border-slate-300 rounded p-1.5 text-sm" /></div>
          <div><label className="text-xs text-slate-500 block mb-1">Filas</label><input type="number" min="1" max="10" value={config.rows} onChange={(e) => setConfig({ ...config, rows: Math.max(1, Number(e.target.value)) })} className="w-full border border-slate-300 rounded p-1.5 text-sm" /></div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-500 block mb-1">Espaciado</label>
          <div className="flex gap-2 items-center">
            <input type="range" min="0" max="50" step="0.5" value={config.gap} onChange={(e) => setConfig({ ...config, gap: Number(e.target.value) })} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
          </div>
        </div>
      </section>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Acciones Rápidas</h4>
        <div className="flex gap-2">
          <button onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'contain', x: 0, y: 0 })))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Completa</button>
          <button onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'cover' })))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Relleno</button>
          <button onClick={rotateAllImages} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600 flex items-center justify-center gap-1"><RotateCw className="w-3 h-3" /> Rotar</button>
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
              <InputNumber valueMm={config.customWidth} unit={unit} step={UNITS[unit].step} onChange={(val) => updateCustomSize('customWidth', val)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-blue-800 block mb-1">Alto</label>
              <InputNumber valueMm={config.customHeight} unit={unit} step={UNITS[unit].step} onChange={(val) => updateCustomSize('customHeight', val)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <div className="flex justify-between"><label className="text-[10px] font-bold text-blue-800 block mb-1">Límite por página</label><span className="text-[9px] text-blue-500">(0 = Sin límite)</span></div>
            <input type="number" min="0" max="100" value={config.customMaxItems} onChange={(e) => setConfig({ ...config, customMaxItems: Math.max(0, Number(e.target.value)) })} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" />
          </div>
        </div>

        {/* --- OPCIÓN DE ESPACIADO REINCORPORADA --- */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 block mb-1">Espaciado</label>
          <div className="flex gap-2 items-center">
            <input
              type="range" min="0" max="50" step="0.5"
              value={config.gap}
              onChange={(e) => setConfig(prev => ({ ...prev, gap: Number(e.target.value) }))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
          </div>
        </div>

      </section>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Acciones Rápidas</h4>
        <div className="flex gap-2">
          <button onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'contain', x: 0, y: 0 })))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Completa</button>
          <button onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'cover' })))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600">Relleno</button>
          <button onClick={rotateAllImages} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1.5 rounded text-slate-600 flex items-center justify-center gap-1"><RotateCw className="w-3 h-3" /> Rotar</button>
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
            <button onClick={() => setConfig({ ...config, mosaicType: 'pieces' })} className={`flex-1 text-[10px] py-1 rounded ${config.mosaicType === 'pieces' ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-500'}`}>Por Piezas</button>
            <button onClick={() => setConfig({ ...config, mosaicType: 'size' })} className={`flex-1 text-[10px] py-1 rounded ${config.mosaicType === 'size' ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-500'}`}>Por Tamaño</button>
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
                  setConfig({ ...config, mosaicCols: val, mosaicRows: val });
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
          onChange={(e) => setConfig({ ...config, printGuides: e.target.checked })}
          className="rounded text-purple-600 focus:ring-purple-500"
        />
        <label htmlFor="mosaicGuides" className="text-xs font-medium text-purple-700 cursor-pointer select-none">
          Imprimir guías de margen

        </label>
      </div>
    </div>
  );

  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = React.useRef(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
    setShowAddMenu(false);
  };

  const renderCVMode = () => {
    // --- HELPERS ---
    const updatePersonalData = (key, value) => {
      setConfig(prev => ({
        ...prev,
        personalData: { ...prev.personalData, [key]: value }
      }));
    };

    const formatDUI = (val) => {
      const raw = val.replace(/\D/g, '').slice(0, 9);
      if (raw.length > 8) return `${raw.slice(0, 8)}-${raw.slice(8)}`;
      return raw;
    };

    const formatNIT = (val) => {
      const raw = val.replace(/\D/g, '').slice(0, 14);
      if (raw.length > 13) return `${raw.slice(0, 4)}-${raw.slice(4, 10)}-${raw.slice(10, 13)}-${raw.slice(13)}`;
      if (raw.length > 10) return `${raw.slice(0, 4)}-${raw.slice(4, 10)}-${raw.slice(10)}`;
      if (raw.length > 4) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
      return raw;
    };

    const calculateAge = (dob) => {
      if (!dob) return '';
      const diff = Date.now() - new Date(dob).getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleDobChange = (e) => {
      const dob = e.target.value;
      const updates = { dob };
      if (!config.personalData.manualAge) {
        updates.age = calculateAge(dob);
      }
      setConfig(prev => ({
        ...prev,
        personalData: { ...prev.personalData, ...updates }
      }));
    };

    const addPhone = () => {
      const newPhone = { id: Date.now(), number: '', type: 'mobile', hasWhatsapp: false };
      updatePersonalData('phones', [...(config.personalData.phones || []), newPhone]);
    };

    const updatePhone = (id, field, val) => {
      const newPhones = config.personalData.phones.map(p => p.id === id ? { ...p, [field]: val } : p);
      updatePersonalData('phones', newPhones);
    };

    // Add Other Doc helpers
    const addOther = () => updatePersonalData('others', [...(config.personalData.others || []), { name: '', value: '' }]);
    const updateOther = (idx, key, val) => {
      const newOthers = [...config.personalData.others];
      newOthers[idx][key] = val;
      updatePersonalData('others', newOthers);
    };

    // --- STEP 0: PAGE SETUP ---
    // --- STEP 0: CV HOME (MENU) ---
    if (config.step === 0) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-700">Curriculum Vitae</h3>
            <p className="text-slate-400 text-xs mt-1">Crea un CV profesional o continúa uno existente</p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => {
                // RESET NEW CV STATE - HARD RESET
                const cleanState = JSON.parse(JSON.stringify(DEFAULT_BASE.personalData));
                setConfig(prev => ({
                  ...prev,
                  ...DEFAULTS.cv, // Base defaults
                  personalData: cleanState, // Explicit fresh data
                  step: 1
                }));
              }}
              className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Plus className="w-5 h-5 text-white" /></div>
                <div className="text-left">
                  <div className="font-bold text-sm">Crear Nuevo</div>
                  <div className="text-[10px] opacity-80">Comenzar desde cero</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setConfig(prev => ({ ...prev, step: 'drafts' }))}
              className="w-full bg-white text-slate-600 border border-slate-200 p-4 rounded-xl shadow-sm hover:bg-slate-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg"><FileText className="w-5 h-5 text-slate-500" /></div>
                <div className="text-left">
                  <div className="font-bold text-sm">Ver Borradores</div>
                  <div className="text-[10px] opacity-80">{cvDrafts?.length || 0} guardados</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      );
    }

    // --- STEP: DRAFTS LIST ---
    if (config.step === 'drafts') {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
          <button onClick={() => setConfig(prev => ({ ...prev, step: 0 }))} className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1 mb-2">
            <ArrowRight className="w-3 h-3 rotate-180" /> Volver
          </button>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-700">Mis Borradores</h3>
            <p className="text-slate-400 text-xs mt-1">Selecciona para continuar editando</p>
          </div>

          <div className="space-y-3">
            {cvDrafts?.length > 0 ? (
              cvDrafts.map(draft => (
                <div key={draft.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center group">
                  <button onClick={() => setConfig(draft.config)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="bg-blue-50 p-2 rounded-lg"><FileText className="w-5 h-5 text-blue-500" /></div>
                    <div>
                      <div className="font-bold text-sm text-slate-700">{draft.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(draft.date).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => deleteCVDraft(draft.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
                <FileText className="w-8 h-8 opacity-50" />
                <span className="text-xs">No tienes borradores guardados</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // --- STEP 1: PAGE SETUP ---
    if (config.step === 1) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
          <button onClick={() => setConfig(prev => ({ ...prev, step: 0 }))} className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1 mb-2">
            <ArrowRight className="w-3 h-3 rotate-180" /> Volver
          </button>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-700">Configuración de Hoja</h3>
            <p className="text-slate-400 text-xs mt-1">Selecciona el tamaño de tu Curriculum</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setConfig(prev => ({ ...prev, pageSize: 'carta' }))}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${config.pageSize === 'carta' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
            >
              <div className="w-16 h-20 bg-white border border-slate-300 shadow-sm flex items-center justify-center">
                <span className="text-[10px] text-slate-400">8.5x11"</span>
              </div>
              <span className={`font-bold text-sm ${config.pageSize === 'carta' ? 'text-blue-600' : 'text-slate-600'}`}>Carta</span>
            </button>

            <button
              onClick={() => setConfig(prev => ({ ...prev, pageSize: 'a4' }))}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${config.pageSize === 'a4' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
            >
              <div className="w-16 h-24 bg-white border border-slate-300 shadow-sm flex items-center justify-center">
                <span className="text-[10px] text-slate-400">A4</span>
              </div>
              <span className={`font-bold text-sm ${config.pageSize === 'a4' ? 'text-blue-600' : 'text-slate-600'}`}>A4</span>
            </button>
          </div>

          <button
            onClick={() => setConfig(prev => ({ ...prev, step: 2 }))}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-8"
          >
            Comenzar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // --- STEP 1: PERSONAL DATA ---
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
        <SaveSection />

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
            Datos Personales
          </h3>

          <div className="space-y-3">
            {/* Nombres */}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-blue-600 font-bold block mb-1">Primer Nombre</label><input type="text" value={config.personalData.firstName} onChange={e => updatePersonalData('firstName', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5 focus:border-blue-500" /></div>
              <div><label className="text-[10px] text-slate-400 font-bold block mb-1">Segundo Nombre (Op)</label><input type="text" value={config.personalData.secondName} onChange={e => updatePersonalData('secondName', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5 focus:border-blue-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-blue-600 font-bold block mb-1">Primer Apellido</label><input type="text" value={config.personalData.firstSurname} onChange={e => updatePersonalData('firstSurname', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5 focus:border-blue-500" /></div>
              <div><label className="text-[10px] text-slate-400 font-bold block mb-1">Segundo Apellido (Op)</label><input type="text" value={config.personalData.secondSurname} onChange={e => updatePersonalData('secondSurname', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5 focus:border-blue-500" /></div>
            </div>

            {/* Sexo y Fecha Nac */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-blue-600 font-bold block mb-1">Sexo</label>
                <select value={config.personalData.sex} onChange={e => updatePersonalData('sex', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5">
                  <option>Masculino</option><option>Femenino</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-blue-600 font-bold block mb-1">Fecha Nacimiento</label>
                <input type="date" value={config.personalData.dob} onChange={handleDobChange} className="w-full text-xs border border-blue-200 rounded p-1.5" />
              </div>
            </div>

            {/* Edad */}
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-100">
              <div className="flex-1">
                <label className="text-[10px] text-blue-600 font-bold block mb-1">Edad</label>
                <input type="number" value={config.personalData.age} onChange={e => updatePersonalData('age', e.target.value)} disabled={!config.personalData.manualAge} className={`w-full text-xs border border-blue-200 rounded p-1.5 ${!config.personalData.manualAge ? 'bg-slate-50 text-slate-500' : ''}`} />
              </div>
              <div className="flex flex-col items-center pt-3">
                <input type="checkbox" checked={config.personalData.manualAge} onChange={e => updatePersonalData('manualAge', e.target.checked)} id="manualAge" />
                <label htmlFor="manualAge" className="text-[9px] text-slate-400 mt-0.5">Manual</label>
              </div>
            </div>

            {/* DUI NIT */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-blue-600 font-bold block mb-1">DUI (9 dg)</label>
                <input type="text" value={config.personalData.dui} onChange={e => updatePersonalData('dui', formatDUI(e.target.value))} placeholder="00000000-0" maxLength={10} className="w-full text-xs border border-blue-200 rounded p-1.5 focus:border-blue-500" />
              </div>
              <div>
                <div className="flex justify-between"><label className="text-[10px] text-blue-600 font-bold block mb-1">NIT</label>
                  <button onClick={() => updatePersonalData('showNit', !config.personalData.showNit)} title={config.personalData.showNit ? "Ocultar" : "Mostrar"} className="text-blue-400 hover:text-blue-600"><Check className={`w-3 h-3 ${!config.personalData.showNit ? 'grayscale opacity-50' : ''}`} /></button></div>
                <input type="text" value={config.personalData.nit} onChange={e => updatePersonalData('nit', formatNIT(e.target.value))} placeholder="0000-000000-000-0" maxLength={17} disabled={!config.personalData.showNit} className={`w-full text-xs border border-blue-200 rounded p-1.5 ${!config.personalData.showNit ? 'bg-slate-100 opacity-50' : ''}`} />
              </div>
            </div>

            {/* Estado Civil */}
            <div className="bg-white p-2 border border-blue-100 rounded">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-blue-600 font-bold">Estado Civil</label>
                <input type="checkbox" checked={config.personalData.showCivilStatus} onChange={e => updatePersonalData('showCivilStatus', e.target.checked)} className="rounded text-blue-500" />
              </div>
              {config.personalData.showCivilStatus && (
                <select value={config.personalData.civilStatus} onChange={e => updatePersonalData('civilStatus', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5">
                  <option>Soltero</option><option>Casado</option><option>Divorciado</option><option>Viudo</option><option>Unión Libre</option>
                </select>
              )}
            </div>

            {/* ISSS AFP */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-1"><label className="text-[10px] text-blue-600 font-bold">ISSS</label><label className="text-[9px]"><input type="checkbox" checked={config.personalData.isssNA} onChange={e => updatePersonalData('isssNA', e.target.checked)} /> N/A</label></div>
                <input type="text" value={config.personalData.isss} onChange={e => updatePersonalData('isss', e.target.value)} disabled={config.personalData.isssNA} className="w-full text-xs border border-blue-200 rounded p-1.5" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1"><label className="text-[10px] text-blue-600 font-bold">AFP</label><label className="text-[9px]"><input type="checkbox" checked={config.personalData.afpNA} onChange={e => updatePersonalData('afpNA', e.target.checked)} /> N/A</label></div>
                <input type="text" value={config.personalData.afp} onChange={e => updatePersonalData('afp', e.target.value)} disabled={config.personalData.afpNA} className="w-full text-xs border border-blue-200 rounded p-1.5" />
              </div>
            </div>

            {/* Telefonos */}
            <div className="bg-white p-2 border border-blue-100 rounded">
              <label className="text-[10px] text-blue-600 font-bold block mb-2">Teléfonos</label>
              <div className="space-y-2">
                {config.personalData.phones?.map((phone, idx) => (
                  <div key={phone.id} className="flex gap-1 items-center">
                    <input type="text" value={phone.number} onChange={e => updatePhone(phone.id, 'number', e.target.value)} placeholder="0000-0000" className="flex-1 text-xs border border-slate-200 rounded p-1.5" />
                    <div className="flex flex-col items-center px-1 bg-slate-50 rounded">
                      <input type="checkbox" checked={phone.hasWhatsapp} onChange={e => updatePhone(phone.id, 'hasWhatsapp', e.target.checked)} title="Tiene WhatsApp" />
                      <span className="text-[8px] text-slate-400">WA</span>
                    </div>
                    <button onClick={() => {
                      const newP = config.personalData.phones.filter(p => p.id !== phone.id);
                      updatePersonalData('phones', newP);
                    }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={addPhone} className="w-full py-1 text-xs text-blue-500 border border-dashed border-blue-300 rounded hover:bg-blue-50">+ Agregar Teléfono</button>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white p-2 border border-blue-100 rounded">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-blue-600 font-bold">Email</label>
                <input type="checkbox" checked={config.personalData.emailNA} onChange={e => updatePersonalData('emailNA', e.target.checked)} title="No Aplica" className="rounded text-blue-500" />
              </div>
              {!config.personalData.emailNA && (
                <input type="email" value={config.personalData.email} onChange={e => updatePersonalData('email', e.target.value)} className="w-full text-xs border border-blue-200 rounded p-1.5" />
              )}
            </div>

            {/* Otros */}
            <div className="bg-white p-2 border border-blue-100 rounded">
              <label className="text-[10px] text-blue-600 font-bold block mb-2">Otros Documentos</label>
              <div className="space-y-2">
                {config.personalData.others?.map((doc, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <input type="text" placeholder="Nombre (Ej: Licencia)" value={doc.name} onChange={e => updateOther(idx, 'name', e.target.value)} className="w-1/3 text-xs border border-slate-200 rounded p-1.5" />
                    <input type="text" placeholder="Valor" value={doc.value} onChange={e => updateOther(idx, 'value', e.target.value)} className="flex-1 text-xs border border-slate-200 rounded p-1.5" />
                    <button onClick={() => {
                      const newO = config.personalData.others.filter((_, i) => i !== idx);
                      updatePersonalData('others', newO);
                    }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={addOther} className="w-full py-1 text-xs text-blue-500 border border-dashed border-blue-300 rounded hover:bg-blue-50">+ Agregar Documento</button>
              </div>
            </div>


          </div>
        </div>

        <button
          onClick={() => setConfig(prev => ({ ...prev, step: 3 }))}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          Continuar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };



  const renderBannerMode = () => {
    // Calcular Tamaño Final
    // const pageSize = PAGE_SIZES[config.pageSize];
    // bannerLayout is not defined in the provided context, assuming it's a prop or derived elsewhere.
    // const bannerLayout = null; // Placeholder, replace with actual derivation if available
    // const finalWidth = bannerLayout ? (pageSize.width * bannerLayout.cols) : 0;
    // const finalHeight = bannerLayout ? (pageSize.height * bannerLayout.rows) : 0;
    // const finalSizeStr = `${convert(finalWidth, unit)} x ${convert(finalHeight, unit)}`;

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
        <SaveSection />
        <PaperSettings config={config} setConfig={setConfig} />
        <MarginSettings config={config} setConfig={setConfig} unit={unit} />

        <div className="bg-pink-50 p-3 rounded-lg border border-pink-100 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-pink-800 block mb-1">Tu Frase</label>
            <textarea value={config.bannerText} onChange={(e) => updateBannerConfig('bannerText', e.target.value)} className="w-full border border-pink-200 rounded p-2 text-sm focus:ring-pink-500 resize-none h-20" placeholder="Escribe aquí..." disabled={!isBannerPreview} />
          </div>

          {/* SECCIÓN DE FUENTES MEJORADA */}
          <div>
            <div className="flex justify-between items-end mb-1 relative">
              <label className="text-[10px] font-bold text-pink-800">Tipografía ({filteredFonts.length})</label>

              <div className="flex gap-1">
                {/* Botón Añadir Fuente */}
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className={`p-1 rounded transition-colors ${showAddMenu ? 'bg-pink-200 text-pink-800' : 'hover:bg-pink-100 text-pink-400'}`}
                    title="Añadir fuentes"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {showAddMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 p-1 z-50 w-36 animate-in fade-in zoom-in-95 duration-200">
                      <div className="text-[9px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Añadir desde:</div>
                      <button onClick={() => { setShowFontInput(true); setShowAddMenu(false); }} className="w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors">
                        <Globe className="w-3 h-3 text-blue-400" /> Google Fonts
                      </button>
                      <button onClick={triggerFileUpload} className="w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors">
                        <FileType className="w-3 h-3 text-amber-500" /> Archivo Local
                      </button>
                      <button onClick={() => { handleSystemFonts(); setShowAddMenu(false); }} className="w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors">
                        <Monitor className="w-3 h-3 text-slate-500" /> Detectar Sistema
                      </button>
                    </div>
                  )}
                </div>

                {/* Botón Filtro */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`p-1 rounded transition-colors ${fontFilter !== 'all' ? 'bg-pink-200 text-pink-800' : 'hover:bg-pink-100 text-pink-400'}`}
                    title="Filtrar fuentes"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 p-1 z-50 w-32 animate-in fade-in zoom-in-95 duration-200">
                      <div className="text-[9px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Mostrar:</div>
                      {[
                        { id: 'all', label: 'Todas', icon: Layers },
                        { id: 'web', label: 'Web', icon: Globe },
                        { id: 'system', label: 'Sistema', icon: Monitor },
                        { id: 'custom', label: 'Archivos', icon: FileType },
                        { id: 'favorites', label: 'Favoritas', icon: Heart }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => selectFilter(opt.id)}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 transition-colors ${fontFilter === opt.id ? 'bg-pink-50 text-pink-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <opt.icon className={`w-3 h-3 ${opt.id === 'favorites' && fontFilter === 'favorites' ? 'fill-pink-600' : ''}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <select value={config.bannerFont} onChange={handleBannerFontChange} className="flex-1 border border-pink-200 rounded p-1.5 text-sm" disabled={!isBannerPreview}>
                {filteredFonts.map((font, idx) => (
                  <option key={idx} value={font.name} style={{ fontFamily: font.name }}>{font.name}</option>
                ))}
                {filteredFonts.length === 0 && <option disabled>Sin resultados</option>}
              </select>
              <button
                onClick={() => toggleFavorite(config.bannerFont || 'Arial')}
                className={`p-1.5 border border-pink-200 rounded transition-colors ${favFonts.includes(config.bannerFont || 'Arial') ? 'bg-pink-50 text-pink-600 border-pink-300' : 'bg-white text-slate-300 hover:text-pink-400'}`}
                title="Marcar como favorita"
              >
                <Heart className={`w-4 h-4 ${favFonts.includes(config.bannerFont || 'Arial') ? 'fill-pink-600' : ''}`} />
              </button>
            </div>

            <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

            {/* Input para Google Fonts */}
            {showFontInput && (
              <div className="mt-2 flex gap-1 animate-in fade-in slide-in-from-top-1">
                <input
                  type="text"
                  placeholder="Ej: Roboto Slab"
                  className="flex-1 text-xs border border-pink-300 p-1 rounded"
                  value={googleFontName}
                  onChange={(e) => setGoogleFontName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoogleFont()}
                  autoFocus
                />
                <button onClick={addGoogleFont} className="bg-pink-500 text-white px-2 rounded text-xs">OK</button>
                <button onClick={() => setShowFontInput(false)} className="text-slate-400 hover:text-red-500 px-1"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-pink-800 block mb-1">Altura Letra ({UNITS[unit].label})</label>
              <InputNumber valueMm={config.bannerHeight} unit={unit} step={UNITS[unit].step} min={10} onChange={(val) => updateBannerConfig('bannerHeight', toMm(val, unit))} className="w-full border border-pink-200 rounded p-1.5 text-sm" disabled={!isBannerPreview} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-pink-800 block mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.bannerColor} onChange={(e) => updateBannerConfig('bannerColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-pink-200 p-0 overflow-hidden" disabled={!isBannerPreview} />
                <span className="text-xs text-pink-600 font-mono">{config.bannerColor}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Independent Outline Toggle */}
            <button
              onClick={() => updateBannerConfig('isOutline', !config.isOutline)}
              className={`flex-1 py-1.5 text-xs font-bold rounded border transition-colors ${config.isOutline ? 'bg-pink-200 border-pink-300 text-pink-800' : 'bg-white border-pink-200 text-pink-400'}`}
              disabled={!isBannerPreview}
            >
              Solo Contorno
            </button>

            {/* Independent Italic Toggle */}
            <button
              onClick={() => updateBannerConfig('isItalic', !config.isItalic)}
              className={`flex-1 py-1.5 text-xs font-bold rounded border transition-colors ${config.isItalic ? 'bg-pink-200 border-pink-300 text-pink-800' : 'bg-white border-pink-200 text-pink-400'}`}
              disabled={!isBannerPreview}
            >
              Italic (K)
            </button>
          </div>



          {/* Conditional Stroke Width Control */}
          {config.isOutline && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="text-[10px] font-bold text-pink-800 block mb-1">Grosor de Contorno ({config.bannerStrokeWidth}px)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={config.bannerStrokeWidth || 1}
                onChange={(e) => updateBannerConfig('bannerStrokeWidth', Number(e.target.value))}
                className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                disabled={!isBannerPreview}
              />
            </div>
          )}
          <div className="pt-3 border-t border-pink-100 mt-3">
            {isBannerPreview ? (
              <button onClick={() => setIsBannerPreview(false)} className="w-full bg-pink-600 text-white text-xs font-bold py-2.5 rounded shadow-sm hover:bg-pink-700 transition flex items-center justify-center gap-2">
                <Scissors className="w-4 h-4" /> Procesar {totalPages} Páginas
              </button>
            ) : (
              <button onClick={() => setIsBannerPreview(true)} className="w-full bg-white text-pink-700 border border-pink-200 text-xs font-bold py-2.5 rounded shadow-sm hover:bg-pink-50 transition flex items-center justify-center gap-2">
                <Layers className="w-4 h-4" /> Ajustar Texto
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100"><input type="checkbox" id="bannerGuides" checked={config.printGuides} onChange={(e) => setConfig({ ...config, printGuides: e.target.checked })} className="rounded text-pink-600 focus:ring-pink-500" /><label htmlFor="bannerGuides" className="text-xs font-medium text-pink-700 cursor-pointer select-none">Imprimir guías de corte</label></div>
      </div >
    );
  };

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
      {renderExitConfirmationModal()}
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
          {activeView === 'cv' && 'Crear Curriculum'}
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
        {activeView === 'cv' && renderCVMode()}
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
