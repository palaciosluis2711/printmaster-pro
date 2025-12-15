import React, { useState, useMemo } from 'react';
import { LayoutGrid, Grid, Ruler, ArrowRight, Star } from 'lucide-react'; // Iconos para las tarjetas

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
  const studio = usePrintStudio();
  const auth = useAuth({
    config: studio.config,
    favorites: studio.favorites,
    unit: studio.unit,
    setConfig: studio.setConfig,
    setFavorites: studio.setFavorites,
    setUnit: studio.setUnit
  });

  const [activeView, setActiveView] = useState('home');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, imageId: null });
  const [editModalData, setEditModalData] = useState({
    visible: false,
    imageId: null,
    imgUrl: null,
    flipH: false, flipV: false, cropShape: 'rect', keepAspectRatio: false
  });

  const totalPagesUI = useMemo(() => {
    if (studio.config.useMosaicMode) {
      if (!studio.mosaicImage) return 1;
      if (studio.config.mosaicType === 'pieces') {
        return studio.config.mosaicCols * studio.config.mosaicRows;
      } else {
        const pageSize = PAGE_SIZES[studio.config.pageSize];
        const cw = pageSize.width - studio.config.margins.left - studio.config.margins.right;
        const ch = pageSize.height - studio.config.margins.top - studio.config.margins.bottom;
        const px = Math.ceil(studio.config.mosaicTargetWidth / cw);
        const py = Math.ceil(studio.config.mosaicTargetHeight / ch);
        return px * py;
      }
    } else {
      if (studio.config.useCustomSize) {
        return Math.ceil(studio.images.length / (studio.images.length || 1));
      }
      const itemsPerPage = studio.config.cols * studio.config.rows;
      return Math.max(1, Math.ceil(studio.images.length / itemsPerPage));
    }
  }, [studio.config, studio.images.length, studio.mosaicImage]);

  const handleContextMenu = (e, imgId) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    setContextMenu({ visible: true, x, y, imageId: imgId });
  };

  const handlePasteFromMenu = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert("Tu navegador no permite acceso al portapapeles.");
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      const newFiles = [];
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted_image.png", { type: imageType });
          newFiles.push(file);
        }
      }
      if (newFiles.length > 0) {
        studio.handleFiles(newFiles);
      }
    } catch (err) {
      console.error("Error pegando imagen:", err);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const openEditModal = () => {
    const { useMosaicMode } = studio.config;
    if (useMosaicMode) {
      if (totalPagesUI !== 1) {
        alert("Para editar la imagen base, asegúrate de que el mosaico ocupe solo 1 página.");
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

  const handleEditSave = (newUrl, w, h) => {
    if (studio.config.useMosaicMode) {
      studio.setMosaicImage(prev => ({
        ...prev,
        src: newUrl,
        originalSrc: prev.originalSrc || prev.src,
        naturalWidth: w,
        naturalHeight: h,
        rotation: 0
      }));
    } else {
      studio.setImages(prev => prev.map(img =>
        img.id === editModalData.imageId
          ? { ...img, src: newUrl, originalSrc: img.originalSrc || img.src, rotation: 0, x: 0, y: 0 }
          : img
      ));
    }
    setEditModalData(prev => ({ ...prev, visible: false }));
  };

  // Función para cargar un favorito desde el Dashboard
  const loadFavoriteFromDashboard = (favConfig) => {
    studio.setConfig(favConfig);
    // Lógica de navegación inteligente
    if (favConfig.useMosaicMode) setActiveView('mosaic');
    else if (favConfig.useCustomSize) setActiveView('custom');
    else setActiveView('grid');
  };

  const showCanvas = ['grid', 'mosaic', 'custom'].includes(activeView);

  // Obtener los últimos 3 favoritos (invertimos el array para ver los más recientes)
  const recentFavorites = [...studio.favorites].reverse().slice(0, 3);

  return (
    <div
      className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col h-screen overflow-hidden print:block print:h-auto print:overflow-visible"
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.length > 0) studio.handleFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >

      <Header
        user={auth.user}
        isSaving={auth.isSaving}
        handleLogin={auth.handleLogin}
        handleLogout={auth.handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
        onUploadClick={(e) => studio.handleFiles(e.target.files)}
        isMosaicMode={studio.config.useMosaicMode}
        isMosaicPreview={studio.isMosaicPreview}
        activeView={activeView}
        mosaicImage={studio.mosaicImage}
      />

      <div className="flex flex-1 overflow-hidden relative print:block print:h-auto print:overflow-visible">
        <Sidebar
          config={studio.config}
          setConfig={studio.setConfig}
          favorites={studio.favorites}
          setFavorites={studio.setFavorites}
          unit={studio.unit}
          setUnit={studio.setUnit}
          images={studio.images}
          mosaicImage={studio.mosaicImage}
          setImages={studio.setImages}
          setMosaicImage={studio.setMosaicImage}
          user={auth.user}
          totalPages={totalPagesUI}
          isMosaicPreview={studio.isMosaicPreview}
          setIsMosaicPreview={studio.setIsMosaicPreview}
          minMosaicDimensions={studio.minMosaicDimensions}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {showCanvas ? (
          <MainCanvas
            zoom={studio.zoom}
            setZoom={studio.setZoom}
            config={studio.config}
            images={studio.images}
            mosaicImage={studio.mosaicImage}
            isMosaicPreview={studio.isMosaicPreview}
            handleContextMenu={handleContextMenu}
            onImageMouseDown={studio.handleMouseDown}
            onImageLoad={studio.handleImageLoad}
            onRemoveImage={studio.removeImage}
            onDuplicateImage={studio.duplicateImage}
            onRotateImage={studio.rotateImage}
            onToggleObjectFit={studio.toggleObjectFit}
            onFillPage={studio.fillPage}
            onRotateMosaic={studio.rotateMosaicImage}
            onToggleMosaicFit={studio.toggleMosaicFit}
            onRemoveMosaic={studio.removeMosaicImage}
            onUploadClick={() => document.querySelector('input[type="file"]').click()}
          />
        ) : (
          /* --- DASHBOARD PRINCIPAL (HOME) --- */
          <div className="flex-1 bg-slate-200/50 flex flex-col items-center justify-center print:hidden p-8 overflow-y-auto">

            {activeView === 'home' ? (
              <div className="max-w-4xl w-full">
                {/* Header del Dashboard */}
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-700 mb-2">Bienvenido a PrintMaster Pro</h2>
                  <p className="text-slate-500">Selecciona una función en el menú lateral o carga un favorito reciente.</p>
                </div>

                {/* Sección de Recientes */}
                {recentFavorites.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <h3 className="text-lg font-bold text-slate-600">Recientes</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recentFavorites.map(fav => (
                        <button
                          key={fav.id}
                          onClick={() => loadFavoriteFromDashboard(fav.config)}
                          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all group text-left"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${fav.config.useMosaicMode ? 'bg-purple-100 text-purple-600' : (fav.config.useCustomSize ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600')}`}>
                              {fav.config.useMosaicMode ? <LayoutGrid className="w-6 h-6" /> : (fav.config.useCustomSize ? <Ruler className="w-6 h-6" /> : <Grid className="w-6 h-6" />)}
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <h4 className="font-bold text-slate-800 mb-1 truncate">{fav.name}</h4>
                          <p className="text-xs text-slate-500">
                            {fav.config.useMosaicMode ? 'Mosaico' : (fav.config.useCustomSize ? 'Personalizado' : 'Retícula')} • {PAGE_SIZES[fav.config.pageSize]?.name.split('(')[0]}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State si no hay favoritos */}
                {recentFavorites.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                    <Star className="w-10 h-10 mb-2 opacity-20" />
                    <p>No tienes configuraciones guardadas recientemente.</p>
                  </div>
                )}
              </div>
            ) : (
              // Para Settings o vistas futuras vacías
              <div className="text-slate-400 font-medium">Configuración Global</div>
            )}
          </div>
        )}

        <ContextMenu
          data={contextMenu}
          close={() => setContextMenu({ ...contextMenu, visible: false })}
          onEdit={openEditModal}
          onPaste={handlePasteFromMenu}
          onUpload={() => document.querySelector('input[type="file"]').click()}
          onRemove={() => studio.removeMosaicImage()}
        />

        <EditModal
          visible={editModalData.visible}
          imageId={editModalData.imageId}
          imgUrl={editModalData.imgUrl}
          onClose={() => setEditModalData(prev => ({ ...prev, visible: false }))}
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

      <style jsx global>{`
          @media print {
            @page {
              size: ${PAGE_SIZES[studio.config.pageSize].width}mm ${PAGE_SIZES[studio.config.pageSize].height}mm;
              margin: 0;
            }
            html, body, #root { height: auto !important; min-height: auto !important; overflow: visible !important; display: block !important; }
            main { height: auto !important; overflow: visible !important; display: block !important; }
            .print\\:break-after-page { break-after: page; page-break-after: always; display: block !important; position: relative !important; }
            .print-no-zoom-outer { width: auto !important; height: auto !important; }
            .print-no-zoom-inner { transform: none !important; box-shadow: none !important; margin: 0 !important; }
            .cell-container, .mosaic-container { overflow: hidden !important; z-index: 0; }
            body { background: white; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
      `}</style>
    </div>
  );
}


