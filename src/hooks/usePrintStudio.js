import { useState, useEffect, useRef } from 'react';
import { toMm, mmToPx } from '../utils/measurements';
import { PAGE_SIZES } from '../constants/printSettings';

// Claves para LocalStorage
const STORAGE_KEY_ALL_CONFIGS = 'printmaster_all_configs_v3'; // Nueva versión de clave
const STORAGE_KEY_UNIT = 'printmaster_unit_v2';
const STORAGE_KEY_FAVS = 'printmaster_favs_v2';
const STORAGE_KEY_VIEW = 'printmaster_active_view_v2';

export function usePrintStudio() {
  // --- 1. ESTADO DE VISTA ACTIVA (Movido desde App.jsx) ---
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_VIEW) || 'home';
    }
    return 'home';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, activeView);
  }, [activeView]);

  // --- 2. UNIDAD ---
  const [unit, setUnit] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEY_UNIT) || 'mm';
    return 'mm';
  });

  // --- 3. CONFIGURACIONES INDIVIDUALES (Multiverso) ---
  const [allConfigs, setAllConfigs] = useState(() => {
    // Configuración Base Común
    const baseDefaults = {
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
      // Banner defaults
      bannerText: 'TEXTO',
      bannerHeight: 100,
      bannerFont: 'Arial',
      bannerColor: '#000000',
      // Refactored styles for multi-select
      isItalic: false,
      isOutline: false,
      bannerStrokeWidth: 1
    };

    // Configuraciones por defecto para cada modo
    const defaults = {
      grid: { ...baseDefaults, useMosaicMode: false, useCustomSize: false },
      mosaic: { ...baseDefaults, useMosaicMode: true, useCustomSize: false },
      custom: { ...baseDefaults, useMosaicMode: false, useCustomSize: true },
      banner: { ...baseDefaults, isBannerMode: true }
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_ALL_CONFIGS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Fusión segura para garantizar que existan todas las ramas
          return {
            grid: { ...defaults.grid, ...(parsed.grid || {}) },
            mosaic: { ...defaults.mosaic, ...(parsed.mosaic || {}) },
            custom: { ...defaults.custom, ...(parsed.custom || {}) },
            banner: { ...defaults.banner, ...(parsed.banner || {}) }
          };
        } catch (e) { console.error("Error loading configs:", e); }
      }
    }
    return defaults;
  });

  // Persistir configuraciones
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ALL_CONFIGS, JSON.stringify(allConfigs));
  }, [allConfigs]);

  // Persistir unidad
  useEffect(() => { localStorage.setItem(STORAGE_KEY_UNIT, unit); }, [unit]);


  // --- 4. EXPOSICIÓN INTELIGENTE ---
  // Determinamos qué config usar basándonos en la vista actual
  // Si estamos en 'home', 'settings' o 'favorites', usamos 'grid' por defecto para evitar errores,
  // pero la UI no mostrará los controles de todas formas.
  const currentMode = ['grid', 'mosaic', 'custom', 'banner'].includes(activeView) ? activeView : 'grid';

  const config = allConfigs[currentMode];

  // Wrapper para setConfig que actualiza solo la rama activa
  const setConfig = (newConfigOrFn) => {
    setAllConfigs(prev => {
      const currentModeConfig = prev[currentMode];
      const updatedConfig = typeof newConfigOrFn === 'function'
        ? newConfigOrFn(currentModeConfig)
        : newConfigOrFn;

      return {
        ...prev,
        [currentMode]: updatedConfig
      };
    });
  };

  // --- FAVORITOS ---
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_FAVS);
      if (saved) { try { return JSON.parse(saved); } catch (e) { } }
    }
    return [];
  });
  useEffect(() => { localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favorites)); }, [favorites]);


  // --- ESTADOS DE SESIÓN (No persistentes y ISOLATED) ---
  // Ahora separamos las imágenes por modo.
  const [gridImages, setGridImages] = useState([]);
  const [customImages, setCustomImages] = useState([]);
  const [mosaicImage, setMosaicImage] = useState(null); // Mosaic tiene su propio estado dedicado

  // Computed property para obtener/setear las imágenes del modo actual
  const images = currentMode === 'custom' ? customImages : gridImages;

  const setImages = (newImagesOrFn) => {
    if (currentMode === 'custom') {
      setCustomImages(newImagesOrFn);
    } else {
      // Por defecto 'grid'
      setGridImages(newImagesOrFn);
    }
    // Nota: Mosaic usa setMosaicImage directamente, Banner no usa lista de imágenes.
  };

  const [zoom, setZoom] = useState(0.8);
  const [isMosaicPreview, setIsMosaicPreview] = useState(true);
  const [isBannerPreview, setIsBannerPreview] = useState(true); // Nuevo estado para Banner
  const [minMosaicDimensions, setMinMosaicDimensions] = useState({ width: 10, height: 10 });
  const dragRef = useRef(null);

  // --- CÁLCULOS ---
  const getCellDimensions = () => {
    const pageWidthMm = PAGE_SIZES[config.pageSize].width;
    const pageHeightMm = PAGE_SIZES[config.pageSize].height;
    // ... resto de lógica igual ...
    // Nota: Como 'config' ya es la versión específica del modo actual, no hay que cambiar nada aquí

    let cellW_mm, cellH_mm;
    if (config.useCustomSize) {
      cellW_mm = config.customWidth;
      cellH_mm = config.customHeight;
    } else {
      const totalGapWidth = config.gap * (config.cols - 1);
      const totalGapHeight = config.gap * (config.rows - 1);
      cellW_mm = (pageWidthMm - config.margins.left - config.margins.right - totalGapWidth) / config.cols;
      cellH_mm = (pageHeightMm - config.margins.top - config.margins.bottom - totalGapHeight) / config.rows;
    }
    return { cellWidthPx: mmToPx(cellW_mm), cellHeightPx: mmToPx(cellH_mm) };
  };

  // --- MANEJO DE ARCHIVOS ---
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    if (currentMode === 'mosaic') {
      const file = files[0];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const pageSize = PAGE_SIZES[config.pageSize];
        const pageW = pageSize.width - config.margins.left - config.margins.right;
        const pageH = pageSize.height - config.margins.top - config.margins.bottom;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const pageRatio = pageW / pageH;
        let initW, initH;
        if (imgRatio > pageRatio) { initW = pageW; initH = pageW / imgRatio; }
        else { initH = pageH; initW = pageH * imgRatio; }

        setMosaicImage({
          id: crypto.randomUUID(), src: url, originalSrc: url, name: file.name,
          naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
          rotation: 0, objectFit: 'contain'
        });

        setMinMosaicDimensions({ width: initW, height: initH });
        setConfig(prev => ({ ...prev, mosaicTargetWidth: initW, mosaicTargetHeight: initH, mosaicCols: 1, mosaicRows: 1 }));
        setIsMosaicPreview(true);
      };
    } else if (currentMode === 'grid' || currentMode === 'custom') {
      const newImages = Array.from(files).map(file => {
        const url = URL.createObjectURL(file);
        return {
          id: crypto.randomUUID(), src: url, originalSrc: url,
          rotation: 0, objectFit: 'cover', x: 0, y: 0, name: file.name, naturalWidth: 1, naturalHeight: 1
        };
      });
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageLoad = (id, e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImages(prev => prev.map(img => img.id === id ? { ...img, naturalWidth, naturalHeight } : img));
  };

  const handleMouseDown = (e, img) => {
    if (currentMode === 'mosaic') return;
    if (e.button === 2) return;
    if (img.objectFit !== 'cover') return;
    e.preventDefault();
    dragRef.current = { id: img.id, startX: e.clientX, startY: e.clientY, initialImgX: img.x || 0, initialImgY: img.y || 0, imgRotation: img.rotation, imgNatW: img.naturalWidth, imgNatH: img.naturalHeight };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;
      const { id, startX, startY, initialImgX, initialImgY, imgRotation, imgNatW, imgNatH } = dragRef.current;
      const { cellWidthPx, cellHeightPx } = getCellDimensions();
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;
      const isRotated90 = Math.abs(imgRotation) % 180 === 90;
      const cellRatio = cellWidthPx / cellHeightPx;
      const imgRatio = (isRotated90 ? imgNatH : imgNatW) / (isRotated90 ? imgNatW : imgNatH);
      let renderW_px, renderH_px;
      if (isRotated90) {
        if (imgRatio > cellRatio) { renderH_px = cellHeightPx; renderW_px = cellHeightPx * imgRatio; }
        else { renderW_px = cellWidthPx; renderH_px = cellWidthPx / imgRatio; }
      } else {
        if (imgRatio > cellRatio) { renderH_px = cellHeightPx; renderW_px = cellHeightPx * imgRatio; }
        else { renderW_px = cellWidthPx; renderH_px = cellWidthPx / imgRatio; }
      }
      const maxX = Math.max(0, (renderW_px - cellWidthPx) / 2);
      const maxY = Math.max(0, (renderH_px - cellHeightPx) / 2);

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
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [zoom, config]);

  // Actions
  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));
  const duplicateImage = (img) => { setImages(prev => [...prev, { ...img, id: crypto.randomUUID(), x: 0, y: 0 }]); };
  const rotateImage = (id) => { setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 } : img)); };
  const rotateAllImages = () => { setImages(prev => prev.map(img => ({ ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 }))); };
  const toggleObjectFit = (id) => { setImages(prev => prev.map(img => img.id === id ? { ...img, objectFit: img.objectFit === 'cover' ? 'contain' : 'cover', x: 0, y: 0 } : img)); };
  const fillPage = (img, itemsPerPage) => {
    const currentCount = images.length;
    const remainder = currentCount % itemsPerPage;
    if (remainder === 0 && currentCount > 0) return;
    const needed = remainder === 0 ? itemsPerPage : itemsPerPage - remainder;
    const copies = Array.from({ length: needed }).map(() => ({ ...img, id: crypto.randomUUID(), x: 0, y: 0 }));
    setImages(prev => [...prev, ...copies]);
  };
  const rotateMosaicImage = () => { if (!mosaicImage) return; setMosaicImage(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 })); };
  const toggleMosaicFit = () => { if (!mosaicImage) return; setMosaicImage(prev => ({ ...prev, objectFit: prev.objectFit === 'cover' ? 'contain' : 'cover' })); };
  const removeMosaicImage = () => { setMosaicImage(null); };

  const updateMosaicSize = (dim, val) => {
    if (!mosaicImage) return;
    const mmVal = Number(val);
    const ratio = mosaicImage.naturalWidth / mosaicImage.naturalHeight;
    if (dim === 'width') setConfig(prev => ({ ...prev, mosaicTargetWidth: toMm(mmVal, unit), mosaicTargetHeight: toMm(mmVal / ratio, unit) }));
    else setConfig(prev => ({ ...prev, mosaicTargetHeight: toMm(mmVal, unit), mosaicTargetWidth: toMm(mmVal * ratio, unit) }));
  };
  const updateMargin = (side, value) => { const mm = toMm(Number(value), unit); setConfig(prev => ({ ...prev, margins: { ...prev.margins, [side]: mm } })); };
  const updateAllMargins = (value) => { const mm = toMm(Number(value), unit); setConfig(prev => ({ ...prev, margins: { top: mm, right: mm, bottom: mm, left: mm } })); };
  const updateCustomSize = (key, value) => { const mm = toMm(Number(value), unit); setConfig(prev => ({ ...prev, [key]: mm })); };

  // Banner Helper
  const updateBannerConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return {
    unit, setUnit, images, setImages, mosaicImage, setMosaicImage, zoom, setZoom, favorites, setFavorites,
    // Exponemos el config activo y la función setConfig que ya sabe a quién actualizar
    config, setConfig,
    // Exponemos activeView y setActiveView para que App y Sidebar los usen
    activeView, setActiveView,
    // Exponemos allConfigs y setAllConfigs para que useAuth pueda guardarlo todo
    allConfigs, setAllConfigs,
    isMosaicPreview, setIsMosaicPreview, minMosaicDimensions,
    isBannerPreview, setIsBannerPreview, updateBannerConfig, // Exportamos props de banner
    handleFiles, handleImageLoad, handleMouseDown, removeImage, duplicateImage, rotateImage, rotateAllImages, toggleObjectFit, fillPage,
    rotateMosaicImage, toggleMosaicFit, removeMosaicImage, updateMosaicSize, updateMargin, updateAllMargins, updateCustomSize
  };
}