'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase'; 

// ========================================================
// 🎨 ESTÉTICA MODULAR Y JERARQUÍA (CON MODO OSCURO)
// ========================================================
const RADIO_GENERAL = "rounded-2xl"; 

const ESTETICA_LOGIN = (isDark: boolean) => ({
  contenedor: `w-full max-w-[300px] p-6 ${RADIO_GENERAL} transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white shadow-lg shadow-slate-200/40 border-slate-100'} border`,
  input: `w-full h-10 px-4 transition-all text-xs font-bold outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 focus:ring-violet-500 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-violet-200 text-slate-800 placeholder:text-slate-400'} border`,
  boton: `font-black active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-10 mt-1 ${RADIO_GENERAL} ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'}`
});

const ESTETICA_FORMULARIO = (isDark: boolean) => ({
  contenedor: `max-w-[360px] mx-auto p-6 ${RADIO_GENERAL} transition-colors duration-300 border ${isDark ? 'bg-slate-900 shadow-none border-slate-800' : 'bg-white shadow-lg shadow-slate-200/40 border-slate-100'}`,
  input: `w-full h-10 px-4 transition-all text-xs font-bold outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 focus:ring-violet-500 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-violet-200 text-slate-800 placeholder:text-slate-400'} border`,
  botonPrincipal: `font-black active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-12 mt-2 ${RADIO_GENERAL} ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'}`,
  btnOpcionInactivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-400 border-slate-100'}`,
  btnOpcionActivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 bg-violet-600 text-white border-violet-600`,
});

const ESTETICA_TARJETA = (isDark: boolean) => ({
  contenedor: `p-6 ${RADIO_GENERAL} border flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white shadow-lg shadow-slate-200/40 border-slate-100'}`,
});

const AMIGOS_FALLBACK = ['Tomas', 'Koke', 'Tito', 'Uli', 'Pablo', 'Oscarcito'];

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

  // MODO OSCURO
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
  
  // Control de la sede
  const [opcionSede, setOpcionSede] = useState<'FIJA' | 'VOTACION' | 'CUSTOM'>('FIJA');
  const [sedeFija, setSedeFija] = useState('Casa de Tomas');
  const [sedePersonalizadaInput, setSedePersonalizadaInput] = useState('');
  const [candidatosSede, setCandidatosSede] = useState<string[]>([]);
  
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  
  const [imagenJuntada, setImagenJuntada] = useState<File | null>(null);
  const [imagenJuntadaPreview, setImagenJuntadaPreview] = useState<string | null>(null);

  // Widget Discord
  const [discordData, setDiscordData] = useState<any>(null);
  const [discordLoading, setDiscordLoading] = useState(true);

  // 1. INICIALIZACIÓN BÁSICA (Solo corre al montar la página)
  useEffect(() => {
    setIsMounted(true);
    const temaLocal = localStorage.getItem('tema_juntadas');
    if (temaLocal === 'dark') setIsDark(true);
    else setIsDark(false);

    const userGuardado = localStorage.getItem('juntadas_user');
    if (userGuardado) setUsuarioLogueado(userGuardado);
  }, []);

  // 2. CARGA DE DATOS AISLADA (Supabase y Discord)
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

    // Fetch de Discord optimizado con anti-caché
    const fetchDiscord = async () => {
      // Usamos el timestamp para obligar al navegador a no usar la versión guardada en caché
      const noCacheTimestamp = new Date().getTime();
      const discordUrl = `https://discord.com/api/guilds/730941554537005137/widget.json?t=${noCacheTimestamp}`;
      
      try {
        const res = await fetch(discordUrl);
        if (res.ok) {
          const data = await res.json();
          setDiscordData(data);
        } else if (res.status === 403) {
          setDiscordData({ errorMensaje: 'FALTA ACTIVAR EL WIDGET EN LOS AJUSTES DE DISCORD' });
        } else {
          setDiscordData({ errorMensaje: `ERROR DE DISCORD: ${res.status}` });
        }
      } catch (error) {
        console.error('Error fetching Discord data', error);
        // Puente para adblockers o CORS
        try {
          const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(discordUrl)}`);
          if (proxyRes.ok) {
            const proxyData = await proxyRes.json();
            setDiscordData(proxyData);
          } else {
             setDiscordData({ errorMensaje: 'BLOQUEADO POR EL NAVEGADOR (ADBLOCK)' });
          }
        } catch(e) {
          setDiscordData({ errorMensaje: 'ERROR DE CONEXIÓN' });
        }
      } finally {
        setDiscordLoading(false);
      }
    };
    
    fetchDiscord();
    // Refresco más veloz: cada 15 segundos para que sea casi instantáneo
    const discordInterval = setInterval(fetchDiscord, 15000);

    return () => {
      supabase.removeChannel(subJuntadas);
      supabase.removeChannel(subUsuarios);
      clearInterval(discordInterval);
    };
  }, []); 

  // 3. SINCRONIZADOR DE TEMA
  useEffect(() => {
    if (usuarioLogueado && usuariosDB.length > 0) {
      const user = usuariosDB.find(u => u.nombre === usuarioLogueado);
      if (user && user.tema_oscuro !== undefined) {
        setIsDark(user.tema_oscuro);
        localStorage.setItem('tema_juntadas', user.tema_oscuro ? 'dark' : 'light');
      }
    }
  }, [usuarioLogueado, usuariosDB]);

  // Guardar preferencia de tema manualmente con el botón
  const toggleTema = async () => {
    const nuevoTema = !isDark;
    setIsDark(nuevoTema);
    localStorage.setItem('tema_juntadas', nuevoTema ? 'dark' : 'light');

    if (usuarioLogueado) {
      await supabase.from('usuarios').update({ tema_oscuro: nuevoTema }).eq('nombre', usuarioLogueado);
    }
  };

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
      // Sincronizar tema post-login
      if(user.tema_oscuro !== undefined) {
        setIsDark(user.tema_oscuro);
        localStorage.setItem('tema_juntadas', user.tema_oscuro ? 'dark' : 'light');
      }
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
            alert("❌ La contraseña actual es incorrecta.");
            return;
        }
    }

    setIsUploading(true);
    let finalFotoUrl = userActual.foto_perfil;

    if (fotoFile) {
        const urlSubida = await subirImagenAlStorage(fotoFile, 'perfiles');
        if (urlSubida) finalFotoUrl = urlSubida;
        else alert("No se pudo subir la foto.");
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
    
    // Asignación de sede para el modo edición
    if (j.esSedePersonalizada) {
        setOpcionSede('CUSTOM');
        setSedePersonalizadaInput(j.sedeFinal || '');
    } else if (j.esSedeFija) {
        setOpcionSede('FIJA');
        setSedeFija(j.sedeFinal || 'Casa de Tomas');
    } else {
        setOpcionSede('VOTACION');
        setCandidatosSede(j.candidatos ? j.candidatos.map((c: any) => c.nombre) : []);
    }
    
    setTagsSel(j.tags || []);
    setNotas(j.notas || '');
    setImagenJuntada(null); 
    setImagenJuntadaPreview(j.imagenUrl || null); 
    setMostrandoFormulario(true);
  };

  const publicar = async () => {
    if (!nuevoTitulo.trim() || !fechaSel || !horaSel.trim()) return alert("Completá título, fecha y hora.");
    if (tipoJuntada === 'IRL' && opcionSede === 'CUSTOM' && !sedePersonalizadaInput.trim()) return alert("Ingresá la sede personalizada.");
    
    // Validación de imagen obligatoria
    if (!juntadaEnEdicion && !imagenJuntada) {
        return alert("¡Tenés que agregar una foto de portada sí o sí!");
    } else if (juntadaEnEdicion) {
        const jActual = juntadas.find(x => x.id === juntadaEnEdicion);
        if (!imagenJuntada && !jActual?.imagenUrl) {
            return alert("¡Tenés que agregar una foto de portada sí o sí!");
        }
    }

    setIsUploading(true);

    let finalImageUrl = null;
    if (imagenJuntada) {
        finalImageUrl = await subirImagenAlStorage(imagenJuntada, 'juntadas');
        if (!finalImageUrl) alert("Hubo un error subiendo la foto de la juntada.");
    } else if (juntadaEnEdicion) {
        const jActual = juntadas.find(x => x.id === juntadaEnEdicion);
        finalImageUrl = jActual?.imagenUrl || null;
    }

    const [y, m, d] = fechaSel.split('-');
    const [h, min] = horaSel.includes(':') ? horaSel.split(':') : [horaSel, '00'];
    const targetDate = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));

    const esSedeFija = opcionSede === 'FIJA';
    const esSedePersonalizada = opcionSede === 'CUSTOM';
    const sedeFinalDeterminada = tipoJuntada === 'DISCORD' ? 'Discord' : (esSedeFija ? sedeFija : (esSedePersonalizada ? sedePersonalizadaInput.trim() : null));

    if (juntadaEnEdicion) {
        const jActual = juntadas.find(x => x.id === juntadaEnEdicion);
        
        let nuevosCandidatos = [];
        if (tipoJuntada === 'IRL' && opcionSede === 'VOTACION') {
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
            esSedePersonalizada: tipoJuntada === 'DISCORD' ? false : esSedePersonalizada,
            sedeFinal: sedeFinalDeterminada,
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
            esSedePersonalizada: tipoJuntada === 'DISCORD' ? false : esSedePersonalizada,
            sedeFinal: sedeFinalDeterminada,
            candidatos: (tipoJuntada === 'DISCORD' || opcionSede !== 'VOTACION') ? [] : candidatosSede.map(c => ({ nombre: c, votantes: [] })),
            tags: tagsSel,
            notas: notas.trim(),
            confirmados: [usuarioLogueado],
            dudosos: [],
            rechazados: [],
            excusas: [], 
            imagenUrl: finalImageUrl,
            pineado: false
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
    if (!j || j.esSedeFija || j.esSedePersonalizada || j.tipo === 'DISCORD') return;

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
          if (!j.esSedeFija && !j.esSedePersonalizada && j.tipo !== 'DISCORD' && j.candidatos) {
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
      const iconoSedeWA = j.esSedePersonalizada ? '📍' : '🏠';
      const sedeTexto = `\n${iconoSedeWA} *SEDE:* ${(j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : 'A votar en la app'}`;
      const msg = `🍾 *PROPUESTA IRL:* ${j.titulo} 🍾\n📆 *DÍA:* ${j.fechaDisplay}\n⏰ *HORA:* ${j.horaDisplay}${sedeTexto}\n\n👉 *Confirmá tu asistencia:* ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const togglePin = async (juntadaId: number, estadoActual: boolean) => {
    if (usuarioLogueado !== 'Tomas') return; 
    const nuevoEstado = !estadoActual;
    
    setJuntadas(prev => prev.map(item => item.id === juntadaId ? { ...item, pineado: nuevoEstado } : item));
    await supabase.from('juntadas').update({ pineado: nuevoEstado }).eq('id', juntadaId);
  };

  const resetForm = () => {
    setJuntadaEnEdicion(null);
    setTipoJuntada('IRL'); 
    setNuevoTitulo(''); 
    setFechaSel(''); 
    setHoraSel(''); 
    setTagsSel([]); 
    setCandidatosSede([]); 
    setOpcionSede('FIJA'); 
    setSedePersonalizadaInput('');
    setNotas(''); 
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

  const calcularEstadoTiempo = (timestamp: number) => {
    if (!timestamp) return { texto: 'CALCULANDO... ⏳', color: 'bg-violet-600' };
    
    const ahora = new Date().getTime();
    const diffMs = timestamp - ahora;
    const TRES_HORAS = 3 * 60 * 60 * 1000;

    if (diffMs < 0) {
      if (Math.abs(diffMs) <= TRES_HORAS) {
        return { texto: 'EN CURSO 😄', color: 'bg-violet-600' };
      } else {
        return { texto: 'EXPIRADO', color: 'bg-red-500' };
      }
    }

    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    
    if (dias > 1) return { texto: `FALTAN ${dias} DÍAS ⏳`, color: 'bg-violet-600' };
    if (dias === 1) return { texto: `MAÑANA 📆 `, color: 'bg-violet-600' };
    if (horas >= 1) return { texto: `FALTAN ${horas} HORAS ⏰`, color: 'bg-violet-600' };
    
    return { texto: '¡EN UN RATO! 🔥', color: 'bg-violet-600' };
  };

  const handleHoraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 2) val = val.substring(0, 2) + ':' + val.substring(2, 4);
    setHoraSel(val);
  };

  if (loading || !isMounted) return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-[#FDFDFF]'} flex items-center justify-center transition-colors duration-300`}>
      <div className="animate-spin text-violet-600 text-2xl">⏳</div>
    </div>
  );

  const tagsAMostrarFormulario = tipoJuntada === 'IRL' ? TAGS_DISPONIBLES_IRL : TAGS_DISPONIBLES_DISCORD;

  const ahoraMs = new Date().getTime();
  const TRES_HORAS = 3 * 60 * 60 * 1000;

  const juntadasOrdenadas = [...juntadas].sort((a, b) => {
    const aExpirado = ahoraMs >= a.timestamp + TRES_HORAS;
    const bExpirado = ahoraMs >= b.timestamp + TRES_HORAS;

    if (aExpirado && !bExpirado) return 1;
    if (!aExpirado && bExpirado) return -1;

    if (a.pineado && !b.pineado) return -1;
    if (!a.pineado && b.pineado) return 1;

    return b.id - a.id; 
  });

  // Solo buscamos canales de voz que tengan gente
  const canalesConGente = discordData?.channels?.map((c: any) => {
    const miembros = discordData.members?.filter((m: any) => m.channel_id === c.id) || [];
    return { ...c, members: miembros };
  }).filter((c: any) => c.members.length > 0) || [];

  return (
    <>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-[#FDFDFF]'} transition-colors duration-300 font-sans`}>
        {/* --- VISTA LOGIN --- */}
        {!usuarioLogueado && (
          <main className="flex items-center justify-center p-4 min-h-screen">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={ESTETICA_LOGIN(isDark).contenedor}>
              <div className="flex justify-center mb-6">
                <img src="https://i.imgur.com/5hJH1kn.png" alt="Logo" className={`h-10 w-auto object-contain ${isDark ? 'invert opacity-90' : ''}`} />
              </div>
              <form onSubmit={intentarLogin} className="space-y-3">
                <select className={`${ESTETICA_LOGIN(isDark).input} ${RADIO_GENERAL} appearance-none cursor-pointer`} value={nombreSeleccionado} onChange={e => setNombreSeleccionado(e.target.value)}>
                  <option value="">¿Quién sos?</option>
                  {(usuariosDB.length > 0 ? usuariosDB.map(u => u.nombre) : AMIGOS_FALLBACK).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="password" placeholder="Contraseña" className={`${ESTETICA_LOGIN(isDark).input} ${RADIO_GENERAL}`} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                {errorLogin && <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{errorLogin}</p>}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={ESTETICA_LOGIN(isDark).boton}>ENTRAR</motion.button>
              </form>
            </motion.div>
          </main>
        )}

        {/* --- VISTA FORMULARIO --- */}
        {usuarioLogueado && mostrandoFormulario && (
          <main className="p-4 pb-10 min-h-screen">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={ESTETICA_FORMULARIO(isDark).contenedor}>
              <button onClick={() => { setMostrandoFormulario(false); resetForm(); }} className={`text-[10px] mb-4 uppercase tracking-widest transition-colors font-bold ${isDark ? 'text-slate-500 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600'}`}>← Cancelar</button>
              <h2 className={`text-xl font-black mb-5 tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{juntadaEnEdicion ? 'EDITAR PROPUESTA' : 'NUEVA PROPUESTA'}</h2>
              
              <div className={`flex gap-2 mb-6 p-1 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <button
                  onClick={() => { setTipoJuntada('IRL'); setTagsSel([]); }}
                  className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${tipoJuntada === 'IRL' ? (isDark ? 'bg-slate-700 text-emerald-400 border-slate-600 border shadow-sm' : 'bg-white text-emerald-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                >
                  📍 IRL
                </button>
                <button
                  onClick={() => { setTipoJuntada('DISCORD'); setTagsSel([]); }}
                  className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 ${tipoJuntada === 'DISCORD' ? 'bg-[#5865F2] text-white shadow-md' : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className={`w-3.5 h-3.5 ${tipoJuntada === 'DISCORD' ? 'text-white' : (isDark ? 'text-white' : 'text-[#5865F2]')}`}>
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C127.86,52.43,121.56,29.1,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
                  </svg>
                  DISCORD
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>¿Qué se hace?</label>
                  <input type="text" placeholder={tipoJuntada === 'IRL' ? "Ej: Asadito en lo de Uli" : "Ej: Torneo de Rocket League"} className={`${ESTETICA_FORMULARIO(isDark).input} ${RADIO_GENERAL}`} value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Día</label>
                    <input type="date" className={`${ESTETICA_FORMULARIO(isDark).input} ${RADIO_GENERAL} text-xs`} value={fechaSel} onChange={e => setFechaSel(e.target.value)} />
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hora</label>
                    <div className="relative">
                      <input type="text" placeholder="21:30" className={`${ESTETICA_FORMULARIO(isDark).input} ${RADIO_GENERAL} pr-8`} value={horaSel} onChange={handleHoraChange} maxLength={5} />
                      <span className={`absolute right-3 top-3 text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PM</span>
                    </div>
                  </div>
                </div>

                {tipoJuntada === 'IRL' && (
                    <div>
                      <label className={`text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sede</label>
                      <div className="flex gap-2 mb-3">
                        <button onClick={() => setOpcionSede('FIJA')} className={opcionSede === 'FIJA' ? ESTETICA_FORMULARIO(isDark).btnOpcionActivo : ESTETICA_FORMULARIO(isDark).btnOpcionInactivo}>FIJA</button>
                        <button onClick={() => setOpcionSede('VOTACION')} className={opcionSede === 'VOTACION' ? ESTETICA_FORMULARIO(isDark).btnOpcionActivo : ESTETICA_FORMULARIO(isDark).btnOpcionInactivo}>VOTACIÓN</button>
                        <button onClick={() => setOpcionSede('CUSTOM')} className={opcionSede === 'CUSTOM' ? ESTETICA_FORMULARIO(isDark).btnOpcionActivo : ESTETICA_FORMULARIO(isDark).btnOpcionInactivo}>CUSTOM</button>
                      </div>
                      
                      <div className="mt-1">
                        {opcionSede === 'FIJA' && (
                          <div className="relative">
                            <select className={`${ESTETICA_FORMULARIO(isDark).input} ${RADIO_GENERAL} appearance-none cursor-pointer pr-8`} value={sedeFija} onChange={e => setSedeFija(e.target.value)}>
                              {AMIGOS_FALLBACK.map(a => <option key={a} value={`Casa de ${a}`}>Casa de {a}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>▼</span>
                            </div>
                          </div>
                        )}
                        {opcionSede === 'VOTACION' && (
                          <div className={`pt-2 pb-3 px-3 rounded-2xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <p className={`text-[9px] font-black mb-3 text-center uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Seleccionar casas candidatas:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {AMIGOS_FALLBACK.map(a => (
                                <motion.button 
                                  key={a}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setCandidatosSede(prev => prev.includes(a) ? prev.filter(c => c !== a) : [...prev, a])}
                                  className={`px-3 py-1.5 rounded-full text-[9px] font-black transition-all border-2 ${candidatosSede.includes(a) ? 'bg-violet-600 text-white border-violet-600 shadow-md' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-400 border-slate-200')}`}>
                                  {a.toUpperCase()}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                        {opcionSede === 'CUSTOM' && (
                          <input 
                            type="text" 
                            maxLength={20}
                            placeholder="Ej: Vertigo, Consti" 
                            className={`${ESTETICA_FORMULARIO(isDark).input} ${RADIO_GENERAL}`} 
                            value={sedePersonalizadaInput} 
                            onChange={e => setSedePersonalizadaInput(e.target.value)} 
                          />
                        )}
                      </div>
                    </div>
                )}

                <div>
                  <label className={`text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Notas (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder={tipoJuntada === 'IRL' ? "Ej: Traigan hielo, falta coca" : "Ej: Superclásico de Rocket League"} 
                    className={`${ESTETICA_FORMULARIO(isDark).input} ${RADIO_GENERAL}`} 
                    value={notas} 
                    onChange={e => setNotas(e.target.value)} 
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>¿Qué onda?</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsAMostrarFormulario.map(t => (
                      <button key={t.label} onClick={() => setTagsSel(prev => prev.includes(t.label) ? prev.filter(x => x !== t.label) : [...prev, t.label])}
                        className={`px-3 py-2 ${RADIO_GENERAL} text-[10px] font-bold transition-all border-2 ${tagsSel.includes(t.label) ? 'bg-violet-600 text-white border-violet-600' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-100')}`}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                    <div className={`relative w-full rounded-xl h-40 flex items-center justify-center transition-colors cursor-pointer overflow-hidden border-2 ${imagenJuntadaPreview ? 'border-transparent shadow-sm' : (isDark ? 'border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-dashed border-violet-200 bg-violet-50 hover:bg-violet-100')}`}>
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
                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-violet-600'}`}>
                          📸 AGREGAR FOTO (OBLIGATORIA)
                        </span>
                      )}
                    </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={publicar} 
                  disabled={isUploading}
                  className={`${ESTETICA_FORMULARIO(isDark).botonPrincipal} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? '⏳ GUARDANDO...' : (juntadaEnEdicion ? '💾 GUARDAR CAMBIOS' : '🚀 PROPONER')}
                </motion.button>
              </div>
            </motion.div>
          </main>
        )}

        {/* --- DASHBOARD --- */}
        {usuarioLogueado && !mostrandoFormulario && (
          <main className="pb-16 min-h-screen">
            <nav className="p-5 flex justify-between items-center max-w-4xl mx-auto relative z-50">
              <img src="https://i.imgur.com/5hJH1kn.png" alt="Logo" className={`h-8 w-auto object-contain transition-all ${isDark ? 'invert opacity-90' : ''}`} />
              
              <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleTema}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-400 hover:text-violet-500 hover:border-violet-300 shadow-sm'}`}
                    title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
                  >
                    {isDark ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                  </button>

                  <div className="relative">
                      <button 
                          onClick={() => { setMenuPerfilAbierto(!menuPerfilAbierto); setPasswordVieja(''); setNuevaPassword(''); setFotoPreview(null); setFotoFile(null); }} 
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-full border transition-colors shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 hover:border-violet-500' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                      >
                          <img src={getFotoUsuario(usuarioLogueado)} className={`w-6 h-6 rounded-full object-cover border ${isDark ? 'border-slate-800 bg-slate-800' : 'border-slate-100 bg-slate-50'}`} alt="Avatar" />
                          <span className={`text-[10px] font-black pr-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{usuarioLogueado} ▼</span>
                      </button>

                      <AnimatePresence>
                          {menuPerfilAbierto && (
                              <motion.div 
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className={`absolute right-0 top-12 w-[260px] border shadow-xl rounded-2xl p-5 flex flex-col gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                              >
                                  <p className={`text-[10px] font-black uppercase tracking-widest text-center border-b pb-3 ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-400 border-slate-100'}`}>Tu Perfil</p>
                                  
                                  <div className="flex flex-col items-center justify-center">
                                    <label htmlFor="perfil-upload" className="relative cursor-pointer group">
                                      <img src={fotoPreview || getFotoUsuario(usuarioLogueado)} className={`w-16 h-16 rounded-full object-cover border-2 transition-colors shadow-sm ${isDark ? 'border-slate-700 group-hover:border-violet-500' : 'border-slate-200 group-hover:border-violet-400'}`} alt="Tu perfil" />
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
                                    <p className={`text-[8px] font-bold mt-2 uppercase tracking-widest text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tocar para subir</p>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                      <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>O Usar Link (Ej: Imgur)</label>
                                      <input type="text" placeholder="https://..." value={nuevaFotoUrl} onChange={e => setNuevaFotoUrl(e.target.value)} className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold outline-none focus:ring-1 border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`} />
                                  </div>

                                  <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                      <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cambiar Contraseña (Opcional)</label>
                                      <input type="password" placeholder="Nueva contraseña..." value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold outline-none focus:ring-1 border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`} />
                                  </div>

                                  <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                      <label className={`text-[9px] font-black ml-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>🔒 Contraseña Actual (Opcional)</label>
                                      <input type="password" placeholder="Solo requerida si cambiás tu clave" value={passwordVieja} onChange={e => setPasswordVieja(e.target.value)} className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold outline-none focus:ring-1 border ${isDark ? 'bg-violet-900/30 border-violet-800 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-white border-violet-200 text-slate-800 focus:ring-violet-400 placeholder:text-slate-400'}`} />
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
                                    }} className={`w-full h-8 rounded-xl text-[10px] font-black uppercase border transition-colors ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}>Cerrar Sesión</button>
                                  </div>
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </div>
            </nav>

            <div className="max-w-4xl mx-auto p-4">
              {/* --- WIDGET DISCORD --- */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3 }} 
                className={`mb-6 p-5 ${RADIO_GENERAL} border transition-colors duration-300 ${isDark ? 'bg-[#5865F2]/10 border-[#5865F2]/20' : 'bg-[#5865F2]/5 border-[#5865F2]/10 shadow-sm'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className={`w-4 h-4 ${isDark ? 'text-[#5865F2]' : 'text-[#5865F2]'}`}>
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C127.86,52.43,121.56,29.1,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {discordData?.name || 'Servidor Discord'}
                    </h3>
                  </div>
                </div>

                {discordLoading ? (
                  <div className="animate-pulse flex gap-2">
                    <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                    <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  </div>
                ) : discordData && !discordData.errorMensaje ? (
                  <div className="space-y-5">
                    {canalesConGente.length > 0 ? (
                        <div className="space-y-4">
                        {canalesConGente.map((c: any) => (
                            <div key={c.id}>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-[#5865F2]' : 'text-[#5865F2]'}`}>
                                🔊 {c.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {c.members.map((m: any) => (
                                <div key={m.id} className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-colors ${isDark ? 'bg-slate-900 border-slate-800 hover:border-[#5865F2]/50' : 'bg-white border-slate-200 shadow-sm hover:border-[#5865F2]/40'}`}>
                                    <div className="relative shrink-0">
                                    <img src={m.avatar_url} alt={m.username} className="w-7 h-7 rounded-full object-cover" />
                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${m.status === 'online' ? 'bg-green-500' : m.status === 'idle' ? 'bg-yellow-500' : 'bg-slate-500'}`}></span>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                    <span className={`text-[10px] font-black leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{m.username}</span>
                                    {m.game && (
                                        <span className="text-[7px] font-bold text-[#5865F2] uppercase leading-tight line-clamp-1">{m.game.name}</span>
                                    )}
                                    </div>
                                </div>
                                ))}
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Silencio total. Nadie en chat de voz 😴
                        </p>
                    )}
                  </div>
                ) : (
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-red-500`}>
                    {discordData?.errorMensaje || 'NO SE PUDO CARGAR DISCORD'}
                  </p>
                )}
              </motion.div>

              {juntadasOrdenadas.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`border-2 border-dashed ${RADIO_GENERAL} py-12 flex flex-col items-center justify-center text-center mt-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-3xl mb-3 opacity-30">🗓️</div>
                  <p className={`text-[10px] font-bold mb-5 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Nada por acá...</p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setMostrandoFormulario(true); }} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-xs px-6 h-10 ${RADIO_GENERAL} ${isDark ? 'shadow-none' : ''}`}>+ PROPONER</motion.button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-end mb-2 px-1">
                    <h2 className={`text-2xl font-black tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-950'}`}>PROPUESTAS</h2>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setMostrandoFormulario(true); }} className={`bg-violet-600 text-white font-black hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-[10px] px-4 h-8 ${RADIO_GENERAL}`}>+ NUEVA</motion.button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {juntadasOrdenadas.map((j) => {
                      
                      const voyYo = (j.confirmados || []).includes(usuarioLogueado);
                      const dudaYo = (j.dudosos || []).includes(usuarioLogueado);
                      const pasoYo = (j.rechazados || []).includes(usuarioLogueado);
                      
                      const cantConfirmados = j.confirmados?.length || 0;

                      const esCreador = usuarioLogueado === j.creador;
                      const esAdminTomas = usuarioLogueado === 'Tomas';
                      const puedeEliminarOEditar = esCreador || esAdminTomas;
                      const estaPineado = j.pineado;

                      const esDiscord = j.tipo === 'DISCORD';
                      const esIRL = j.tipo === 'IRL' || !j.tipo;
                      const iconoSede = j.esSedePersonalizada ? '📍' : '🏠';

                      const totalVotosSede = j.candidatos ? j.candidatos.reduce((acc: number, c: any) => acc + (c.votantes?.length || 0), 0) : 0;
                      const totalPosiblesVotantes = AMIGOS_FALLBACK.length - (j.rechazados?.length || 0);
                      const votosRestantes = Math.max(0, totalPosiblesVotantes - totalVotosSede);

                      let sedeConfirmada = (j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : null;
                      let esIrremontable = false;

                      if (!j.esSedeFija && !j.esSedePersonalizada && j.candidatos && j.candidatos.length > 0) {
                        const ordenados = [...j.candidatos].sort((a, b) => (b.votantes?.length || 0) - (a.votantes?.length || 0));
                        const maxVotos = ordenados[0]?.votantes?.length || 0;
                        const segundoMaxVotos = ordenados.length > 1 ? (ordenados[1]?.votantes?.length || 0) : 0;

                        if (maxVotos > 0 && maxVotos > (segundoMaxVotos + votosRestantes)) {
                          sedeConfirmada = ordenados[0].nombre;
                          esIrremontable = true;
                        }
                      }

                      const estadoT = calcularEstadoTiempo(j.timestamp);

                      return (
                        <motion.div 
                          key={j.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`relative ${ESTETICA_TARJETA(isDark).contenedor} ${estadoT.texto.includes('EXPIRADO') ? (isDark ? 'opacity-50' : 'opacity-60 grayscale-[30%]') : ''} ${estaPineado && !estadoT.texto.includes('EXPIRADO') ? (isDark ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-slate-950 border-transparent' : 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white border-transparent') : ''}`}
                        >
                          {/* BOTONES DE CONTROL */}
                          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 items-center justify-center">
                            {puedeEliminarOEditar && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  onClick={() => eliminarJuntada(j.id)}
                                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors font-bold cursor-pointer text-xs ${j.imagenUrl ? 'text-white/70 hover:bg-white/20 bg-black/20 hover:text-red-400' : (isDark ? 'text-slate-400 bg-slate-800 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 bg-slate-100 hover:text-red-500')}`}
                                  title="Eliminar juntada"
                                >
                                  ✕
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  onClick={() => abrirEdicion(j)}
                                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors cursor-pointer ${j.imagenUrl ? 'text-white/70 hover:text-white hover:bg-white/20 bg-black/20' : (isDark ? 'text-slate-400 bg-slate-800 hover:bg-violet-900/30 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50 bg-slate-100')}`}
                                  title="Editar juntada"
                                >
                                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </motion.button>
                              </>
                            )}
                            
                            {/* ICONO DE PIN (CHINCHE) */}
                            {(esAdminTomas || estaPineado) && (
                                <motion.button
                                  whileHover={esAdminTomas ? { scale: 1.1 } : {}}
                                  onClick={() => esAdminTomas ? togglePin(j.id, j.pineado) : null}
                                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors text-xs ${
                                    esAdminTomas ? 'cursor-pointer' : 'cursor-default'
                                  } ${
                                    estaPineado 
                                      ? (j.imagenUrl ? 'text-yellow-400 bg-black/40' : (isDark ? 'text-yellow-500 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-100')) 
                                      : (j.imagenUrl ? 'text-white/70 hover:text-white hover:bg-white/20 bg-black/20' : (isDark ? 'text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-yellow-500' : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 bg-slate-100'))
                                  }`}
                                  title={estaPineado ? "Evento destacado" : "Destacar evento"}
                                >
                                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                                  </svg>
                                </motion.button>
                            )}
                          </div>

                          {/* IDENTIDAD */}
                          <div className="absolute top-3 left-3 z-20 flex flex-row gap-1.5 items-center">
                            <span className={`${j.imagenUrl ? 'bg-black/40 backdrop-blur-md text-white border-white/10' : (esDiscord ? (isDark ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30' : 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20') : (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100'))} text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border shadow-sm flex items-center gap-1.5`}>
                                {esDiscord ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className="w-3 h-3 text-white drop-shadow-sm">
                                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C127.86,52.43,121.56,29.1,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
                                        </svg> 
                                        DISCORD
                                    </>
                                ) : '📍 IRL'}
                            </span>
                            <span className={`${j.imagenUrl ? 'bg-black/40 backdrop-blur-md text-white border-white/10' : (isDark ? 'bg-violet-900/30 text-violet-300 border-violet-800/50' : 'bg-violet-50 text-violet-600 border-violet-100')} text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border shadow-sm flex items-center gap-1.5`}>
                                <img src={getFotoUsuario(j.creador)} className="w-3.5 h-3.5 rounded-full object-cover" alt="creador" />
                                {j.creador}
                            </span>
                          </div>

                          {/* --- HEADER CON IMAGEN --- */}
                          {j.imagenUrl ? (
                            <div className="relative -mx-6 -mt-6 mb-4 p-6 rounded-t-2xl overflow-hidden min-h-[180px] flex flex-col justify-end">
                              <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${j.imagenUrl})` }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-slate-900/10 z-10" />
                              
                              {/* Posicionamiento absoluto en la parte inferior con margen '3' */}
                              <div className="absolute bottom-3 left-6 right-3 z-20 flex flex-col gap-1.5 pt-16">
                                <h3 className="text-2xl font-black text-white leading-none tracking-tight drop-shadow-md pr-8">{j.titulo}</h3>
                                
                                <div className="flex items-center flex-wrap gap-2 text-slate-200 drop-shadow-md">
                                  <span className="text-sm">📅</span>
                                  <p className="text-xs font-bold">{j.fechaDisplay} — <span className="text-white">{j.horaDisplay}</span></p>
                                  
                                  <span className={`${estadoT.color} bg-opacity-90 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm`}>
                                    {estadoT.texto}
                                  </span>
                                </div>

                                {esIRL && (
                                  (j.esSedeFija || j.esSedePersonalizada || esIrremontable) ? (
                                     <div className="flex items-center gap-1.5 drop-shadow-md">
                                        <span className="text-sm">{iconoSede}</span>
                                        <span className="bg-white text-slate-900 border border-slate-200 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                            {(j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : `${sedeConfirmada} VOTADA COMO SEDE`}
                                        </span>
                                    </div>
                                  ) : (
                                     <div className="flex items-center gap-1.5 drop-shadow-md">
                                        <span className="text-sm">{iconoSede}</span>
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
                                <div className="mb-2.5 mt-16 pr-8 relative">
                                  <h3 className={`text-xl font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{j.titulo}</h3>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 mb-4">
                                  <div className={`flex items-center flex-wrap gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span className="text-sm">📅</span>
                                    <p className="text-xs font-bold">{j.fechaDisplay} — <span className={isDark ? 'text-white' : 'text-slate-950'}>{j.horaDisplay}</span></p>

                                    <span className={`${estadoT.color} text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm`}>
                                      {estadoT.texto}
                                    </span>
                                  </div>

                                  {esIRL && (
                                    (j.esSedeFija || j.esSedePersonalizada || esIrremontable) ? (
                                       <div className={`flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                          <span className="text-sm">{iconoSede}</span>
                                          <span className="bg-white text-slate-900 border border-slate-200 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                              {(j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : `${sedeConfirmada} VOTADA COMO SEDE`}
                                          </span>
                                      </div>
                                    ) : (
                                       <div className={`flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                          <span className="text-sm">{iconoSede}</span>
                                          <span className="bg-yellow-400 text-yellow-950 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                              SEDE EN VOTACIÓN
                                          </span>
                                      </div>
                                    )
                                  )}
                                </div>
                            </>
                          )}
                          
                          {/* --- SECCIÓN DE VOTACIÓN DE SEDE --- */}
                          {esIRL && (!j.esSedeFija && !j.esSedePersonalizada && !esIrremontable) && (
                            <div className="space-y-3 mb-4 mt-1">
                              <div className={`p-3 border ${RADIO_GENERAL} ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 flex justify-between ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  <span>🗳️ Votación de sede</span>
                                  <span className="normal-case tracking-normal">Quedan {votosRestantes} votos</span>
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
                                        className={`relative overflow-hidden w-full flex justify-between items-center px-3 py-2 ${RADIO_GENERAL} border transition-all group ${yoVoteAca ? (isDark ? 'border-violet-500 ring-1 ring-violet-900 bg-slate-900' : 'border-violet-500 ring-1 ring-violet-200 bg-white') : (isDark ? 'border-slate-700 hover:border-violet-600 bg-slate-900' : 'border-slate-200 hover:border-violet-400 bg-white')}`}
                                      >
                                        <motion.div
                                          className={`absolute left-0 top-0 bottom-0 ${yoVoteAca ? (isDark ? 'bg-violet-900/30' : 'bg-violet-100') : (isDark ? 'bg-slate-800' : 'bg-slate-100')}`}
                                          initial={{ width: 0 }}
                                          animate={{ width: `${porcentaje}%` }}
                                          transition={{ duration: 0.3, ease: "easeOut" }}
                                        />
                                        <div className="relative z-10 flex justify-between items-center w-full">
                                          <span className={`text-[10px] font-bold ${yoVoteAca ? (isDark ? 'text-violet-400' : 'text-violet-700') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>{c.nombre}</span>
                                          <div className="flex items-center gap-2">
                                            <div className="flex -space-x-1.5 mr-1">
                                                {c.votantes?.slice(0,3).map((v: string) => (
                                                    <img key={v} src={getFotoUsuario(v)} className={`w-4 h-4 rounded-full border object-cover ${isDark ? 'border-slate-800' : 'border-white'}`} alt="votante" />
                                                ))}
                                            </div>
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${vCount > 0 ? (isDark ? 'text-violet-300 bg-violet-900/40' : 'text-violet-600 bg-violet-50') : (isDark ? 'text-slate-500 bg-slate-800/50' : 'text-slate-400 bg-slate-50')}`}>
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
                            <div className={`mb-4 p-3 border ${RADIO_GENERAL} ${isDark ? 'bg-violet-900/20 border-violet-800/50' : 'bg-violet-50/50 border-violet-100'}`}>
                              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>📌 NOTAS:</p>
                              <p className={`text-[10px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{j.notas}</p>
                            </div>
                          )}

                          {j.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-5 mt-1">
                                {j.tags.map((t: any) => {
                                  const icon = TODOS_LOS_TAGS.find(d => d.label === t)?.emoji;
                                  return <span key={t} className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{icon} {t}</span>
                                })}
                              </div>
                          )}

                          {/* SECCIÓN ASISTENCIA */}
                          <div className={`p-3 ${RADIO_GENERAL} border mb-4 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`flex justify-between items-end border-b pb-2 mb-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Asistencia:</p>
                              
                              <div className="flex gap-0.5">
                                {Array.from({ length: AMIGOS_FALLBACK.length }).map((_, i) => (
                                  <span 
                                    key={i} 
                                    className={`text-sm transition-all duration-300 ${i < cantConfirmados ? (isDark ? 'text-violet-500 opacity-100' : 'text-violet-600 opacity-100') : (isDark ? 'text-slate-600 opacity-30 grayscale' : 'text-slate-400 opacity-30 grayscale')}`}
                                  >
                                    👤
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {(!j.confirmados?.length && !j.dudosos?.length && !j.rechazados?.length) && <p className={`text-[10px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nadie respondió todavía</p>}
                            {j.confirmados?.length > 0 && <p className={`text-[10px] font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>✅ <span className={`font-bold ${isDark ? 'text-green-500' : 'text-green-600'}`}>VAN:</span> {j.confirmados.join(', ')}</p>}
                            {j.dudosos?.length > 0 && <p className={`text-[10px] font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>🤔 <span className={`font-bold ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>DUDAN:</span> {j.dudosos.join(', ')}</p>}
                            {j.rechazados?.length > 0 && <p className={`text-[10px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>❌ <span className={`font-bold ${isDark ? 'text-red-500' : 'text-red-500'}`}>PASAN:</span> {j.rechazados.join(', ')}</p>}
                          </div>

                          {/* --- BOTONES VOY / NO SÉ / NO PUEDO --- */}
                          <div className="grid grid-cols-3 gap-2 mb-3 relative">
                            <button 
                              onClick={() => toggleAsistencia(j.id, 'voy')}
                              className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors duration-200 ${RADIO_GENERAL} border ${voyYo ? (isDark ? 'bg-green-500 text-white border-green-500 shadow-none' : 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                            >VOY</button>
                            <button 
                              onClick={() => toggleAsistencia(j.id, 'nose')}
                              className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors duration-200 ${RADIO_GENERAL} border ${dudaYo ? (isDark ? 'bg-yellow-500 text-white border-yellow-500 shadow-none' : 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-200') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                            >NO SÉ</button>
                            <button 
                              onClick={() => toggleAsistencia(j.id, 'paso')}
                              className={`h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors duration-200 ${RADIO_GENERAL} border ${pasoYo ? (isDark ? 'bg-red-500 text-white border-red-500 shadow-none' : 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                            >PASO</button>
                          </div>

                          {/* --- BOTÓN WHATSAPP --- */}
                          <button 
                            onClick={() => compartirWhatsApp(j)}
                            className={`w-full flex items-center justify-center gap-1.5 py-2 mb-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-green-500 hover:text-green-400' : 'text-green-600 hover:text-green-700'}`}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            AVISAR POR WHATSAPP
                          </button>

                          {/* --- ZONA DE COMENTARIOS INLINE (AL FINAL) --- */}
                          <div className={`mt-auto pt-3 border-t flex-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            {/* Lista de Comentarios */}
                            <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                              {(j.excusas || []).map((c: any, idx: number) => {
                                let ringColor = 'border-transparent';
                                if ((j.confirmados || []).includes(c.usuario)) ringColor = `ring-2 ring-green-500 ring-offset-1 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-white'}`;
                                else if ((j.dudosos || []).includes(c.usuario)) ringColor = `ring-2 ring-yellow-400 ring-offset-1 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-white'}`;
                                else if ((j.rechazados || []).includes(c.usuario)) ringColor = `ring-2 ring-red-500 ring-offset-1 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-white'}`;

                                return (
                                  <div key={idx} className={`flex items-center gap-2 group relative py-1 rounded-lg px-1 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                    <img src={getFotoUsuario(c.usuario)} className={`w-6 h-6 rounded-full object-cover shadow-sm shrink-0 ${ringColor}`} alt="avatar" />
                                    <div className={`flex-1 text-[10px] font-medium leading-tight line-clamp-3 break-words ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                      <span className={`font-black uppercase mr-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{c.usuario}:</span>
                                      {c.texto}
                                    </div>
                                    {c.usuario === usuarioLogueado && (
                                      <button onClick={() => borrarComentario(j.id, c.texto)} className={`font-bold text-[10px] transition-colors ml-2 px-1 ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`} title="Borrar comentario">✕</button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Input para Nuevo Comentario */}
                            <div className="relative w-full mt-2">
                              <input 
                                type="text"
                                maxLength={120} 
                                placeholder="Escribí un comentario..." 
                                value={comentariosInputs[j.id] || ''}
                                onChange={(e) => setComentariosInputs(prev => ({ ...prev, [j.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') agregarComentario(j.id); }}
                                className={`w-full h-8 pl-3 pr-8 rounded-lg text-[9px] font-bold outline-none focus:ring-1 transition-all border ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`}
                              />
                              <button 
                                onClick={() => agregarComentario(j.id)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded-md flex items-center justify-center shadow-sm active:scale-95 transition-all"
                              >
                                <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                              </button>
                            </div>
                          </div>

                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </>
  );
}