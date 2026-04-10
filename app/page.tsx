'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase'; 

// ========================================================
// 🎨 ESTÉTICA MODULAR Y JERARQUÍA
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
  botonPrincipal: `bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-12 mt-2 ${RADIO_GENERAL}`,
  btnOpcionInactivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 bg-white text-slate-400 border-slate-100`,
  btnOpcionActivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 bg-violet-600 text-white border-violet-600`,
};

const ESTETICA_TARJETA = {
  contenedor: `bg-white p-6 ${RADIO_GENERAL} shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col`,
};

const AMIGOS_FALLBACK = ['Tomas', 'Koke', 'Tito', 'Uli', 'Pablo', 'Oscarcito'];

// SEPARAMOS LOS TAGS
const TAGS_DISPONIBLES_IRL = [
  { label: 'PS5', emoji: '🎮' }, { label: 'Asado', emoji: '🥩' }, { label: 'Juegos de Mesa', emoji: '🎲' }, 
  { label: 'Novias Invitadas', emoji: '👩‍❤️‍👨' }, { label: 'Chupi', emoji: '🥃' }, { label: 'Minubis', emoji: '👩🏻‍🦰' },
  { label: 'Lowcost', emoji: '💸' }, { label: 'María', emoji: '🍁' }, { label: 'Fiesta', emoji: '🎉' }
];

const TAGS_DISPONIBLES_DISCORD = [
  { label: 'Rocket League', emoji: '🚗' }, { label: 'Lol', emoji: '🧙‍♂️' }, { label: 'Impostor', emoji: '🔪' },
  { label: 'Make it Meme', emoji: '😂' }, { label: 'Pinturillo', emoji: '🎨' }
];

const TODOS_LOS_TAGS = [...TAGS_DISPONIBLES_IRL, ...TAGS_DISPONIBLES_DISCORD];

const varFadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

const varStaggerContainer = {
  visible: { transition: { staggerChildren: 0.05 } }
};

export default function Home() {
  const [usuarioLogueado, setUsuarioLogueado] = useState<string | null>(null);
  const [nombreSeleccionado, setNombreSeleccionado] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  
  const [juntadas, setJuntadas] = useState<any[]>([]);
  const [usuariosDB, setUsuariosDB] = useState<any[]>([]);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [juntadaEnEdicion, setJuntadaEnEdicion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Perfil de Usuario
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [passwordVieja, setPasswordVieja] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Estados de Comentarios
  const [comentariosInputs, setComentariosInputs] = useState<Record<number, string>>({});

  // Estados Formulario
  const [tipoJuntada, setTipoJuntada] = useState<'IRL' | 'DISCORD'>('IRL');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [fechaSel, setFechaSel] = useState(''); 
  const [horaSel, setHoraSel] = useState(''); 
  const [esSedeFija, setEsSedeFija] = useState(true);
  const [sedeFija, setSedeFija] = useState('Casa de Tomas');
  const [candidatosSede, setCandidatosSede] = useState<string[]>([]);
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  
  const [imagenJuntada, setImagenJuntada] = useState<File | null>(null);
  const [imagenJuntadaPreview, setImagenJuntadaPreview] = useState<string | null>(null); // ESTADO PARA LA MINIATURA

  useEffect(() => {
    const userGuardado = localStorage.getItem('juntadas_user');
    if (userGuardado) setUsuarioLogueado(userGuardado);
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      const [resJuntadas, resUsuarios] = await Promise.all([
        supabase.from('juntadas').select('*').order('id', { ascending: false }),
        supabase.from('usuarios').select('*')
      ]);
      
      if (resJuntadas.data) setJuntadas(resJuntadas.data);
      if (resUsuarios.data) setUsuariosDB(resUsuarios.data);
      setLoading(false);
    }
    cargarDatos();

    const subJuntadas = supabase.channel('juntadas_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'juntadas' }, () => cargarDatos()).subscribe();
    const subUsuarios = supabase.channel('usuarios_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => cargarDatos()).subscribe();

    return () => {
      supabase.removeChannel(subJuntadas);
      supabase.removeChannel(subUsuarios);
    };
  }, []);

  const getFotoUsuario = (nombre: string) => {
    const user = usuariosDB.find(u => u.nombre === nombre);
    return user?.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nombre}`;
  };

  const intentarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreSeleccionado) return setErrorLogin('Falta elegir quién sos.');
    
    let user = usuariosDB.find(u => u.nombre === nombreSeleccionado);
    if (!user) {
        const { data } = await supabase.from('usuarios').select('*').eq('nombre', nombreSeleccionado).single();
        user = data;
    }
    
    if (user && user.password === passwordInput) {
      setUsuarioLogueado(nombreSeleccionado);
      localStorage.setItem('juntadas_user', nombreSeleccionado);
      setErrorLogin('');
    } else { 
      setErrorLogin('Contraseña incorrecta'); 
    }
  };

  const comprimirImagen = (file: File, maxWidth: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const subirImagenAlStorage = async (file: File, folder: string) => {
    try {
      const maximoAncho = folder === 'perfiles' ? 400 : 800;
      const archivoComprimido = await comprimirImagen(file, maximoAncho);

      const fileExt = 'jpg'; 
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2,9)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('fotos').upload(filePath, archivoComprimido);
      
      if (uploadError) {
        console.error("Error subiendo:", uploadError);
        return null;
      }

      const { data } = supabase.storage.from('fotos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Error en el proceso de compresión/subida:", err);
      return null;
    }
  };

  const guardarPerfil = async () => {
    const userActual = usuariosDB.find(u => u.nombre === usuarioLogueado);
    if (!userActual) return;

    if (nuevaPassword.trim() !== '') {
        if (passwordVieja !== userActual.password) {
            alert("❌ La contraseña actual es incorrecta. No se puede cambiar la contraseña.");
            return;
        }
    }

    setIsUploading(true);
    let finalFotoUrl = userActual.foto_perfil;

    if (fotoFile) {
        const urlSubida = await subirImagenAlStorage(fotoFile, 'perfiles');
        if (urlSubida) finalFotoUrl = urlSubida;
        else alert("No se pudo subir la foto. Fijate que hayas creado el bucket 'fotos' y sus permisos.");
    } else if (nuevaFotoUrl.trim()) {
        finalFotoUrl = nuevaFotoUrl.trim();
    }

    const datos = {
        password: nuevaPassword.trim() !== '' ? nuevaPassword.trim() : userActual.password,
        foto_perfil: finalFotoUrl
    };

    const { error } = await supabase.from('usuarios').update(datos).eq('nombre', usuarioLogueado);
    if (error) alert("❌ Error al guardar: " + error.message);
    else {
        setMenuPerfilAbierto(false);
        setPasswordVieja('');
        setNuevaPassword('');
        setNuevaFotoUrl('');
        setFotoFile(null);
        setFotoPreview(null);
    }
    setIsUploading(false);
  };

  const abrirEdicion = (j: any) => {
    setJuntadaEnEdicion(j.id);
    setTipoJuntada(j.tipo || 'IRL');
    setNuevoTitulo(j.titulo);
    
    const date = new Date(j.timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setFechaSel(`${yyyy}-${mm}-${dd}`);
    
    const hh = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    setHoraSel(`${hh}:${mins}`);
    
    setEsSedeFija(j.esSedeFija);
    if (j.esSedeFija) {
        setSedeFija(j.sedeFinal || 'Casa de Tomas');
    } else {
        setCandidatosSede(j.candidatos ? j.candidatos.map((c: any) => c.nombre) : []);
    }
    
    setTagsSel(j.tags || []);
    setNotas(j.notas || '');
    setImagenJuntada(null); 
    setImagenJuntadaPreview(j.imagenUrl || null); // CARGAMOS LA PREVIA SI YA TENÍA FOTO
    setMostrandoFormulario(true);
  };

  const publicar = async () => {
    if (!nuevoTitulo.trim() || !fechaSel || !horaSel.trim()) return alert("Completá título, fecha y hora.");
    
    setIsUploading(true);

    let finalImageUrl = null;
    if (imagenJuntada) {
        finalImageUrl = await subirImagenAlStorage(imagenJuntada, 'juntadas');
        if (!finalImageUrl) alert("Hubo un error subiendo la foto de la juntada, se guardará sin la foto nueva.");
    } else if (juntadaEnEdicion) {
        const jActual = juntadas.find(x => x.id === juntadaEnEdicion);
        finalImageUrl = jActual?.imagenUrl || null;
    }

    const [y, m, d] = fechaSel.split('-');
    const [h, min] = horaSel.includes(':') ? horaSel.split(':') : [horaSel, '00'];
    const targetDate = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));

    if (juntadaEnEdicion) {
        const jActual = juntadas.find(x => x.id === juntadaEnEdicion);
        
        let nuevosCandidatos = [];
        if (tipoJuntada === 'IRL' && !esSedeFija) {
            const oldCandidatos = jActual?.candidatos || [];
            nuevosCandidatos = candidatosSede.map(c => {
                const existing = oldCandidatos.find((old: any) => old.nombre === c);
                return existing ? existing : { nombre: c, votantes: [] };
            });
        }

        const updateData = {
            tipo: tipoJuntada,
            titulo: nuevoTitulo,
            fechaDisplay: formatearFechaDisplay(fechaSel),
            horaDisplay: `${horaSel} PM`,
            timestamp: targetDate.getTime(),
            esSedeFija: tipoJuntada === 'DISCORD' ? true : esSedeFija,
            sedeFinal: tipoJuntada === 'DISCORD' ? 'Discord' : (esSedeFija ? sedeFija : null),
            candidatos: nuevosCandidatos,
            tags: tagsSel,
            notas: notas.trim(),
            imagenUrl: finalImageUrl
        };

        const { error } = await supabase.from('juntadas').update(updateData).eq('id', juntadaEnEdicion);
        if (error) alert("❌ ERROR AL ACTUALIZAR: " + error.message);
        else {
            setMostrandoFormulario(false);
            resetForm();
        }
    } else {
        const nueva = {
            creador: usuarioLogueado,
            tipo: tipoJuntada,
            titulo: nuevoTitulo,
            fechaDisplay: formatearFechaDisplay(fechaSel),
            horaDisplay: `${horaSel} PM`,
            timestamp: targetDate.getTime(),
            esSedeFija: tipoJuntada === 'DISCORD' ? true : esSedeFija,
            sedeFinal: tipoJuntada === 'DISCORD' ? 'Discord' : (esSedeFija ? sedeFija : null),
            candidatos: (tipoJuntada === 'DISCORD' || esSedeFija) ? [] : candidatosSede.map(c => ({ nombre: c, votantes: [] })),
            tags: tagsSel,
            notas: notas.trim(),
            confirmados: [usuarioLogueado],
            dudosos: [],
            rechazados: [],
            excusas: [], 
            imagenUrl: finalImageUrl
        };

        const { data, error } = await supabase.from('juntadas').insert([nueva]).select();
        if (error) alert("❌ ERROR AL PUBLICAR: " + error.message);
        else if (data) {
            setMostrandoFormulario(false);
            resetForm();
        }
    }
    setIsUploading(false);
  };

  const votarSede = async (juntadaId: number, casaNombre: string) => {
    const j = juntadas.find(item => item.id === juntadaId);
    if (!j || j.esSedeFija || j.tipo === 'DISCORD') return;

    const nuevosCandidatos = j.candidatos.map((c: any) => {
      const votantesFiltrados = (c.votantes || []).filter((v: string) => v !== usuarioLogueado);
      if (c.nombre === casaNombre) votantesFiltrados.push(usuarioLogueado);
      return { ...c, votantes: votantesFiltrados };
    });

    setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, candidatos: nuevosCandidatos } : item));
    supabase.from('juntadas').update({ candidatos: nuevosCandidatos }).eq('id', juntadaId).then();
  };

  const toggleAsistencia = (juntadaId: number, estado: 'voy' | 'nose' | 'paso') => {
    const jIndex = juntadas.findIndex(item => item.id === juntadaId);
    if (jIndex === -1) return;
    const j = juntadas[jIndex];

    const yaEsVoy = estado === 'voy' && (j.confirmados || []).includes(usuarioLogueado);
    const yaEsNose = estado === 'nose' && (j.dudosos || []).includes(usuarioLogueado);
    const yaEsPaso = estado === 'paso' && (j.rechazados || []).includes(usuarioLogueado);

    let confirmados = (j.confirmados || []).filter((u: string) => u !== usuarioLogueado);
    let dudosos = (j.dudosos || []).filter((u: string) => u !== usuarioLogueado);
    let rechazados = (j.rechazados || []).filter((u: string) => u !== usuarioLogueado);
    let nuevosCandidatos = j.candidatos;

    if (!(yaEsVoy || yaEsNose || yaEsPaso)) {
        if (estado === 'voy') confirmados.push(usuarioLogueado);
        if (estado === 'nose') dudosos.push(usuarioLogueado);
        if (estado === 'paso') {
          rechazados.push(usuarioLogueado);
          if (!j.esSedeFija && j.tipo !== 'DISCORD' && j.candidatos) {
            nuevosCandidatos = j.candidatos.map((c: any) => ({
              ...c, votantes: (c.votantes || []).filter((v: string) => v !== usuarioLogueado)
            }));
          }
        }
    }

    setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, confirmados, dudosos, rechazados, candidatos: nuevosCandidatos } : item));
    supabase.from('juntadas').update({ confirmados, dudosos, rechazados, candidatos: nuevosCandidatos }).eq('id', juntadaId).then();
  };

  const agregarComentario = (juntadaId: number) => {
    const texto = comentariosInputs[juntadaId]?.trim();
    if (!texto) return;

    const j = juntadas.find(item => item.id === juntadaId);
    if (!j) return;

    const comentariosActuales = j.excusas || [];
    const misComentarios = comentariosActuales.filter((c: any) => c.usuario === usuarioLogueado);

    if (misComentarios.length >= 3) {
      alert("Límite alcanzado: podés dejar un máximo de 3 comentarios por juntada.");
      return;
    }

    const nuevoComentario = { usuario: usuarioLogueado, texto, tipo: 'comentario' };
    const nuevosComentariosArray = [...comentariosActuales, nuevoComentario];

    setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, excusas: nuevosComentariosArray } : item));
    setComentariosInputs(prev => ({ ...prev, [juntadaId]: '' }));

    supabase.from('juntadas').update({ excusas: nuevosComentariosArray }).eq('id', juntadaId).then();
  };

  const borrarComentario = (juntadaId: number, textoComentario: string) => {
    const j = juntadas.find(item => item.id === juntadaId);
    if (!j) return;
    
    const comentariosRestantes = (j.excusas || []).filter((e: any) => !(e.usuario === usuarioLogueado && e.texto === textoComentario));
    
    setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, excusas: comentariosRestantes } : item));
    supabase.from('juntadas').update({ excusas: comentariosRestantes }).eq('id', juntadaId).then();
  };

  const eliminarJuntada = async (juntadaId: number) => {
    if (!window.confirm("¿Seguro que querés eliminar esta juntada?")) return;
    await supabase.from('juntadas').delete().eq('id', juntadaId);
  };

  const compartirWhatsApp = (j: any) => {
    const url = window.location.origin; 
    if (j.tipo === 'DISCORD') {
      const msg = `🎧 *PROPUESTA DISCORD:* ${j.titulo} 👾\n📆 *DÍA:* ${j.fechaDisplay}\n⏰ *HORA:* ${j.horaDisplay}\n\n👉 *Confirmá tu asistencia:* ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      const sedeTexto = `\n🏠 *SEDE:* ${j.esSedeFija ? j.sedeFinal : 'A votar en la app'}`;
      const msg = `🍾 *PROPUESTA IRL:* ${j.titulo} 🍾\n📆 *DÍA:* ${j.fechaDisplay}\n⏰ *HORA:* ${j.horaDisplay}${sedeTexto}\n\n👉 *Confirmá tu asistencia:* ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const resetForm = () => {
    setJuntadaEnEdicion(null);
    setTipoJuntada('IRL'); setNuevoTitulo(''); setFechaSel(''); setHoraSel(''); setTagsSel([]); setCandidatosSede([]); setEsSedeFija(true); setNotas(''); 
    setImagenJuntada(null);
    setImagenJuntadaPreview(null);
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

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
      <div className="animate-spin text-violet-600 text-2xl">⏳</div>
    </div>
  );

  const tagsAMostrarFormulario = tipoJuntada === 'IRL' ? TAGS_DISPONIBLES_IRL : TAGS_DISPONIBLES_DISCORD;

  return (
    <>
      {/* --- VISTA LOGIN --- */}
      {!usuarioLogueado && (
        <main className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4">
          <motion.div variants={varFadeInUp} initial="hidden" animate="visible" className={ESTETICA_LOGIN.contenedor}>
            <div className="flex justify-center mb-6">
              <img src="https://i.imgur.com/5hJH1kn.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>
            <form onSubmit={intentarLogin} className="space-y-3">
              <select className={`${ESTETICA_LOGIN.input} ${RADIO_GENERAL} appearance-none cursor-pointer`} value={nombreSeleccionado} onChange={e => setNombreSeleccionado(e.target.value)}>
                <option value="">¿Quién sos?</option>
                {(usuariosDB.length > 0 ? usuariosDB.map(u => u.nombre) : AMIGOS_FALLBACK).map(a => <option key={a} value={a}>{a}</option>)}
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
            <button onClick={() => { setMostrandoFormulario(false); resetForm(); }} className="text-slate-400 font-bold text-[10px] mb-4 uppercase tracking-widest hover:text-violet-600 transition-colors">← Cancelar</button>
            <h2 className="text-xl font-black text-slate-900 mb-5 tracking-tighter uppercase">{juntadaEnEdicion ? 'EDITAR PROPUESTA' : 'NUEVA PROPUESTA'}</h2>
            
            {/* SELECTOR TIPO JUNTADA */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
              <button
                onClick={() => { setTipoJuntada('IRL'); setTagsSel([]); }}
                className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${tipoJuntada === 'IRL' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                📍 IRL
              </button>
              <button
                onClick={() => { setTipoJuntada('DISCORD'); setTagsSel([]); }}
                className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${tipoJuntada === 'DISCORD' ? 'bg-[#5865F2] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                🎧 DISCORD
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">¿Qué se hace?</label>
                <input type="text" placeholder={tipoJuntada === 'IRL' ? "EJ: Asadito en lo de Uli" : "EJ: Torneo de Rocket League"} className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL}`} value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} />
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

              {/* SEDE (SOLO PARA IRL) */}
              {tipoJuntada === 'IRL' && (
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
                            {AMIGOS_FALLBACK.map(a => <option key={a} value={`Casa de ${a}`}>Casa de {a}</option>)}
                          </select>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-[10px]">▼</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 pb-3 bg-slate-50 px-3 border border-slate-100 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 mb-3 text-center uppercase tracking-widest">Seleccionar casas candidatas:</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {AMIGOS_FALLBACK.map(a => (
                              <motion.button 
                                key={a}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCandidatosSede(prev => prev.includes(a) ? prev.filter(c => c !== a) : [...prev, a])}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-black transition-all border-2 ${candidatosSede.includes(a) ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                                {a.toUpperCase()}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Notas (Opcional)</label>
                <input 
                  type="text" 
                  placeholder={tipoJuntada === 'IRL' ? "EJ: Traigan hielo, falta coca..." : "EJ: Superclásico de Rocket League..."} 
                  className={`${ESTETICA_FORMULARIO.input} ${RADIO_GENERAL}`} 
                  value={notas} 
                  onChange={e => setNotas(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">¿Qué onda?</label>
                <div className="flex flex-wrap gap-1.5">
                  {tagsAMostrarFormulario.map(t => (
                    <button key={t.label} onClick={() => setTagsSel(prev => prev.includes(t.label) ? prev.filter(x => x !== t.label) : [...prev, t.label])}
                      className={`px-3 py-2 ${RADIO_GENERAL} text-[10px] font-bold transition-all border-2 ${tagsSel.includes(t.label) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-100'}`}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPLOAD FOTO CON VISTA PREVIA ESTÉTICA */}
              <div className="pt-2">
                  <div className={`relative w-full rounded-xl h-24 flex items-center justify-center transition-colors cursor-pointer overflow-hidden border-2 ${imagenJuntadaPreview ? 'border-transparent shadow-sm' : 'border-dashed border-violet-200 bg-violet-50 hover:bg-violet-100'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImagenJuntada(file);
                          setImagenJuntadaPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {imagenJuntadaPreview ? (
                      <>
                        <img src={imagenJuntadaPreview} className="w-full h-full object-cover" alt="Preview Juntada" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            🔄 CAMBIAR FOTO
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-violet-600">
                        📸 AGREGAR FOTO (OPCIONAL)
                      </span>
                    )}
                  </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={publicar} 
                disabled={isUploading}
                className={`${ESTETICA_FORMULARIO.botonPrincipal} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? '⏳ GUARDANDO...' : (juntadaEnEdicion ? '💾 GUARDAR CAMBIOS' : '🚀 PROPONER')}
              </motion.button>
            </div>
          </motion.div>
        </main>
      )}

      {/* --- DASHBOARD --- */}
      {usuarioLogueado && !mostrandoFormulario && (
        <main className="min-h-screen bg-[#FDFDFF] font-sans pb-16">
          <nav className="p-5 flex justify-between items-center max-w-4xl mx-auto relative z-50">
            <img src="https://i.imgur.com/5hJH1kn.png" alt="Logo" className="h-8 w-auto object-contain" />
            
            {/* BOTÓN PERFIL ARRIBA A LA DERECHA */}
            <div className="relative">
                <button 
                    onClick={() => { setMenuPerfilAbierto(!menuPerfilAbierto); setPasswordVieja(''); setNuevaPassword(''); setFotoPreview(null); setFotoFile(null); }} 
                    className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-full shadow-sm border border-slate-200 hover:border-violet-300 transition-colors"
                >
                    <img src={getFotoUsuario(usuarioLogueado)} className="w-6 h-6 rounded-full object-cover border border-slate-100 bg-slate-50" alt="Avatar" />
                    <span className="text-[10px] font-black text-slate-800 pr-1">{usuarioLogueado} ▼</span>
                </button>

                {/* MODAL PERFIL DESPLEGABLE MEJORADO */}
                <AnimatePresence>
                    {menuPerfilAbierto && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-12 w-[260px] bg-white border border-slate-200 shadow-xl rounded-2xl p-5 flex flex-col gap-4"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 pb-3">Tu Perfil</p>
                            
                            {/* CÍRCULO UPLOAD FOTO */}
                            <div className="flex flex-col items-center justify-center">
                              <label htmlFor="perfil-upload" className="relative cursor-pointer group">
                                <img src={fotoPreview || getFotoUsuario(usuarioLogueado)} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 group-hover:border-violet-400 transition-colors shadow-sm" alt="Tu perfil" />
                                <div className="absolute inset-0 bg-slate-900/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <span className="text-white text-xl">📷</span>
                                </div>
                              </label>
                              <input 
                                id="perfil-upload"
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if(file) {
                                    setFotoFile(file);
                                    setFotoPreview(URL.createObjectURL(file));
                                  }
                                }}
                              />
                              <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest text-center">Tocar para subir</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-bold text-slate-500 ml-1">O Usar Link (Ej: Imgur)</label>
                                <input type="text" placeholder="https://..." value={nuevaFotoUrl} onChange={e => setNuevaFotoUrl(e.target.value)} className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-violet-300" />
                            </div>

                            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                                <label className="text-[9px] font-bold text-slate-500 ml-1">Cambiar Contraseña (Opcional)</label>
                                <input type="password" placeholder="Nueva contraseña..." value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-violet-300" />
                            </div>

                            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                                <label className="text-[9px] font-black text-slate-800 ml-1">🔒 Contraseña Actual (Opcional)</label>
                                <input type="password" placeholder="Solo requerida si cambiás tu clave" value={passwordVieja} onChange={e => setPasswordVieja(e.target.value)} className="w-full h-8 px-3 bg-violet-50 border border-violet-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-violet-400" />
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                              <button 
                                  onClick={guardarPerfil} 
                                  disabled={isUploading}
                                  className={`w-full h-9 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-violet-700 active:scale-95 transition-all'}`}
                              >
                                  {isUploading ? '⏳ GUARDANDO...' : 'GUARDAR CAMBIOS'}
                              </button>
                              
                              <button onClick={() => {
                                  setUsuarioLogueado(null);
                                  localStorage.removeItem('juntadas_user');
                              }} className="w-full h-8 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-100 transition-colors">Cerrar Sesión</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto p-4">
            <AnimatePresence mode="popLayout">
              {juntadas.length === 0 ? (
                <motion.div variants={varFadeInUp} initial="hidden" animate="visible" exit={{ opacity: 0 }} className={`bg-white border-2 border-dashed border-slate-200 ${RADIO_GENERAL} py-12 flex flex-col items-center justify-center text-center mt-2`}>
                  <div className="text-3xl mb-3 opacity-30">🗓️</div>
                  <p className="text-[10px] font-bold text-slate-500 mb-5 uppercase tracking-widest">Nada por acá...</p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setMostrandoFormulario(true); }} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-xs px-6 h-10 ${RADIO_GENERAL}`}>+ PROPONER</motion.button>
                </motion.div>
              ) : (
                <motion.div variants={varStaggerContainer} initial="hidden" animate="visible" className="space-y-6">
                  <div className="flex justify-between items-end mb-2 px-1">
                    <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">PROPUESTAS</h2>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setMostrandoFormulario(true); }} className={`bg-violet-600 text-white font-black hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-[10px] px-4 h-8 ${RADIO_GENERAL}`}>+ NUEVA</motion.button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {juntadas.map((j, index) => {
                      
                      const voyYo = (j.confirmados || []).includes(usuarioLogueado);
                      const dudaYo = (j.dudosos || []).includes(usuarioLogueado);
                      const pasoYo = (j.rechazados || []).includes(usuarioLogueado);
                      
                      const cantConfirmados = j.confirmados?.length || 0;

                      const esCreador = usuarioLogueado === j.creador;
                      const esAdminTomas = usuarioLogueado === 'Tomas';
                      const puedeEliminarOEditar = esCreador || esAdminTomas;

                      const esDiscord = j.tipo === 'DISCORD';
                      const esIRL = j.tipo === 'IRL' || !j.tipo;

                      const totalVotosSede = j.candidatos ? j.candidatos.reduce((acc: number, c: any) => acc + (c.votantes?.length || 0), 0) : 0;
                      const totalPosiblesVotantes = AMIGOS_FALLBACK.length - (j.rechazados?.length || 0);
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

                      const misComentarios = (j.excusas || []).filter((c: any) => c.usuario === usuarioLogueado);
                      const puedeComentar = misComentarios.length < 3;

                      return (
                        <motion.div 
                          layout
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          key={j.id || index}
                          variants={varFadeInUp}
                          className={`relative ${ESTETICA_TARJETA.contenedor}`}
                        >
                          {/* BOTONES DE CONTROL (ELIMINAR Y EDITAR) ARRIBA A LA DERECHA (APILADOS VERTICALMENTE) */}
                          {puedeEliminarOEditar && (
                            <div className="absolute top-6 right-6 z-30 flex flex-col gap-1.5 items-center justify-center">
                              <motion.button
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={() => eliminarJuntada(j.id)}
                                className={`flex items-center justify-center w-6 h-6 hover:text-red-500 rounded-full transition-colors font-bold cursor-pointer text-xs ${j.imagenUrl ? 'text-white/70 hover:bg-white/20 bg-black/20' : 'text-slate-400 hover:bg-red-50 bg-slate-100'}`}
                                title="Eliminar juntada"
                              >
                                ✕
                              </motion.button>
                              <motion.button
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={() => abrirEdicion(j)}
                                className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors cursor-pointer ${j.imagenUrl ? 'text-white/70 hover:text-white hover:bg-white/20 bg-black/20' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50 bg-slate-100'}`}
                                title="Editar juntada"
                              >
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                              </motion.button>
                            </div>
                          )}

                          {/* IDENTIDAD ARRIBA A LA IZQUIERDA (ALINEADOS HORIZONTALMENTE) */}
                          <div className="absolute top-6 left-6 z-20 flex flex-row gap-1.5 items-center">
                            <span className={`${j.imagenUrl ? 'bg-black/40 backdrop-blur-md text-white border-white/10' : (esDiscord ? 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100')} text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border shadow-sm flex items-center gap-1.5`}>
                                {esDiscord ? '🎧 DISCORD' : '📍 IRL'}
                            </span>
                            <span className={`${j.imagenUrl ? 'bg-black/40 backdrop-blur-md text-white border-white/10' : 'bg-violet-50 text-violet-600 border-violet-100'} text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border shadow-sm flex items-center gap-1.5`}>
                                <img src={getFotoUsuario(j.creador)} className="w-3.5 h-3.5 rounded-full object-cover" alt="creador" />
                                {j.creador}
                            </span>
                          </div>

                          {/* --- HEADER CON IMAGEN (EFECTO GRADIENTE Y COMPRIMIDO) --- */}
                          {j.imagenUrl ? (
                            <div className="relative -mx-6 -mt-6 mb-4 p-6 rounded-t-2xl overflow-hidden min-h-[180px] flex flex-col justify-end">
                              <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${j.imagenUrl})` }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-slate-900/10 z-10" />
                              
                              <div className="relative z-20 flex flex-col gap-1.5 pt-16">
                                <h3 className="text-2xl font-black text-white leading-none tracking-tight drop-shadow-md pr-12">{j.titulo}</h3>
                                
                                <div className="flex items-center flex-wrap gap-2 text-slate-200 drop-shadow-md">
                                  <span className="text-sm">📅</span>
                                  <p className="text-xs font-bold">{j.fechaDisplay} — <span className="text-white">{j.horaDisplay}</span></p>
                                  
                                  {/* TIEMPO RESTANTE DENTRO DE LA IMAGEN */}
                                  <span className="bg-violet-600/90 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                    {calcularTiempoRestante(j.timestamp)}
                                  </span>
                                </div>

                                {/* --- SEDE DENTRO DE LA IMAGEN (SOLO IRL) --- */}
                                {esIRL && (
                                  (j.esSedeFija || esIrremontable) ? (
                                     <div className="flex items-center gap-1.5 drop-shadow-md">
                                        <span className="text-sm">🏠</span>
                                        <span className="bg-green-500 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                            {j.esSedeFija ? j.sedeFinal : `${sedeConfirmada} VOTADA COMO SEDE`}
                                        </span>
                                    </div>
                                  ) : (
                                     <div className="flex items-center gap-1.5 drop-shadow-md">
                                        <span className="text-sm">🏠</span>
                                        <span className="bg-yellow-400 text-yellow-950 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                            SEDE EN VOTACIÓN
                                        </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                                {/* --- HEADER SIN IMAGEN --- */}
                                <div className="mb-2.5 mt-12 pr-12 relative">
                                  <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">{j.titulo}</h3>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 mb-4">
                                  <div className="flex items-center flex-wrap gap-2 text-slate-700">
                                    <span className="text-sm">📅</span>
                                    <p className="text-xs font-bold">{j.fechaDisplay} — <span className="text-slate-950">{j.horaDisplay}</span></p>

                                    {/* BURBUJA PROLIJA VIOLETA */}
                                    <span className="bg-violet-600 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                      {calcularTiempoRestante(j.timestamp)}
                                    </span>
                                  </div>

                                  {/* --- SEDE FUERA DE LA IMAGEN (SOLO IRL) --- */}
                                  {esIRL && (
                                    (j.esSedeFija || esIrremontable) ? (
                                       <div className="flex items-center gap-1.5 text-slate-950">
                                          <span className="text-sm">🏠</span>
                                          {/* BURBUJA PROLIJA VERDE */}
                                          <span className="bg-green-500 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                              {j.esSedeFija ? j.sedeFinal : `${sedeConfirmada} VOTADA COMO SEDE`}
                                          </span>
                                      </div>
                                    ) : (
                                       <div className="flex items-center gap-1.5 text-slate-950">
                                          <span className="text-sm">🏠</span>
                                          {/* BURBUJA PROLIJA AMARILLA */}
                                          <span className="bg-yellow-400 text-yellow-950 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                              SEDE EN VOTACIÓN
                                          </span>
                                      </div>
                                    )
                                  )}
                                </div>
                            </>
                          )}
                          
                          {/* --- SECCIÓN DE VOTACIÓN DE SEDE (SOLO IRL Y SI NO ESTÁ CONFIRMADA) --- */}
                          {esIRL && (!j.esSedeFija && !esIrremontable) && (
                            <div className="space-y-3 mb-4 mt-1">
                              <div className={`p-3 bg-slate-50 border border-slate-100 ${RADIO_GENERAL}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                  <span>🗳️ Votación de sede</span>
                                  <span className="text-slate-400 normal-case tracking-normal">Quedan {votosRestantes} votos</span>
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
                                          transition={{ duration: 0.3, ease: "easeOut" }}
                                        />
                                        <div className="relative z-10 flex justify-between items-center w-full">
                                          <span className={`text-[10px] font-bold ${yoVoteAca ? 'text-violet-700' : 'text-slate-700'}`}>{c.nombre}</span>
                                          <div className="flex items-center gap-2">
                                            <div className="flex -space-x-1.5 mr-1">
                                                {c.votantes?.slice(0,3).map((v: string) => (
                                                    <img key={v} src={getFotoUsuario(v)} className="w-4 h-4 rounded-full border border-white object-cover" alt="votante" />
                                                ))}
                                            </div>
                                            <span className={`text-[10px] font-black ${vCount > 0 ? 'text-violet-600 bg-violet-50' : 'text-slate-400 bg-slate-50'} px-1.5 py-0.5 rounded`}>
                                              {vCount}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {j.notas && (
                            <div className={`mb-4 p-3 bg-violet-50/50 border border-violet-100 ${RADIO_GENERAL}`}>
                              <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-1">📌 Aclaración:</p>
                              <p className="text-[10px] text-slate-700 font-medium">{j.notas}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-5 mt-1">
                            {j.tags.map((t: any) => {
                              const icon = TODOS_LOS_TAGS.find(d => d.label === t)?.emoji;
                              return <span key={t} className={`bg-slate-50 text-slate-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest`}>{icon} {t}</span>
                            })}
                          </div>

                          {/* SECCIÓN ASISTENCIA */}
                          <div className={`bg-slate-50 p-3 ${RADIO_GENERAL} border border-slate-100 mb-4`}>
                            <div className="flex justify-between items-end border-b border-slate-200 pb-2 mb-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asistencia:</p>
                              
                              <div className="flex gap-0.5">
                                {Array.from({ length: AMIGOS_FALLBACK.length }).map((_, i) => (
                                  <span 
                                    key={i} 
                                    className={`text-sm transition-all duration-300 ${i < cantConfirmados ? 'text-violet-600 opacity-100' : 'text-slate-400 opacity-30 grayscale'}`}
                                  >
                                    👤
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {(!j.confirmados?.length && !j.dudosos?.length && !j.rechazados?.length) && <p className="text-[10px] text-slate-400 italic">Nadie respondió todavía</p>}
                            {j.confirmados?.length > 0 && <p className="text-[10px] font-medium text-slate-700 mb-1">✅ <span className="font-bold text-green-600">VAN:</span> {j.confirmados.join(', ')}</p>}
                            {j.dudosos?.length > 0 && <p className="text-[10px] font-medium text-slate-700 mb-1">🤔 <span className="font-bold text-yellow-600">DUDAN:</span> {j.dudosos.join(', ')}</p>}
                            {j.rechazados?.length > 0 && <p className="text-[10px] font-medium text-slate-700">❌ <span className="font-bold text-red-500">PASAN:</span> {j.rechazados.join(', ')}</p>}
                          </div>

                          {/* --- BOTONES VOY / NO SÉ / NO PUEDO --- */}
                          <div className="grid grid-cols-3 gap-2 mb-3 relative">
                            <button 
                              onClick={() => toggleAsistencia(j.id, 'voy')}
                              className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors duration-200 ${RADIO_GENERAL} ${voyYo ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >VOY</button>
                            <button 
                              onClick={() => toggleAsistencia(j.id, 'nose')}
                              className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors duration-200 ${RADIO_GENERAL} ${dudaYo ? 'bg-yellow-500 text-white shadow-md shadow-yellow-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >NO SÉ</button>
                            <button 
                              onClick={() => toggleAsistencia(j.id, 'paso')}
                              className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors duration-200 ${RADIO_GENERAL} ${pasoYo ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >PASO</button>
                          </div>

                          {/* --- BOTÓN WHATSAPP --- */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                              <button 
                                onClick={() => compartirWhatsApp(j)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black text-green-600 uppercase tracking-widest hover:text-green-700 transition-colors"
                              >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                AVISAR POR WHATSAPP
                              </button>
                          </div>

                          {/* --- ZONA DE COMENTARIOS INLINE (AL FINAL) --- */}
                          <div className="mt-auto pt-3 border-t border-slate-100 flex-1">
                            {/* Lista de Comentarios */}
                            <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                              {(j.excusas || []).map((c: any, idx: number) => {
                                let ringColor = 'border-transparent';
                                if ((j.confirmados || []).includes(c.usuario)) ringColor = 'ring-2 ring-green-500 ring-offset-1';
                                else if ((j.dudosos || []).includes(c.usuario)) ringColor = 'ring-2 ring-yellow-400 ring-offset-1';
                                else if ((j.rechazados || []).includes(c.usuario)) ringColor = 'ring-2 ring-red-500 ring-offset-1';

                                return (
                                  <div key={idx} className="flex items-center gap-2 group relative py-1 hover:bg-slate-50 rounded-lg px-1 transition-colors">
                                    <img src={getFotoUsuario(c.usuario)} className={`w-5 h-5 rounded-full object-cover shadow-sm ${ringColor}`} alt="avatar" />
                                    <div className="flex-1 text-[10px] font-medium leading-tight truncate text-slate-600">
                                      <span className="font-black uppercase text-slate-800 mr-1">{c.usuario}:</span>
                                      {c.texto}
                                    </div>
                                    {c.usuario === usuarioLogueado && (
                                      <button onClick={() => borrarComentario(j.id, c.texto)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 font-bold text-[10px] transition-opacity ml-2 px-1" title="Borrar comentario">✕</button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Input para Nuevo Comentario */}
                            {puedeComentar ? (
                                <div className="relative w-full mt-2">
                                  <input 
                                    type="text" 
                                    placeholder="Escribí un comentario..." 
                                    value={comentariosInputs[j.id] || ''}
                                    onChange={(e) => setComentariosInputs(prev => ({ ...prev, [j.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') agregarComentario(j.id); }}
                                    className="w-full h-8 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-violet-300 transition-all"
                                  />
                                  <button 
                                    onClick={() => agregarComentario(j.id)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded-md flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                  >
                                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                                  </button>
                                </div>
                            ) : (
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center mt-3 bg-slate-50 py-1 rounded-md border border-slate-100">Límite de comentarios alcanzado</p>
                            )}
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