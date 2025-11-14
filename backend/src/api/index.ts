/**
 * API Server Entry Point
 * Starts the Fastify API server with all middleware and routes
 */

import { startServer } from './server.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Start server if this is the main module
const isMainModule =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export * from './server.js';
export * from './health.js';
