// EatEase-Diner/frontend/src/services/pollingService.js

const API_BASE_URL = "http://localhost:8000";

class PollingService {
  constructor() {
    this.intervals = new Map();
    this.subscribers = new Map();
    this.pollingInterval = 30000; // 30 seconds
    this.isTabActive = true;
    
    // Track tab visibility - SIMPLIFIED
    if (typeof document !== 'undefined') {
      document.addEventListener("visibilitychange", () => {
        this.isTabActive = !document.hidden;
        console.log(`👁️ Tab is now ${this.isTabActive ? 'active' : 'inactive'}`);
        
        if (!this.isTabActive) {
          this.pausePolling();
        } else {
          this.resumePolling();
        }
      });
    }
  }

  // ✅ SIMPLE SUBSCRIBE
  subscribe(restaurantId, callback) {
    console.log(`📡 [Polling] Subscribing to restaurant ${restaurantId}`);

    // Store callback
    if (!this.subscribers.has(restaurantId)) {
      this.subscribers.set(restaurantId, new Set());
    }
    this.subscribers.get(restaurantId).add(callback);

    // Start polling if not already started
    if (!this.intervals.has(restaurantId)) {
      console.log(`▶️ [Polling] Starting NEW interval for ${restaurantId}`);
      this.startPolling(restaurantId);
    } else {
      console.log(`🔄 [Polling] Using EXISTING interval for ${restaurantId}`);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(restaurantId, callback);
  }

  // ✅ SIMPLE UNSUBSCRIBE
  unsubscribe(restaurantId, callback) {
    if (this.subscribers.has(restaurantId)) {
      const callbacks = this.subscribers.get(restaurantId);
      callbacks.delete(callback);

      // If no more subscribers, stop polling
      if (callbacks.size === 0) {
        console.log(`⏹️ [Polling] No more subscribers, stopping interval for ${restaurantId}`);
        this.stopPolling(restaurantId);
        this.subscribers.delete(restaurantId);
      }
    }
  }

  // ✅ SIMPLE START POLLING
  startPolling(restaurantId) {
    console.log(`⏱️ [Polling] Setting up 30s interval for ${restaurantId}`);
    
    // Clear any existing interval first (safety)
    this.stopPolling(restaurantId);

    // Create the interval
    const intervalId = setInterval(() => {
      if (this.isTabActive) {
        console.log(`⏰ [Polling] 30s interval tick for ${restaurantId}`);
        this.fetchRestaurantStatus(restaurantId);
      }
    }, this.pollingInterval);

    this.intervals.set(restaurantId, intervalId);
    
    // Fetch immediately
    console.log(`🔍 [Polling] Initial fetch for ${restaurantId}`);
    this.fetchRestaurantStatus(restaurantId);
  }

  // ✅ SIMPLE STOP POLLING
  stopPolling(restaurantId) {
    if (this.intervals.has(restaurantId)) {
      console.log(`⏹️ [Polling] Stopping interval for ${restaurantId}`);
      clearInterval(this.intervals.get(restaurantId));
      this.intervals.delete(restaurantId);
    }
  }

  // ✅ FIXED PAUSE POLLING
  pausePolling() {
    console.log("⏸️ [Polling] Pausing all intervals");
    // Just clear the intervals - we'll restart them in resume
    this.intervals.forEach((intervalId, restaurantId) => {
      clearInterval(intervalId);
      console.log(`⏸️ [Polling] Cleared interval for ${restaurantId}`);
    });
    // Don't delete from map - we need to know which intervals to restart
  }

  // ✅ FIXED RESUME POLLING - THIS WAS THE BUG!
  resumePolling() {
    console.log("▶️ [Polling] Resuming all intervals");
    
    // Restart intervals for all restaurants that have subscribers
    this.subscribers.forEach((callbacks, restaurantId) => {
      if (callbacks.size > 0) {
        console.log(`▶️ [Polling] Restarting interval for ${restaurantId}`);
        // Clear any existing (should already be cleared by pause)
        if (this.intervals.has(restaurantId)) {
          clearInterval(this.intervals.get(restaurantId));
        }
        
        // Create new interval
        const intervalId = setInterval(() => {
          if (this.isTabActive) {
            console.log(`⏰ [Polling] Interval tick for ${restaurantId}`);
            this.fetchRestaurantStatus(restaurantId);
          }
        }, this.pollingInterval);
        
        this.intervals.set(restaurantId, intervalId);
        
        // Fetch immediately on resume
        console.log(`🔍 [Polling] Immediate fetch on resume for ${restaurantId}`);
        this.fetchRestaurantStatus(restaurantId);
      }
    });
  }

  // ✅ SIMPLE FETCH
  async fetchRestaurantStatus(restaurantId) {
    try {
      console.log(`🔍 [Polling] Fetching status for ${restaurantId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/restaurants/${restaurantId}/status`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant) {
          console.log(`✅ [Polling] Update for ${restaurantId}:`, 
            `Status: ${data.restaurant.crowd_status},`,
            `Occupancy: ${data.restaurant.current_occupancy}/${data.restaurant.max_capacity}`,
            `at ${new Date().toLocaleTimeString()}`
          );
          this.notifySubscribers(restaurantId, data.restaurant);
        }
      } else {
        console.warn(`⚠️ [Polling] Fetch failed for ${restaurantId}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ [Polling] Error fetching ${restaurantId}:`, error);
    }
  }

  // ✅ SIMPLE NOTIFY
  notifySubscribers(restaurantId, restaurantData) {
    if (this.subscribers.has(restaurantId)) {
      const callbacks = this.subscribers.get(restaurantId);
      console.log(`📢 [Polling] Notifying ${callbacks.size} subscribers for ${restaurantId}`);
      callbacks.forEach((callback) => {
        try {
          callback(restaurantData);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }
}

// Export singleton instance
export default new PollingService();