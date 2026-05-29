-- ============================================================
-- Performance indexes for columns used in WHERE, JOIN, and
-- ORDER BY clauses across the application.
--
-- Run this migration in the Supabase SQL Editor or via the CLI:
--   supabase db push
--
-- Every CREATE INDEX uses IF NOT EXISTS so the script is
-- safe to re-run.
-- ============================================================

-- Enable the pg_trgm extension (needed for ILIKE / trigram indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------
-- Table: "Noticia"
-- ----------------------------------------------------------

-- WHERE estado = '...' / IN (estado, [...])
CREATE INDEX IF NOT EXISTS idx_noticia_estado
  ON "Noticia" ("estado");

-- WHERE categoria ILIKE '...'  (trigram GIN index for pattern matching)
CREATE INDEX IF NOT EXISTS idx_noticia_categoria_trgm
  ON "Noticia" USING gin ("categoria" gin_trgm_ops);

-- ORDER BY fecha_creacion DESC
CREATE INDEX IF NOT EXISTS idx_noticia_fecha_creacion
  ON "Noticia" ("fecha_creacion" DESC);

-- ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_noticia_created_at
  ON "Noticia" ("created_at" DESC);

-- WHERE id_categoria = ...  (foreign key to Seccion)
CREATE INDEX IF NOT EXISTS idx_noticia_id_categoria
  ON "Noticia" ("id_categoria");

-- WHERE id_usuario_creador = ...  (foreign key to Usuario)
CREATE INDEX IF NOT EXISTS idx_noticia_id_usuario_creador
  ON "Noticia" ("id_usuario_creador");

-- Composite: filter by estado + sort by created_at (Panel de noticias, GestionarNoticias)
CREATE INDEX IF NOT EXISTS idx_noticia_estado_created_at
  ON "Noticia" ("estado", "created_at" DESC);

-- Composite: filter by id_categoria + estado + sort by created_at (Secciones page)
CREATE INDEX IF NOT EXISTS idx_noticia_id_categoria_estado_created_at
  ON "Noticia" ("id_categoria", "estado", "created_at" DESC);

-- ----------------------------------------------------------
-- Table: "Seccion"
-- ----------------------------------------------------------

-- WHERE estado = 1
CREATE INDEX IF NOT EXISTS idx_seccion_estado
  ON "Seccion" ("estado");

-- WHERE nombre_id = '...'  (slug lookup in Secciones page)
CREATE INDEX IF NOT EXISTS idx_seccion_nombre_id
  ON "Seccion" ("nombre_id");

-- ORDER BY nombre ASC
CREATE INDEX IF NOT EXISTS idx_seccion_nombre
  ON "Seccion" ("nombre");

-- ----------------------------------------------------------
-- Table: "Usuario"
-- ----------------------------------------------------------

-- WHERE id_user_autenticacion = ...  (auth lookup on every login / session check)
CREATE INDEX IF NOT EXISTS idx_usuario_id_user_autenticacion
  ON "Usuario" ("id_user_autenticacion");

-- ----------------------------------------------------------
-- Table: "Comentario"
-- ----------------------------------------------------------

-- WHERE id_noticia = ...  (load comments for a news article)
CREATE INDEX IF NOT EXISTS idx_comentario_id_noticia
  ON "Comentario" ("id_noticia");

-- WHERE id_usuario = ...  (filter comments by user)
CREATE INDEX IF NOT EXISTS idx_comentario_id_usuario
  ON "Comentario" ("id_usuario");

-- ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_comentario_created_at
  ON "Comentario" ("created_at" DESC);

-- Composite: filter by id_noticia + id_usuario + sort by created_at
-- (exact query in Noticia.jsx comment loading)
CREATE INDEX IF NOT EXISTS idx_comentario_noticia_usuario_created
  ON "Comentario" ("id_noticia", "id_usuario", "created_at" DESC);
