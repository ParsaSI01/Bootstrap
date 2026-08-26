const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8000;

const ignored = new Set(['.git', '.idea', 'node_modules']);

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function buildTree(currentPath, relativePath = '') {
    const entries = fs.readdirSync(currentPath, {
        withFileTypes: true,
    });

    return entries
        .filter((entry) => !ignored.has(entry.name))
        .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;

            return a.name.localeCompare(b.name);
        })
        .map((entry) => {
            const fullPath = path.join(currentPath, entry.name);
            const entryPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
                return {
                    name: entry.name,
                    type: 'directory',
                    path: entryPath,
                    children: buildTree(fullPath, entryPath),
                };
            }

            return {
                name: entry.name,
                type: 'file',
                path: entryPath,
            };
        });
}

function getSafePath(urlPath) {
    const decodedPath = decodeURIComponent(urlPath);

    const requestedPath = path.normalize(path.join(ROOT, decodedPath));

    if (requestedPath !== ROOT && !requestedPath.startsWith(ROOT + path.sep)) {
        return null;
    }

    return requestedPath;
}

function serveFile(urlPath, response) {
    const filePath = getSafePath(urlPath);

    if (!filePath) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    let target = filePath;

    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        target = path.join(target, 'index.html');
    }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        response.writeHead(404);
        response.end('Not Found');
        return;
    }

    const extension = path.extname(target).toLowerCase();

    response.writeHead(200, {
        'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    });

    fs.createReadStream(target).pipe(response);
}

const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/api/tree') {
        try {
            const tree = buildTree(ROOT);

            response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
            });

            response.end(JSON.stringify(tree));
        } catch (error) {
            console.error(error);

            response.writeHead(500, {
                'Content-Type': 'application/json; charset=utf-8',
            });

            response.end(
                JSON.stringify({
                    error: 'Failed to build project tree.',
                })
            );
        }

        return;
    }

    serveFile(url.pathname === '/' ? '/index.html' : url.pathname, response);
});

server.listen(PORT, () => {
    console.log(`Project browser: http://localhost:${PORT}`);
});
