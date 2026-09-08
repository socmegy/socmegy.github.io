const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.WATERMARK_PREVIEW_PORT || 4173);
const upstream = 'https://watermark-pro-api.socmegy.workers.dev';
const websiteFile = 'index.html';
const controlFile = 'control.html';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(body);
}

async function proxy(req, res) {
  const targetPath = req.url.slice('/_api'.length) || '/';
  const chunks = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  for await (const chunk of req) chunks.push(chunk);
  const headers = {...req.headers};
  delete headers.host;
  delete headers.origin;
  delete headers.referer;
  delete headers['content-length'];
  let response;
  try {
    response = await fetch(upstream + targetPath, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      redirect: 'manual',
      signal: controller.signal
    });
  } finally { clearTimeout(timeout); }
  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key)) responseHeaders[key] = value;
  });
  responseHeaders['cache-control'] = 'no-store';
  res.writeHead(response.status, responseHeaders);
  res.end(Buffer.from(await response.arrayBuffer()));
}

function serveFile(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (requestPath === '/') {
    res.writeHead(302, {'Location': '/watermark-pro/', 'Cache-Control': 'no-store'});
    res.end();
    return;
  }
  if (requestPath === '/watermark-pro') {
    res.writeHead(302, {'Location': '/watermark-pro/', 'Cache-Control': 'no-store'});
    res.end();
    return;
  }
  if (['/control','/control/','/watermark-pro/control','/watermark-pro/control/'].includes(requestPath)) {
    res.writeHead(302, {'Location':'/watermark-pro/control.html','Cache-Control':'no-store'});
    res.end();return;
  }
  const relative = /^\/watermark-pro\/(?:profil\/?|pelan\/?|sokongan\/?|tetapan\/?)?$/.test(requestPath)
    ? websiteFile
    : ['/control', '/control/', '/watermark-pro/control', '/watermark-pro/control/'].includes(requestPath)
      ? controlFile
      : /^\/(?:control\/|watermark-pro\/control\/)(?:logo\.jpg|bg\.jpg|qr\.jpg|favicon\.ico)$/.test(requestPath)
        ? requestPath.endsWith('bg.jpg') ? 'bg.jpg' : requestPath.endsWith('qr.jpg') ? 'qr.jpg' : 'logo.jpg'
      : requestPath.replace(/^\/watermark-pro\//, '').replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(res, 404, 'Fail tidak ditemui.');
    return;
  }
  let body = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (ext === '.html') {
    // Local browser talks directly to the Cloudflare Worker. This keeps realtime
    // auth/D1 working even when the Node preview proxy cannot reach the internet.
    const config = `<script>window.WATERMARK_API_BASE='${upstream}';</script>`;
    body = Buffer.from(body.toString('utf8').replace(/<head([^>]*)>/i, `<head$1>${config}`));
  }
  send(res, 200, body, mime[ext] || 'application/octet-stream');
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/_api/')) await proxy(req, res);
    else serveFile(req, res);
  } catch (error) {
    console.error(error);
    send(res, 502, `Proxy API gagal: ${error.message}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Watermark Pro local preview: http://localhost:${port}/watermark-pro/`);
  console.log(`Control: http://localhost:${port}/control`);
});
