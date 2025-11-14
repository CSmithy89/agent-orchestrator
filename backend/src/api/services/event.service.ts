/**
 * EventService - Real-time event publishing and subscription management
 * Implements publish/subscribe pattern for WebSocket real-time updates
 */

import { Event, EventType } from '../types/events.types.js';

/**
 * Event handler function type
 */
export type EventHandler = (event: Event) => void;

/**
 * EventService class - Singleton event bus for real-time updates
 */
export class EventService {
  private static instance: EventService;
  private subscribers: Map<string, Set<EventHandler>>;
  private globalSubscribers: Set<EventHandler>;

  private constructor() {
    this.subscribers = new Map();
    this.globalSubscribers = new Set();
  }

  /**
   * Get singleton instance of EventService
   */
  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Emit an event to all subscribed handlers
   * @param event Event to emit
   */
  public emit(event: Event): void {
    // Emit to project-specific subscribers
    const projectSubscribers = this.subscribers.get(event.projectId);
    if (projectSubscribers) {
      projectSubscribers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }

    // Emit to global subscribers
    this.globalSubscribers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in global event handler:', error);
      }
    });
  }

  /**
   * Subscribe to events for a specific project
   * @param projectId Project identifier to subscribe to
   * @param handler Event handler function
   */
  public subscribe(projectId: string, handler: EventHandler): void {
    if (!this.subscribers.has(projectId)) {
      this.subscribers.set(projectId, new Set());
    }

    const projectSubscribers = this.subscribers.get(projectId)!;
    projectSubscribers.add(handler);
  }

  /**
   * Unsubscribe from events for a specific project
   * @param projectId Project identifier to unsubscribe from
   * @param handler Event handler function to remove
   */
  public unsubscribe(projectId: string, handler: EventHandler): void {
    const projectSubscribers = this.subscribers.get(projectId);
    if (projectSubscribers) {
      projectSubscribers.delete(handler);

      // Clean up empty subscriber sets
      if (projectSubscribers.size === 0) {
        this.subscribers.delete(projectId);
      }
    }
  }

  /**
   * Subscribe to all events (global subscription)
   * @param handler Event handler function
   */
  public subscribeGlobal(handler: EventHandler): void {
    this.globalSubscribers.add(handler);
  }

  /**
   * Unsubscribe from all events (global subscription)
   * @param handler Event handler function to remove
   */
  public unsubscribeGlobal(handler: EventHandler): void {
    this.globalSubscribers.delete(handler);
  }

  /**
   * Unsubscribe all handlers for a specific project
   * @param projectId Project identifier
   */
  public unsubscribeAll(projectId: string): void {
    this.subscribers.delete(projectId);
  }

  /**
   * Get count of subscribers for a specific project
   * @param projectId Project identifier
   * @returns Number of subscribers
   */
  public getSubscriberCount(projectId: string): number {
    return this.subscribers.get(projectId)?.size || 0;
  }

  /**
   * Get count of global subscribers
   * @returns Number of global subscribers
   */
  public getGlobalSubscriberCount(): number {
    return this.globalSubscribers.size;
  }

  /**
   * Helper method to create and emit an event
   * @param projectId Project identifier
   * @param eventType Type of event
   * @param data Event data
   */
  public emitEvent(projectId: string, eventType: EventType, data: unknown): void {
    const event: Event = {
      projectId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };
    this.emit(event);
  }

  /**
   * Clear all subscriptions (for testing)
   */
  public clearAll(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }
}

// Export singleton instance
export const eventService = EventService.getInstance();
