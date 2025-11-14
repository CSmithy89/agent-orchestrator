/**
 * WebSocket Handler - Real-time event streaming with JWT authentication
 * Provides WebSocket server for real-time project updates
 */

import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { eventService, EventHandler } from '../services/event.service.js';
import { Event, SubscriptionMessage, ErrorMessage } from '../types/events.types.js';

// JWT verification - compatible with vitest
async function verifyJWT(token: string, secret: string): Promise<{ userId?: string }> {
  try {
    // Use dynamic import for jwt to avoid vitest issues
    const { default: jwt } = await import('jsonwebtoken');
    return jwt.verify(token, secret) as { userId?: string };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extended WebSocket with client metadata
 */
interface ExtendedWebSocket extends WebSocket {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

/**
 * WebSocket authentication result
 */
interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * WebSocket server configuration
 */
export interface WebSocketConfig {
  jwtSecret: string;
  pingInterval?: number;
}

/**
 * WebSocket handler class
 */
export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, ExtendedWebSocket>;
  private config: WebSocketConfig;
  private pingInterval?: NodeJS.Timeout;

  constructor(httpServer: HTTPServer, config: WebSocketConfig) {
    this.config = {
      pingInterval: 30000, // 30 seconds default
      ...config
    };

    this.clients = new Map();

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/ws/status-updates'
    });

    // Setup connection handler
    this.wss.on('connection', this.handleConnection.bind(this));

    // Setup heartbeat
    this.startHeartbeat();

    console.log('WebSocket server initialized at /ws/status-updates');
  }

  /**
   * Authenticate WebSocket connection using JWT
   */
  private async authenticate(request: IncomingMessage): Promise<AuthResult> {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          authenticated: false,
          error: 'Missing or invalid authorization header'
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      const decoded = await verifyJWT(token, this.config.jwtSecret);

      return {
        authenticated: true,
        userId: decoded.userId
      };
    } catch (error) {
      return {
        authenticated: false,
        error: 'Invalid or expired token'
      };
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Authenticate connection (async)
    this.authenticate(request).then(authResult => {
      if (!authResult.authenticated) {
        const errorMsg: ErrorMessage = {
          error: 'Authentication failed',
          message: authResult.error || 'Unauthorized'
        };
        ws.send(JSON.stringify(errorMsg));
        ws.close(1008, 'Authentication failed');
        return;
      }

      this.setupAuthenticatedConnection(ws, authResult.userId);
    }).catch(error => {
      const errorMsg: ErrorMessage = {
        error: 'Authentication failed',
        message: 'Internal error during authentication'
      };
      ws.send(JSON.stringify(errorMsg));
      ws.close(1008, 'Authentication failed');
    });
  }

  /**
   * Setup authenticated WebSocket connection
   */
  private setupAuthenticatedConnection(ws: WebSocket, userId?: string): void {
    // Setup extended WebSocket
    const client = ws as ExtendedWebSocket;
    client.id = uuidv4();
    client.userId = userId;
    client.subscriptions = new Set();
    client.isAlive = true;

    // Store client
    this.clients.set(client.id, client);

    console.log(`WebSocket client connected: ${client.id} (user: ${client.userId})`);

    // Setup pong handler for heartbeat
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Setup message handler
    client.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Setup close handler
    client.on('close', () => {
      this.handleDisconnect(client);
    });

    // Setup error handler
    client.on('error', (error) => {
      console.error(`WebSocket error for client ${client.id}:`, error);
    });

    // Send welcome message
    client.send(JSON.stringify({
      type: 'connected',
      clientId: client.id,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(client: ExtendedWebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as SubscriptionMessage;

      if (message.action === 'subscribe') {
        this.handleSubscribe(client, message.projectId);
      } else if (message.action === 'unsubscribe') {
        this.handleUnsubscribe(client, message.projectId);
      } else {
        const errorMsg: ErrorMessage = {
          error: 'Invalid action',
          message: 'Action must be "subscribe" or "unsubscribe"'
        };
        client.send(JSON.stringify(errorMsg));
      }
    } catch (error) {
      const errorMsg: ErrorMessage = {
        error: 'Invalid message',
        message: 'Failed to parse message as JSON'
      };
      client.send(JSON.stringify(errorMsg));
    }
  }

  /**
   * Handle project subscription
   */
  private handleSubscribe(client: ExtendedWebSocket, projectId: string): void {
    // Add to client subscriptions
    client.subscriptions.add(projectId);

    // Create event handler for this client and project
    const handler: EventHandler = (event: Event) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    };

    // Store handler reference on client for cleanup
    if (!(client as any).eventHandlers) {
      (client as any).eventHandlers = new Map<string, EventHandler>();
    }
    (client as any).eventHandlers.set(projectId, handler);

    // Subscribe to events
    eventService.subscribe(projectId, handler);

    console.log(`Client ${client.id} subscribed to project ${projectId}`);

    // Send confirmation
    client.send(JSON.stringify({
      type: 'subscribed',
      projectId,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle project unsubscription
   */
  private handleUnsubscribe(client: ExtendedWebSocket, projectId: string): void {
    // Remove from client subscriptions
    client.subscriptions.delete(projectId);

    // Get and remove event handler
    const eventHandlers = (client as any).eventHandlers as Map<string, EventHandler> | undefined;
    const handler = eventHandlers?.get(projectId);
    if (handler) {
      eventService.unsubscribe(projectId, handler);
      eventHandlers!.delete(projectId);
    }

    console.log(`Client ${client.id} unsubscribed from project ${projectId}`);

    // Send confirmation
    client.send(JSON.stringify({
      type: 'unsubscribed',
      projectId,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(client: ExtendedWebSocket): void {
    console.log(`WebSocket client disconnected: ${client.id}`);

    // Unsubscribe from all projects
    const eventHandlers = (client as any).eventHandlers as Map<string, EventHandler> | undefined;
    if (eventHandlers) {
      for (const [projectId, handler] of eventHandlers.entries()) {
        eventService.unsubscribe(projectId, handler);
      }
      eventHandlers.clear();
    }

    // Remove client
    this.clients.delete(client.id);
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    if (this.config.pingInterval) {
      this.pingInterval = setInterval(() => {
        this.wss.clients.forEach((ws) => {
          const client = ws as ExtendedWebSocket;

          if (!client.isAlive) {
            console.log(`Terminating dead connection: ${client.id}`);
            return client.terminate();
          }

          client.isAlive = false;
          client.ping();
        });
      }, this.config.pingInterval);
    }
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get subscription count for a project
   */
  getSubscriptionCount(projectId: string): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(projectId)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    this.stopHeartbeat();

    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}
