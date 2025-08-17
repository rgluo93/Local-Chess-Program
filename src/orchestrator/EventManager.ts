/**
 * EventManager - Event-Driven Component Coordination
 * 
 * This class provides a centralized event management system that enables
 * loose coupling between components while maintaining coordinated state
 * updates and communication.
 */

import type {
  GameEvent,
  EventType,
  ComponentType,
  PerformanceMeasuredEvent,
  ErrorOccurredEvent,
  IntegrationError,
} from '../types/Integration';

// =============================================================================
// EVENT SUBSCRIPTION TYPES
// =============================================================================

interface EventSubscription<T extends GameEvent = GameEvent> {
  id: string;
  type: T['type'];
  listener: (event: T) => void;
  options: {
    once: boolean;
    priority: number;
    component?: ComponentType;
  };
  created: Date;
  callCount: number;
  lastCalled?: Date;
}

interface EventMetrics {
  type: EventType;
  totalEmitted: number;
  totalListeners: number;
  averageProcessingTime: number;
  lastEmitted?: Date;
  errors: number;
}

// =============================================================================
// EVENT MANAGER CONFIGURATION
// =============================================================================

interface EventManagerConfig {
  maxHistorySize: number;
  enableMetrics: boolean;
  enablePerformanceTracking: boolean;
  maxListenersPerEvent: number;
  enableDebugMode: boolean;
  errorHandling: {
    throwOnListenerError: boolean;
    maxRetries: number;
    retryDelayMs: number;
  };
}

const DEFAULT_CONFIG: EventManagerConfig = {
  maxHistorySize: 1000,
  enableMetrics: true,
  enablePerformanceTracking: true,
  maxListenersPerEvent: 50,
  enableDebugMode: false,
  errorHandling: {
    throwOnListenerError: false,
    maxRetries: 3,
    retryDelayMs: 100,
  },
};

// =============================================================================
// EVENT MANAGER IMPLEMENTATION
// =============================================================================

export class EventManager {
  private subscriptions = new Map<string, EventSubscription>();
  private eventHistory: GameEvent[] = [];
  private metrics = new Map<EventType, EventMetrics>();
  private config: EventManagerConfig;
  private nextSubscriptionId = 1;

  constructor(config: Partial<EventManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================================================

  /**
   * Add an event listener for a specific event type
   */
  addEventListener<T extends GameEvent>(
    type: T['type'],
    listener: (event: T) => void,
    options: {
      once?: boolean;
      priority?: number;
      component?: ComponentType;
    } = {}
  ): string {
    // Validate listener count
    const currentListeners = this.getListenerCount(type);
    if (currentListeners >= this.config.maxListenersPerEvent) {
      throw new Error(
        `Maximum listeners (${this.config.maxListenersPerEvent}) exceeded for event type: ${type}`
      );
    }

    const subscriptionId = `sub_${this.nextSubscriptionId++}`;
    const subscription: EventSubscription<T> = {
      id: subscriptionId,
      type,
      listener: listener as (event: GameEvent) => void,
      options: {
        once: options.once ?? false,
        priority: options.priority ?? 0,
        component: options.component,
      },
      created: new Date(),
      callCount: 0,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.initializeMetrics(type);

    if (this.config.enableDebugMode) {
      console.debug(`[EventManager] Added listener for ${type} (ID: ${subscriptionId})`);
    }

    return subscriptionId;
  }

  /**
   * Remove a specific event listener
   */
  removeEventListener(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);

    if (this.config.enableDebugMode) {
      console.debug(`[EventManager] Removed listener ${subscriptionId} for ${subscription.type}`);
    }

    return true;
  }

  /**
   * Remove all listeners for a specific event type or all types
   */
  removeAllListeners(type?: EventType): void {
    if (type) {
      for (const [id, subscription] of this.subscriptions) {
        if (subscription.type === type) {
          this.subscriptions.delete(id);
        }
      }
    } else {
      this.subscriptions.clear();
    }

    if (this.config.enableDebugMode) {
      const target = type ? `type ${type}` : 'all types';
      console.debug(`[EventManager] Removed all listeners for ${target}`);
    }
  }

  // ==========================================================================
  // EVENT EMISSION
  // ==========================================================================

  /**
   * Emit an event to all registered listeners
   */
  async emitEvent<T extends GameEvent>(event: T): Promise<void> {
    const startTime = performance.now();

    try {
      // Add to history
      this.addToHistory(event);

      // Get relevant subscriptions and sort by priority
      const subscriptions = this.getSubscriptionsForType(event.type)
        .sort((a, b) => b.options.priority - a.options.priority);

      if (this.config.enableDebugMode) {
        console.debug(`[EventManager] Emitting ${event.type} to ${subscriptions.length} listeners`);
      }

      // Process subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(subscription => this.processSubscription(subscription, event))
      );

      // Handle subscription results
      const errors: string[] = [];
      let processedCount = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const subscription = subscriptions[i];

        if (result.status === 'fulfilled') {
          processedCount++;
          subscription.callCount++;
          subscription.lastCalled = new Date();

          // Remove one-time listeners
          if (subscription.options.once) {
            this.subscriptions.delete(subscription.id);
          }
        } else {
          errors.push(`Listener ${subscription.id}: ${result.reason}`);
          this.handleListenerError(subscription, result.reason, event);
        }
      }

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(event.type, startTime, errors.length);
      }

      // Emit performance event if enabled
      if (this.config.enablePerformanceTracking) {
        const duration = performance.now() - startTime;
        this.emitPerformanceEvent(event.type, duration, processedCount);
      }

    } catch (error) {
      this.handleEmissionError(event, error as Error);
      throw error;
    }
  }

  /**
   * Emit event synchronously (for critical events)
   */
  emitEventSync<T extends GameEvent>(event: T): void {
    const startTime = performance.now();

    try {
      this.addToHistory(event);

      const subscriptions = this.getSubscriptionsForType(event.type)
        .sort((a, b) => b.options.priority - a.options.priority);

      for (const subscription of subscriptions) {
        try {
          subscription.listener(event);
          subscription.callCount++;
          subscription.lastCalled = new Date();

          if (subscription.options.once) {
            this.subscriptions.delete(subscription.id);
          }
        } catch (error) {
          this.handleListenerError(subscription, error as Error, event);
        }
      }

      if (this.config.enableMetrics) {
        this.updateMetrics(event.type, startTime, 0);
      }

    } catch (error) {
      this.handleEmissionError(event, error as Error);
      throw error;
    }
  }

  // ==========================================================================
  // EVENT HISTORY & UTILITIES
  // ==========================================================================

  /**
   * Get event history, optionally filtered by type
   */
  getEventHistory(type?: EventType, limit?: number): GameEvent[] {
    let events = type 
      ? this.eventHistory.filter(e => e.type === type)
      : [...this.eventHistory];

    if (limit && limit > 0) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
    if (this.config.enableDebugMode) {
      console.debug('[EventManager] Event history cleared');
    }
  }

  /**
   * Wait for a specific event to occur
   */
  waitForEvent<T extends GameEvent>(
    type: T['type'],
    timeout: number = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutHandle: NodeJS.Timeout;
      let subscriptionId: string;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (subscriptionId) this.removeEventListener(subscriptionId);
      };

      timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for event: ${type}`));
      }, timeout);

      subscriptionId = this.addEventListener(
        type,
        (event: T) => {
          cleanup();
          resolve(event);
        },
        { once: true }
      );
    });
  }

  /**
   * Get the last event of a specific type
   */
  getLastEvent(type?: EventType): GameEvent | null {
    const events = type 
      ? this.eventHistory.filter(e => e.type === type)
      : this.eventHistory;

    return events.length > 0 ? events[events.length - 1] : null;
  }

  // ==========================================================================
  // METRICS & DIAGNOSTICS
  // ==========================================================================

  /**
   * Get event metrics
   */
  getMetrics(): Record<EventType, EventMetrics> {
    const result: Record<string, EventMetrics> = {};
    for (const [type, metrics] of this.metrics) {
      result[type] = { ...metrics };
    }
    return result as Record<EventType, EventMetrics>;
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(type?: EventType): number {
    if (type) {
      return this.getSubscriptionsForType(type).length;
    }
    return this.subscriptions.size;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): Array<{
    id: string;
    type: EventType;
    component?: ComponentType;
    created: Date;
    callCount: number;
    lastCalled?: Date;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      type: sub.type,
      component: sub.options.component,
      created: sub.created,
      callCount: sub.callCount,
      lastCalled: sub.lastCalled,
    }));
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    if (this.config.enableDebugMode) {
      console.debug('[EventManager] Metrics reset');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EventManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    if (this.config.enableDebugMode) {
      console.debug('[EventManager] Configuration updated', updates);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EventManagerConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private getSubscriptionsForType(type: EventType): EventSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.type === type);
  }

  private async processSubscription(
    subscription: EventSubscription,
    event: GameEvent
  ): Promise<void> {
    const maxRetries = this.config.errorHandling.maxRetries;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        await subscription.listener(event);
        return;
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          throw error;
        }
        
        // Wait before retry
        if (this.config.errorHandling.retryDelayMs > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.errorHandling.retryDelayMs)
          );
        }
      }
    }
  }

  private addToHistory(event: GameEvent): void {
    this.eventHistory.push(event);

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxHistorySize);
    }
  }

  private initializeMetrics(type: EventType): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, {
        type,
        totalEmitted: 0,
        totalListeners: 0,
        averageProcessingTime: 0,
        errors: 0,
      });
    }
  }

  private updateMetrics(
    type: EventType, 
    startTime: number, 
    errorCount: number
  ): void {
    const metrics = this.metrics.get(type);
    if (!metrics) return;

    const duration = performance.now() - startTime;
    const newTotal = metrics.totalEmitted + 1;
    
    metrics.totalEmitted = newTotal;
    metrics.totalListeners = this.getListenerCount(type);
    metrics.averageProcessingTime = 
      (metrics.averageProcessingTime * (newTotal - 1) + duration) / newTotal;
    metrics.lastEmitted = new Date();
    metrics.errors += errorCount;
  }

  private emitPerformanceEvent(
    operation: string,
    duration: number,
    processed: number
  ): void {
    const perfEvent: PerformanceMeasuredEvent = {
      type: 'performance:measured',
      timestamp: new Date(),
      source: 'orchestrator',
      operation: `event_${operation}`,
      duration,
      threshold: 10, // 10ms threshold for event processing
      passed: duration <= 10,
    };

    // Emit synchronously to avoid infinite recursion
    this.emitEventSync(perfEvent);
  }

  private handleListenerError(
    subscription: EventSubscription,
    error: Error,
    event: GameEvent
  ): void {
    if (this.config.enableDebugMode) {
      console.error(`[EventManager] Listener error in ${subscription.id}:`, error);
    }

    // Emit error event
    const errorEvent: ErrorOccurredEvent = {
      type: 'error:occurred',
      timestamp: new Date(),
      source: subscription.options.component || 'orchestrator',
      error: {
        ...error,
        type: 'event_propagation',
        component: subscription.options.component || 'orchestrator',
        operation: `event_listener_${subscription.type}`,
        timestamp: new Date(),
        recoverable: true,
      } as IntegrationError,
      context: `Event listener for ${subscription.type}`,
      recoverable: true,
    };

    this.emitEventSync(errorEvent);

    // Remove listener if configured to do so
    if (this.config.errorHandling.throwOnListenerError) {
      throw error;
    }
  }

  private handleEmissionError(event: GameEvent, error: Error): void {
    if (this.config.enableDebugMode) {
      console.error('[EventManager] Event emission error:', error);
    }

    // Log critical error - can't emit error event due to emission failure
    console.error(`Critical EventManager error during ${event.type} emission:`, error);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
    this.metrics.clear();
    
    if (this.config.enableDebugMode) {
      console.debug('[EventManager] Destroyed');
    }
  }
}