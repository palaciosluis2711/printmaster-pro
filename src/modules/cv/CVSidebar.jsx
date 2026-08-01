import React, { useState } from 'react';
import {
    Plus, FileText, ChevronRight, ArrowRight, Clock,
    Trash2, Check, X, Save, ArrowLeft
} from 'lucide-react';
import Button from '../../components/ui/Button';

export const CV_DEFAULT_PERSONAL_DATA = {
    firstName: '',
    secondName: '',
    firstSurname: '',
    secondSurname: '',
    sex: 'Masculino',
    dob: '',
    age: '',
    manualAge: false,
    dui: '',
    nit: '',
    showNit: true,
    civilStatus: 'Soltero',
    showCivilStatus: true,
    isss: '',
    isssNA: false,
    afp: '',
    afpNA: false,
    phones: [{ id: 1, number: '', type: 'mobile', hasWhatsapp: true }],
    email: '',
    emailNA: false,
    others: []
};

export default function CVSidebar({
    config,
    setConfig,
    cvDrafts = [],
    saveCVDraft,
    deleteCVDraft
}) {
    const [savedNotice, setSavedNotice] = useState(false);

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
        if (!config.personalData?.manualAge) {
            updates.age = calculateAge(dob);
        }
        setConfig(prev => ({
            ...prev,
            personalData: { ...prev.personalData, ...updates }
        }));
    };

    const addPhone = () => {
        const newPhone = { id: Date.now(), number: '', type: 'mobile', hasWhatsapp: false };
        updatePersonalData('phones', [...(config.personalData?.phones || []), newPhone]);
    };

    const updatePhone = (id, field, val) => {
        const newPhones = (config.personalData?.phones || []).map(p => p.id === id ? { ...p, [field]: val } : p);
        updatePersonalData('phones', newPhones);
    };

    const addOther = () => updatePersonalData('others', [...(config.personalData?.others || []), { name: '', value: '' }]);
    const updateOther = (idx, key, val) => {
        const newOthers = [...(config.personalData?.others || [])];
        newOthers[idx][key] = val;
        updatePersonalData('others', newOthers);
    };

    const handleManualSave = () => {
        const name = config.personalData?.firstName
            ? `${config.personalData.firstName} ${config.personalData.firstSurname || ''} - ${new Date().toLocaleDateString()}`
            : `CV - ${new Date().toLocaleDateString()}`;
        const savedId = saveCVDraft(name, config);
        const currentSnapshot = JSON.stringify({
            personalData: config.personalData || {},
            pageSize: config.pageSize || 'carta'
        });
        setConfig(prev => ({
            ...prev,
            activeDraftId: savedId || prev.activeDraftId,
            lastSavedSnapshot: currentSnapshot
        }));
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    const currentStep = config.step ?? 0;

    // --- STEP 0: CV HOME (MENU) ---
    if (currentStep === 0) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-700">Curriculum Vitae</h3>
                    <p className="text-slate-400 text-xs mt-1">Crea un CV profesional o continúa uno existente</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => {
                            setConfig(prev => ({
                                ...prev,
                                isCVMode: true,
                                pageSize: 'carta',
                                personalData: JSON.parse(JSON.stringify(CV_DEFAULT_PERSONAL_DATA)),
                                step: 1
                            }));
                        }}
                        className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-between group cursor-pointer"
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

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <div className="text-xs font-bold text-slate-600 mb-1">Currículums Guardados</div>
                        <div className="text-2xl font-black text-blue-600">{cvDrafts?.length || 0}</div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Selecciona cualquier CV en el panel central para editarlo.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 1: PAGE SETUP ---
    if (currentStep === 1) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-700">Configuración de Hoja</h3>
                    <p className="text-slate-400 text-xs mt-1">Selecciona el tamaño de tu Curriculum</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, pageSize: 'carta' }))}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${config.pageSize === 'carta' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                    >
                        <div className="w-16 h-20 bg-white border border-slate-300 shadow-sm flex items-center justify-center rounded">
                            <span className="text-[10px] text-slate-400">8.5x11"</span>
                        </div>
                        <span className={`font-bold text-sm ${config.pageSize === 'carta' ? 'text-blue-600' : 'text-slate-600'}`}>Carta</span>
                    </button>

                    <button
                        onClick={() => setConfig(prev => ({ ...prev, pageSize: 'a4' }))}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${config.pageSize === 'a4' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                    >
                        <div className="w-16 h-24 bg-white border border-slate-300 shadow-sm flex items-center justify-center rounded">
                            <span className="text-[10px] text-slate-400">A4</span>
                        </div>
                        <span className={`font-bold text-sm ${config.pageSize === 'a4' ? 'text-blue-600' : 'text-slate-600'}`}>A4</span>
                    </button>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setConfig(prev => ({ ...prev, step: 2 }))}
                    className="w-full mt-8"
                    icon={ArrowRight}
                >
                    Comenzar Edición
                </Button>
            </div>
        );
    }

    // --- STEP 2: PERSONAL DATA FORM ---
    const personalData = config.personalData || {};

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edición de CV</span>
                <button
                    onClick={handleManualSave}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-blue-200"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savedNotice ? "¡Guardado!" : "Guardar Borrador"}</span>
                </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                    Datos Personales
                </h3>

                <div className="space-y-3">
                    {/* Nombres */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-blue-600 font-bold block mb-1">Primer Nombre</label>
                            <input
                                type="text"
                                value={personalData.firstName || ''}
                                onChange={e => updatePersonalData('firstName', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Segundo Nombre (Op)</label>
                            <input
                                type="text"
                                value={personalData.secondName || ''}
                                onChange={e => updatePersonalData('secondName', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-blue-600 font-bold block mb-1">Primer Apellido</label>
                            <input
                                type="text"
                                value={personalData.firstSurname || ''}
                                onChange={e => updatePersonalData('firstSurname', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Segundo Apellido (Op)</label>
                            <input
                                type="text"
                                value={personalData.secondSurname || ''}
                                onChange={e => updatePersonalData('secondSurname', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>
                    </div>

                    {/* Sexo y Fecha Nac */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-blue-600 font-bold block mb-1">Sexo</label>
                            <select
                                value={personalData.sex || 'Masculino'}
                                onChange={e => updatePersonalData('sex', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 outline-none bg-white"
                            >
                                <option>Masculino</option>
                                <option>Femenino</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-blue-600 font-bold block mb-1">Fecha Nacimiento</label>
                            <input
                                type="date"
                                value={personalData.dob || ''}
                                onChange={handleDobChange}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 outline-none bg-white"
                            />
                        </div>
                    </div>

                    {/* Edad */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-100">
                        <div className="flex-1">
                            <label className="text-[10px] text-blue-600 font-bold block mb-1">Edad</label>
                            <input
                                type="number"
                                value={personalData.age || ''}
                                onChange={e => updatePersonalData('age', e.target.value)}
                                disabled={!personalData.manualAge}
                                className={`w-full text-xs border border-blue-200 rounded-md p-1.5 ${!personalData.manualAge ? 'bg-slate-50 text-slate-500' : ''}`}
                            />
                        </div>
                        <div className="flex flex-col items-center pt-3">
                            <input
                                type="checkbox"
                                checked={personalData.manualAge || false}
                                onChange={e => updatePersonalData('manualAge', e.target.checked)}
                                id="manualAge"
                                className="rounded text-blue-600"
                            />
                            <label htmlFor="manualAge" className="text-[9px] text-slate-400 mt-0.5 cursor-pointer select-none">Manual</label>
                        </div>
                    </div>

                    {/* DUI NIT */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-blue-600 font-bold block mb-1">DUI (9 dg)</label>
                            <input
                                type="text"
                                value={personalData.dui || ''}
                                onChange={e => updatePersonalData('dui', formatDUI(e.target.value))}
                                placeholder="00000000-0"
                                maxLength={10}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between">
                                <label className="text-[10px] text-blue-600 font-bold block mb-1">NIT</label>
                                <button
                                    onClick={() => updatePersonalData('showNit', !personalData.showNit)}
                                    title={personalData.showNit ? "Ocultar" : "Mostrar"}
                                    className="text-blue-400 hover:text-blue-600 cursor-pointer"
                                >
                                    <Check className={`w-3 h-3 ${!personalData.showNit ? 'grayscale opacity-50' : ''}`} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={personalData.nit || ''}
                                onChange={e => updatePersonalData('nit', formatNIT(e.target.value))}
                                placeholder="0000-000000-000-0"
                                maxLength={17}
                                disabled={!personalData.showNit}
                                className={`w-full text-xs border border-blue-200 rounded-lg p-1.5 ${!personalData.showNit ? 'bg-slate-100 opacity-50' : 'bg-white'}`}
                            />
                        </div>
                    </div>

                    {/* Estado Civil */}
                    <div className="bg-white p-2 border border-blue-100 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] text-blue-600 font-bold">Estado Civil</label>
                            <input
                                type="checkbox"
                                checked={personalData.showCivilStatus ?? true}
                                onChange={e => updatePersonalData('showCivilStatus', e.target.checked)}
                                className="rounded text-blue-500"
                            />
                        </div>
                        {personalData.showCivilStatus && (
                            <select
                                value={personalData.civilStatus || 'Soltero'}
                                onChange={e => updatePersonalData('civilStatus', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-md p-1.5 outline-none"
                            >
                                <option>Soltero</option>
                                <option>Casado</option>
                                <option>Divorciado</option>
                                <option>Viudo</option>
                                <option>Unión Libre</option>
                            </select>
                        )}
                    </div>

                    {/* ISSS AFP */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] text-blue-600 font-bold">ISSS</label>
                                <label className="text-[9px] cursor-pointer"><input type="checkbox" checked={personalData.isssNA || false} onChange={e => updatePersonalData('isssNA', e.target.checked)} /> N/A</label>
                            </div>
                            <input
                                type="text"
                                value={personalData.isss || ''}
                                onChange={e => updatePersonalData('isss', e.target.value)}
                                disabled={personalData.isssNA}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 bg-white disabled:bg-slate-100"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] text-blue-600 font-bold">AFP</label>
                                <label className="text-[9px] cursor-pointer"><input type="checkbox" checked={personalData.afpNA || false} onChange={e => updatePersonalData('afpNA', e.target.checked)} /> N/A</label>
                            </div>
                            <input
                                type="text"
                                value={personalData.afp || ''}
                                onChange={e => updatePersonalData('afp', e.target.value)}
                                disabled={personalData.afpNA}
                                className="w-full text-xs border border-blue-200 rounded-lg p-1.5 bg-white disabled:bg-slate-100"
                            />
                        </div>
                    </div>

                    {/* Telefonos */}
                    <div className="bg-white p-2.5 border border-blue-100 rounded-lg">
                        <label className="text-[10px] text-blue-600 font-bold block mb-2">Teléfonos</label>
                        <div className="space-y-2">
                            {personalData.phones?.map((phone) => (
                                <div key={phone.id} className="flex gap-1 items-center">
                                    <input
                                        type="text"
                                        value={phone.number}
                                        onChange={e => updatePhone(phone.id, 'number', e.target.value)}
                                        placeholder="0000-0000"
                                        className="flex-1 text-xs border border-slate-200 rounded-md p-1.5"
                                    />
                                    <div className="flex flex-col items-center px-1.5 bg-slate-50 rounded-md border border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={phone.hasWhatsapp || false}
                                            onChange={e => updatePhone(phone.id, 'hasWhatsapp', e.target.checked)}
                                            title="Tiene WhatsApp"
                                        />
                                        <span className="text-[8px] text-slate-400 font-bold">WA</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newP = personalData.phones.filter(p => p.id !== phone.id);
                                            updatePersonalData('phones', newP);
                                        }}
                                        className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addPhone}
                                className="w-full py-1 text-xs text-blue-600 font-medium border border-dashed border-blue-300 rounded-md hover:bg-blue-50 transition cursor-pointer"
                            >
                                + Agregar Teléfono
                            </button>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="bg-white p-2.5 border border-blue-100 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] text-blue-600 font-bold">Email</label>
                            <label className="text-[9px] cursor-pointer"><input type="checkbox" checked={personalData.emailNA || false} onChange={e => updatePersonalData('emailNA', e.target.checked)} /> No Aplica</label>
                        </div>
                        {!personalData.emailNA && (
                            <input
                                type="email"
                                value={personalData.email || ''}
                                onChange={e => updatePersonalData('email', e.target.value)}
                                className="w-full text-xs border border-blue-200 rounded-md p-1.5"
                                placeholder="ejemplo@correo.com"
                            />
                        )}
                    </div>

                    {/* Otros */}
                    <div className="bg-white p-2.5 border border-blue-100 rounded-lg">
                        <label className="text-[10px] text-blue-600 font-bold block mb-2">Otros Documentos</label>
                        <div className="space-y-2">
                            {personalData.others?.map((doc, idx) => (
                                <div key={idx} className="flex gap-1 items-center">
                                    <input
                                        type="text"
                                        placeholder="Nombre (Ej: Licencia)"
                                        value={doc.name}
                                        onChange={e => updateOther(idx, 'name', e.target.value)}
                                        className="w-1/3 text-xs border border-slate-200 rounded-md p-1.5"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Valor"
                                        value={doc.value}
                                        onChange={e => updateOther(idx, 'value', e.target.value)}
                                        className="flex-1 text-xs border border-slate-200 rounded-md p-1.5"
                                    />
                                    <button
                                        onClick={() => {
                                            const newO = personalData.others.filter((_, i) => i !== idx);
                                            updatePersonalData('others', newO);
                                        }}
                                        className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addOther}
                                className="w-full py-1 text-xs text-blue-600 font-medium border border-dashed border-blue-300 rounded-md hover:bg-blue-50 transition cursor-pointer"
                            >
                                + Agregar Documento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
