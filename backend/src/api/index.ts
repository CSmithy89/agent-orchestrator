/**
 * API Server Entry Point
 * Starts the Fastify API server with all middleware and routes
 */

import { startServer } from './server.js';

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export * from './server.js';
export * from './health.js';
