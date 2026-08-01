import React, { useState } from 'react';
import { ChevronLeft, Save, Trash2, Check, X } from 'lucide-react';

// --- IMPORTACIÓN DE MÓDULOS AISLADOS ---
import { HomeMenu } from '../../modules/home';
import { GridSidebar } from '../../modules/grid';
import { CustomGridSidebar } from '../../modules/custom-grid';
import { MosaicSidebar } from '../../modules/mosaic';
import { BannerSidebar } from '../../modules/banner';
import { CVSidebar, CVDraftModal } from '../../modules/cv';
import { FavoritesSidebar } from '../../modules/favorites';
import { SettingsSidebar } from '../../modules/settings';

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
  activeView,
  setActiveView,
  // Props Banner
  isBannerPreview,
  setIsBannerPreview,
  updateBannerConfig,
  // CV Props
  cvDrafts,
  saveCVDraft,
  deleteCVDraft
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newFavName, setNewFavName] = useState('');
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'view', view: 'home' } | { type: 'cv_list' }
  const [draftName, setDraftName] = useState('');

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

  const performNavigation = (view) => {
    if (activeView === 'home' && DEFAULTS[view]) {
      setConfig(prev => ({ ...prev, ...DEFAULTS[view] }));
    } else {
      if (view === 'grid') setConfig(prev => ({ ...prev, useMosaicMode: false, useCustomSize: false, isBannerMode: false, isCVMode: false }));
      else if (view === 'mosaic') setConfig(prev => ({ ...prev, useMosaicMode: true, useCustomSize: false, isBannerMode: false, isCVMode: false }));
      else if (view === 'custom') setConfig(prev => ({ ...prev, useMosaicMode: false, useCustomSize: true, isBannerMode: false, isCVMode: false }));
      else if (view === 'banner') setConfig(prev => ({ ...prev, isBannerMode: true, useMosaicMode: false, useCustomSize: false, isCVMode: false }));
      else if (view === 'cv') setConfig(prev => ({ ...prev, isCVMode: true, step: 0, cvPageSize: 'carta', useMosaicMode: false, useCustomSize: false, isBannerMode: false }));
    }
    setActiveView(view);
    setShowSaveModal(false);
    setShowExitPrompt(false);
    setPendingAction(null);
  };

  const isCVModifiedSinceLastSave = () => {
    if (activeView !== 'cv' || Number(config.step || 0) === 0) return false;
    const currentSnapshot = JSON.stringify({
      personalData: config.personalData || {},
      pageSize: config.pageSize || 'carta'
    });
    const hasMeaningfulData = Boolean(
      config.personalData?.firstName?.trim() ||
      config.personalData?.firstSurname?.trim() ||
      config.personalData?.phones?.some(p => p.number?.trim())
    );
    if (!hasMeaningfulData) return false;
    if (config.lastSavedSnapshot) {
      return currentSnapshot !== config.lastSavedSnapshot;
    }
    return true;
  };

  const navigateTo = (view) => {
    if (activeView === 'cv' && view !== 'cv' && isCVModifiedSinceLastSave()) {
      setDraftName(`${config.personalData?.firstName || 'Sin Nombre'} ${config.personalData?.firstSurname || ''} - ${new Date().toLocaleDateString()}`.trim());
      setPendingAction({ type: 'view', view });
      setShowExitPrompt(true);
      return;
    }
    performNavigation(view);
  };

  const handleHeaderBack = () => {
    if (activeView === 'cv') {
      if (Number(config.step || 0) > 0) {
        if (isCVModifiedSinceLastSave()) {
          setDraftName(`${config.personalData?.firstName || 'Sin Nombre'} ${config.personalData?.firstSurname || ''} - ${new Date().toLocaleDateString()}`.trim());
          setPendingAction({ type: 'cv_list' });
          setShowExitPrompt(true);
          return;
        }
        setConfig(prev => ({ ...prev, step: 0 }));
        return;
      }
      performNavigation('home');
      return;
    }
    navigateTo('home');
  };

  const handleSaveAndExit = () => {
    try {
      saveCVDraft(draftName, config);
    } catch (e) {
      console.error("Save failed", e);
    }
    if (pendingAction?.type === 'view') {
      performNavigation(pendingAction.view);
    } else {
      setConfig(prev => ({ ...prev, step: 0 }));
      setShowExitPrompt(false);
      setPendingAction(null);
    }
  };

  const handleExitWithoutSave = () => {
    if (pendingAction?.type === 'view') {
      performNavigation(pendingAction.view);
    } else {
      setConfig(prev => ({ ...prev, step: 0 }));
      setShowExitPrompt(false);
      setPendingAction(null);
    }
  };

  const rotateAllImages = () => {
    setImages(prev => prev.map(img => ({ ...img, rotation: (img.rotation + 90) % 360, x: 0, y: 0 })));
  };

  const saveConfiguration = () => {
    if (!newFavName.trim()) return;
    const newFav = { id: Date.now(), name: newFavName.trim(), config };
    setFavorites([...favorites, newFav]);
    setNewFavName('');
    setShowSaveModal(false);
  };

  const deleteFavorite = (id) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const showSaveButton = ['grid', 'custom', 'banner'].includes(activeView);

  return (
    <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shadow-sm z-10 print:hidden h-full">
      <CVDraftModal
        isOpen={showExitPrompt}
        draftName={draftName}
        setDraftName={setDraftName}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSave={handleExitWithoutSave}
        onCancel={() => {
          setShowExitPrompt(false);
          setPendingAction(null);
        }}
      />

      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur z-20">
        {activeView !== 'home' ? (
          <button
            onClick={handleHeaderBack}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title={activeView === 'cv' && Number(config.step || 0) > 0 ? "Volver a lista de CVs" : "Volver al Menú Principal"}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-7"></div>
        )}

        <h2 className="text-sm font-bold text-slate-700 flex-1 text-center uppercase tracking-wide truncate px-1">
          {activeView === 'home' && 'Menú Principal'}
          {activeView === 'grid' && 'Retícula Estándar'}
          {activeView === 'mosaic' && 'Modo Mosaico'}
          {activeView === 'custom' && 'Retícula Personalizada'}
          {activeView === 'banner' && 'Texto Gigante'}
          {activeView === 'cv' && (Number(config.step || 0) > 0 ? 'Crear Curriculum' : 'Curriculums')}
          {activeView === 'favorites' && 'Favoritos'}
          {activeView === 'settings' && 'Ajustes'}
        </h2>

        {showSaveButton ? (
          <button
            onClick={() => setShowSaveModal(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition cursor-pointer"
            title="Guardar como Favorito"
          >
            <Save className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-7"></div>
        )}
      </div>

      {/* Save Modal Inline Bar */}
      {showSaveModal && (
        <div className="m-4 mb-0 bg-amber-50 border border-amber-200 p-3 rounded-xl animate-in slide-in-from-top-2 fade-in">
          <label className="text-[10px] font-bold text-amber-700 uppercase mb-1 block">Guardar Configuración</label>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Nombre..."
              className="flex-1 text-xs border border-amber-300 p-1.5 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
              value={newFavName}
              onChange={e => setNewFavName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveConfiguration()}
            />
            <button
              onClick={saveConfiguration}
              className="bg-amber-500 text-white px-2.5 rounded-lg hover:bg-amber-600 cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSaveModal(false)}
              className="bg-white text-amber-700 border border-amber-200 px-2 rounded-lg hover:bg-amber-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Module Content */}
      <div className="p-5 flex-1 overflow-y-auto">
        {activeView === 'home' && <HomeMenu navigateTo={navigateTo} />}
        {activeView === 'grid' && (
          <GridSidebar
            config={config}
            setConfig={setConfig}
            unit={unit}
            setImages={setImages}
            rotateAllImages={rotateAllImages}
          />
        )}
        {activeView === 'mosaic' && (
          <MosaicSidebar
            config={config}
            setConfig={setConfig}
            unit={unit}
            mosaicImage={mosaicImage}
            isMosaicPreview={isMosaicPreview}
            setIsMosaicPreview={setIsMosaicPreview}
          />
        )}
        {activeView === 'custom' && (
          <CustomGridSidebar
            config={config}
            setConfig={setConfig}
            unit={unit}
            setImages={setImages}
            rotateAllImages={rotateAllImages}
          />
        )}
        {activeView === 'banner' && (
          <BannerSidebar
            config={config}
            setConfig={setConfig}
            unit={unit}
            isBannerPreview={isBannerPreview}
            setIsBannerPreview={setIsBannerPreview}
            updateBannerConfig={updateBannerConfig}
            totalPages={totalPages}
          />
        )}
        {activeView === 'cv' && (
          <CVSidebar
            config={config}
            setConfig={setConfig}
            cvDrafts={cvDrafts}
            saveCVDraft={saveCVDraft}
            deleteCVDraft={deleteCVDraft}
          />
        )}
        {activeView === 'favorites' && (
          <FavoritesSidebar
            favorites={favorites}
            setConfig={setConfig}
            deleteFavorite={deleteFavorite}
            navigateTo={navigateTo}
          />
        )}
        {activeView === 'settings' && (
          <SettingsSidebar
            unit={unit}
            setUnit={setUnit}
          />
        )}
      </div>

      {/* Footer Info */}
      {activeView === 'home' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-medium">PrintMaster Pro v2.0</p>
        </div>
      )}

      {['grid', 'custom'].includes(activeView) && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Imágenes: {images.length}</span>
          <button
            onClick={() => setImages([])}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Limpiar
          </button>
        </div>
      )}

      {activeView === 'mosaic' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Imagen Base: {mosaicImage ? 'Sí' : 'No'}</span>
          <button
            onClick={() => setMosaicImage(null)}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Limpiar
          </button>
        </div>
      )}
    </aside>
  );
}
