/**
 * Simple in-memory pub/sub for SSE communication
 * For production, consider using Redis or a similar service
 */

type Listener = (data: { type: string; [key: string]: unknown }) => void;

class PubSub {
    private channels: Map<string, Set<Listener>> = new Map();

    /**
     * Subscribe to a channel
     */
    subscribe(channel: string, listener: Listener): () => void {
        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
        }

        const listeners = this.channels.get(channel)!;
        listeners.add(listener);

        console.log(`Subscribed to channel: ${channel}, total listeners: ${listeners.size}`);

        // Return unsubscribe function
        return () => {
            listeners.delete(listener);
            console.log(`Unsubscribed from channel: ${channel}, remaining listeners: ${listeners.size}`);
            
            // Clean up empty channels
            if (listeners.size === 0) {
                this.channels.delete(channel);
            }
        };
    }

    /**
     * Publish data to a channel
     */
    publish(channel: string, data: { type: string; [key: string]: unknown }): void {
        const listeners = this.channels.get(channel);
        
        if (!listeners || listeners.size === 0) {
            console.log(`No listeners for channel: ${channel}`);
            return;
        }

        console.log(`Publishing to channel: ${channel}, listeners: ${listeners.size}`);
        
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`Error in listener for channel ${channel}:`, error);
            }
        });
    }

    /**
     * Check if a channel has any listeners
     */
    hasListeners(channel: string): boolean {
        return this.channels.has(channel) && this.channels.get(channel)!.size > 0;
    }

    /**
     * Get the number of listeners for a channel
     */
    getListenerCount(channel: string): number {
        return this.channels.get(channel)?.size || 0;
    }
}

// Export singleton instance
export const pubsub = new PubSub();

