var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var SESSION_COOKIE = "wp_session";
var SESSION_DAYS = 30;
var encoder = new TextEncoder();
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    try {
      if (url.pathname === "/health") {
        let database = env.DB ? "bound" : "missing";
        if (env.DB) {
          try {
            await env.DB.prepare("SELECT 1 AS ok").first();
            database = "ok";
          } catch (e) {
            console.error("health_db_error", e?.stack || e);
            database = "error";
          }
        }
        return json({ ok: true, service: "watermark-pro-api", database, bootstrap: Boolean(env.BOOTSTRAP_TOKEN) }, 200, cors);
      }
      if (url.pathname === "/setup") {
        if (request.method === "GET") return await setupPage(env);
        if (request.method === "POST") return await handleSetupPost(request, env);
      }
      if (!url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404, cors);
      if (isMutation(request.method) && !originAllowed(origin, env)) {
        return json({ error: "Origin tidak dibenarkan." }, 403, cors);
      }
      await cleanupExpiredSessions(env);
      if (url.pathname === "/api/public/state" && request.method === "GET") return json(await getPublicState(env), 200, cors);
      if (url.pathname === "/api/auth/register" && request.method === "POST") return await registerUser(request, env, cors);
      if (url.pathname === "/api/auth/login" && request.method === "POST") return await loginUser(request, env, cors);
      if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") return await forgotPassword(request, env, cors);
      if (url.pathname === "/api/auth/logout" && request.method === "POST") return await logoutUser(request, env, cors);
      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        const user = await requireUser(request, env);
        return json({ user: publicUser(user) }, 200, cors);
      }
      if (url.pathname === "/api/account/notifications/read" && request.method === "POST") {
        const user = await requireUser(request, env);
        const body = await readBody(request);
        const id = String(body.id || "");
        const notice = await env.DB.prepare("SELECT id FROM notifications WHERE id=? AND (audience='ALL' OR lower(audience)=lower(?))").bind(id, user.username).first();
        if (!notice) throw new HttpError(404, "Notifikasi tidak ditemui.");
        await env.DB.prepare("INSERT OR IGNORE INTO notification_reads (user_id,notification_id,read_at) VALUES (?,?,?)").bind(user.id, id, nowIso()).run();
        return json({ ok: true }, 200, cors);
      }
      if (url.pathname === "/api/account/image-proxy" && request.method === "GET") {
        const user = await requireUser(request, env);
        return await exportAvatar(request, env, cors, user);
      }
      if (url.pathname === "/api/account/state" && request.method === "GET") {
        const user = await requireUser(request, env);
        return json(await getAccountState(env, user), 200, cors);
      }
      if (url.pathname === "/api/account/profile" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        return await updateProfile(request, env, cors, user);
      }
      if (url.pathname === "/api/account/password" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        return await changePassword(request, env, cors, user);
      }
      if (url.pathname === "/api/account" && request.method === "DELETE") {
        const user = await requireUser(request, env);
        if (user.role !== "user") {
          throw new HttpError(403, "Akaun pemilik tidak boleh dipadam melalui laman pengguna.");
        }
        await deleteUserRecords(env, user);
        const headers = new Headers(cors);
        clearSessionCookie(headers);
        return json({ ok: true }, 200, headers);
      }
      if (url.pathname === "/api/account/downloads" && request.method === "POST") {
        const user = await requireUser(request, env);
        return await addDownloadUsage(request, env, cors, user);
      }
      if (url.pathname === "/api/payments" && request.method === "POST") {
        const user = await requireUser(request, env);
        return await submitPayment(request, env, cors, user);
      }
      if (url.pathname === "/api/control/image-proxy" && request.method === "GET") {
        await requireAdmin(request, env);
        const user = await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(url.searchParams.get("userId") || "").first();
        if (!user) throw new HttpError(404, "Pengguna tidak ditemui.");
        return await exportAvatar(request, env, cors, user);
      }
      if (/^\/api\/control\/users\/[^/]+\/password$/.test(url.pathname) && request.method === "PATCH") {
        await requireAdmin(request, env);
        return await resetControlPassword(request, env, cors, decodeURIComponent(url.pathname.split("/")[4]));
      }
      if (url.pathname === "/api/control/state" && request.method === "GET") {
        await requireAdmin(request, env);
        return json(await getControlState(env), 200, cors);
      }
      if (url.pathname === "/api/control/settings" && request.method === "PUT") {
        await requireAdmin(request, env);
        return await saveSettings(request, env, cors);
      }
      if (url.pathname === "/api/control/plans" && request.method === "PUT") {
        await requireAdmin(request, env);
        return await savePlans(request, env, cors);
      }
      if (url.pathname === "/api/control/users" && request.method === "POST") {
        await requireAdmin(request, env);
        return await createControlUser(request, env, cors);
      }
      if (/^\/api\/control\/users\/[^/]+$/.test(url.pathname)) {
        await requireAdmin(request, env);
        const id = decodeURIComponent(url.pathname.split("/").pop());
        if (request.method === "PUT") return await updateControlUser(request, env, cors, id);
        if (request.method === "DELETE") return await deleteControlUser(env, cors, id);
      }
      if (/^\/api\/control\/users\/[^/]+\/grant$/.test(url.pathname) && request.method === "POST") {
        await requireAdmin(request, env);
        const id = decodeURIComponent(url.pathname.split("/")[4]);
        return await grantPro(request, env, cors, id);
      }
      if (/^\/api\/control\/users\/[^/]+\/remove-pro$/.test(url.pathname) && request.method === "POST") {
        await requireAdmin(request, env);
        const id = decodeURIComponent(url.pathname.split("/")[4]);
        return await removePro(env, cors, id);
      }
      if (/^\/api\/control\/submissions\/[^/]+\/review$/.test(url.pathname) && request.method === "POST") {
        await requireAdmin(request, env);
        const id = decodeURIComponent(url.pathname.split("/")[4]);
        return await reviewPayment(request, env, cors, id);
      }
      if (url.pathname === "/api/control/notifications" && request.method === "POST") {
        await requireAdmin(request, env);
        return await saveNotice(request, env, cors, null);
      }
      if (/^\/api\/control\/notifications\/[^/]+$/.test(url.pathname)) {
        await requireAdmin(request, env);
        const id = decodeURIComponent(url.pathname.split("/").pop());
        if (request.method === "PUT") return await saveNotice(request, env, cors, id);
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM notifications WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }
      if (url.pathname === "/api/control/legal" && request.method === "PUT") {
        await requireAdmin(request, env);
        return await saveLegal(request, env, cors);
      }
      return json({ error: "Not found" }, 404, cors);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status, cors);
      console.error("worker_error", error?.stack || error);
      return json({ error: "Ralat pelayan.", detail: String(error?.message || error || "unknown") }, 500, cors);
    }
  }
};
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
function publicAvatarUrl(value, base) {
  let url;
  try {
    url = new URL(value, base);
  } catch {
    throw new HttpError(400, "Pautan avatar tidak sah.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new HttpError(400, "Gunakan pautan imej HTTP atau HTTPS awam.");
  const ipv4 = /^\d+\.\d+\.\d+\.\d+$/.test(host) ? host.split(".").map(Number) : null;
  const privateIPv4 = ipv4 && (ipv4[0] === 0 || ipv4[0] === 10 || ipv4[0] === 127 || ipv4[0] >= 224 || ipv4[0] === 100 && ipv4[1] >= 64 && ipv4[1] <= 127 || ipv4[0] === 169 && ipv4[1] === 254 || ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31 || ipv4[0] === 192 && ipv4[1] === 168);
  if (privateIPv4 || host.includes(":") && !/^[23][0-9a-f]{3}:/.test(host) || !host.includes(".") && !host.includes(":") || /(?:^|\.)(localhost|local|internal|home|lan|invalid)$/.test(host)) {
    throw new HttpError(400, "Pautan avatar mesti boleh diakses melalui internet awam.");
  }
  return url;
}
__name(publicAvatarUrl, "publicAvatarUrl");
function avatarMediaType(bytes, declared) {
  const starts = /* @__PURE__ */ __name((values) => values.every((value, index) => bytes[index] === value), "starts");
  const ascii = /* @__PURE__ */ __name((start, end) => String.fromCharCode(...bytes.subarray(start, end)), "ascii");
  if (starts([137, 80, 78, 71, 13, 10, 26, 10])) return "image/png";
  if (starts([255, 216, 255])) return "image/jpeg";
  if (/^GIF8[79]a$/.test(ascii(0, 6))) return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 40))) return "image/avif";
  if (ascii(0, 2) === "BM") return "image/bmp";
  if (starts([0, 0, 1, 0])) return "image/x-icon";
  if (declared === "image/svg+xml" && /<svg[\s>]/i.test(new TextDecoder().decode(bytes.subarray(0, 4096)))) return declared;
  throw new HttpError(502, "Pautan avatar tidak mengembalikan fail imej yang boleh dibaca.");
}
__name(avatarMediaType, "avatarMediaType");
async function exportAvatar(request, env, cors, user) {
  const requested = new URL(request.url).searchParams.get("url");
  if (!requested || requested !== user.photo) throw new HttpError(403, "Hanya avatar akaun yang disimpan boleh dieksport.");
  let target = publicAvatarUrl(requested);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15e3);
  try {
    let response;
    for (let hop = 0; hop <= 5; hop++) {
      response = await fetch(target.href, { redirect: "manual", signal: controller.signal, headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" } });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const next = response.headers.get("Location");
      await response.body?.cancel();
      if (!next || hop === 5) throw new HttpError(502, "Terlalu banyak redirect pada pautan avatar.");
      target = publicAvatarUrl(next, target);
    }
    if (!response.ok || !response.body) throw new HttpError(502, "Hos foto menolak muat turun avatar (HTTP " + response.status + ").");
    const declared = (response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    const reader = response.body.getReader(), chunks = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 10 * 1024 * 1024) {
        await reader.cancel();
        throw new HttpError(413, "Avatar melebihi 10 MB.");
      }
      chunks.push(value);
    }
    const blob = new Blob(chunks), type = avatarMediaType(new Uint8Array(await blob.slice(0, 4096).arrayBuffer()), declared);
    const headers = new Headers(cors);
    headers.set("Content-Type", type);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, no-store");
    headers.set("Content-Security-Policy", "sandbox; default-src 'none'");
    headers.set("Content-Disposition", 'attachment; filename="avatar"');
    return new Response(blob, { headers });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, controller.signal.aborted ? "Hos foto mengambil masa terlalu lama untuk membalas." : "Sambungan ke hos foto gagal.");
  } finally {
    clearTimeout(timer);
  }
}
__name(exportAvatar, "exportAvatar");
function isMutation(method) {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}
__name(isMutation, "isMutation");
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
function uid(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}
__name(uid, "uid");
function normalizeUsername(value) {
  const clean = String(value || "").trim().toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9._]/g, "");
  return clean ? `@${clean}` : "";
}
__name(normalizeUsername, "normalizeUsername");
function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
__name(normalizeEmail, "normalizeEmail");
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
__name(validEmail, "validEmail");
function validatePassword(value) {
  if (value.length < 8 || value.length > 256) throw new HttpError(400, "Kata laluan mestilah 8 hingga 256 aksara.");
}
__name(validatePassword, "validatePassword");
function clampInt(value, min, max, fallback = min) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
__name(clampInt, "clampInt");
function addMonthsIso(base, months) {
  const date = new Date(base || Date.now());
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.toISOString();
}
__name(addMonthsIso, "addMonthsIso");
function parseOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "https://socmegy.com,https://www.socmegy.com,https://control.socmegy.com,https://socmegy.github.io,http://localhost:4173,http://127.0.0.1:4173").split(",").map((v) => v.trim()).filter(Boolean);
  return [.../* @__PURE__ */ new Set([...configured, "null"])];
}
__name(parseOrigins, "parseOrigins");
function originAllowed(origin, env) {
  if (!origin) return true;
  return parseOrigins(env).includes(origin);
}
__name(originAllowed, "originAllowed");
function corsHeaders(origin, env) {
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "no-store"
  });
  if (originAllowed(origin, env) && origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}
__name(corsHeaders, "corsHeaders");
function json(data, status = 200, baseHeaders = {}) {
  const headers = new Headers(baseHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { status, headers });
}
__name(json, "json");
async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}
__name(readBody, "readBody");
function bytesToBase64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
__name(bytesToBase64, "bytesToBase64");
function base64ToBytes(str) {
  const raw = atob(str);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
__name(base64ToBytes, "base64ToBytes");
function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bytesToBase64(arr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(randomToken, "randomToken");
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function hashPassword(password, saltBase64 = null) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 1e4 }, key, 256);
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash, salt) {
  const result = await hashPassword(password, salt);
  return timingSafeEqual(result.hash, hash);
}
__name(verifyPassword, "verifyPassword");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function bearerToken(request) {
  const raw = request.headers.get("Authorization") || "";
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}
__name(bearerToken, "bearerToken");
function authToken(request) {
  return bearerToken(request) || parseCookie(request, SESSION_COOKIE);
}
__name(authToken, "authToken");
function parseCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}
__name(parseCookie, "parseCookie");
function setSessionCookie(headers, token) {
  const maxAge = SESSION_DAYS * 86400;
  headers.append("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
}
__name(setSessionCookie, "setSessionCookie");
function clearSessionCookie(headers) {
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
__name(clearSessionCookie, "clearSessionCookie");
async function createSession(env, userId) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const created = /* @__PURE__ */ new Date();
  const expires = new Date(created.getTime() + SESSION_DAYS * 864e5);
  await env.DB.prepare("INSERT INTO sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)").bind(tokenHash, userId, created.toISOString(), expires.toISOString()).run();
  return token;
}
__name(createSession, "createSession");
async function getSessionUser(request, env) {
  const token = authToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>?
  `).bind(tokenHash, nowIso()).first();
  return row || null;
}
__name(getSessionUser, "getSessionUser");
async function requireUser(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) throw new HttpError(401, "Sila log masuk.");
  if (user.status !== "active") throw new HttpError(403, "Akaun tidak aktif.");
  return user;
}
__name(requireUser, "requireUser");
async function requireAdmin(request, env) {
  const user = await requireUser(request, env);
  if (user.role !== "admin") throw new HttpError(403, "Akses Pusat Kawalan diperlukan.");
  return user;
}
__name(requireAdmin, "requireAdmin");
async function cleanupExpiredSessions(env) {
  if (Math.random() < 0.03) await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(nowIso()).run();
}
__name(cleanupExpiredSessions, "cleanupExpiredSessions");
function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    photo: row.photo || "",
    plan: row.plan,
    status: row.status,
    publicProfile: row.public_profile === void 0 ? true : Boolean(row.public_profile),
    createdAt: row.created_at,
    proUntil: row.pro_until,
    downloads: { images: Number(row.downloads_images || 0), videos: Number(row.downloads_videos || 0) }
  };
}
__name(publicUser, "publicUser");
function bannerListFromValue(value) {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 30).map((item) => item.slice(0, 2048));
}
__name(bannerListFromValue, "bannerListFromValue");
async function registerUser(request, env, cors) {
  const body = await readBody(request);
  const username = normalizeUsername(body.username);
  const usernameBody = username.replace(/^@/, "");
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (usernameBody.length < 2 || usernameBody.length > 20) throw new HttpError(400, "Nama pengguna mestilah 2 hingga 20 aksara.");
  if (!validEmail(email)) throw new HttpError(400, "E-mel tidak sah.");
  validatePassword(password);
  const exists = await env.DB.prepare("SELECT id FROM users WHERE username=? OR email=?").bind(username, email).first();
  if (exists) throw new HttpError(409, "Nama pengguna atau e-mel sudah digunakan.");
  const id = uid("user");
  const { hash, salt } = await hashPassword(password);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id,username,email,password_hash,password_salt,role,photo,plan,status,created_at,downloads_images,downloads_videos)
    VALUES (?,?,?,?,?,'user','','free','active',?,0,0)`).bind(id, username, email, hash, salt, nowIso()),
    automaticNotification(env, username, "Akaun dicipta", "Akaun Watermark Pro anda berjaya dicipta.", "registered-" + id)
  ]);
  const token = await createSession(env, id);
  const headers = new Headers(cors);
  setSessionCookie(headers, token);
  const user = await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(id).first();
  return json({ ok: true, user: publicUser(user), token }, 201, headers);
}
__name(registerUser, "registerUser");
async function loginUser(request, env, cors) {
  const body = await readBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const adminOnly = Boolean(body.adminOnly);
  const user = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
  if (!user || !await verifyPassword(password, user.password_hash, user.password_salt)) throw new HttpError(401, "E-mel atau kata laluan tidak betul.");
  if (user.status !== "active") throw new HttpError(403, "Akaun tidak aktif.");
  if (adminOnly && user.role !== "admin") throw new HttpError(403, "Akaun ini tiada akses Pusat Kawalan.");
  const token = await createSession(env, user.id);
  const headers = new Headers(cors);
  setSessionCookie(headers, token);
  return json({ ok: true, user: publicUser(user), token }, 200, headers);
}
__name(loginUser, "loginUser");
async function changePassword(request, env, cors, user) {
  const body = await readBody(request);
  const current = String(body.currentPassword || "");
  const next = String(body.newPassword || "");
  if (!await verifyPassword(current, user.password_hash, user.password_salt)) throw new HttpError(400, "Kata laluan semasa tidak betul.");
  validatePassword(next);
  const { hash, salt } = await hashPassword(next);
  await env.DB.prepare("UPDATE users SET password_hash=?,password_salt=? WHERE id=?").bind(hash, salt, user.id).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run();
  const token = await createSession(env, user.id);
  const headers = new Headers(cors);
  setSessionCookie(headers, token);
  return json({ ok: true, token }, 200, headers);
}
__name(changePassword, "changePassword");
async function forgotPassword(request, env, cors) {
  const body = await readBody(request);
  const email = normalizeEmail(body.email);
  if (!validEmail(email)) throw new HttpError(400, "Masukkan e-mel yang sah.");
  return json({ ok: true, message: "Untuk menetapkan semula kata laluan, hubungi pentadbir Watermark Pro melalui Sokongan. Pentadbir akan mengesahkan identiti anda dan menetapkan kata laluan baharu. Kata laluan lama tidak diperlukan." }, 200, cors);
}
__name(forgotPassword, "forgotPassword");
async function logoutUser(request, env, cors) {
  const token = authToken(request);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256Hex(token)).run();
  const headers = new Headers(cors);
  clearSessionCookie(headers);
  return json({ ok: true }, 200, headers);
}
__name(logoutUser, "logoutUser");
async function updateProfile(request, env, cors, user) {
  const body = await readBody(request);
  const username = normalizeUsername(body.username ?? user.username);
  const usernameBody = username.replace(/^@/, "");
  const email = normalizeEmail(body.email ?? user.email);
  const photo = String(body.photo ?? user.photo ?? "").trim();
  const publicProfile = body.publicProfile === void 0 ? user.public_profile === void 0 ? true : Boolean(user.public_profile) : Boolean(body.publicProfile);
  if (usernameBody.length < 2 || usernameBody.length > 20) throw new HttpError(400, "Nama pengguna mestilah 2 hingga 20 aksara.");
  if (!validEmail(email)) throw new HttpError(400, "E-mel tidak sah.");
  const duplicate = await env.DB.prepare("SELECT id FROM users WHERE (username=? OR email=?) AND id<>?").bind(username, email, user.id).first();
  if (duplicate) throw new HttpError(409, "Nama pengguna atau e-mel sudah digunakan.");
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET username=?,email=?,photo=?,public_profile=? WHERE id=?").bind(username, email, photo, publicProfile ? 1 : 0, user.id),
    env.DB.prepare("UPDATE notifications SET audience=? WHERE lower(audience)=lower(?)").bind(username, user.username)
  ]);
  await env.DB.prepare("UPDATE submissions SET username=?,email=? WHERE user_id=?").bind(username, email, user.id).run();
  await env.DB.prepare("UPDATE subscriptions SET username=? WHERE user_id=?").bind(username, user.id).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(user.id).first();
  return json({ ok: true, user: publicUser(updated) }, 200, cors);
}
__name(updateProfile, "updateProfile");
async function addDownloadUsage(request, env, cors, user) {
  const body = await readBody(request);
  const images = clampInt(body.images, 0, 1e3, 0);
  const videos = clampInt(body.videos, 0, 1e3, 0);
  await env.DB.prepare("UPDATE users SET downloads_images=downloads_images+?, downloads_videos=downloads_videos+? WHERE id=?").bind(images, videos, user.id).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(user.id).first();
  return json({ ok: true, downloads: publicUser(updated).downloads }, 200, cors);
}
__name(addDownloadUsage, "addDownloadUsage");
async function submitPayment(request, env, cors, user) {
  const settings = await env.DB.prepare("SELECT * FROM settings WHERE id=1").first();
  if (!settings || !settings.payments_open) throw new HttpError(409, "Pembayaran sedang ditutup.");
  const pending = await env.DB.prepare("SELECT id FROM submissions WHERE user_id=? AND status='PENDING' LIMIT 1").bind(user.id).first();
  if (pending) throw new HttpError(409, "Anda masih mempunyai pembayaran yang menunggu semakan.");
  const body = await readBody(request);
  const paymentTime = String(body.paymentTime || "").trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(paymentTime)) throw new HttpError(400, "Masa pembayaran tidak sah.");
  const plan = await env.DB.prepare("SELECT * FROM plans WHERE slug='pro' AND active=1").first();
  if (!plan) throw new HttpError(409, "Pelan Penyokong Pro tidak tersedia.");
  let reference = String(body.reference || "").trim().toUpperCase();
  if (!/^PRO-[A-Z0-9]{5,20}$/.test(reference)) reference = `PRO-${randomToken(8).replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10)}`;
  const exists = await env.DB.prepare("SELECT id FROM submissions WHERE reference=?").bind(reference).first();
  if (exists) reference = `PRO-${randomToken(9).replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 11)}`;
  const submission = {
    id: uid("sub"),
    userId: user.id,
    username: user.username,
    email: user.email,
    planName: plan.name,
    reference,
    amount: Number(plan.discount_price ?? plan.normal_price ?? 0),
    paymentTime,
    submittedAt: nowIso(),
    status: "PENDING"
  };
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO submissions (id,user_id,username,email,plan_name,reference,amount,payment_time,submitted_at,status)
    VALUES (?,?,?,?,?,?,?,?,?,'PENDING')`).bind(submission.id, submission.userId, submission.username, submission.email, submission.planName, submission.reference, submission.amount, submission.paymentTime, submission.submittedAt),
    automaticNotification(env, user.username, "Pembayaran Pro dihantar", "Penghantaran pembayaran anda diterima dan sedang menunggu semakan serta kelulusan Watermark Pro.", "payment-" + submission.id)
  ]);
  return json({ ok: true, submission }, 201, cors);
}
__name(submitPayment, "submitPayment");
function automaticNotification(env, audience, title, text, eventId) {
  return env.DB.prepare("INSERT INTO notifications (id,title,text,audience,sender_username,sender_photo,created_at) VALUES (?,?,?,?,COALESCE((SELECT admin_username FROM settings WHERE id=1),'@watermarkpro'),COALESCE((SELECT admin_photo FROM settings WHERE id=1),''),?)").bind("notice-" + eventId, title, text, normalizeUsername(audience), nowIso());
}
__name(automaticNotification, "automaticNotification");
async function resetControlPassword(request, env, cors, id) {
  const user = await env.DB.prepare("SELECT id FROM users WHERE id=? AND role='user'").bind(id).first();
  if (!user) throw new HttpError(404, "Pengguna tidak ditemui.");
  const body = await readBody(request);
  const password = String(body.newPassword || "");
  validatePassword(password);
  const { hash, salt } = await hashPassword(password);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash=?,password_salt=? WHERE id=?").bind(hash, salt, id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(id)
  ]);
  return json({ ok: true, message: "Kata laluan pengguna berjaya ditukar. Semua sesi lama telah ditamatkan." }, 200, cors);
}
__name(resetControlPassword, "resetControlPassword");
async function getPublicState(env) {
  const [settings, plansRes, legalRes] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM settings WHERE id=1"),
    env.DB.prepare("SELECT * FROM plans WHERE active=1 ORDER BY CASE slug WHEN 'free' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END, name"),
    env.DB.prepare("SELECT * FROM legal_sections ORDER BY type, position, rowid")
  ]);
  let topRows = [];
  try {
    topRows = (await env.DB.prepare("SELECT id,username,photo,plan,status,created_at,pro_until,downloads_images,downloads_videos,public_profile FROM users WHERE role='user' AND status='active' AND COALESCE(public_profile,1)<>0 ORDER BY (COALESCE(downloads_images,0)+COALESCE(downloads_videos,0)) DESC, created_at ASC LIMIT 100").all()).results || [];
  } catch (error) {
    if (!/public_profile/i.test(String(error?.message || error))) throw error;
    topRows = (await env.DB.prepare("SELECT id,username,photo,plan,status,created_at,pro_until,downloads_images,downloads_videos FROM users WHERE role='user' AND status='active' ORDER BY (downloads_images+downloads_videos) DESC LIMIT 100").all()).results || [];
  }
  const s = settings.results?.[0] || { admin_username: "@watermarkpro", admin_photo: "", payments_open: 1, qr_image: "", whatsapp: "", auth_banners: "[]", overview_banners: "[]" };
  const legal = legalFromRows(legalRes.results || []);
  return {
    version: 1,
    admin: { username: s.admin_username, photo: s.admin_photo },
    settings: {
      paymentsOpen: Boolean(s.payments_open),
      qrImage: s.qr_image || "",
      whatsapp: s.whatsapp || "",
      communityUrl: s.community_url || "",
      authBanners: bannerListFromValue(s.auth_banners),
      overviewBanners: bannerListFromValue(s.overview_banners)
    },
    plans: (plansRes.results || []).map(planFromRow),
    legal,
    topUsers: topRows.map((r) => ({
      id: r.id,
      username: r.username,
      photo: String(r.photo || "").trim(),
      plan: r.plan,
      status: r.status,
      publicProfile: r.public_profile === void 0 ? true : Boolean(r.public_profile),
      createdAt: r.created_at,
      proUntil: r.pro_until,
      downloads: { images: Number(r.downloads_images || 0), videos: Number(r.downloads_videos || 0) }
    }))
  };
}
__name(getPublicState, "getPublicState");
async function getAccountState(env, user) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS notification_reads (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE, read_at TEXT NOT NULL, PRIMARY KEY(user_id,notification_id))").run();
  const [submissionsRes, subsRes, noticesRes] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM submissions WHERE user_id=? ORDER BY submitted_at DESC LIMIT 25").bind(user.id),
    env.DB.prepare("SELECT * FROM subscriptions WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(user.id),
    env.DB.prepare("SELECT n.*,r.read_at FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=? WHERE n.audience='ALL' OR lower(n.audience)=lower(?) ORDER BY n.created_at DESC LIMIT 100").bind(user.id, user.username)
  ]);
  return {
    user: publicUser(user),
    submissions: (submissionsRes.results || []).map(submissionFromRow),
    subscriptions: (subsRes.results || []).map(subscriptionFromRow),
    notifications: (noticesRes.results || []).map((r) => ({ ...noticeFromRow(r), readAt: r.read_at || null }))
  };
}
__name(getAccountState, "getAccountState");
async function getControlState(env) {
  const [settingsRes, adminRes, plansRes, usersRes, submissionsRes, subscriptionsRes, noticesRes, legalRes] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM settings WHERE id=1"),
    env.DB.prepare("SELECT username,email,photo,created_at FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1"),
    env.DB.prepare("SELECT * FROM plans ORDER BY CASE slug WHEN 'free' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END, name"),
    env.DB.prepare("SELECT * FROM users WHERE role='user' ORDER BY created_at DESC"),
    env.DB.prepare("SELECT * FROM submissions ORDER BY submitted_at DESC"),
    env.DB.prepare("SELECT * FROM subscriptions ORDER BY created_at DESC"),
    env.DB.prepare("SELECT * FROM notifications ORDER BY created_at DESC"),
    env.DB.prepare("SELECT * FROM legal_sections ORDER BY type, position, rowid")
  ]);
  const s = settingsRes.results?.[0] || {};
  const admin = adminRes.results?.[0] || {};
  return {
    version: 1,
    updatedAt: nowIso(),
    admin: {
      username: s.admin_username || admin.username || "@watermarkpro",
      email: admin.email || "",
      photo: s.admin_photo || admin.photo || "",
      createdAt: admin.created_at || ""
    },
    settings: {
      paymentsOpen: Boolean(s.payments_open),
      qrImage: s.qr_image || "",
      whatsapp: s.whatsapp || "",
      communityUrl: s.community_url || "",
      authBanners: bannerListFromValue(s.auth_banners),
      overviewBanners: bannerListFromValue(s.overview_banners)
    },
    plans: (plansRes.results || []).map(planFromRow),
    users: (usersRes.results || []).map(publicUser),
    submissions: (submissionsRes.results || []).map(submissionFromRow),
    subscriptions: (subscriptionsRes.results || []).map(subscriptionFromRow),
    notifications: (noticesRes.results || []).map(noticeFromRow),
    legal: legalFromRows(legalRes.results || [])
  };
}
__name(getControlState, "getControlState");
function planFromRow(r) {
  let features = [];
  try {
    features = JSON.parse(r.features_json || "[]");
  } catch {
  }
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    normalPrice: Number(r.normal_price || 0),
    discountPrice: Number(r.discount_price || 0),
    discountLabel: r.discount_label || "",
    billingLabel: r.billing_label || "",
    description: r.description || "",
    features,
    active: Boolean(r.active)
  };
}
__name(planFromRow, "planFromRow");
function submissionFromRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.username,
    email: r.email || "",
    planName: r.plan_name,
    reference: r.reference,
    amount: Number(r.amount || 0),
    paymentTime: r.payment_time || "-",
    submittedAt: r.submitted_at,
    status: r.status
  };
}
__name(submissionFromRow, "submissionFromRow");
function subscriptionFromRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.username,
    planName: r.plan_name,
    reference: r.reference || "",
    receiptNo: r.receipt_no || "",
    amount: Number(r.amount || 0),
    months: Number(r.months || 1),
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    createdAt: r.created_at,
    paymentTime: r.payment_time || "-",
    status: r.status
  };
}
__name(subscriptionFromRow, "subscriptionFromRow");
function noticeFromRow(r) {
  return {
    id: r.id,
    title: r.title,
    text: r.text,
    audience: r.audience,
    senderUsername: r.sender_username,
    senderPhoto: r.sender_photo || "",
    createdAt: r.created_at
  };
}
__name(noticeFromRow, "noticeFromRow");
function legalFromRows(rows) {
  const out = { terms: { updatedAt: null, sections: [] }, privacy: { updatedAt: null, sections: [] } };
  for (const row of rows) {
    const bucket = out[row.type];
    if (!bucket) continue;
    bucket.sections.push({ id: row.id, title: row.title, text: row.text });
    if (!bucket.updatedAt || row.updated_at > bucket.updatedAt) bucket.updatedAt = row.updated_at;
  }
  return out;
}
__name(legalFromRows, "legalFromRows");
async function saveSettings(request, env, cors) {
  const body = await readBody(request);
  const admin = body.admin || {};
  const settings = body.settings || {};
  const username = normalizeUsername(admin.username) || "@watermarkpro";
  const photo = String(admin.photo || "").trim();
  const current = await env.DB.prepare("SELECT * FROM settings WHERE id=1").first();
  const communityUrl = String(settings.communityUrl ?? current?.community_url ?? "").trim();
  if (communityUrl) {
    let parsed;
    try {
      parsed = new URL(communityUrl);
    } catch {
      throw new HttpError(400, "Pautan Telegram tidak sah.");
    }
    if (parsed.protocol !== "https:" || !["t.me", "telegram.me", "www.t.me"].includes(parsed.hostname)) throw new HttpError(400, "Gunakan pautan Telegram HTTPS.");
  }
  const authBanners = bannerListFromValue(settings.authBanners === void 0 ? current?.auth_banners : settings.authBanners);
  const overviewBanners = bannerListFromValue(settings.overviewBanners === void 0 ? current?.overview_banners : settings.overviewBanners);
  try {
    await env.DB.prepare(`UPDATE settings SET admin_username=?,admin_photo=?,payments_open=?,qr_image=?,whatsapp=?,auth_banners=?,overview_banners=?,community_url=? WHERE id=1`).bind(
      username,
      photo,
      settings.paymentsOpen === false ? 0 : 1,
      String(settings.qrImage || "").trim(),
      String(settings.whatsapp || "").trim(),
      JSON.stringify(authBanners),
      JSON.stringify(overviewBanners),
      communityUrl
    ).run();
  } catch (error) {
    if (/auth_banners|overview_banners|no such column/i.test(String(error?.message || error))) {
      throw new HttpError(503, "Jalankan migration banner D1 sebelum menggunakan tetapan banner.");
    }
    throw error;
  }
  await env.DB.prepare("UPDATE notifications SET sender_username=?,sender_photo=?").bind(username, photo).run();
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(saveSettings, "saveSettings");
async function savePlans(request, env, cors) {
  const body = await readBody(request);
  const plans = Array.isArray(body.plans) ? body.plans : Array.isArray(body) ? body : [];
  if (!plans.length) throw new HttpError(400, "Sekurang-kurangnya satu pelan diperlukan.");
  const statements = [env.DB.prepare("DELETE FROM plans")];
  for (const p of plans) {
    const id = String(p.id || uid("plan"));
    const slug = String(p.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug || !String(p.name || "").trim()) throw new HttpError(400, "Nama dan pengecam pelan diperlukan.");
    statements.push(env.DB.prepare(`INSERT INTO plans (id,slug,name,normal_price,discount_price,discount_label,billing_label,description,features_json,active)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id, slug, String(p.name).trim(), Number(p.normalPrice || 0), Number(p.discountPrice || 0), String(p.discountLabel || ""), String(p.billingLabel || ""), String(p.description || ""), JSON.stringify(Array.isArray(p.features) ? p.features : []), p.active === false ? 0 : 1));
  }
  await env.DB.batch(statements);
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(savePlans, "savePlans");
async function createControlUser(request, env, cors) {
  const body = await readBody(request);
  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  if (!username || username.replace("@", "").length < 2) throw new HttpError(400, "Nama pengguna tidak sah.");
  if (!validEmail(email)) throw new HttpError(400, "E-mel tidak sah.");
  const duplicate = await env.DB.prepare("SELECT id FROM users WHERE username=? OR email=?").bind(username, email).first();
  if (duplicate) throw new HttpError(409, "Nama pengguna atau e-mel sudah digunakan.");
  const tempPassword = randomToken(12).replace(/[-_]/g, "A").slice(0, 12);
  const { hash, salt } = await hashPassword(tempPassword);
  const id = uid("user");
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id,username,email,password_hash,password_salt,role,photo,plan,status,created_at,pro_until,downloads_images,downloads_videos)
    VALUES (?,?,?,?,?,'user',?,?,?,?,?,?,?)`).bind(id, username, email, hash, salt, String(body.photo || ""), body.plan === "pro" ? "pro" : "free", body.status === "inactive" ? "inactive" : "active", nowIso(), null, Number(body.downloads?.images || 0), Number(body.downloads?.videos || 0)),
    automaticNotification(env, username, "Akaun dicipta", "Akaun Watermark Pro anda berjaya dicipta.", "registered-" + id)
  ]);
  return json({ ok: true, temporaryPassword: tempPassword, state: await getControlState(env) }, 201, cors);
}
__name(createControlUser, "createControlUser");
async function updateControlUser(request, env, cors, id) {
  const body = await readBody(request);
  const current = await env.DB.prepare("SELECT * FROM users WHERE id=? AND role='user'").bind(id).first();
  if (!current) throw new HttpError(404, "Pengguna tidak ditemui.");
  const username = normalizeUsername(body.username ?? current.username);
  const email = normalizeEmail(body.email ?? current.email);
  const duplicate = await env.DB.prepare("SELECT id FROM users WHERE (username=? OR email=?) AND id<>?").bind(username, email, id).first();
  if (duplicate) throw new HttpError(409, "Nama pengguna atau e-mel sudah digunakan.");
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET username=?,email=?,photo=?,plan=?,status=?,downloads_images=?,downloads_videos=? WHERE id=?`).bind(username, email, String(body.photo || ""), body.plan === "pro" ? "pro" : "free", body.status === "inactive" ? "inactive" : "active", Number(body.downloads?.images || 0), Number(body.downloads?.videos || 0), id),
    env.DB.prepare("UPDATE notifications SET audience=? WHERE lower(audience)=lower(?)").bind(username, current.username)
  ]);
  await env.DB.prepare("UPDATE submissions SET username=?,email=? WHERE user_id=?").bind(username, email, id).run();
  await env.DB.prepare("UPDATE subscriptions SET username=? WHERE user_id=?").bind(username, id).run();
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(updateControlUser, "updateControlUser");
async function deleteUserRecords(env, user) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM notifications WHERE lower(audience)=lower(?)").bind(user.username),
    env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE id=? AND role='user'").bind(user.id)
  ]);
}
__name(deleteUserRecords, "deleteUserRecords");
async function deleteControlUser(env, cors, id) {
  const user = await env.DB.prepare("SELECT * FROM users WHERE id=? AND role='user'").bind(id).first();
  if (!user) throw new HttpError(404, "Pengguna tidak ditemui.");
  await deleteUserRecords(env, user);
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(deleteControlUser, "deleteControlUser");
async function grantPro(request, env, cors, id) {
  const body = await readBody(request);
  const months = clampInt(body.months ?? body.durationMonths, 1, 24, 1);
  const user = await env.DB.prepare("SELECT * FROM users WHERE id=? AND role='user'").bind(id).first();
  if (!user) throw new HttpError(404, "Pengguna tidak ditemui.");
  const requestedStart = body.startsAt || body.startDate || body.createdAt || null;
  const requestedDate = requestedStart ? new Date(requestedStart) : null;
  const fallbackStart = user.plan === "pro" && user.pro_until && new Date(user.pro_until) > /* @__PURE__ */ new Date() ? user.pro_until : nowIso();
  const start = requestedDate && Number.isFinite(requestedDate.getTime()) ? requestedDate.toISOString() : fallbackStart;
  const end = addMonthsIso(start, months);
  await env.DB.prepare("UPDATE users SET plan='pro',status='active',pro_until=? WHERE id=?").bind(end, id).run();
  const createdAt = nowIso();
  const ref = `GRANT-${createdAt.replace(/\D/g, "").slice(0, 14)}`;
  await env.DB.prepare(`INSERT INTO subscriptions (id,user_id,username,plan_name,reference,receipt_no,amount,months,starts_at,ends_at,created_at,payment_time,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(uid("history"), id, user.username, "Penyokong Pro", ref, `WP-${ref}`, 0, months, start, end, createdAt, "-", "GRANTED").run();
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(grantPro, "grantPro");
async function removePro(env, cors, id) {
  const user = await env.DB.prepare("SELECT * FROM users WHERE id=? AND role='user'").bind(id).first();
  if (!user) throw new HttpError(404, "Pengguna tidak ditemui.");
  await env.DB.prepare("UPDATE users SET plan='free',pro_until=NULL WHERE id=?").bind(id).run();
  const createdAt = nowIso();
  const ref = `REMOVE-${createdAt.replace(/\D/g, "").slice(0, 14)}`;
  await env.DB.prepare(`INSERT INTO subscriptions (id,user_id,username,plan_name,reference,receipt_no,amount,months,starts_at,ends_at,created_at,payment_time,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(uid("history"), id, user.username, "Penyokong Pro", ref, `WP-${ref}`, 0, 0, null, createdAt, createdAt, "-", "REMOVED").run();
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(removePro, "removePro");
async function reviewPayment(request, env, cors, id) {
  const body = await readBody(request);
  const action = String(body.action || "").toLowerCase();
  const submission = await env.DB.prepare("SELECT * FROM submissions WHERE id=?").bind(id).first();
  if (!submission) throw new HttpError(404, "Penghantaran tidak ditemui.");
  if (submission.status !== "PENDING") throw new HttpError(409, "Penghantaran ini sudah disemak.");
  const user = submission.user_id ? await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(submission.user_id).first() : null;
  const createdAt = nowIso();
  if (action === "reject") {
    await env.DB.batch([
      env.DB.prepare("UPDATE submissions SET status='REJECTED' WHERE id=?").bind(id),
      env.DB.prepare(`INSERT INTO subscriptions (id,user_id,username,plan_name,reference,receipt_no,amount,months,starts_at,ends_at,created_at,payment_time,status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(uid("history"), submission.user_id, submission.username, submission.plan_name, submission.reference, `WP-${submission.reference}`, Number(submission.amount || 0), 1, null, null, createdAt, submission.payment_time || "-", "REJECTED")
    ]);
    return json({ ok: true, state: await getControlState(env) }, 200, cors);
  }
  if (action !== "approve") throw new HttpError(400, "Tindakan tidak sah.");
  if (!user) throw new HttpError(409, "Akaun pengguna bagi pembayaran ini tidak ditemui.");
  const start = user.plan === "pro" && user.pro_until && new Date(user.pro_until) > /* @__PURE__ */ new Date() ? user.pro_until : createdAt;
  const end = addMonthsIso(start, 1);
  await env.DB.batch([
    env.DB.prepare("UPDATE submissions SET status='PAID' WHERE id=?").bind(id),
    env.DB.prepare("UPDATE users SET plan='pro',status='active',pro_until=? WHERE id=?").bind(end, user.id),
    env.DB.prepare(`INSERT INTO subscriptions (id,user_id,username,plan_name,reference,receipt_no,amount,months,starts_at,ends_at,created_at,payment_time,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(uid("history"), user.id, user.username, submission.plan_name, submission.reference, `WP-${submission.reference}`, Number(submission.amount || 0), 1, start, end, createdAt, submission.payment_time || "-", "PAID"),
    automaticNotification(env, user.username, "Akaun Sokongan Pro diaktifkan", "Akaun Sokongan Pro anda telah disahkan dan kini aktif.", "approved-" + id)
  ]);
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(reviewPayment, "reviewPayment");
async function saveNotice(request, env, cors, id) {
  const body = await readBody(request);
  const title = String(body.title || "").trim();
  const text = String(body.text || "").trim();
  const audience = body.audience === "ALL" ? "ALL" : normalizeUsername(body.audience);
  if (!title || !text) throw new HttpError(400, "Tajuk dan mesej diperlukan.");
  const settings = await env.DB.prepare("SELECT * FROM settings WHERE id=1").first();
  if (id) {
    await env.DB.prepare("UPDATE notifications SET title=?,text=?,audience=?,sender_username=?,sender_photo=? WHERE id=?").bind(title, text, audience, settings?.admin_username || "@watermarkpro", settings?.admin_photo || "", id).run();
  } else {
    await env.DB.prepare("INSERT INTO notifications (id,title,text,audience,sender_username,sender_photo,created_at) VALUES (?,?,?,?,?,?,?)").bind(uid("notice"), title, text, audience, settings?.admin_username || "@watermarkpro", settings?.admin_photo || "", nowIso()).run();
  }
  return json({ ok: true, state: await getControlState(env) }, id ? 200 : 201, cors);
}
__name(saveNotice, "saveNotice");
async function saveLegal(request, env, cors) {
  const body = await readBody(request);
  const legal = body.legal || body;
  const statements = [env.DB.prepare("DELETE FROM legal_sections")];
  for (const type of ["terms", "privacy"]) {
    const doc = legal[type] || { sections: [] };
    const updatedAt = doc.updatedAt || nowIso();
    (Array.isArray(doc.sections) ? doc.sections : []).forEach((section, index) => {
      statements.push(env.DB.prepare("INSERT INTO legal_sections (id,type,title,text,position,updated_at) VALUES (?,?,?,?,?,?)").bind(String(section.id || uid(type)), type, String(section.title || "").trim(), String(section.text || "").trim(), (index + 1) * 10, updatedAt));
    });
  }
  await env.DB.batch(statements);
  return json({ ok: true, state: await getControlState(env) }, 200, cors);
}
__name(saveLegal, "saveLegal");
async function setupPage(env) {
  if (!env.DB) return new Response("DB binding tidak ditemui. Pastikan D1 binding bernama DB aktif pada deployment ini.", { status: 500 });
  const existing = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
  const ready = Boolean(existing);
  const body = ready ? `
    <h1>Watermark Pro</h1><p>Pusat Kawalan sudah mempunyai akaun pemilik.</p><p>Halaman setup ini tidak lagi boleh mencipta akaun baharu.</p>` : `
    <h1>Setup Watermark Pro</h1>
    <p>Cipta akaun pemilik pertama untuk Pusat Kawalan.</p>
    <form method="post" novalidate>
      <label>Bootstrap token<input name="bootstrap_token" type="password" required></label>
      <label>Nama pengguna<input name="username" value="@watermarkpro" required></label>
      <label>E-mel<input name="email" type="email" required></label>
      <label>Kata laluan<input name="password" type="password" required></label>
      <button type="submit">Cipta akaun pemilik</button>
    </form>`;
  return new Response(`<!doctype html><html lang="ms"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Watermark Pro Setup</title><style>body{font-family:system-ui,sans-serif;background:#f6f8fa;color:#111827;margin:0;padding:24px}.box{max-width:520px;margin:8vh auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:24px}h1{margin-top:0}form{display:grid;gap:14px}label{display:grid;gap:7px;font-weight:700;font-size:14px}input{font:inherit;padding:12px;border:1px solid #cbd5e1;border-radius:10px}button{font:inherit;font-weight:800;padding:12px;border:0;border-radius:10px;background:#111827;color:#fff}</style><body><div class="box">${body}</div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
__name(setupPage, "setupPage");
async function handleSetupPost(request, env) {
  if (!env.DB) return new Response("DB binding tidak ditemui. Pastikan D1 binding bernama DB aktif pada deployment ini.", { status: 500 });
  const existing = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
  if (existing) return new Response("Akaun pemilik sudah wujud.", { status: 409 });
  if (!env.BOOTSTRAP_TOKEN) return new Response("BOOTSTRAP_TOKEN belum ditetapkan pada Worker secret.", { status: 500 });
  const body = await readBody(request);
  if (String(body.bootstrap_token || "") !== String(env.BOOTSTRAP_TOKEN)) return new Response("Bootstrap token tidak betul.", { status: 403 });
  const username = normalizeUsername(body.username) || "@watermarkpro";
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email)) return new Response("E-mel tidak sah.", { status: 400 });
  validatePassword(password);
  const { hash, salt } = await hashPassword(password);
  await env.DB.prepare(`INSERT INTO users (id,username,email,password_hash,password_salt,role,photo,plan,status,created_at,downloads_images,downloads_videos)
    VALUES (?,?,?,?,?,'admin','','pro','active',?,0,0)`).bind(uid("admin"), username, email, hash, salt, nowIso()).run();
  return new Response(`<!doctype html><html lang="ms"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Siap</title><style>body{font-family:system-ui,sans-serif;padding:28px;background:#f6f8fa}.box{max-width:520px;margin:10vh auto;background:white;border:1px solid #e5e7eb;border-radius:18px;padding:24px}</style><body><div class="box"><h1>Siap.</h1><p>Akaun pemilik Watermark Pro sudah dicipta. Sekarang boleh log masuk pada Pusat Kawalan.</p></div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
__name(handleSetupPost, "handleSetupPost");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
