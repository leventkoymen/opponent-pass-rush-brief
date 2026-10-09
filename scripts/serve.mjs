import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = path.join(project, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};

// Serve only the bundled app, only on this computer. No packages or network APIs.
export function createLocalServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET','HEAD'].includes(req.method)) {
      res.writeHead(405, {'Allow':'GET, HEAD'}); res.end('Method not allowed'); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.includes('\0') || pathname.includes('\\')) throw {status:400};
      const candidate = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!candidate.startsWith(root + path.sep)) throw {status:404};
      const resolved = await realpath(candidate);
      if (!resolved.startsWith(root + path.sep)) throw {status:404};
      const info = await stat(resolved);
      if (!info.isFile()) throw {status:404};
      const body = await readFile(resolved);
      res.writeHead(200, {'Content-Type':types[path.extname(resolved)] || 'application/octet-stream','Content-Length':body.length});
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      const status = error instanceof URIError ? 400 : error.status || (['ENOENT','ENOTDIR'].includes(error.code) ? 404 : 500);
      res.writeHead(status, {'Content-Type':'text/plain; charset=utf-8'});
      res.end(status === 404 ? 'File not found' : status === 400 ? 'Invalid request' : 'Unable to serve file');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), portAt = args.indexOf('--port');
  const port = portAt < 0 ? 4173 : Number(args[portAt + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Choose a port between 1 and 65535, for example --port 4174.'); process.exit(1);
  }
  const server = createLocalServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Try: npm start -- --port ${port + 1}` : `Could not start the local website: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`\nThe Film Room is ready.\nOpen ${url}\n\nKeep this window open. Press Ctrl+C to stop.\n`);
    if (!args.includes('--no-open')) {
      const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
      const child = spawn(command, [url], {stdio:'ignore'});
      child.on('error', () => console.log(`Open ${url} in your browser.`));
      child.unref();
    }
  });
}
