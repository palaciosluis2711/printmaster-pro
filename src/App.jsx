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
  Link,
  Unlink,
  Ruler,
  LogIn,
  LogOut,
  User,
  Cloud
} from 'lucide-react';

// --- IMPORTACIONES DE FIREBASE ---
// Asegúrate de que src/firebase.js existe y tiene tus credenciales
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

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
const mmToPx = (mm) => mm * 3.7795275591;

export default function App() {
  // --- ESTADO PRINCIPAL ---
  const [user, setUser] = useState(null); // Estado del usuario
  const [isSaving, setIsSaving] = useState(false); // Indicador de guardado en nube

  const [unit, setUnit] = useState('mm');
  const [images, setImages] = useState([]);
  const [zoom, setZoom] = useState(0.8);

  // Estado inicial diferido para cargar de LocalStorage si no hay usuario
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('printmaster_favs');
    return saved ? JSON.parse(saved) : [];
  });

  const dragRef = useRef(null);

  const [config, setConfig] = useState({
    pageSize: 'carta',
    cols: 2,
    rows: 2,
    gap: 5,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    showGuides: true,
    printGuides: false,
    uniformMargins: false,
    useCustomSize: false,
    customWidth: 50,
    customHeight: 50,
    customMaxItems: 0
  });

  const [newFavName, setNewFavName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // --- LÓGICA DE FIREBASE Y PERSISTENCIA ---

  // 1. Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Si inicia sesión, cargar sus datos de Firestore
        await loadUserData(currentUser.uid);
      } else {
        // Si cierra sesión, volver a datos locales (o limpiar)
        const savedFavs = localStorage.getItem('printmaster_favs');
        setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar datos del usuario desde Firestore
  const loadUserData = async (uid) => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config) setConfig(data.config);
        if (data.favorites) setFavorites(data.favorites);
        if (data.unit) setUnit(data.unit);
      } else {
        // Si es usuario nuevo, guardar la config actual como inicial
        await setDoc(docRef, {
          config,
          favorites,
          unit
        });
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
    setIsSaving(false);
  };

  // 3. Auto-guardado en Firestore (Debounced)
  // Guarda Configuración y Unidad cada vez que cambian, pero espera 1.5s de inactividad
  useEffect(() => {
    if (!user) return; // Solo si hay usuario

    const saveData = setTimeout(async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, "users", user.uid);
        // Usamos setDoc con { merge: true } para actualizar solo lo necesario
        await setDoc(docRef, { config, unit }, { merge: true });
      } catch (error) {
        console.error("Error guardando config:", error);
      }
      setIsSaving(false);
    }, 1500); // Esperar 1.5 segundos después del último cambio

    return () => clearTimeout(saveData);
  }, [config, unit, user]);

  // 4. Guardado inmediato de Favoritos
  // Los favoritos no necesitan debounce porque son acciones puntuales
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, guardar en LocalStorage
      localStorage.setItem('printmaster_favs', JSON.stringify(favorites));
      return;
    }

    const saveFavs = async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { favorites }, { merge: true });
      } catch (error) {
        console.error("Error guardando favoritos:", error);
      }
      setIsSaving(false);
    };
    saveFavs();
  }, [favorites, user]);


  // --- FUNCIONES DE AUTH ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo iniciar sesión con Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };


  // --- CÁLCULOS LÓGICOS (Igual que antes) ---
  const currentPage = PAGE_SIZES[config.pageSize];
  const pageWidthMm = currentPage.width;
  const pageHeightMm = currentPage.height;

  const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
  const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;

  let computedCols, computedRows, computedCellWidthMm, computedCellHeightMm, itemsPerPage;

  if (config.useCustomSize) {
    const w = config.customWidth;
    const h = config.customHeight;
    const g = config.gap;
    const maxCols = Math.floor((contentWidth + g) / (w + g));
    const maxRows = Math.floor((contentHeight + g) / (h + g));
    computedCols = Math.max(1, maxCols);
    computedRows = Math.max(1, maxRows);
    computedCellWidthMm = w;
    computedCellHeightMm = h;
    const maxPossible = computedCols * computedRows;
    const limit = config.customMaxItems > 0 ? config.customMaxItems : maxPossible;
    itemsPerPage = Math.min(maxPossible, limit);
  } else {
    computedCols = config.cols;
    computedRows = config.rows;
    itemsPerPage = computedCols * computedRows;
    const totalGapWidth = config.gap * (config.cols - 1);
    computedCellWidthMm = (contentWidth - totalGapWidth) / config.cols;
    const totalGapHeight = config.gap * (config.rows - 1);
    computedCellHeightMm = (contentHeight - totalGapHeight) / config.rows;
  }

  const cellWidthPx = mmToPx(computedCellWidthMm);
  const cellHeightPx = mmToPx(computedCellHeightMm);
  const totalPages = Math.max(1, Math.ceil(images.length / itemsPerPage));

  // --- HANDLERS (Files, Drag, Etc) ---
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const newImages = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      src: URL.createObjectURL(file),
      rotation: 0,
      objectFit: 'cover',
      x: 0, y: 0, name: file.name, naturalWidth: 1, naturalHeight: 1
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleFileUpload = (e) => handleFiles(e.target.files);
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleImageLoad = (id, e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImages(prev => prev.map(img => img.id === id ? { ...img, naturalWidth, naturalHeight } : img));
  };

  const handleRightClickPaste = async (e) => {
    e.preventDefault();
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return;
      const clipboardItems = await navigator.clipboard.read();
      const newPastedImages = [];
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted.png", { type: imageType });
          newPastedImages.push({
            id: crypto.randomUUID(),
            src: URL.createObjectURL(file),
            rotation: 0, objectFit: 'cover', x: 0, y: 0, name: 'Portapapeles', naturalWidth: 1, naturalHeight: 1
          });
        }
      }
      if (newPastedImages.length > 0) setImages(prev => [...prev, ...newPastedImages]);
    } catch (err) { /* Silent fail */ }
  };

  const handleMouseDown = (e, img) => {
    if (img.objectFit !== 'cover') return;
    e.preventDefault();
    dragRef.current = {
      id: img.id, startX: e.clientX, startY: e.clientY,
      initialImgX: img.x || 0, initialImgY: img.y || 0,
      imgRotation: img.rotation, imgNatW: img.naturalWidth, imgNatH: img.naturalHeight
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
        if (imgRatio > cellRatio) { renderH_px = cellH_px; renderW_px = cellH_px * imgRatio; }
        else { renderW_px = cellW_px; renderH_px = cellW_px / imgRatio; }
      } else {
        if (imgRatio > cellRatio) { renderH_px = cellH_px; renderW_px = cellH_px * imgRatio; }
        else { renderW_px = cellW_px; renderH_px = cellW_px / imgRatio; }
      }
      const maxX = Math.max(0, (renderW_px - cellW_px) / 2);
      const maxY = Math.max(0, (renderH_px - cellH_px) / 2);
      setImages(prev => prev.map(img => {
        if (img.id === id) {
          let nextX = Math.max(-maxX, Math.min(maxX, initialImgX + deltaX));
          let nextY = Math.max(-maxY, Math.min(maxY, initialImgY + deltaY));
          return { ...img, x: nextX, y: nextY };
        }
        return img;
      }));
    };
    const handleMouseUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoom, cellWidthPx, cellHeightPx]);

  // Image actions...
  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));
  const duplicateImage = (img) => { setImages(prev => [...prev, { ...img, id: crypto.randomUUID(), x: 0, y: 0 }]); };
  const fillPage = (img) => {
    const currentCount = images.length;
    const remainder = currentCount % itemsPerPage;
    if (remainder === 0 && currentCount > 0) return;
    const needed = remainder === 0 ? itemsPerPage : itemsPerPage - remainder;
    const copies = Array.from({ length: needed }).map(() => ({ ...img, id: crypto.randomUUID(), x: 0, y: 0 }));
    setImages(prev => [...prev, ...copies]);
  };
  const rotateImage = (id) => { setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 } : img)); };
  const rotateAllImages = () => { setImages(prev => prev.map(img => ({ ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 }))); };
  const toggleObjectFit = (id) => { setImages(prev => prev.map(img => img.id === id ? { ...img, objectFit: img.objectFit === 'cover' ? 'contain' : 'cover', x: 0, y: 0 } : img)); };

  // Config actions
  const saveConfiguration = () => {
    if (!newFavName.trim()) return;
    const newFav = { id: Date.now(), name: newFavName, config };
    const updatedFavs = [...favorites, newFav];
    setFavorites(updatedFavs);
    setNewFavName('');
    setShowSaveModal(false);
  };
  const loadConfiguration = (favConfig) => { const { orientation, ...rest } = favConfig; setConfig({ uniformMargins: false, useCustomSize: false, customWidth: 50, customHeight: 50, customMaxItems: 0, ...rest }); };
  const deleteFavorite = (id) => { setFavorites(favorites.filter(f => f.id !== id)); };

  const updateMargin = (side, value) => {
    const mmValue = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, margins: { ...prev.margins, [side]: mmValue } }));
  };
  const updateAllMargins = (value) => {
    const mmValue = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, margins: { top: mmValue, right: mmValue, bottom: mmValue, left: mmValue } }));
  };
  const updateCustomSize = (key, value) => {
    const mmValue = toMm(Number(value), unit);
    setConfig(prev => ({ ...prev, [key]: mmValue }));
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col h-screen overflow-hidden" onDrop={handleDrop} onDragOver={handleDragOver}>

      {/* HEADER */}
      <header className="bg-blue-700 text-white p-3 shadow-md flex justify-between items-center z-20 print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="w-6 h-6" />
          <h1 className="text-lg font-bold">PrintMaster <span className="font-light opacity-80">Pro</span></h1>
        </div>

        <div className="flex gap-2 items-center">
          {/* USER / LOGIN SECTION */}
          <div className="mr-4 border-r border-blue-500 pr-4 flex items-center">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-white/50" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><User className="w-4 h-4" /></div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium max-w-[100px] truncate">{user.displayName || user.email}</span>
                  <div className="flex items-center gap-1">
                    {isSaving && <Cloud className="w-3 h-3 text-blue-200 animate-pulse" />}
                    <button onClick={handleLogout} className="text-[10px] text-blue-200 hover:text-white flex items-center gap-1">
                      <LogOut className="w-3 h-3" /> Salir
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 bg-white text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-50 transition shadow-sm"
              >
                <LogIn className="w-3 h-3" /> Iniciar Sesión
              </button>
            )}
          </div>

          <button onClick={() => setShowSettingsModal(true)} className="p-2 mr-2 text-blue-200 hover:text-white hover:bg-blue-600/50 rounded-full transition" title="Configuración Global">
            <Settings className="w-5 h-5" />
          </button>

          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Subir Fotos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shadow-sm z-10 print:hidden">
          <div className="p-5 space-y-6 flex-1">
            {/* Favoritos */}
            <section className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Star className="w-3 h-3" /> Favoritos {user && <Cloud className="w-3 h-3 text-blue-400" title="Sincronizado en la nube" />}
                </h3>
                <button onClick={() => setShowSaveModal(true)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition flex items-center gap-1">
                  <Save className="w-3 h-3" /> Guardar actual
                </button>
              </div>

              {showSaveModal && (
                <div className="mb-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <input autoFocus type="text" placeholder="Nombre (ej. Pasaporte)" className="flex-1 text-xs border p-1 rounded" value={newFavName} onChange={e => setNewFavName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveConfiguration()} />
                  <button onClick={saveConfiguration} className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setShowSaveModal(false)} className="bg-slate-200 text-slate-600 px-2 rounded hover:bg-slate-300"><X className="w-3 h-3" /></button>
                </div>
              )}

              {favorites.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay configuraciones guardadas.</p>
              ) : (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {favorites.map(fav => (
                    <li key={fav.id} className="flex justify-between items-center group text-sm">
                      <button onClick={() => loadConfiguration(fav.config)} className="text-slate-700 hover:text-blue-600 truncate flex-1 text-left">{fav.name}</button>
                      <button onClick={() => deleteFavorite(fav.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <hr className="border-slate-100" />

            {/* Papel */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Settings className="w-3 h-3" /> Papel</h3>
              <div className="space-y-3">
                <select className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={config.pageSize} onChange={(e) => setConfig({ ...config, pageSize: e.target.value })}>
                  {Object.entries(PAGE_SIZES).map(([key, val]) => (<option key={key} value={key}>{val.name}</option>))}
                </select>
              </div>
            </section>

            {/* Márgenes */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Maximize className="w-3 h-3" /> Márgenes ({UNITS[unit].label})</h3>
                <div className="flex items-center gap-1.5" title="Aplicar el mismo margen a todos los lados">
                  <input type="checkbox" id="uniformMargins" checked={config.uniformMargins} onChange={(e) => { const isChecked = e.target.checked; const newConfig = { ...config, uniformMargins: isChecked }; if (isChecked) { const val = config.margins.top; newConfig.margins = { top: val, right: val, bottom: val, left: val }; } setConfig(newConfig); }} className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3" />
                  <label htmlFor="uniformMargins" className="text-[10px] font-medium text-slate-500 cursor-pointer select-none flex items-center gap-1">{config.uniformMargins ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />} Unificar</label>
                </div>
              </div>

              {config.uniformMargins && (
                <div className="mb-3 bg-blue-50 p-2 rounded-md border border-blue-100 animate-in slide-in-from-top-2 fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-blue-700">Margen Global</label>
                    <span className="text-[10px] font-mono text-blue-600">{convert(config.margins.top, unit)}</span>
                  </div>
                  <input type="range" min="0" max="50" step={UNITS[unit].step} value={convert(config.margins.top, unit)} onChange={(e) => updateAllMargins(e.target.value)} className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
              )}

              <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${config.uniformMargins ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {['top', 'bottom', 'left', 'right'].map(side => {
                  const labels = { top: 'Superior', bottom: 'Inferior', left: 'Izquierdo', right: 'Derecho' };
                  return (
                    <div key={side}>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">{labels[side]}</label>
                      <input type="number" step={UNITS[unit].step} min="0" value={convert(config.margins[side], unit)} onChange={(e) => updateMargin(side, e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" disabled={config.uniformMargins} />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Retícula */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Grid className="w-3 h-3" /> Retícula</h3>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" id="customSize" checked={config.useCustomSize} onChange={(e) => setConfig({ ...config, useCustomSize: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3" />
                  <label htmlFor="customSize" className="text-[10px] font-medium text-slate-500 cursor-pointer select-none flex items-center gap-1"><Ruler className="w-3 h-3" /> Tamaño Fijo</label>
                </div>
              </div>

              {config.useCustomSize ? (
                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-blue-800 block mb-1">Ancho ({UNITS[unit].label})</label>
                      <input type="number" step={UNITS[unit].step} min="1" value={convert(config.customWidth, unit)} onChange={(e) => updateCustomSize('customWidth', e.target.value)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-blue-800 block mb-1">Alto ({UNITS[unit].label})</label>
                      <input type="number" step={UNITS[unit].step} min="1" value={convert(config.customHeight, unit)} onChange={(e) => updateCustomSize('customHeight', e.target.value)} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-blue-800 block mb-1">Límite por página</label>
                      <span className="text-[9px] text-blue-500">(0 = Máx. posible)</span>
                    </div>
                    <input type="number" min="0" max="100" value={config.customMaxItems} onChange={(e) => setConfig({ ...config, customMaxItems: Math.max(0, Number(e.target.value)) })} className="w-full border border-blue-200 rounded p-1.5 text-sm focus:ring-blue-500" placeholder="Ej. 8" />
                  </div>
                  <div className="text-[10px] text-blue-600 bg-blue-100 p-2 rounded flex gap-1 items-start">
                    <span>ℹ️</span>
                    <span>Caben <b>{Math.max(1, Math.floor((contentWidth + config.gap) / (config.customWidth + config.gap)))}</b> x <b>{Math.max(1, Math.floor((contentHeight + config.gap) / (config.customHeight + config.gap)))}</b> ({Math.floor((contentWidth + config.gap) / (config.customWidth + config.gap)) * Math.floor((contentHeight + config.gap) / (config.customHeight + config.gap))} total)</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-3 animate-in slide-in-from-top-2 fade-in">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Columnas</label>
                    <input type="number" min="1" max="10" value={config.cols} onChange={(e) => setConfig({ ...config, cols: Math.max(1, Number(e.target.value)) })} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Filas</label>
                    <input type="number" min="1" max="10" value={config.rows} onChange={(e) => setConfig({ ...config, rows: Math.max(1, Number(e.target.value)) })} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">Espaciado ({UNITS[unit].label})</label>
                <div className="flex gap-2 items-center">
                  <input type="range" min="0" max="50" step="0.5" value={config.gap} onChange={(e) => setConfig({ ...config, gap: Number(e.target.value) })} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  <span className="text-xs font-mono w-10 text-right">{convert(config.gap, unit)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <input type="checkbox" id="printGuides" checked={config.printGuides} onChange={(e) => setConfig({ ...config, printGuides: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                <label htmlFor="printGuides" className="text-xs font-medium text-slate-600 cursor-pointer select-none">Imprimir líneas guía</label>
              </div>
            </section>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">Imágenes: {images.length}</span>
              <button onClick={() => setImages([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"><Trash2 className="w-3 h-3" /> Limpiar Todo</button>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'contain', x: 0, y: 0 })))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600">Todos Completa</button>
              <button onClick={() => setImages(prev => prev.map(img => ({ ...img, objectFit: 'cover' })))} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600">Todos Relleno</button>
              <button onClick={rotateAllImages} className="flex-1 text-[10px] bg-white border hover:bg-slate-100 py-1 rounded text-slate-600">Rotar Todos</button>
            </div>
          </div>
        </aside>

        {/* --- CANVAS PRINCIPAL --- */}
        <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">

          <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-30 print:hidden transition-all hover:shadow-xl">
            <button onClick={() => setZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition" title="Alejar"><Minimize className="w-4 h-4" /></button>
            <input type="range" min="0.2" max="2.0" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            <button onClick={() => setZoom(z => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))} className="text-slate-400 hover:text-slate-600 transition" title="Acercar"><Maximize className="w-4 h-4" /></button>
            <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center ml-1 border-l border-slate-200 pl-3">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex flex-col gap-8 print:gap-0 shrink-0 items-center pb-32 print:pb-0">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div key={pageIndex} className={`page-wrapper print-no-zoom-outer relative shrink-0 print:block print:overflow-visible ${pageIndex < totalPages - 1 ? 'print:break-after-page' : ''}`} style={{ width: `${pageWidthMm * zoom}mm`, height: `${pageHeightMm * zoom}mm` }}>
                <div className="bg-white shadow-xl print-no-zoom-inner transition-transform duration-300 origin-top-left print:shadow-none print:m-0 relative" style={{ width: `${pageWidthMm}mm`, height: `${pageHeightMm}mm`, transform: `scale(${zoom})`, paddingTop: `${config.margins.top}mm`, paddingRight: `${config.margins.right}mm`, paddingBottom: `${config.margins.bottom}mm`, paddingLeft: `${config.margins.left}mm` }}>
                  <div className={`w-full h-full grid relative ${!config.printGuides ? 'print:!border-none' : ''}`} style={{ gridTemplateColumns: config.useCustomSize ? `repeat(${computedCols}, ${computedCellWidthMm}mm)` : `repeat(${computedCols}, 1fr)`, gridTemplateRows: config.useCustomSize ? `repeat(${computedRows}, ${computedCellHeightMm}mm)` : `repeat(${computedRows}, 1fr)`, gap: `${config.gap}mm`, border: config.showGuides ? '1px dashed #e2e8f0' : 'none', justifyContent: config.useCustomSize ? 'center' : 'stretch', alignContent: config.useCustomSize ? 'start' : 'stretch' }}>
                    {Array.from({ length: itemsPerPage }).map((_, cellIndex) => {
                      const imgIndex = pageIndex * itemsPerPage + cellIndex;
                      const img = images[imgIndex];
                      const isRotated90 = img && (Math.abs(img.rotation) % 180 === 90);
                      let dynamicStyle = {};
                      if (img) {
                        const cellRatio = cellWidthPx / cellHeightPx;
                        const imgWidth = isRotated90 ? (img.naturalHeight || 1) : (img.naturalWidth || 1);
                        const imgHeight = isRotated90 ? (img.naturalWidth || 1) : (img.naturalHeight || 1);
                        const imgRatio = imgWidth / imgHeight;
                        dynamicStyle = { transform: `translate(calc(-50% + ${img.x}px), calc(-50% + ${img.y}px)) rotate(${img.rotation}deg)`, position: 'absolute', top: '50%', left: '50%', maxWidth: 'none', maxHeight: 'none', cursor: img.objectFit === 'cover' ? 'grab' : 'default' };
                        if (img.objectFit === 'contain') {
                          if (isRotated90) { dynamicStyle.width = `${cellHeightPx}px`; dynamicStyle.height = `${cellWidthPx}px`; }
                          else { dynamicStyle.width = '100%'; dynamicStyle.height = '100%'; dynamicStyle.maxWidth = '100%'; dynamicStyle.maxHeight = '100%'; }
                          dynamicStyle.objectFit = 'contain'; dynamicStyle.objectPosition = 'center center';
                        } else {
                          if (isRotated90) {
                            if (imgRatio > cellRatio) { dynamicStyle.width = `${cellHeightPx}px`; dynamicStyle.height = 'auto'; }
                            else { dynamicStyle.height = `${cellWidthPx}px`; dynamicStyle.width = 'auto'; }
                          } else {
                            if (imgRatio > cellRatio) { dynamicStyle.height = `${cellHeightPx}px`; dynamicStyle.width = 'auto'; }
                            else { dynamicStyle.width = `${cellWidthPx}px`; dynamicStyle.height = 'auto'; }
                          }
                        }
                      }
                      return (
                        <div key={cellIndex} className={`relative overflow-hidden group select-none ${!img ? 'flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors' : ''} ${!config.printGuides && !img ? 'print:!border-none' : ''} ${!img && imgIndex === images.length && images.length === 0 ? 'animate-pulse' : ''}`} style={config.useCustomSize ? { width: `${computedCellWidthMm}mm`, height: `${computedCellHeightMm}mm` } : {}} onContextMenu={!img ? handleRightClickPaste : undefined}>
                          {!img ? (
                            (imgIndex <= images.length) ? (
                              <div className="text-slate-300 flex flex-col items-center justify-center cursor-pointer w-full h-full print:hidden" onClick={() => document.querySelector('input[type="file"]').click()}>
                                <Plus className="w-6 h-6 opacity-50" />
                              </div>
                            ) : null
                          ) : (
                            <>
                              <img src={img.src} alt={`print-${imgIndex}`} className="transition-transform duration-75 block" style={dynamicStyle} onMouseDown={(e) => handleMouseDown(e, img)} onLoad={(e) => handleImageLoad(img.id, e)} draggable={false} />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors print:hidden flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                                <div className="pointer-events-auto flex gap-1">
                                  <button onClick={() => fillPage(img)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Rellenar página"><Grid className="w-4 h-4" /></button>
                                  <button onClick={() => toggleObjectFit(img.id)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title={img.objectFit === 'cover' ? "Completa (Contain)" : "Relleno (Cover)"}><Scaling className="w-4 h-4" /></button>
                                  <button onClick={() => rotateImage(img.id)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Rotar"><RotateCw className="w-4 h-4" /></button>
                                  <button onClick={() => duplicateImage(img)} className="bg-white text-slate-700 p-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-600 transition" title="Duplicar"><Copy className="w-4 h-4" /></button>
                                  <button onClick={() => removeImage(img.id)} className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 transition" title="Eliminar"><X className="w-4 h-4" /></button>
                                </div>
                              </div>
                              <div className="absolute bottom-1 right-1 print:hidden opacity-0 group-hover:opacity-100 pointer-events-none">
                                <span className="text-[9px] bg-black/50 text-white px-1 rounded backdrop-blur-sm">{img.objectFit === 'cover' ? 'Relleno' : 'Completa'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-bold print:hidden">Página {pageIndex + 1} de {totalPages}</div>
              </div>
            ))}
          </div>
        </main>

        {/* --- MODAL SETTINGS --- */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Settings className="w-4 h-4" /> Configuración</h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unidad de Medida</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {Object.keys(UNITS).map(u => (
                      <button key={u} onClick={() => setUnit(u)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${unit === u ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{UNITS[u].label}</button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Esto afectará cómo se muestran las medidas en el panel de márgenes y espaciado.</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end">
                <button onClick={() => setShowSettingsModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition">Aceptar</button>
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
            html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; }
            main { height: auto !important; overflow: visible !important; display: block !important; }
            .overflow-auto, .overflow-hidden { overflow: visible !important; height: auto !important; }
            body { background: white; }
            .print\\:break-after-page { break-after: page; page-break-after: always; }
            .print-no-zoom-outer { width: auto !important; height: auto !important; }
            .print-no-zoom-inner { transform: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}</style>
      </div>
    </div>
  );
}


