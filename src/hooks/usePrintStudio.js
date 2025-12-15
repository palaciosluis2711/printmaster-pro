import { useState, useEffect, useRef } from 'react';
import { toMm, mmToPx } from '../utils/measurements';
import { PAGE_SIZES } from '../constants/printSettings';

export function usePrintStudio() {
  // --- ESTADOS PRINCIPALES ---
  const [unit, setUnit] = useState('mm');
  const [images, setImages] = useState([]);
  const [zoom, setZoom] = useState(0.8);
  const [mosaicImage, setMosaicImage] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Estados para control de Mosaico
  const [isMosaicPreview, setIsMosaicPreview] = useState(true);
  // NUEVO: Almacena el tamaño mínimo (1 página) para el modo "Por Tamaño"
  const [minMosaicDimensions, setMinMosaicDimensions] = useState({ width: 10, height: 10 });

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
    customMaxItems: 0,
    // Modo Mosaico
    useMosaicMode: false,
    mosaicType: 'pieces', // 'pieces' o 'size'
    mosaicCols: 1,
    mosaicRows: 1,
    mosaicTargetWidth: 200,
    mosaicTargetHeight: 200
  });

  const dragRef = useRef(null);

  // --- CÁLCULOS DE DIMENSIONES ---
  const getCellDimensions = () => {
    const pageWidthMm = PAGE_SIZES[config.pageSize].width;
    const pageHeightMm = PAGE_SIZES[config.pageSize].height;
    const contentWidth = pageWidthMm - config.margins.left - config.margins.right;
    const contentHeight = pageHeightMm - config.margins.top - config.margins.bottom;

    let cellW_mm, cellH_mm;

    if (config.useCustomSize) {
      cellW_mm = config.customWidth;
      cellH_mm = config.customHeight;
    } else {
      const totalGapWidth = config.gap * (config.cols - 1);
      const totalGapHeight = config.gap * (config.rows - 1);
      cellW_mm = (contentWidth - totalGapWidth) / config.cols;
      cellH_mm = (contentHeight - totalGapHeight) / config.rows;
    }

    return {
      cellWidthPx: mmToPx(cellW_mm),
      cellHeightPx: mmToPx(cellH_mm)
    };
  };

  // --- MANEJO DE ARCHIVOS ---
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    if (config.useMosaicMode) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // --- CÁLCULO INICIAL INTELIGENTE (1 Página Contain) ---
        const pageSize = PAGE_SIZES[config.pageSize];
        const pageW = pageSize.width - config.margins.left - config.margins.right;
        const pageH = pageSize.height - config.margins.top - config.margins.bottom;

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const pageRatio = pageW / pageH;

        let initW, initH;

        if (imgRatio > pageRatio) {
          initW = pageW;
          initH = pageW / imgRatio;
        } else {
          initH = pageH;
          initW = pageH * imgRatio;
        }

        setMosaicImage({
          id: crypto.randomUUID(),
          src: url,
          originalSrc: url,
          name: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          rotation: 0,
          objectFit: 'contain'
        });

        // NUEVO: Guardamos estas dimensiones como el MÍNIMO permitido
        setMinMosaicDimensions({ width: initW, height: initH });

        setConfig(prev => ({
          ...prev,
          mosaicTargetWidth: initW,
          mosaicTargetHeight: initH,
          mosaicCols: 1,
          mosaicRows: 1
        }));
        setIsMosaicPreview(true);
      };
    } else {
      const newImages = Array.from(files).map(file => {
        const url = URL.createObjectURL(file);
        return {
          id: crypto.randomUUID(),
          src: url,
          originalSrc: url,
          rotation: 0,
          objectFit: 'cover',
          x: 0, y: 0,
          name: file.name,
          naturalWidth: 1,
          naturalHeight: 1
        };
      });
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageLoad = (id, e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImages(prev => prev.map(img => img.id === id ? { ...img, naturalWidth, naturalHeight } : img));
  };

  // --- LÓGICA DE ARRASTRE ---
  const handleMouseDown = (e, img) => {
    if (config.useMosaicMode) return;
    if (e.button === 2) return;
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
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoom, config]);

  // --- ACTIONS ---
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

  // --- MOSAIC ACTIONS ---
  const rotateMosaicImage = () => {
    if (!mosaicImage) return;
    setMosaicImage(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };
  const toggleMosaicFit = () => {
    if (!mosaicImage) return;
    setMosaicImage(prev => ({ ...prev, objectFit: prev.objectFit === 'cover' ? 'contain' : 'cover' }));
  };
  const removeMosaicImage = () => { setMosaicImage(null); };

  const updateMosaicSize = (dim, val) => {
    if (!mosaicImage) return;
    const mmVal = Number(val);
    const ratio = mosaicImage.naturalWidth / mosaicImage.naturalHeight;
    if (dim === 'width') {
      setConfig(prev => ({ ...prev, mosaicTargetWidth: toMm(mmVal, unit), mosaicTargetHeight: toMm(mmVal / ratio, unit) }));
    } else {
      setConfig(prev => ({ ...prev, mosaicTargetHeight: toMm(mmVal, unit), mosaicTargetWidth: toMm(mmVal * ratio, unit) }));
    }
  };

  const updateMargin = (side, value) => { const mm = toMm(Number(value), unit); setConfig(prev => ({ ...prev, margins: { ...prev.margins, [side]: mm } })); };
  const updateAllMargins = (value) => { const mm = toMm(Number(value), unit); setConfig(prev => ({ ...prev, margins: { top: mm, right: mm, bottom: mm, left: mm } })); };
  const updateCustomSize = (key, value) => { const mm = toMm(Number(value), unit); setConfig(prev => ({ ...prev, [key]: mm })); };

  return {
    unit, setUnit,
    images, setImages,
    mosaicImage, setMosaicImage,
    zoom, setZoom,
    favorites, setFavorites,
    config, setConfig,
    isMosaicPreview, setIsMosaicPreview,
    minMosaicDimensions, // Exportamos el nuevo estado
    handleFiles, handleImageLoad, handleMouseDown,
    removeImage, duplicateImage, rotateImage, rotateAllImages, toggleObjectFit, fillPage,
    rotateMosaicImage, toggleMosaicFit, removeMosaicImage, updateMosaicSize,
    updateMargin, updateAllMargins, updateCustomSize
  };
}