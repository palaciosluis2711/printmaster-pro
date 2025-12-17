import React from 'react';
import {
  Printer,
  User,
  LogIn,
  LogOut,
  Settings,
  Upload,
  Cloud
} from 'lucide-react';

export default function Header({
  user,
  isSaving,
  handleLogin,
  handleLogout,
  onOpenSettings,
  onUploadClick,
  isMosaicMode,
  isMosaicPreview,
  activeView,
  mosaicImage
}) {

  // --- 1. LÓGICA DEL BOTÓN DE CARGA ---
  // Mostrar solo en vistas funcionales
  let showUploadBtn = ['grid', 'mosaic', 'custom'].includes(activeView);

  // Excepción: Ocultar en Mosaico si ya está procesado (para no cambiar la imagen base en ese punto)
  if (isMosaicMode && !isMosaicPreview) {
    showUploadBtn = false;
  }

  // Texto dinámico
  let uploadBtnText = "Subir Fotos";
  if (isMosaicMode) {
    uploadBtnText = mosaicImage ? "Cambiar Imagen" : "Cargar Imagen";
  }

  // --- 2. LÓGICA DEL BOTÓN IMPRIMIR ---
  let showPrintBtn = false;

  if (activeView === 'mosaic') {
    // En Mosaico: Solo mostrar si YA se procesaron las páginas (no está en preview)
    if (!isMosaicPreview) {
      showPrintBtn = true;
    }
  } else if (['grid', 'custom'].includes(activeView)) {
    // En Retícula/Personalizado: Siempre mostrar (las páginas están listas)
    showPrintBtn = true;
  }
  // En home, settings, favorites se mantiene en false

  return (
    <header className="bg-blue-700 text-white p-3 shadow-md flex justify-between items-center z-20 print:hidden">
      <div className="flex items-center gap-2">
        <Printer className="w-6 h-6" />
        <h1 className="text-lg font-bold">PrintMaster <span className="font-light opacity-80">Pro</span></h1>
      </div>

      <div className="flex gap-2 items-center">
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
                  <button onClick={handleLogout} className="text-[10px] text-blue-200 hover:text-white flex items-center gap-1"><LogOut className="w-3 h-3" /> Salir</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-white text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-50 transition shadow-sm"><LogIn className="w-3 h-3" /> Iniciar Sesión</button>
          )}
        </div>

        <button onClick={onOpenSettings} className="p-2 mr-2 text-blue-200 hover:text-white hover:bg-blue-600/50 rounded-full transition" title="Configuración Global">
          <Settings className="w-5 h-5" />
        </button>

        {/* BOTÓN DE CARGA */}
        {showUploadBtn && (
          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{uploadBtnText}</span>
            <input
              type="file"
              multiple={!isMosaicMode}
              accept="image/*"
              className="hidden"
              onChange={onUploadClick}
            />
          </label>
        )}

        {/* BOTÓN IMPRIMIR (Renderizado Condicional) */}
        {showPrintBtn && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition animate-in fade-in zoom-in-95 duration-200"
            title="Imprimir documento"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        )}
      </div>
    </header>
  );
}


