import { cpSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const docsImagesDir = path.resolve(rootDir, 'docs/images');

const imageContentType = (filePath: string): string => {
  switch (path.extname(filePath).toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const copyDocsImages = (): Plugin => ({
  name: 'copy-docs-images',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/images/')) {
        next();
        return;
      }

      const relativePath = decodeURIComponent(
        (req.url.slice('/images/'.length).split('?')[0] ?? ''),
      );
      if (
        !relativePath ||
        path.isAbsolute(relativePath) ||
        relativePath.split(/[/\\]/).includes('..')
      ) {
        res.statusCode = 400;
        res.end('Bad Request');
        return;
      }

      const filePath = path.resolve(docsImagesDir, relativePath);
      if (
        !filePath.startsWith(`${docsImagesDir}${path.sep}`) ||
        !existsSync(filePath)
      ) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      res.setHeader('Content-Type', imageContentType(filePath));
      res.end(readFileSync(filePath));
    });
  },
  closeBundle() {
    if (!existsSync(docsImagesDir)) {
      return;
    }

    cpSync(docsImagesDir, path.resolve(rootDir, 'dist/images'), {
      recursive: true,
    });
  },
});

export default defineConfig({
  envPrefix: ['VITE_', 'DICTIONARY_'],
  plugins: [copyDocsImages()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
