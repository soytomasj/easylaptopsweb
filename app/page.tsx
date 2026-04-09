'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase'; 

// ========================================================
// 🎨 ESTÉTICA MODULAR
// ========================================================
const RADIO_GENERAL = "rounded-2xl"; 

const ESTETICA_LOGIN = {
  contenedor: `w-full max-w-[300px] bg-white p-6 ${RADIO_GENERAL} shadow-lg shadow-slate-200/40 border border-slate-100`,
  input: `w-full h-10 px-4 bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-200 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400`,
  boton: `bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-10 mt-1 ${RADIO_GENERAL}`
};

const ESTETICA_FORMULARIO = {
  contenedor: `max-w-[360px] mx-auto bg-white p-6 ${RADIO_GENERAL} shadow-lg shadow-slate-200/40 border border-slate-100`,
  input: `w-full h-10 px-4 bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-200 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400`,
  botonPrincipal: `bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-12 mt-4 ${RADIO_GENERAL}`,
  btnOpcionInactivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 bg-white text-slate-400 border-slate-100`,
  btnOpcionActivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 bg-violet-600 text-white border-violet-600`,
};

const ESTETICA_TARJETA = {
  contenedor: `bg-white p-6 ${RADIO_GENERAL} shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col`,
  btnAccionInactivo: `h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${RADIO_GENERAL} bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100`,
};

// --- NUEVOS USUARIOS Y CONTRASEÑAS ---
const AMIGOS = ['Tomas', 'Koke', 'Tito', 'Uli', 'Pablo', 'Oscarcito'];

const CREDENCIALES: Record<string, string> = {
  'Tomas': '123',
  'Koke': '123',
  'Tito': '123',
  'Uli': '123',
  'Pablo': '123',
  'Oscarcito': '123'
};

// --- NUEVOS TAGS ---
const TAGS_DISPONIBLES = [
  { label: 'PS5', emoji: '🎮' }, 
  { label: 'Asado', emoji: '🥩' },
  { label: 'Juegos de Mesa', emoji: '🎲' }, 
  { label: 'Novias Invitadas', emoji: '👩‍❤️‍👨' },
  { label: 'Chupi', emoji: '🥃' },
  { label: 'Minubis', emoji: '👩🏻‍🦰' },
  { label: 'Lowcost', emoji: '💸' },
  { label: 'María', emoji: '🍁' },
  { label: 'Fiesta', emoji: '🎉' }
];

// --- VARIANTES PARA ANIMACIONES ---
const varFadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const varStaggerContainer = {
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function Home() {
  const [usuarioLogueado, setUsuarioLogueado] = useState<string | null>(null);
  const [nombreSeleccionado, setNombreSeleccionado] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [juntadas, setJuntadas] = useState<any[]>([]);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados Formulario
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [fechaSel, setFechaSel] = useState(''); 
  const [horaSel, setHoraSel] = useState(''); 
  const [esSedeFija, setEsSedeFija] = useState(true);
  const [sedeFija, setSedeFija] = useState('Casa de Tomas');
  const [candidatosSede, setCandidatosSede] = useState<string[]>([]);
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [notas, setNotas] = useState('');

  // 1. Cargar datos al iniciar
  useEffect(() => {
    async function cargarDatos() {
      const { data, error } = await supabase
        .from('juntadas')
        .select('*')
        .order('id', { ascending: false });
      
      if (data) setJuntadas(data);
      setLoading(false);
    }
    cargarDatos();
  }, []);

  // 2. Publicar en la nube
  const publicar = async () => {
    if (!nuevoTitulo.trim() || !fechaSel || !horaSel.trim()) return alert("Completá título, fecha y hora.");
    
    const [y, m, d] = fechaSel.split('-');
    const [h, min] = horaSel.includes(':') ? horaSel.split(':') : [horaSel, '00'];
    const targetDate = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));

    const nueva = {
      creador: usuarioLogueado,
      titulo: nuevoTitulo,
      fechaDisplay: formatearFechaDisplay(fechaSel),
      horaDisplay: `${horaSel} PM`,
      timestamp: targetDate.getTime(),
      esSedeFija,
      sedeFinal: esSedeFija ? sedeFija : null,
      candidatos: esSedeFija ? [] : candidatosSede.map(c => ({ nombre: c, votantes: [] })),
      tags: tagsSel,
      notas: notas.trim(),
      confirmados: [usuarioLogueado],
      dudosos: [],
      rechazados: []
    };

    const { data, error } = await supabase.from('juntadas').insert([nueva]).select();

    // SI HAY ERROR, NOS TIRA UNA ALERTA EN LA CARA
    if (error) {
      alert("ERROR DE SUPABASE: " + error.message);
    } else if (data) {
      setJuntadas([data[0], ...juntadas]);
      setMostrandoFormulario(false);
      resetForm();
    }
  };

  // 3. Votar sede en la nube
  const votarSede = async (juntadaId: number, casaNombre: string) => {
    const j = juntadas.find(item => item.id === juntadaId);
    if (!j || j.esSedeFija) return;

    const nuevosCandidatos = j.candidatos.map((c: any) => {
      const votantesFiltrados = (c.votantes || []).filter((v: string) => v !== usuarioLogueado);
      if (c.nombre === casaNombre) votantesFiltrados.push(usuarioLogueado);
      return { ...c, votantes: votantesFiltrados };
    });

    const { error } = await supabase.from('juntadas').update({ candidatos: nuevosCandidatos }).eq('id', juntadaId);
    if (!error) setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, candidatos: nuevosCandidatos } : item));
  };

  // 4. Cambiar asistencia en la nube
  const toggleAsistencia = async (juntadaId: number, estado: 'voy' | 'nose' | 'paso') => {
    const j = juntadas.find(item => item.id === juntadaId);
    if (!j) return;

    let confirmados = (j.confirmados || []).filter((u: string) => u !== usuarioLogueado);
    let dudosos = (j.dudosos || []).filter((u: string) => u !== usuarioLogueado);
    let rechazados = (j.rechazados || []).filter((u: string) => u !== usuarioLogueado);
    let nuevosCandidatos = j.candidatos;

    if (estado === 'voy') confirmados.push(usuarioLogueado);
    if (estado === 'nose') dudosos.push(usuarioLogueado);
    if (estado === 'paso') {
      rechazados.push(usuarioLogueado);
      if (!j.esSedeFija && j.candidatos) {
        nuevosCandidatos = j.candidatos.map((c: any) => ({
          ...c, votantes: (c.votantes || []).filter((v: string) => v !== usuarioLogueado)
        }));
      }
    }

    const { error } = await supabase.from('juntadas').update({ confirmados, dudosos, rechazados, candidatos: nuevosCandidatos }).eq('id', juntadaId);
    if (!error) setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, confirmados, dudosos, rechazados, candidatos: nuevosCandidatos } : item));
  };

  // 5. Eliminar de la nube
  const eliminarJuntada = async (juntadaId: number) => {
    if (!window.confirm("¿Seguro que querés eliminar esta juntada?")) return;
    const { error } = await supabase.from('juntadas').delete().eq('id', juntadaId);
    if (!error) setJuntadas(prev => prev.filter(j => j.id !== juntadaId));
  };

  // --- COMPARTIR POR WHATSAPP (SOLUCIÓN EMOJIS CON CÓDIGOS) ---
  const compartirWhatsApp = (j: any) => {
    const url = window.location.origin; 
    
    // Usamos los códigos nativos para evitar que el editor los rompa al guardar
    const champ = String.fromCodePoint(0x1F37E);
    const cal = String.fromCodePoint(0x1F4C6);
    const reloj = String.fromCodePoint(0x23F0);
    const casa = String.fromCodePoint(0x1F3E0);
    const dedo = String.fromCodePoint(0x1F449);
    const urna = String.fromCodePoint(0x1F5F3, 0xFE0F);

    const sede = j.esSedeFija ? j.sedeFinal : `A votar en la app ${urna}`;
    
    const mensaje = `${champ} *PROPUESTA JUNTADA:* ${j.titulo} ${champ}\n${cal} *DÍA:* ${j.fechaDisplay}\n${reloj} *HORA:* ${j.horaDisplay}\n${casa} *SEDE:* ${sede}\n\n${dedo} *Confirmá tu asistencia o votá la sede acá:* ${url}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  const resetForm = () => {
    setNuevoTitulo(''); setFechaSel(''); setHoraSel(''); setTagsSel([]); setCandidatosSede([]); setEsSedeFija(true); setNotas('');
  };

  const formatearFechaDisplay = (fechaStr: string) => {
    if (!fechaStr) return '';
    const [y, m, d] = fechaStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[dateObj.getDay()]} ${d} de ${meses[dateObj.getMonth()]}`;
  };

  const calcularTiempoRestante = (timestamp: number) => {
    if (!timestamp) return 'CALCULANDO... ⏳';
    const ahora = new Date().getTime();
    const diffMs = timestamp - ahora;
    if (diffMs < 0) return 'YA ARRANCÓ (O PASÓ) 🏃‍♂️';
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    if (dias > 1) return `FALTAN ${dias} DÍAS ⏳`;
    if (dias === 1) return `MAÑANA 📆 `;
    if (horas >= 1) return `FALTAN ${horas} HORAS ⏰`;
    return '¡EN UN RATO! 🔥';
  };

  const handleHoraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 2) val = val.substring(0, 2) + ':' + val.substring(2, 4);
    setHoraSel(val);
  };

  const intentarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreSeleccionado) return setErrorLogin('Falta elegir quién sos.');
    
    if (CREDENCIALES[nombreSeleccionado] === passwordInput) {
      setUsuarioLogueado(nombreSeleccionado);
      setErrorLogin('');
    } else { 
      setErrorLogin('Contraseña incorrecta'); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
      <div className="animate-spin text-violet-600 text-2xl">⏳</div>
    </div>
  );

  return (
    <>
      {/* --- VISTA LOGIN --- */}
      {!usuarioLogueado && (
        <main className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4">
          <motion.div variants={varFadeInUp} initial="hidden" animate="visible" className={ESTETICA_LOGIN.contenedor}>
            <div className="text-center mb-6 text-violet-600 text-2xl italic font-black tracking-tighter">JX.</div>
            <form onSubmit={intentarLogin} className="space-y-3">
              <select className={`${ESTETICA_LOGIN.input} ${RADIO_GENERAL} appearance-none cursor-pointer`} value={nombreSeleccionado} onChange={e => setNombreSeleccionado(e.target.value)}>
                <option value="">¿Quién sos?</option>
                {AMIGOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input type="password" placeholder="Contraseña" className={`${ESTETICA_LOGIN.input} ${RADIO_GENERAL}`} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              {errorLogin && <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{errorLogin}</p>}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={ESTETICA_LOGIN.boton}>ENTRAR</motion.button>
            </form>
          </motion.div>
        </main>
      )}

      {/* --- VISTA FORMULARIO --- */}
      {usuarioLogueado && mostrandoFormulario && (
        <main className="min-h-screen bg-[#FDFDFF] p-4 pb-10">
          <motion.div variants={varFadeInUp} initial="hidden" animate="visible" className={ESTETICA_FORMULARIO.contenedor}>
            <button onClick={() => setMostrandoFormulario(false)} className="text-slate-400 font-bold text-[10px] mb-4 uppercase tracking-widest hover:text-violet-600 transition-colors">← Cancelar</button>
            <h2 className="text-xl font-black text-slate-900 mb-5 tracking-tighter uppercase">NUEVA PROPUESTA</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">¿Qué se hace?</label>
                <input type="text" placeholder="EJ: Asadito en lo de Uli" className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL}`} value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Día</label>
                  <input type="date" className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL} text-xs`} value={fechaSel} onChange={e => setFechaSel(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Hora</label>
                  <div className="relative">
                    <input type="text" placeholder="21:30" className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL} pr-8`} value={horaSel} onChange={handleHoraChange} maxLength={5} />
                    <span className="absolute right-3 top-3 text-[10px] font-black text-slate-400">PM</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Sede</label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setEsSedeFija(true)} className={esSedeFija ? ESTETICA_FORMULARIO.btnOpcionActivo : ESTETICA_FORMULARIO.btnOpcionInactivo}>FIJA</button>
                  <button onClick={() => setEsSedeFija(false)} className={!esSedeFija ? ESTETICA_FORMULARIO.btnOpcionActivo : ESTETICA_FORMULARIO.btnOpcionInactivo}>POR VOTACIÓN</button>
                </div>
                
                <div className="mt-1">
                  {esSedeFija ? (
                    <div className="relative">
                      <select className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL} bg-white appearance-none cursor-pointer pr-8`} value={sedeFija} onChange={e => setSedeFija(e.target.value)}>
                        {AMIGOS.map(a => <option key={a} value={`Casa de ${a}`}>Casa de {a}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-[10px]">▼</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 pb-3 bg-slate-50 px-3 border border-slate-100 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 mb-3 text-center uppercase tracking-widest">Seleccionar casas candidatas:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {AMIGOS.map(a => (
                          <motion.button 
                            key={a}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCandidatosSede(prev => prev.includes(a) ? prev.filter(c => c !== a) : [...prev, a])}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black transition-all border-2 ${candidatosSede.includes(a) ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200' : 'bg-white text-slate-400 border-slate-200 hover:border-violet-300'}`}>
                            {a.toUpperCase()}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Notas (Opcional)</label>
                <input type="text" placeholder="EJ: Traigan hielo, falta coca..." className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL}`} value={notas} onChange={e => setNotas(e.target.value)} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">¿Qué onda?</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_DISPONIBLES.map(t => (
                    <button key={t.label} onClick={() => setTagsSel(prev => prev.includes(t.label) ? prev.filter(x => x !== t.label) : [...prev, t.label])}
                      className={`px-3 py-2 ${RADIO_GENERAL} text-[10px] font-bold transition-all border-2 ${tagsSel.includes(t.label) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-100'}`}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={publicar} className={ESTETICA_FORMULARIO.botonPrincipal}>🚀 PROPONER</motion.button>
            </div>
          </motion.div>
        </main>
      )}

      {/* --- DASHBOARD --- */}
      {usuarioLogueado && !mostrandoFormulario && (
        <main className="min-h-screen bg-[#FDFDFF] font-sans pb-16">
          <nav className="p-5 flex justify-between items-center max-w-4xl mx-auto">
            <h1 className="text-xl font-black tracking-tighter text-slate-900">JUNTADAS<span className="text-violet-600">.</span></h1>
            <button onClick={() => setUsuarioLogueado(null)} className={`text-[9px] font-black text-slate-400 border border-slate-200 px-4 py-1.5 ${RADIO_GENERAL} uppercase tracking-widest hover:bg-slate-50 transition-colors`}>Salir</button>
          </nav>

          <div className="max-w-4xl mx-auto p-4">
            <AnimatePresence mode="popLayout">
              {juntadas.length === 0 ? (
                <motion.div variants={varFadeInUp} initial="hidden" animate="visible" exit={{ opacity: 0 }} className={`bg-white border-2 border-dashed border-slate-200 ${RADIO_GENERAL} py-12 flex flex-col items-center justify-center text-center mt-2`}>
                  <div className="text-3xl mb-3 opacity-30">🗓️</div>
                  <p className="text-slate-500 text-[10px] font-bold mb-5 uppercase tracking-widest">Nada por acá...</p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setMostrandoFormulario(true)} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-xs px-6 h-10 ${RADIO_GENERAL}`}>+ PROPONER</motion.button>
                </motion.div>
              ) : (
                <motion.div variants={varStaggerContainer} initial="hidden" animate="visible" className="space-y-6">
                  <div className="flex justify-between items-end mb-2 px-1">
                    <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">PROPUESTAS</h2>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setMostrandoFormulario(true)} className={`bg-violet-600 text-white font-black hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-[10px] px-4 h-8 ${RADIO_GENERAL}`}>+ NUEVA</motion.button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {juntadas.map((j, index) => {
                      const voyYo = (j.confirmados || []).includes(usuarioLogueado);
                      const dudaYo = (j.dudosos || []).includes(usuarioLogueado);
                      const pasoYo = (j.rechazados || []).includes(usuarioLogueado);
                      const cantConfirmados = j.confirmados?.length || 0;

                      const esCreador = usuarioLogueado === j.creador;
                      const esAdminTomas = usuarioLogueado === 'Tomas';
                      const puedeEliminar = esCreador || esAdminTomas;

                      const totalVotosSede = j.candidatos ? j.candidatos.reduce((acc: number, c: any) => acc + (c.votantes?.length || 0), 0) : 0;
                      const totalPosiblesVotantes = AMIGOS.length - (j.rechazados?.length || 0);
                      const votosRestantes = Math.max(0, totalPosiblesVotantes - totalVotosSede);

                      let sedeConfirmada = j.esSedeFija ? j.sedeFinal : null;
                      let esIrremontable = false;

                      if (!j.esSedeFija && j.candidatos && j.candidatos.length > 0) {
                        const ordenados = [...j.candidatos].sort((a, b) => (b.votantes?.length || 0) - (a.votantes?.length || 0));
                        const maxVotos = ordenados[0]?.votantes?.length || 0;
                        const segundoMaxVotos = ordenados.length > 1 ? (ordenados[1]?.votantes?.length || 0) : 0;

                        if (maxVotos > 0 && maxVotos > (segundoMaxVotos + votosRestantes)) {
                          sedeConfirmada = ordenados[0].nombre;
                          esIrremontable = true;
                        }
                      }

                      return (
                        <motion.div 
                          layout
                          key={j.id || index}
                          variants={varFadeInUp}
                          className={`relative ${ESTETICA_TARJETA.contenedor}`}
                        >
                          {puedeEliminar && (
                            <motion.button
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              whileHover={{ scale: 1.2, color: '#ef4444' }}
                              onClick={() => eliminarJuntada(j.id)}
                              className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors font-bold cursor-pointer text-xs z-10"
                              title="Eliminar juntada"
                            >
                              ✕
                            </motion.button>
                          )}

                          <div className="mb-4 pr-6">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">{j.titulo}</h3>
                              <span className={`bg-violet-50 text-violet-600 text-[9px] font-black px-2 py-1 ${RADIO_GENERAL} uppercase tracking-widest border border-violet-100`}>
                                Propuesto por {j.creador}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-sm">📅</span>
                              <p className="text-xs font-bold text-slate-700">{j.fechaDisplay} — <span className="text-slate-900 font-black">{j.horaDisplay}</span></p>
                              <span className={`bg-violet-600 text-white text-[9px] font-black px-2 py-1 ${RADIO_GENERAL} uppercase tracking-widest shadow-sm`}>
                                {calcularTiempoRestante(j.timestamp)}
                              </span>
                            </div>
                            
                            {(j.esSedeFija || esIrremontable) ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">🏠</span>
                                  <p className="text-xs font-black text-violet-600 uppercase">{sedeConfirmada}</p>
                                </div>
                                {esIrremontable && (
                                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit uppercase tracking-widest border border-emerald-200">
                                    Votación cerrada por mayoría
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className={`mt-3 p-3 bg-slate-50 border border-slate-100 ${RADIO_GENERAL}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                  <span>🗳️ Votación de sede</span>
                                  <span className="text-slate-300 normal-case tracking-normal">Quedan {votosRestantes} votos</span>
                                </p>
                                <div className="space-y-1.5">
                                  {j.candidatos.map((c: any) => {
                                    const vCount = c.votantes?.length || 0;
                                    const porcentaje = totalVotosSede === 0 ? 0 : Math.round((vCount / totalVotosSede) * 100);
                                    const yoVoteAca = (c.votantes || []).includes(usuarioLogueado);

                                    return (
                                      <button 
                                        key={c.nombre} 
                                        onClick={() => votarSede(j.id, c.nombre)} 
                                        className={`relative overflow-hidden w-full flex justify-between items-center bg-white px-3 py-2 ${RADIO_GENERAL} border transition-all group ${yoVoteAca ? 'border-violet-500 ring-1 ring-violet-200' : 'border-slate-200 hover:border-violet-400'}`}
                                      >
                                        <motion.div
                                          className={`absolute left-0 top-0 bottom-0 ${yoVoteAca ? 'bg-violet-100' : 'bg-slate-100'}`}
                                          initial={{ width: 0 }}
                                          animate={{ width: `${porcentaje}%` }}
                                          transition={{ duration: 0.5, ease: "easeOut" }}
                                        />
                                        <div className="relative z-10 flex justify-between items-center w-full">
                                          <span className={`text-[10px] font-bold ${yoVoteAca ? 'text-violet-700' : 'text-slate-700'}`}>{c.nombre}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400">{porcentaje}%</span>
                                            <span className={`text-[10px] font-black ${vCount > 0 ? 'text-violet-600 bg-violet-50' : 'text-slate-400 bg-slate-50'} px-1.5 py-0.5 rounded`}>
                                              {vCount} {vCount === 1 ? 'voto' : 'votos'}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {j.notas && (
                            <div className={`mb-4 p-3 bg-violet-50/50 border border-violet-100 ${RADIO_GENERAL}`}>
                              <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-1">📌 Aclaración:</p>
                              <p className="text-xs text-slate-700 font-medium">{j.notas}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {j.tags.map((t: any) => {
                              const icon = TAGS_DISPONIBLES.find(d => d.label === t)?.emoji;
                              return <span key={t} className={`bg-slate-50 text-slate-600 text-[9px] font-bold px-2 py-1 ${RADIO_GENERAL} border border-slate-200 uppercase tracking-wide`}>{icon} {t}</span>
                            })}
                          </div>

                          <div className={`bg-slate-50 p-3 ${RADIO_GENERAL} border border-slate-100 mb-4`}>
                            <div className="flex justify-between items-end border-b border-slate-200 pb-2 mb-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asistencia:</p>
                              
                              <div className="flex gap-0.5">
                                {Array.from({ length: AMIGOS.length }).map((_, i) => (
                                  <span 
                                    key={i} 
                                    className={`text-sm transition-all ${i < cantConfirmados ? 'text-violet-600 opacity-100' : 'text-slate-400 opacity-30 grayscale'}`}
                                  >
                                    👤
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {(!j.confirmados?.length && !j.dudosos?.length && !j.rechazados?.length) && <p className="text-[10px] text-slate-400 italic">Nadie respondió todavía</p>}
                            {j.confirmados?.length > 0 && <p className="text-[10px] text-slate-700 mb-1">✅ <span className="font-bold">Van:</span> {j.confirmados.join(', ')}</p>}
                            {j.dudosos?.length > 0 && <p className="text-[10px] text-slate-700 mb-1">🤔 <span className="font-bold">No saben:</span> {j.dudosos.join(', ')}</p>}
                            {j.rechazados?.length > 0 && <p className="text-[10px] text-slate-700">❌ <span className="font-bold">No pueden:</span> {j.rechazados.join(', ')}</p>}
                          </div>

                          <div className="mt-auto space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <motion.button 
                                whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                                onClick={() => toggleAsistencia(j.id, 'voy')}
                                className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${RADIO_GENERAL} ${voyYo ? 'bg-green-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >VOY</motion.button>
                              <motion.button 
                                whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                                onClick={() => toggleAsistencia(j.id, 'nose')}
                                className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${RADIO_GENERAL} ${dudaYo ? 'bg-yellow-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >NO SÉ</motion.button>
                              <motion.button 
                                whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                                onClick={() => toggleAsistencia(j.id, 'paso')}
                                className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${RADIO_GENERAL} ${pasoYo ? 'bg-red-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >NO PUEDO</motion.button>
                            </div>
                            
                            <motion.button 
                              whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                              onClick={() => compartirWhatsApp(j)}
                              className={`w-full h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${RADIO_GENERAL} bg-green-500 text-white shadow-md shadow-green-200 hover:bg-green-600`}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              AVISAR POR WHATSAPP
                            </motion.button>
                          </div>

                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </>
  );
}