import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Type, Globe, FileType, Monitor, Filter, Heart,
    Plus, X, Scissors, Layers
} from 'lucide-react';
import { PaperSettings, MarginSettings, PrintGuidesFooter } from '../../components/layout/PaperMarginControls';
import InputNumber from '../../components/ui/InputNumber';
import Button from '../../components/ui/Button';
import { toMm } from '../../utils/measurements';
import { UNITS } from '../../constants/printSettings';

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

export default function BannerSidebar({
    config,
    setConfig,
    unit,
    isBannerPreview,
    setIsBannerPreview,
    updateBannerConfig,
    totalPages
}) {
    const [fontList, setFontList] = useState(DEFAULT_FONTS);
    const [favFonts, setFavFonts] = useState([]);
    const [fontFilter, setFontFilter] = useState('all');
    const [googleFontName, setGoogleFontName] = useState('');
    const [showFontInput, setShowFontInput] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const savedFavs = localStorage.getItem('printmaster_fav_fonts');
        if (savedFavs) {
            try {
                setFavFonts(JSON.parse(savedFavs));
            } catch {
                // ignore
            }
        }
    }, []);

    const toggleFavorite = (fontName) => {
        const newFavs = favFonts.includes(fontName)
            ? favFonts.filter(f => f !== fontName)
            : [...favFonts, fontName];
        setFavFonts(newFavs);
        localStorage.setItem('printmaster_fav_fonts', JSON.stringify(newFavs));
    };

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

    const handleSystemFonts = async () => {
        try {
            if (!window.queryLocalFonts) {
                alert("Tu navegador no soporta esta función.");
                return;
            }
            const available = await window.queryLocalFonts();
            const names = [...new Set(available.map(f => f.family))];
            const newSystemFonts = names.map(name => ({ name, type: 'system' }));

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

    const filteredFonts = useMemo(() => {
        if (fontFilter === 'favorites') {
            return fontList.filter(f => favFonts.includes(f.name));
        }
        if (fontFilter === 'all') return fontList;
        return fontList.filter(f => f.type === fontFilter);
    }, [fontList, fontFilter, favFonts]);

    const selectFilter = async (type) => {
        if (type === 'system') {
            await handleSystemFonts();
        }
        setFontFilter(type);
        setShowFilterMenu(false);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <PaperSettings config={config} setConfig={setConfig} />
            <MarginSettings config={config} setConfig={setConfig} unit={unit} />

            <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" /> Texto del Banner
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">Frase</label>
                        <textarea
                            value={config.bannerText || ''}
                            onChange={(e) => updateBannerConfig('bannerText', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none h-20"
                            placeholder="Escribe aquí..."
                            disabled={!isBannerPreview}
                        />
                    </div>

                    {/* FONT SELECTOR */}
                    <div>
                        <div className="flex justify-between items-end mb-1 relative">
                            <label className="text-xs text-slate-500 font-medium">Tipografía ({filteredFonts.length})</label>
                            <div className="flex gap-1">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAddMenu(!showAddMenu)}
                                        className={`p-1 rounded transition-colors cursor-pointer ${showAddMenu ? 'bg-pink-100 text-pink-700' : 'hover:bg-slate-100 text-slate-400'}`}
                                        title="Añadir fuentes"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    {showAddMenu && (
                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 p-1 z-50 w-36 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="text-[9px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Añadir desde:</div>
                                            <button onClick={() => { setShowFontInput(true); setShowAddMenu(false); }} className="w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                                                <Globe className="w-3 h-3 text-blue-400" /> Google Fonts
                                            </button>
                                            <button onClick={() => { fileInputRef.current?.click(); setShowAddMenu(false); }} className="w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                                                <FileType className="w-3 h-3 text-amber-500" /> Archivo Local
                                            </button>
                                            <button onClick={() => { handleSystemFonts(); setShowAddMenu(false); }} className="w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                                                <Monitor className="w-3 h-3 text-slate-500" /> Detectar Sistema
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        className={`p-1 rounded transition-colors cursor-pointer ${fontFilter !== 'all' ? 'bg-pink-100 text-pink-700' : 'hover:bg-slate-100 text-slate-400'}`}
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
                                                    className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 transition cursor-pointer ${fontFilter === opt.id ? 'bg-pink-50 text-pink-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <opt.icon className={`w-3 h-3 ${opt.id === 'favorites' && fontFilter === 'favorites' ? 'fill-pink-600 text-pink-600' : ''}`} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-2">
                            <select
                                value={config.bannerFont || 'Arial'}
                                onChange={(e) => updateBannerConfig('bannerFont', e.target.value)}
                                className="flex-1 border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                disabled={!isBannerPreview}
                            >
                                {filteredFonts.map((font, idx) => (
                                    <option key={idx} value={font.name} style={{ fontFamily: font.name }}>{font.name}</option>
                                ))}
                                {filteredFonts.length === 0 && <option disabled>Sin resultados</option>}
                            </select>
                            <button
                                onClick={() => toggleFavorite(config.bannerFont || 'Arial')}
                                className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${favFonts.includes(config.bannerFont || 'Arial') ? 'bg-pink-50 text-pink-600 border-pink-300' : 'bg-white border-slate-300 text-slate-300 hover:text-pink-400'}`}
                                title="Marcar como favorita"
                            >
                                <Heart className={`w-4 h-4 ${favFonts.includes(config.bannerFont || 'Arial') ? 'fill-pink-600' : ''}`} />
                            </button>
                        </div>

                        <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

                        {showFontInput && (
                            <div className="mt-2 flex gap-1 animate-in fade-in slide-in-from-top-1">
                                <input
                                    type="text"
                                    placeholder="Ej: Roboto Slab"
                                    className="flex-1 text-xs border border-pink-300 p-1.5 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={googleFontName}
                                    onChange={(e) => setGoogleFontName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addGoogleFont()}
                                    autoFocus
                                />
                                <button onClick={addGoogleFont} className="bg-pink-500 text-white px-2.5 rounded-lg text-xs font-semibold hover:bg-pink-600 cursor-pointer">OK</button>
                                <button onClick={() => setShowFontInput(false)} className="text-slate-400 hover:text-red-500 px-1 cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">Altura Letra ({UNITS[unit]?.label})</label>
                            <InputNumber
                                valueMm={config.bannerHeight || 100}
                                unit={unit}
                                step={UNITS[unit]?.step || 1}
                                min={10}
                                onChange={(val) => updateBannerConfig('bannerHeight', toMm(val, unit))}
                                className="w-full"
                                disabled={!isBannerPreview}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={config.bannerColor || '#000000'}
                                    onChange={(e) => updateBannerConfig('bannerColor', e.target.value)}
                                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 overflow-hidden"
                                    disabled={!isBannerPreview}
                                />
                                <span className="text-xs text-slate-600 font-mono">{config.bannerColor || '#000000'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => updateBannerConfig('isOutline', !config.isOutline)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${config.isOutline ? 'bg-pink-100 border-pink-300 text-pink-800' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                            disabled={!isBannerPreview}
                        >
                            Solo Contorno
                        </button>
                        <button
                            onClick={() => updateBannerConfig('isItalic', !config.isItalic)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${config.isItalic ? 'bg-pink-100 border-pink-300 text-pink-800' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                            disabled={!isBannerPreview}
                        >
                            Itálica (Cursiva)
                        </button>
                    </div>

                    {config.isOutline && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                            <label className="text-xs text-slate-500 block mb-1 font-medium">Grosor de Contorno ({config.bannerStrokeWidth || 1}px)</label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                value={config.bannerStrokeWidth || 1}
                                onChange={(e) => updateBannerConfig('bannerStrokeWidth', Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                                disabled={!isBannerPreview}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* BOTÓN PROCESAR / VISTA PREVIA */}
            <div className="pt-2">
                <Button
                    variant={isBannerPreview ? 'pink' : 'outline'}
                    size="md"
                    onClick={() => setIsBannerPreview(!isBannerPreview)}
                    className="w-full"
                    icon={isBannerPreview ? Scissors : Layers}
                >
                    {isBannerPreview ? `Procesar ${totalPages || 1} Páginas` : "Ajustar Texto"}
                </Button>
            </div>

            <PrintGuidesFooter config={config} setConfig={setConfig} color="pink" />
        </div>
    );
}
