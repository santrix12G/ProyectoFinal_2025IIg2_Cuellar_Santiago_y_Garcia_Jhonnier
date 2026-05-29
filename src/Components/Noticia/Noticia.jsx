import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '../../supabaseClient.js';
import './Noticia.css';
import SocialMedias from '../SocialMedia/SocialMedias.jsx';

const Noticia = () => {
  // Obtener parámetros de la URL
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados principales
  const [noticia, setNoticia] = useState(null);
  const [noticiasRelacionadas, setNoticiasRelacionadas] = useState([]);
  const [noticiasSeccion, setNoticiasSeccion] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardado, setGuardado] = useState(false);
  const [progresoLectura, setProgresoLectura] = useState(0);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  // Referencias para la tabla de contenidos
  const seccionesRef = useRef([]);
  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para calcular tiempo de lectura
  const calcularTiempoLectura = (contenido) => {
    if (!contenido) return '1 min';
    const palabras = contenido.split(/\s+/).length;
    const minutos = Math.ceil(palabras / 200); // 200 palabras por minuto
    return `${minutos} min de lectura`;
  };

  // Función para obtener iniciales del autor
  const obtenerInicialesAutor = (nombre) => {
    if (!nombre) return 'AN';
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  // Función para calcular tiempo relativo
  const calcularTiempoRelativo = (fecha) => {
    if (!fecha) return 'Fecha desconocida';

    const ahora = new Date();
    const fechaComentario = new Date(fecha);
    const diferenciaMs = ahora - fechaComentario;
    const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const diferenciaDias = Math.floor(diferenciaHoras / 24);

    if (diferenciaHoras < 1) {
      return 'Hace menos de 1 hora';
    } else if (diferenciaHoras === 1) {
      return 'Hace 1 hora';
    } else if (diferenciaHoras < 24) {
      return `Hace ${diferenciaHoras} horas`;
    } else if (diferenciaDias === 1) {
      return 'Hace 1 día';
    } else {
      return `Hace ${diferenciaDias} días`;
    }
  };

  // Obtener noticia individual
  useEffect(() => {
    const obtenerNoticia = async () => {
      try {
        setCargando(true);

        // Obtener la noticia por ID

        //hint

        //"Try changing 'Usuario' to one of the following: 'Usuario!Noticia_id_usuario_creador_fkey', 'Usuario!Comentario'. Find the desired relationship in the 'details' key."
        const { data: noticiaData, error } = await supabase
          .from('Noticia')
          .select(`*,
            Seccion:Seccion (
              nombre
            ),
            id_usuario_creador:Usuario!Noticia_id_usuario_creador_fkey (
              nombre_completo,
              id_usuario
            )
          `)
          .eq('id_noticia', id)
          .single();


        let noticiaObtenida = null;


        if (error) {
          console.error('Error al obtener noticia:', error);
          // Intentar con otro campo si existe
          const { data: noticiaAlt, error: error2 } = await supabase
            .from('Noticia')
            .select('*')
            .eq('id', id)
            .single();

          if (error2) {
            console.error('Error al obtener noticia alternativa:', error2);
          } else {
            noticiaObtenida = noticiaAlt;
            setNoticia(noticiaAlt);
          }
        } else {
          noticiaObtenida = noticiaData;
          setNoticia(noticiaData);
        }

        // Obtener noticias relacionadas (misma categoría)
        if (noticiaObtenida?.categoria) {
          const { data: relacionadas } = await supabase
            .from('Noticia')
            .select('*')
            .ilike('categoria', noticiaObtenida.categoria)
            .neq('id_noticia', noticiaObtenida.id_noticia || id)
            .order('fecha_creacion', { ascending: false })
            .limit(3);

          setNoticiasRelacionadas(relacionadas || []);

          // Obtener más noticias de la misma sección
          const { data: seccion } = await supabase
            .from('Noticia')
            .select('*')
            .ilike('categoria', noticiaObtenida.categoria)
            .neq('id_noticia', noticiaObtenida.id_noticia || id)
            .order('fecha_creacion', { ascending: false })
            .limit(3);

          setNoticiasSeccion(seccion || []);
        }

        // Obtener comentarios (Tabla de comentarios)
        const obtenerComentarios = async () => {
          try {
            const { data: comentariosData, error: comentariosError } = await supabase
              .from('Comentario')
              .select(`*,
                id_usuario:Usuario!Comentario_id_usuario_fkey(
                  nombre_completo
                )
                `)
              .eq('id_noticia', id)
              .eq('id_usuario', noticiaObtenida.id_usuario_creador.id_usuario)
              .order('created_at', { ascending: false });
            setComentarios(comentariosData || []);
          } catch (error) {
            console.error('Error al obtener comentarios:', error);
          }
        }
        obtenerComentarios();

      } catch (error) {
        console.error('Error al obtener noticia:', error);
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      obtenerNoticia();
    }
  }, [id]);

  // Actualizar barra de progreso al hacer scroll
  useEffect(() => {
    const actualizarProgreso = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgresoLectura(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', actualizarProgreso);
    return () => window.removeEventListener('scroll', actualizarProgreso);
  }, []);

  // Extraer encabezados del contenido para la tabla de contenidos
  useEffect(() => {
    if (noticia?.contenido) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(noticia.contenido, 'text/html');
      const headings = doc.querySelectorAll('h2, h3');

      const secciones = Array.from(headings).map((heading, index) => {
        const id = heading.id || `seccion-${index}`;
        if (!heading.id) heading.id = id;
        return {
          id,
          texto: heading.textContent,
          nivel: heading.tagName.toLowerCase()
        };
      });

      seccionesRef.current = secciones;
    }
  }, [noticia]);

  // Manejar compartir en redes sociales
  const manejarCompartir = (redSocial) => {
    const url = encodeURIComponent(window.location.href);
    const titulo = encodeURIComponent(noticia?.titulo || '');

    let shareUrl = '';
    switch (redSocial) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${titulo}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${titulo} ${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${titulo}&body=Te recomiendo leer este artículo: ${url}`;
        break;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const getUser = async () => {
    const { data } = await supabase.auth.getUser(); // devuelve { user }
    return data?.user ?? null;
  };


  // Manejar enviar comentario
  const manejarEnviarComentario = async (e) => {
    e.preventDefault();
    if (!comentarioTexto.trim()) return;
    const { data, error } = await supabase
      .from("Comentario")
      .insert([
        {
          id_noticia: id,
          id_usuario: noticia.id_usuario_creador.id_usuario,
          contenido: comentarioTexto
        },
      ])
      .select(`*,
          id_usuario:Usuario!Comentario_id_usuario_fkey(
            nombre_completo
          )`);

    if (error) {
      console.error("Error al agregar comentario:", error);
    } else {
      setComentarios([data[0], ...comentarios]); // Actualizar la lista sin recargar
    }


  };



  // Manejar suscripción al newsletter
  const manejarNewsletter = (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    if (email) {
      alert(`¡Gracias por suscribirte con ${email}!`);
      e.target.reset();
    }
  };

  // Scroll suave a sección
  const scrollASeccion = (seccionId) => {
    const elemento = document.getElementById(seccionId);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (cargando) {
    return (
      <div className="noticia-cargando">
        <div className="cargando-spinner"></div>
        <p>Cargando noticia...</p>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="noticia-no-encontrada">
        <h2>Noticia no encontrada</h2>
        <p>La noticia que buscas no existe o ha sido eliminada.</p>
        <Link to="/" className="boton-volver">Volver al inicio</Link>
      </div>
    );
  }
  return (
    <div className="noticia">
      {/* Barra de progreso */}
      <div
        className="barra-progreso"
        style={{ width: `${progresoLectura}%` }}
      ></div>

      {/* Botones de compartir */}
      <div className="botones-compartir">
        <SocialMedias posicion="column" size="40"/>
      </div>

      {/* Sección Hero */}
      <section
        className="seccion-hero-noticia"
      >
        <div className="imagen-hero-noticia">
          {noticia.image_url ? (
            <img
              src={noticia.image_url}
              alt={noticia.titulo}
              className="imagen-hero-real"
            />
          ) : (
            <span className="emoji-hero">'📰'</span>
          )}
        </div>
        <div className="overlay-hero">
          <div className="contenido-hero">
            <span className="categoria-hero">{noticia.Seccion==null?"General":noticia.Seccion.nombre}</span>
            <h1 className="titulo-hero">{noticia.titulo || 'Sin título'}</h1>
            <p className="subtitulo-hero">
              {noticia.extracto || noticia.contenido?.substring(0, 200) || 'Sin descripción disponible'}
            </p>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <div className="contenedor-principal">
        {/* Contenido del Artículo */}
        <main className="contenido-articulo">
          {/* Meta del Artículo */}
          <div className="meta-articulo">
            <div className="info-autor">
              <div
                className="avatar-autor"
              >
                {obtenerInicialesAutor(noticia.id_usuario_creador.nombre_completo || 'Anónimo')}
              </div>
              <div className="detalles-autor">
                <h3 className="nombre-autor">{noticia.id_usuario_creador.nombre_completo || 'Anónimo'}</h3>
                <p className="cargo-autor">Especialista en {noticia.Seccion==null?"General":noticia.Seccion.nombre}</p>
              </div>
            </div>
            <div className="estadisticas-articulo">
              <div className="item-estadistica">
                <span>📅</span>
                <span>{formatearFecha(noticia.created_at)}</span>
              </div>
              <div className="item-estadistica">
                <span>🕒</span>
                <span>{calcularTiempoLectura(noticia.contenido)}</span>
              </div>
            </div>
          </div>

          {/* Cuerpo del Artículo */}
          <div
            className="cuerpo-articulo"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(noticia.contenido || '<p>Contenido no disponible</p>') }}
          ></div>

          {/* Biografía del Autor */}
          <div className="biografia-autor">
            <div className="header-biografia">
              <div
                className="avatar-biografia"
              >
                {obtenerInicialesAutor(noticia.id_usuario_creador.nombre_completo || 'Anónimo')}
              </div>
              <div className="info-biografia">
                <h3 className="nombre-biografia">{noticia.id_usuario_creador.nombre_completo || 'Anónimo'}</h3>
              </div>
            </div>
            <p className="descripcion-biografia">
              {`Especialista con amplia experiencia en ${(noticia.Seccion==null)?'su área de expertise':noticia.Seccion.nombre}.`}
            </p>
            <div className="social-biografia">
              <a href="#" className="icono-social" target="_blank" rel="noopener noreferrer">🐦</a>
              <a href="#" className="icono-social" target="_blank" rel="noopener noreferrer">in</a>
              <a href="#" className="icono-social" target="_blank" rel="noopener noreferrer">📧</a>
            </div>
          </div>

          {/* Sección de Comentarios */}
          <section className="seccion-comentarios">
            <h2 className="titulo-comentarios">Comentarios ({comentarios.length || 0})</h2>
            <form className="formulario-comentario" onSubmit={manejarEnviarComentario}>
              <textarea
                className="textarea-comentario"
                placeholder="Comparte tu opinión sobre este artículo..."
                value={comentarioTexto}
                onChange={(e) => setComentarioTexto(e.target.value)}
                required
              ></textarea>
              <button
                type="submit"
                className="boton-enviar-comentario"
                disabled={enviandoComentario}
              >
                {enviandoComentario ? 'Enviando...' : 'Publicar Comentario'}
              </button>
            </form>
            <div className="lista-comentarios">
              {comentarios.map((comentario) => (
                <div key={comentario.id_comentario} className="comentario">
                  <div className="header-comentario">
                    <div
                      className="avatar-comentario"
                    >
                      {comentario.iniciales || "RB"}
                    </div>
                    <div className="info-comentario">
                      <h4 className="nombre-comentario">{comentario.id_usuario.nombre_completo || "Roberto"}</h4>
                      <span className="fecha-comentario">
                        {calcularTiempoRelativo(comentario.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="texto-comentario">{comentario.contenido}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Barra Lateral */}
        <aside className="barra-lateral-noticia">
          {/* Tabla de Contenidos */}
          {seccionesRef.current.length > 0 && (
            <div className="widget-lateral">
              <h3 className="titulo-widget">Tabla de Contenidos</h3>
              <ul className="lista-toc">
                {seccionesRef.current.map((seccion) => (
                  <li key={seccion.id} className="item-toc">
                    <button
                      className="enlace-toc"
                      onClick={() => scrollASeccion(seccion.id)}
                    >
                      {seccion.texto}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Newsletter */}
          <div className="widget-lateral">
            <h3 className="titulo-widget">Newsletter {noticia.categoria}</h3>
            <p className="descripcion-newsletter">
              Recibe las últimas noticias directamente en tu email.
            </p>
            <form className="formulario-newsletter" onSubmit={manejarNewsletter}>
              <input
                type="email"
                placeholder="tu@email.com"
                className="input-newsletter"
                required
              />
              <button type="submit" className="boton-newsletter">
                Suscribirse
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Noticia;
