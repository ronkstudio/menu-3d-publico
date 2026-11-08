// Menú 3D · función "panel" de Supabase (Edge Function).
// Hace de intermediario seguro: el panel de cada local manda sus cambios acá con su usuario,
// y esta función los publica en GitHub con TU token, que queda guardado en Supabase (nunca llega al local).
//
// Acciones (POST con JSON, siempre con la sesión del usuario):
//   { accion: "mis-locales" }                                   → qué locales puede editar
//   { accion: "publicar", carpeta, archivos: [...], mensaje }    → publica cambios de un local
//   { accion: "crear-usuario", email, password, carpeta, whatsapp } → (solo admin) crea el usuario de un local
//   { accion: "usuarios" }                                       → (solo admin) lista los usuarios de los locales
//   { accion: "nueva-clave", id, password, whatsapp }             → (solo admin) le pone otra contraseña a un local
//   { accion: "borrar-usuario", id }                             → (solo admin) borra el usuario de un local
//   { accion: "mi-plan", carpeta }                               → plan, vencimiento y últimos pagos de un local
//   { accion: "registrar-pago", carpeta, monto, comprobante }    → renueva el plan (el local tiene que mandar comprobante)
//   { accion: "ver-comprobante", id }                            → (solo admin) link temporal al comprobante
//   { accion: "revisar-pago", id, estado }                       → (solo admin) confirma un pago o lo anula
//
// Secreto que hay que cargar en Supabase (Edge Functions → Secrets):
//   GITHUB_TOKEN   token de GitHub con "Contents: Read and write" sobre menu-3d-publico
// El proyecto y el autor de los cambios no son secretos: están acá abajo (si cambia el usuario de GitHub, se cambian acá).

import { createClient } from 'npm:@supabase/supabase-js@2';

const ORIGENES = ['https://ronkstudio.github.io', 'http://localhost:8765'];
const REPO = 'ronkstudio/menu-3d-publico';
const AUTOR = { name: 'ronkstudio', email: '351777670+ronkstudio@users.noreply.github.com' };
const RAMA = 'main';
const API = 'https://api.github.com/repos/' + REPO;
const MAX_ARCHIVOS = 40, MAX_BYTES = 20 * 1024 * 1024;

function cors(req: Request) {
  const o = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGENES.includes(o) ? o : ORIGENES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
function responder(req: Request, cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors(req), 'Content-Type': 'application/json' } });
}

async function github(ruta: string, opciones: { method?: string; body?: unknown } = {}) {
  const r = await fetch(API + ruta, {
    method: opciones.method ?? 'GET',
    headers: { Authorization: 'Bearer ' + Deno.env.get('GITHUB_TOKEN'), Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  if (!r.ok) throw new Error('GitHub ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}
function base64Texto(s: string) {
  const b = new TextEncoder().encode(s);
  let t = ''; for (let i = 0; i < b.length; i += 0x8000) t += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(t);
}

type Archivo = { ruta: string; texto?: string; dataUrl?: string; borrar?: boolean };

/* página de entrada del local (la que lee WhatsApp al compartir el link: título e imagen).
   Cuando publica un local, se arma acá a partir de su menú, así queda al día aunque cambie el nombre.
   Es la misma que arma el panel del administrador (paginaLocal en panel/index.html). */
const SITIO = 'https://' + REPO.split('/')[0] + '.github.io/' + REPO.split('/')[1] + '/';
function esc(s: unknown) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]); }
function paginaLocal(m: { nombre?: string; colores?: { claro?: { acento?: string } } }, dir: string) {
  const n = esc(m.nombre), url = SITIO + dir + '/', v = Date.now().toString(36);
  const acento = m.colores?.claro?.acento ?? '', color = /^#[0-9a-f]{3,8}$/i.test(acento) ? acento : '#b5832f';
  const js = (f: string) => '<script src="../motor/' + f + '"></' + 'script>\n';
  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<!-- Datos para cuando se comparte el link (WhatsApp, etc.). El menú en sí está en menu.json. Esta página se genera al publicar -->\n' +
    '<title>' + n + ' · Menú 3D</title>\n<meta name="description" content="Menú digital con platos en 3D. Escaneá el QR o acercá el celular al NFC y mirá cada plato sobre tu mesa.">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:url" content="' + esc(url) + '">\n' +
    '<meta property="og:title" content="' + n + ' · Menú 3D">\n<meta property="og:description" content="Mirá cada plato en 3D sobre tu mesa antes de elegir.">\n' +
    '<meta property="og:image" content="' + esc(url + 'compartir.jpg?v=' + v) + '">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="theme-color" content="' + color + '">\n' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%27.9em%27 font-size=%2790%27%3E%F0%9F%8D%BD%3C/text%3E%3C/svg%3E">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="../motor/menu.css">\n</head>\n<body data-menu="menu.json">\n' +
    js('menu.js') + js('cargar-three.js') + js('relieve.js') + js('visor3d.js') + js('mascota.js') + '</body>\n</html>\n';
}

/* publica varios archivos en un solo cambio (commit) */
async function publicar(archivos: Archivo[], mensaje: string) {
  const ref = await github('/git/ref/heads/' + RAMA);
  const padre = ref.object.sha;
  const commit = await github('/git/commits/' + padre);
  const arbol = [];
  for (const a of archivos) {
    if (a.borrar) { arbol.push({ path: a.ruta, mode: '100644', type: 'blob', sha: null }); continue; }
    const contenido = a.dataUrl ? a.dataUrl.split(',')[1] : base64Texto(a.texto ?? '');
    const b = await github('/git/blobs', { method: 'POST', body: { content: contenido, encoding: 'base64' } });
    arbol.push({ path: a.ruta, mode: '100644', type: 'blob', sha: b.sha });
  }
  const nuevoArbol = await github('/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: arbol } });
  const nuevo = await github('/git/commits', { method: 'POST', body: { message: mensaje, tree: nuevoArbol.sha, parents: [padre], author: AUTOR, committer: AUTOR } });
  await github('/git/refs/heads/' + RAMA, { method: 'PATCH', body: { sha: nuevo.sha } });
}

/* ---------- pagos: cada período se cuenta desde "desde" y dura según la forma de pago ---------- */
const MESES: Record<string, number> = { mensual: 1, semestral: 6, anual: 12 };
const DIAS_ANTES = 15;                     /* un local puede renovar desde 15 días antes del vencimiento */
const MAX_COMPROBANTE = 5 * 1024 * 1024;
const DEPOSITO = 'comprobantes';
function hoyAR() { return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); } /* Argentina: UTC-3 todo el año */
function sumarMeses(iso: string, n: number) { const [a, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(a, m - 1 + n, d)).toISOString().slice(0, 10); }
function sumarDias(iso: string, n: number) { const [a, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10); }
function venceDe(p: { desde: string; pago: string }) { return sumarMeses(p.desde, MESES[p.pago]); }
function fechaTexto(iso: string) { const [a, m, d] = iso.split('-'); return d + '/' + m + '/' + a; }
async function huellaDe(b: Uint8Array) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', b));
  return Array.from(h).map((x) => x.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const sesion = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
    const { data: { user } } = await sesion.auth.getUser();
    if (!user) return responder(req, { error: 'Tenés que iniciar sesión.' }, 401);

    const servidor = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: permisos } = await servidor.from('usuarios_locales').select('carpeta, rol').eq('user_id', user.id);
    const esAdmin = (permisos ?? []).some((p) => p.rol === 'admin');
    const cuerpo = await req.json();

    if (cuerpo.accion === 'mis-locales') return responder(req, { admin: esAdmin, locales: (permisos ?? []).map((p) => p.carpeta) });

    if (cuerpo.accion === 'publicar') {
      const carpeta = String(cuerpo.carpeta ?? '');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(carpeta)) return responder(req, { error: 'Carpeta inválida.' }, 400);
      if (!esAdmin && !(permisos ?? []).some((p) => p.carpeta === carpeta)) return responder(req, { error: 'No tenés permiso para este local.' }, 403);
      const archivos: Archivo[] = Array.isArray(cuerpo.archivos) ? cuerpo.archivos : [];
      if (!archivos.length || archivos.length > MAX_ARCHIVOS) return responder(req, { error: 'Cantidad de archivos inválida.' }, 400);
      let total = 0;
      for (const a of archivos) {
        const ruta = String(a.ruta ?? '');
        total += (a.texto ?? a.dataUrl ?? '').length;
        if (ruta.includes('..') || ruta.startsWith('/')) return responder(req, { error: 'Ruta inválida: ' + ruta }, 400);
        if (!esAdmin) {
          /* un local solo toca su carpeta: menú, fotos y modelos (nada de páginas, nada de borrar) */
          if (!ruta.startsWith(carpeta + '/') || a.borrar || !/\.(json|jpg|png)$/.test(ruta)) return responder(req, { error: 'No se puede publicar ' + ruta }, 403);
          if (a.dataUrl && !/^data:image\/(jpeg|png);base64,/.test(a.dataUrl)) return responder(req, { error: 'Imagen inválida: ' + ruta }, 400);
          if (ruta.endsWith('.json')) JSON.parse(a.texto ?? ''); /* tiene que ser un menú válido */
        }
      }
      if (total > MAX_BYTES) return responder(req, { error: 'Los archivos son demasiado grandes.' }, 413);
      /* un local no manda páginas: si cambió su menú, su página de entrada se arma acá (nombre al día al compartir) */
      const menu = archivos.find((a) => a.ruta === carpeta + '/menu.json');
      if (!esAdmin && menu) {
        /* lo que incluye el plan lo decide el administrador: un local no lo puede cambiar al publicar,
           ni pasarse de los platos en 3D de su plan (las bebidas no cuentan) */
        const nuevo = JSON.parse(menu.texto ?? '{}');
        const actual = await github('/contents/' + carpeta + '/menu.json?ref=' + RAMA).then((r) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(String(r.content).replace(/\n/g, '')), (c) => c.charCodeAt(0))))).catch(() => null);
        if (actual?.incluye) nuevo.incluye = actual.incluye; else delete nuevo.incluye;
        const limite = Number(nuevo.incluye?.platos3d) || 0;
        if (limite) {
          const bebida = (id: string) => (nuevo.categorias ?? []).some((c: { id?: string; nombre?: string }) => c.id === id && /bebida|trago|c[oó]ctel|vino|cerveza/i.test((c.nombre ?? '') + ' ' + (c.id ?? '')));
          const con3d = (nuevo.platos ?? []).filter((p: { modelo?: unknown; categoria?: string }) => p.modelo && !bebida(String(p.categoria))).length;
          if (con3d > limite) return responder(req, { error: 'Tu plan incluye hasta ' + limite + ' platos en 3D (sin contar bebidas) y tenés ' + con3d + '. Quitale el 3D a alguno para publicar.' }, 400);
        }
        menu.texto = JSON.stringify(nuevo, null, 2) + '\n';
        archivos.push({ ruta: carpeta + '/index.html', texto: paginaLocal(nuevo, carpeta) });
      }
      await publicar(archivos, String(cuerpo.mensaje ?? 'Actualiza el menú de ' + carpeta).slice(0, 120));
      return responder(req, { ok: true });
    }

    /* ---------- plan y pagos ---------- */
    const esDelLocal = (c: string) => /^[a-z0-9][a-z0-9-]*$/.test(c) && (esAdmin || (permisos ?? []).some((p) => p.carpeta === c));

    /* lo que el local ve de su plan: { plan: { plan, pago, desde, vence, abre }, pagos: [{ fecha, monto, estado }] } */
    if (cuerpo.accion === 'mi-plan') {
      const carpeta = String(cuerpo.carpeta ?? '');
      if (!esDelLocal(carpeta)) return responder(req, { error: 'No tenés permiso para este local.' }, 403);
      const { data: pl, error } = await servidor.from('planes').select('plan, pago, desde').eq('carpeta', carpeta).maybeSingle();
      if (error) throw error;
      if (!pl) return responder(req, { plan: null, pagos: [] });
      const { data: pagos } = await servidor.from('pagos').select('fecha, monto, estado').eq('carpeta', carpeta).order('id', { ascending: false }).limit(6);
      const vence = venceDe(pl);
      return responder(req, { plan: { ...pl, vence, abre: sumarDias(vence, -DIAS_ANTES) }, pagos: pagos ?? [] });
    }

    /* renueva el plan un período. Si todavía no venció, el período nuevo arranca cuando termina el actual (no se pierden días);
       si ya venció, arranca hoy. El local tiene que mandar el comprobante y su pago queda "para revisar". */
    if (cuerpo.accion === 'registrar-pago') {
      const carpeta = String(cuerpo.carpeta ?? '');
      if (!esDelLocal(carpeta)) return responder(req, { error: 'No tenés permiso para este local.' }, 403);
      const { data: pl, error } = await servidor.from('planes').select('plan, pago, desde').eq('carpeta', carpeta).maybeSingle();
      if (error) throw error;
      if (!pl) return responder(req, { error: 'Este local todavía no tiene un plan cargado.' }, 400);
      const hoy = hoyAR(), vence = venceDe(pl);
      if (!esAdmin && hoy < sumarDias(vence, -DIAS_ANTES)) return responder(req, { error: 'Tu plan está al día hasta el ' + fechaTexto(vence) + '. Vas a poder renovarlo desde el ' + fechaTexto(sumarDias(vence, -DIAS_ANTES)) + '.' }, 400);

      let ruta: string | null = null, huella: string | null = null;
      const archivo = String(cuerpo.comprobante ?? '');
      if (!esAdmin || archivo) {
        const m = /^data:(image\/jpeg|image\/png|application\/pdf);base64,(.+)$/.exec(archivo);
        if (!m) return responder(req, { error: 'Mandá el comprobante como foto o PDF.' }, 400);
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        if (bytes.length > MAX_COMPROBANTE) return responder(req, { error: 'El comprobante pesa demasiado: el máximo es 5 MB.' }, 400);
        huella = await huellaDe(bytes);
        const { data: repetido } = await servidor.from('pagos').select('id').eq('carpeta', carpeta).eq('huella', huella).maybeSingle();
        if (repetido) return responder(req, { error: 'Ese comprobante ya fue enviado.' }, 400);
        ruta = carpeta + '/' + huella + (m[1] === 'application/pdf' ? '.pdf' : m[1] === 'image/png' ? '.png' : '.jpg');
        const { error: sinSubir } = await servidor.storage.from(DEPOSITO).upload(ruta, bytes, { contentType: m[1], upsert: false });
        if (sinSubir) return responder(req, { error: 'No se pudo guardar el comprobante. Probá de nuevo.' }, 500);
      }
      const borrarArchivo = async () => { if (ruta) await servidor.storage.from(DEPOSITO).remove([ruta]); };

      const nuevo = vence > hoy ? vence : hoy;
      const { data: fila, error: sinPago } = await servidor.from('pagos').insert({
        carpeta, fecha: hoy, plan: pl.plan, pago: pl.pago, monto: Math.max(0, Math.round(Number(cuerpo.monto) || 0)) || null,
        desde_antes: pl.desde, desde_nuevo: nuevo, origen: esAdmin ? 'admin' : 'local', estado: esAdmin ? 'ok' : 'revisar', comprobante: ruta, huella,
      }).select('id').single();
      if (sinPago) { await borrarArchivo(); throw sinPago; }
      /* solo si el plan sigue como se leyó: dos pagos al mismo tiempo no pueden sumarse */
      const { data: cambiado, error: sinPlan } = await servidor.from('planes').update({ desde: nuevo, actualizado: new Date().toISOString() }).eq('carpeta', carpeta).eq('desde', pl.desde).select('carpeta');
      if (sinPlan || !cambiado?.length) {
        await servidor.from('pagos').delete().eq('id', fila.id); await borrarArchivo();
        return responder(req, { error: 'No se pudo renovar el plan. Recargá la página y probá de nuevo.' }, 409);
      }
      return responder(req, { ok: true, id: fila.id, desde: nuevo, vence: sumarMeses(nuevo, MESES[pl.pago]) });
    }

    /* link temporal para mirar un comprobante (el depósito es privado) */
    if (cuerpo.accion === 'ver-comprobante') {
      if (!esAdmin) return responder(req, { error: 'Solo el administrador puede ver los comprobantes.' }, 403);
      const { data: p } = await servidor.from('pagos').select('comprobante').eq('id', Number(cuerpo.id)).maybeSingle();
      if (!p?.comprobante) return responder(req, { error: 'Este pago no tiene comprobante.' }, 404);
      const { data, error } = await servidor.storage.from(DEPOSITO).createSignedUrl(p.comprobante, 600);
      if (error) throw error;
      return responder(req, { url: data.signedUrl, pdf: p.comprobante.endsWith('.pdf') });
    }

    /* confirmar un pago o anularlo. Anular devuelve el plan al vencimiento de antes */
    if (cuerpo.accion === 'revisar-pago') {
      if (!esAdmin) return responder(req, { error: 'Solo el administrador puede revisar pagos.' }, 403);
      const estado = String(cuerpo.estado ?? '');
      if (estado !== 'ok' && estado !== 'anulado') return responder(req, { error: 'Estado inválido.' }, 400);
      const { data: p } = await servidor.from('pagos').select('id, carpeta, estado, desde_antes, desde_nuevo').eq('id', Number(cuerpo.id)).maybeSingle();
      if (!p) return responder(req, { error: 'Ese pago ya no existe.' }, 404);
      if (p.estado === 'anulado') return responder(req, { error: 'Ese pago ya está anulado.' }, 400);
      let desde: string | null = null;
      if (estado === 'anulado') {
        const { data: cambiado, error } = await servidor.from('planes').update({ desde: p.desde_antes, actualizado: new Date().toISOString() }).eq('carpeta', p.carpeta).eq('desde', p.desde_nuevo).select('carpeta');
        if (error) throw error;
        if (!cambiado?.length) return responder(req, { error: 'El plan cambió después de este pago. Anulá primero el pago más nuevo, o corregí la fecha con "Cambiar plan".' }, 409);
        desde = p.desde_antes;
      }
      const { error } = await servidor.from('pagos').update({ estado }).eq('id', p.id);
      if (error) throw error;
      return responder(req, { ok: true, desde });
    }

    /* ---------- usuarios de los locales: todo esto es solo para el administrador ---------- */
    const whatsapp = String(cuerpo.whatsapp ?? '').replace(/\D/g, '').slice(0, 15); /* se guarda para volver a escribirle */

    if (cuerpo.accion === 'crear-usuario') {
      if (!esAdmin) return responder(req, { error: 'Solo el administrador puede crear usuarios.' }, 403);
      const carpeta = String(cuerpo.carpeta ?? '');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(carpeta)) return responder(req, { error: 'Carpeta inválida.' }, 400);
      const { data, error } = await servidor.auth.admin.createUser({
        email: cuerpo.email, password: cuerpo.password, email_confirm: true, user_metadata: whatsapp ? { whatsapp } : {},
      });
      if (error) return responder(req, { error: error.message }, 400);
      const { error: sinLocal } = await servidor.from('usuarios_locales').insert({ user_id: data.user.id, carpeta, rol: 'local' });
      if (sinLocal) { /* no se pudo asignar el local: se borra el usuario para no dejarlo a medias */
        await servidor.auth.admin.deleteUser(data.user.id);
        return responder(req, { error: 'No se pudo asignar el local: ' + sinLocal.message }, 500);
      }
      return responder(req, { ok: true, id: data.user.id });
    }

    /* lista de usuarios de los locales: [{ id, carpeta, email, whatsapp, creado, ultimoIngreso }] */
    if (cuerpo.accion === 'usuarios') {
      if (!esAdmin) return responder(req, { error: 'Solo el administrador puede ver los usuarios.' }, 403);
      const { data: filas, error } = await servidor.from('usuarios_locales').select('user_id, carpeta, rol, creado');
      if (error) throw error;
      const cuentas = new Map<string, { email?: string; created_at?: string; last_sign_in_at?: string; user_metadata?: Record<string, unknown> }>();
      for (let pagina = 1; pagina <= 20; pagina++) {
        const { data, error: e } = await servidor.auth.admin.listUsers({ page: pagina, perPage: 1000 });
        if (e) throw e;
        for (const u of data.users) cuentas.set(u.id, u);
        if (data.users.length < 1000) break;
      }
      const usuarios = (filas ?? []).filter((f) => f.rol === 'local').map((f) => {
        const u = cuentas.get(f.user_id);
        return {
          id: f.user_id, carpeta: f.carpeta, email: u?.email ?? '', whatsapp: String(u?.user_metadata?.whatsapp ?? ''),
          creado: u?.created_at ?? f.creado, ultimoIngreso: u?.last_sign_in_at ?? null,
        };
      });
      return responder(req, { usuarios });
    }

    /* nueva contraseña o borrar: solo usuarios de locales (al administrador no se lo toca desde acá) */
    if (cuerpo.accion === 'nueva-clave' || cuerpo.accion === 'borrar-usuario') {
      if (!esAdmin) return responder(req, { error: 'Solo el administrador puede cambiar usuarios.' }, 403);
      const id = String(cuerpo.id ?? '');
      const { data: suyos } = await servidor.from('usuarios_locales').select('rol').eq('user_id', id);
      if (!suyos?.length) return responder(req, { error: 'Ese usuario ya no existe.' }, 404);
      if (suyos.some((p) => p.rol === 'admin')) return responder(req, { error: 'Ese usuario es administrador: se cambia desde Supabase.' }, 403);
      if (cuerpo.accion === 'nueva-clave') {
        const password = String(cuerpo.password ?? '');
        if (password.length < 8) return responder(req, { error: 'La contraseña tiene que tener al menos 8 caracteres.' }, 400);
        const { error } = await servidor.auth.admin.updateUserById(id, whatsapp ? { password, user_metadata: { whatsapp } } : { password });
        if (error) return responder(req, { error: error.message }, 400);
        return responder(req, { ok: true });
      }
      const { error } = await servidor.auth.admin.deleteUser(id); /* sus permisos se borran solos (on delete cascade) */
      if (error) return responder(req, { error: error.message }, 400);
      return responder(req, { ok: true });
    }

    return responder(req, { error: 'Acción desconocida.' }, 400);
  } catch (e) {
    return responder(req, { error: String((e as Error).message ?? e) }, 500);
  }
});
