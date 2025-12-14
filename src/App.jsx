import React, { useState, useMemo } from 'react';

// --- HOOKS Y UTILIDADES ---
import { useAuth } from './hooks/useAuth';
import { usePrintStudio } from './hooks/usePrintStudio';
import { PAGE_SIZES } from './constants/printSettings';

// --- COMPONENTES ---
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MainCanvas from './components/Canvas/MainCanvas';
import EditModal from './components/Modals/EditModal';
import SettingsModal from './components/Modals/SettingsModal';
import ContextMenu from './components/Modals/ContextMenu';

export default function App() {
  // 1. Inicializamos la lógica del estudio (Estado de imágenes, config, zoom)
  const studio = usePrintStudio();

  // 2. Inicializamos la autenticación y persistencia (Conectada al estudio)
  const auth = useAuth({
    config: studio.config,
    favorites: studio.favorites,
    unit: studio.unit,
    setConfig: studio.setConfig,
    setFavorites: studio.setFavorites,
    setUnit: studio.setUnit
  });

  // 3. Estados UI Locales (Modales y Menús)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, imageId: null });
  const [editModalData, setEditModalData] = useState({ 
    visible: false, 
    imageId: null, 
    imgUrl: null,
    // defaults para el editor
    flipH: false, flipV: false, cropShape: 'rect', keepAspectRatio: false 
  });

  // --- LOGICA DE UI AUXILIAR ---

  // Cálculo de páginas para mostrar en el Sidebar (Duplicado ligero de lógica para la UI)
  const totalPagesUI = useMemo(() => {
    if (studio.config.useMosaicMode) {
      if (!studio.mosaicImage) return 1;
      
      if (studio.config.mosaicType === 'pieces') {
          return studio.config.mosaicCols * studio.config.mosaicRows;
      } else {
          // Estimación rápida para modo tamaño
          const pageSize = PAGE_SIZES[studio.config.pageSize];
          const cw = pageSize.width - studio.config.margins.left - studio.config.margins.right;
          const ch = pageSize.height - studio.config.margins.top - studio.config.margins.bottom;
          const px = Math.ceil(studio.config.mosaicTargetWidth / cw);
          const py = Math.ceil(studio.config.mosaicTargetHeight / ch);
          return px * py;
      }
    } else {
      if (studio.config.useCustomSize) {
         // Placeholder, el canvas hace el cálculo real preciso
         return Math.ceil(studio.images.length / (studio.images.length || 1)); 
      }
      const itemsPerPage = studio.config.cols * studio.config.rows;
      return Math.max(1, Math.ceil(studio.images.length / itemsPerPage));
    }
  }, [studio.config, studio.images.length, studio.mosaicImage]);

  // Context Menu Handler
  const handleContextMenu = (e, imgId) => {
    e.preventDefault();
    // Limitar posición para que no se salga de la pantalla
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    setContextMenu({ visible: true, x, y, imageId: imgId });
  };

  // Pegar desde portapapeles
  const handlePasteFromMenu = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) { 
        alert("Tu navegador no permite acceso al portapapeles."); 
        return; 
      }
      const clipboardItems = await navigator.clipboard.read();
      const newFiles = [];
      
      for (const item of clipboardItems) {
        // Buscar tipos de imagen
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted_image.png", { type: imageType });
          newFiles.push(file);
        }
      }

      if (newFiles.length > 0) {
        // Usamos el handler del hook studio
        studio.handleFiles(newFiles); 
      }
    } catch (err) {
      console.error("Error pegando imagen:", err);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Abrir Editor
  const openEditModal = () => {
    const { useMosaicMode, mosaicType, mosaicCols, mosaicRows } = studio.config;
    
    // Validación Mosaico
    if (useMosaicMode) {
      // Permitir edición si es 1x1 o si estamos en modo preview (opcional, pero mejor restringir a 1x1 base)
      const isMosaic1x1 = mosaicType === 'pieces' && mosaicCols === 1 && mosaicRows === 1;
      
      if (!isMosaic1x1) {
        alert("Para editar la imagen base, vuelve al modo 1x1 (1 Hoja Horizontal x 1 Hoja Vertical).");
        return;
      }
      if (studio.mosaicImage) {
        setEditModalData({ 
          visible: true, 
          imageId: 'mosaic', 
          imgUrl: studio.mosaicImage.originalSrc || studio.mosaicImage.src
        });
      }
    } else {
      // Modo Normal
      if (!contextMenu.imageId) return;
      const img = studio.images.find(i => i.id === contextMenu.imageId);
      if (img) {
        setEditModalData({ 
          visible: true, 
          imageId: img.id, 
          imgUrl: img.originalSrc || img.src
        });
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Guardar Edición
  const handleEditSave = (newUrl, w, h) => {
    if (studio.config.useMosaicMode) {
        // Actualizar Mosaico
        studio.setMosaicImage(prev => ({
            ...prev,
            src: newUrl,
            originalSrc: prev.originalSrc || prev.src,
            naturalWidth: w,
            naturalHeight: h,
            rotation: 0 
        }));
    } else {
        // Actualizar imagen individual
        studio.setImages(prev => prev.map(img => 
            img.id === editModalData.imageId 
            ? { ...img, src: newUrl, originalSrc: img.originalSrc || img.src, rotation: 0, x: 0, y: 0 } 
            : img
        ));
    }
    setEditModalData(prev => ({ ...prev, visible: false }));
  };

  return (
    <div 
      className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col h-screen overflow-hidden" 
      onDrop={(e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        if (e.dataTransfer.files?.length > 0) {
            studio.handleFiles(e.dataTransfer.files);
        }
      }} 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      
      {/* 1. HEADER */}
      <Header 
        user={auth.user} 
        isSaving={auth.isSaving}
        handleLogin={auth.handleLogin} 
        handleLogout={auth.handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
        onUploadClick={(e) => studio.handleFiles(e.target.files)}
        isMosaicMode={studio.config.useMosaicMode}
      />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 2. SIDEBAR */}
        <Sidebar 
          config={studio.config} 
          setConfig={studio.setConfig}
          favorites={studio.favorites}
          setFavorites={studio.setFavorites}
          unit={studio.unit}
          images={studio.images}
          mosaicImage={studio.mosaicImage}
          setImages={studio.setImages}
          setMosaicImage={studio.setMosaicImage}
          user={auth.user}
          totalPages={totalPagesUI}
          // Nuevos Props para la Vista Previa
          isMosaicPreview={studio.isMosaicPreview}
          setIsMosaicPreview={studio.setIsMosaicPreview}
        />

        {/* 3. CANVAS PRINCIPAL */}
        <MainCanvas 
          // Estado Visual
          zoom={studio.zoom}
          setZoom={studio.setZoom}
          config={studio.config}
          images={studio.images}
          mosaicImage={studio.mosaicImage}
          // Nuevo Prop para la Vista Previa
          isMosaicPreview={studio.isMosaicPreview}
          
          // Handlers Interacción
          handleContextMenu={handleContextMenu}
          onImageMouseDown={studio.handleMouseDown}
          onImageLoad={studio.handleImageLoad}
          
          // Acciones
          onRemoveImage={studio.removeImage}
          onDuplicateImage={studio.duplicateImage}
          onRotateImage={studio.rotateImage}
          onToggleObjectFit={studio.toggleObjectFit}
          onFillPage={studio.fillPage}
          
          // Acciones Mosaico
          onRotateMosaic={studio.rotateMosaicImage}
          onToggleMosaicFit={studio.toggleMosaicFit}
          onRemoveMosaic={studio.removeMosaicImage}
          
          // Acciones Empty State
          onUploadClick={() => document.querySelector('input[type="file"]').click()}
        />
        
        {/* 4. MODALES Y MENÚS FLOTANTES */}
        
        <ContextMenu 
            data={contextMenu} 
            close={() => setContextMenu({...contextMenu, visible:false})}
            onEdit={openEditModal}
            onPaste={handlePasteFromMenu}
        />

        <EditModal 
            visible={editModalData.visible}
            imageId={editModalData.imageId}
            imgUrl={editModalData.imgUrl}
            onClose={() => setEditModalData(prev => ({...prev, visible: false}))}
            onSave={handleEditSave}
        />

        {showSettingsModal && (
            <SettingsModal 
                unit={studio.unit} 
                setUnit={studio.setUnit} 
                close={() => setShowSettingsModal(false)} 
            />
        )}
      </div>

      {/* ESTILOS GLOBALES DE IMPRESIÓN */}
      <style jsx global>{`
          @media print {
            @page {
              size: ${PAGE_SIZES[studio.config.pageSize].width}mm ${PAGE_SIZES[studio.config.pageSize].height}mm;
              margin: 0;
            }
            html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; }
            main { height: auto !important; overflow: visible !important; display: block !important; }
            .overflow-auto, .overflow-hidden { overflow: visible !important; height: auto !important; }
            body { background: white; }
            .print\\:break-after-page { break-after: page; page-break-after: always; }
            .print-no-zoom-outer { width: auto !important; height: auto !important; }
            .print-no-zoom-inner { transform: none !important; }
            .cell-container { overflow: hidden !important; z-index: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
      `}</style>
    </div>
  );
}


