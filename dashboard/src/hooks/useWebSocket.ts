import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketEvent } from '@/api/types';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type EventCallback = (event: WebSocketEvent) => void;

interface UseWebSocketOptions {
  enabled?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

/**
 * Hook for WebSocket connection with automatic reconnection and event subscription
 */
export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const { enabled = true, reconnect = true, maxReconnectAttempts = 10 } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [events, setEvents] = useState<WebSocketEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscribersRef = useRef<Map<string, Set<EventCallback>>>(new Map());

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000;
    const maxDelay = 16000;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);
    return delay;
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      const separator = url.includes('?') ? '&' : '?';
      const wsUrl = token ? `${url}${separator}token=${token}` : url;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          console.log('[WebSocket] Event received:', data);

          // Add to events array
          setEvents((prev) => [...prev, data]);

          // Notify subscribers
          const callbacks = subscribersRef.current.get(data.eventType);
          if (callbacks) {
            callbacks.forEach((callback) => callback(data));
          }

          // Notify wildcard subscribers
          const wildcardCallbacks = subscribersRef.current.get('*');
          if (wildcardCallbacks) {
            wildcardCallbacks.forEach((callback) => callback(data));
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = getReconnectDelay();
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      setConnectionStatus('error');
    }
  }, [enabled, url, reconnect, maxReconnectAttempts, getReconnectDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, []);

  /**
   * Subscribe to specific event types
   */
  const subscribe = useCallback((eventType: string, callback: EventCallback) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }

    subscribersRef.current.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  }, []);

  /**
   * Unsubscribe from event type
   */
  const unsubscribe = useCallback((eventType: string) => {
    subscribersRef.current.delete(eventType);
  }, []);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    events,
    subscribe,
    unsubscribe,
    clearEvents,
    connect,
    disconnect,
  };
}
