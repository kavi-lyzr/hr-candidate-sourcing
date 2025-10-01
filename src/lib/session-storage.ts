/**
 * In-memory storage for tool call results, indexed by sessionId
 * This allows us to pass data from tool calls back to the chat endpoint
 */

interface ToolResult {
  sessionId: string;
  toolName: string;
  result: any;
  timestamp: Date;
}

class SessionStorage {
  private storage: Map<string, ToolResult[]>;
  private readonly TTL = 10 * 60 * 1000; // 10 minutes TTL

  constructor() {
    this.storage = new Map();
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Store a tool result for a session
   */
  set(sessionId: string, toolName: string, result: any): void {
    const existing = this.storage.get(sessionId) || [];
    existing.push({
      sessionId,
      toolName,
      result,
      timestamp: new Date(),
    });
    this.storage.set(sessionId, existing);
    console.log(`[SessionStorage] Stored ${toolName} result for session ${sessionId}`);
  }

  /**
   * Get all tool results for a session
   */
  get(sessionId: string): ToolResult[] {
    return this.storage.get(sessionId) || [];
  }

  /**
   * Get specific tool result for a session
   */
  getToolResult(sessionId: string, toolName: string): any | null {
    const results = this.storage.get(sessionId) || [];
    const result = results.find(r => r.toolName.includes(toolName));
    return result ? result.result : null;
  }

  /**
   * Clear results for a session
   */
  clear(sessionId: string): void {
    this.storage.delete(sessionId);
    console.log(`[SessionStorage] Cleared session ${sessionId}`);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [sessionId, results] of this.storage.entries()) {
      const validResults = results.filter(r => 
        now - r.timestamp.getTime() < this.TTL
      );
      
      if (validResults.length === 0) {
        this.storage.delete(sessionId);
        cleaned++;
      } else if (validResults.length < results.length) {
        this.storage.set(sessionId, validResults);
      }
    }
    
    if (cleaned > 0) {
      console.log(`[SessionStorage] Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Get storage size for debugging
   */
  size(): number {
    return this.storage.size;
  }
}

// Export singleton instance
export const sessionStorage = new SessionStorage();

