const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const MAX_BODY_BYTES = 4096;
const MESSAGE_LIMIT_PER_TEN_MINUTES = 3;
const MESSAGE_LIMIT_PER_DAY = 10;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (!isOriginAllowed(origin, env)) {
      return json({ message: "请求来源不受信任" }, 403, origin, env);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        return json({ ok: true }, 200, origin, env);
      }
      if (request.method === "GET" && url.pathname === "/api/messages") {
        return await listMessages(url, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/api/stats") {
        return json({ stats: await getStats(env) }, 200, origin, env);
      }
      if (request.method === "POST" && url.pathname === "/api/visits") {
        return await recordVisit(request, env, origin);
      }
      if (request.method === "POST" && url.pathname === "/api/messages") {
        return await createMessage(request, env, origin);
      }
      return json({ message: "接口不存在" }, 404, origin, env);
    } catch (error) {
      console.error("guestbook request failed", error);
      return json({ message: "服务暂时不可用" }, 500, origin, env);
    }
  },
};

function allowedOrigins(env) {
  return String(
    env.ALLOWED_ORIGINS ||
      "https://gsyiswatchingu.github.io,http://127.0.0.1:5500,http://localhost:5500"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin, env) {
  return !origin || allowedOrigins(env).includes(origin);
}

function corsHeaders(origin, env) {
  const headers = {
    ...JSON_HEADERS,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && isOriginAllowed(origin, env)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(payload, status, origin, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(origin, env),
  });
}

async function readJson(request) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new HttpError(413, "提交内容过长");
  if (!String(request.headers.get("Content-Type") || "").includes("application/json")) {
    throw new HttpError(415, "仅接受 JSON 请求");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new HttpError(413, "提交内容过长");
  }
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new HttpError(400, "JSON 格式无效");
  }
}

async function createMessage(request, env, origin) {
  try {
    assertDatabase(env);
    assertSecrets(env);
    const body = await readJson(request);

    if (String(body.website || "").trim()) {
      return json({ status: "pending" }, 202, origin, env);
    }

    const nickname = normalizeText(body.nickname, 20);
    const content = normalizeText(body.content, 300, true);
    if (nickname.length < 2) throw new HttpError(400, "昵称至少需要 2 个字符");
    if (content.length < 2) throw new HttpError(400, "留言至少需要 2 个字符");
    if ((content.match(/https?:\/\//gi) || []).length > 2) {
      throw new HttpError(400, "留言中的链接过多");
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const day = isoDay(now);
    const ipHash = await hmacHex(env.IP_HASH_SECRET, `${day}|${clientIp}`);
    await enforceMessageRateLimit(env, ipHash, now);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO messages (id, nickname, content, status, ip_hash, created_at, approved_at)
       VALUES (?, ?, ?, 'approved', ?, ?, ?)`
    )
      .bind(id, nickname, content, ipHash, now, now)
      .run();

    return json(
      {
        status: "approved",
        item: { id, nickname, content, createdAt: now },
      },
      201,
      origin,
      env
    );
  } catch (error) {
    return handleKnownError(error, origin, env);
  }
}

async function listMessages(url, env, origin) {
  try {
    assertDatabase(env);
    const limit = clamp(Number(url.searchParams.get("limit") || 12), 1, 30);
    const cursor = decodeCursor(url.searchParams.get("cursor"));
    const query = cursor
      ? env.DB.prepare(
          `SELECT id, nickname, content, created_at
           FROM messages
           WHERE status = 'approved'
             AND (created_at < ? OR (created_at = ? AND id < ?))
           ORDER BY created_at DESC, id DESC
           LIMIT ?`
        ).bind(cursor.createdAt, cursor.createdAt, cursor.id, limit + 1)
      : env.DB.prepare(
          `SELECT id, nickname, content, created_at
           FROM messages
           WHERE status = 'approved'
           ORDER BY created_at DESC, id DESC
           LIMIT ?`
        ).bind(limit + 1);

    const result = await query.all();
    const rows = result.results || [];
    const hasMore = rows.length > limit;
    const visibleRows = rows.slice(0, limit);
    const last = visibleRows.at(-1);

    return json(
      {
        items: visibleRows.map((row) => ({
          id: row.id,
          nickname: row.nickname,
          content: row.content,
          createdAt: row.created_at,
        })),
        nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
        stats: await getStats(env),
      },
      200,
      origin,
      env
    );
  } catch (error) {
    return handleKnownError(error, origin, env);
  }
}

async function recordVisit(request, env, origin) {
  try {
    assertDatabase(env);
    assertSecrets(env);
    if (isLocalOrigin(origin)) {
      return json({ stats: await getStats(env) }, 200, origin, env);
    }
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const now = Date.now();
    const day = isoDay(now);
    const visitorHash = await hmacHex(env.IP_HASH_SECRET, `${day}|${clientIp}|${userAgent}`);

    await env.DB.prepare(
      `INSERT INTO daily_visitors
         (visit_date, visitor_hash, page_views, first_seen_at, last_seen_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT (visit_date, visitor_hash)
       DO UPDATE SET
         page_views = page_views + 1,
         last_seen_at = excluded.last_seen_at`
    )
      .bind(day, visitorHash, now, now)
      .run();

    return json({ stats: await getStats(env) }, 200, origin, env);
  } catch (error) {
    return handleKnownError(error, origin, env);
  }
}

async function getStats(env) {
  assertDatabase(env);
  const day = isoDay(Date.now());
  const [views, visitors, messages] = await env.DB.batch([
    env.DB.prepare("SELECT COALESCE(SUM(page_views), 0) AS value FROM daily_visitors"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM daily_visitors WHERE visit_date = ?").bind(day),
    env.DB.prepare("SELECT COUNT(*) AS value FROM messages WHERE status = 'approved'"),
  ]);

  return {
    pageViews: Number(views.results?.[0]?.value || 0),
    visitorsToday: Number(visitors.results?.[0]?.value || 0),
    approvedMessages: Number(messages.results?.[0]?.value || 0),
  };
}

async function enforceMessageRateLimit(env, ipHash, now) {
  const tenMinutesAgo = now - 10 * 60 * 1000;
  const startOfDay = new Date(isoDay(now)).getTime();
  const [recent, daily] = await env.DB.batch([
    env.DB.prepare(
      "SELECT COUNT(*) AS value FROM messages WHERE ip_hash = ? AND created_at >= ?"
    ).bind(ipHash, tenMinutesAgo),
    env.DB.prepare(
      "SELECT COUNT(*) AS value FROM messages WHERE ip_hash = ? AND created_at >= ?"
    ).bind(ipHash, startOfDay),
  ]);
  if (Number(recent.results?.[0]?.value || 0) >= MESSAGE_LIMIT_PER_TEN_MINUTES) {
    throw new HttpError(429, "提交太频繁，请稍后再试");
  }
  if (Number(daily.results?.[0]?.value || 0) >= MESSAGE_LIMIT_PER_DAY) {
    throw new HttpError(429, "今天的留言次数已达上限");
  }
}

async function hmacHex(secret, input) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeText(value, maxLength, preserveLines = false) {
  const text = String(value || "").normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const normalized = preserveLines
    ? text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : text.replace(/\s+/g, " ").trim();
  if (normalized.length > maxLength) throw new HttpError(400, `内容不能超过 ${maxLength} 个字符`);
  return normalized;
}

function assertDatabase(env) {
  if (!env.DB) throw new HttpError(503, "数据库尚未配置");
}

function assertSecrets(env) {
  if (!env.IP_HASH_SECRET) throw new HttpError(503, "匿名标识密钥尚未配置");
}

function isoDay(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isLocalOrigin(origin) {
  if (!origin) return false;
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function clamp(value, min, max) {
  const safe = Number.isFinite(value) ? Math.floor(value) : min;
  return Math.min(Math.max(safe, min), max);
}

function encodeCursor(createdAt, id) {
  return btoa(JSON.stringify({ createdAt, id }));
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const cursor = JSON.parse(atob(value));
    if (!Number.isFinite(cursor.createdAt) || typeof cursor.id !== "string") return null;
    return cursor;
  } catch {
    return null;
  }
}

function handleKnownError(error, origin, env) {
  if (error instanceof HttpError) return json({ message: error.message }, error.status, origin, env);
  throw error;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
