const API_BASE_URL = "http://localhost:8000";

class PollingService {
  constructor() {
    this.intervals = new Map();
    this.subscribers = new Map();
    this.pollingInterval = 30000; // 30 seconds
    this.isTabActive = true;
    this.retryDelays = new Map();
    this.isFetching = new Map();
    this.lastFetchTime = new Map();
    this.lastUpdateTime = new Map(); // ✅ ADD THIS: Track when data was last updated
    
    document.addEventListener("visibilitychange", () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive) {
        this.resumePolling();
      } else {
        this.pausePolling();
      }
    });
  }

  // Subscribe to restaurant updates
  subscribe(restaurantId, callback) {
    console.log(`Subscribing to restaurant ${restaurantId} updates`);

    // Store callback
    if (!this.subscribers.has(restaurantId)) {
      this.subscribers.set(restaurantId, new Set());
    }
    this.subscribers.get(restaurantId).add(callback);

    // ✅ SEND LAST KNOWN DATA IMMEDIATELY
    if (this.lastUpdateTime.has(restaurantId)) {
      console.log(`Sending cached data for ${restaurantId} to new subscriber`);
      // You'll need to store the last data somewhere. Let's add that:
      if (this.lastData && this.lastData[restaurantId]) {
        setTimeout(() => callback(this.lastData[restaurantId]), 100);
      }
    }

    // Start polling if not already started
    if (!this.intervals.has(restaurantId)) {
      this.startPolling(restaurantId);
    } else {
      // ✅ IF INTERVAL ALREADY EXISTS, TRIGGER IMMEDIATE UPDATE
      console.log(`Interval already exists for ${restaurantId}, triggering immediate fetch`);
      setTimeout(() => {
        if (this.isTabActive && !this.isFetching.get(restaurantId)) {
          this.fetchRestaurantStatus(restaurantId);
        }
      }, 1000);
    }

    return () => this.unsubscribe(restaurantId, callback);
  }

  // Start polling for a restaurant
  startPolling(restaurantId) {
    console.log(`Starting polling for restaurant ${restaurantId}`);

    // Fetch immediately
    this.fetchRestaurantStatus(restaurantId);

    // Set up interval - FIXED: Use arrow function to maintain 'this' context
    const intervalId = setInterval(() => {
      if (this.isTabActive) {
        this.fetchRestaurantStatus(restaurantId);
      }
    }, this.pollingInterval);

    this.intervals.set(restaurantId, intervalId);
  }

  // Fetch restaurant status from API - UPDATED
  async fetchRestaurantStatus(restaurantId) {
    // Check if already fetching
    if (this.isFetching.get(restaurantId)) {
      console.log(`Already fetching ${restaurantId}, skipping`);
      return;
    }
    
    // Check last fetch time (minimum 5 seconds between calls)
    const lastFetch = this.lastFetchTime.get(restaurantId);
    const now = Date.now();
    if (lastFetch && (now - lastFetch) < 5000) {
      console.log(`Skipping fetch for ${restaurantId}, last fetch was ${Math.round((now - lastFetch)/1000)}s ago`);
      return;
    }

    try {
      this.isFetching.set(restaurantId, true);
      
      // Check retry delay
      const currentDelay = this.retryDelays.get(restaurantId) || 0;
      if (currentDelay > 0) {
        console.log(`Waiting ${currentDelay}ms before polling ${restaurantId}`);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/restaurants/${restaurantId}/status`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      // Handle rate limiting
      if (response.status === 429) {
        console.warn(`Rate limited for restaurant ${restaurantId}`);
        const currentDelay = this.retryDelays.get(restaurantId) || 30000;
        const newDelay = Math.min(currentDelay * 2, 300000);
        this.retryDelays.set(restaurantId, newDelay);
        console.log(`Will retry in ${newDelay / 1000} seconds`);
        return;
      }

      // Reset retry delay on success
      this.retryDelays.delete(restaurantId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant) {
          this.lastFetchTime.set(restaurantId, Date.now());
          this.lastUpdateTime.set(restaurantId, Date.now()); // ✅ TRACK UPDATE TIME
          
          // ✅ STORE LAST DATA
          if (!this.lastData) this.lastData = {};
          this.lastData[restaurantId] = data.restaurant;
          
          this.notifySubscribers(restaurantId, data.restaurant);
        }
      }
    } catch (error) {
      console.error(`Error polling restaurant ${restaurantId}:`, error);
      const currentDelay = this.retryDelays.get(restaurantId) || 30000;
      const newDelay = Math.min(currentDelay * 1.5, 300000);
      this.retryDelays.set(restaurantId, newDelay);
    } finally {
      this.isFetching.set(restaurantId, false);
    }
  }

  // ✅ ADD THIS METHOD: Get time since last update
  getTimeSinceLastUpdate(restaurantId) {
    if (!this.lastUpdateTime.has(restaurantId)) return null;
    return Date.now() - this.lastUpdateTime.get(restaurantId);
  }

  // ✅ ADD THIS METHOD: Force update for all subscribers
  forceUpdate(restaurantId) {
    if (this.intervals.has(restaurantId)) {
      console.log(`Force updating ${restaurantId}`);
      this.fetchRestaurantStatus(restaurantId);
    }
  }

  // Unsubscribe from restaurant updates
  unsubscribe(restaurantId, callback) {
    if (this.subscribers.has(restaurantId)) {
      const callbacks = this.subscribers.get(restaurantId);
      callbacks.delete(callback);

      // If no more subscribers, stop polling
      if (callbacks.size === 0) {
        this.stopPolling(restaurantId);
        this.subscribers.delete(restaurantId);
      }
    }
  }

  // Start polling for a restaurant
  startPolling(restaurantId) {
    console.log(`Starting polling for restaurant ${restaurantId}`);

    // ✅ DELAY INITIAL FETCH TO AVOID RUSH
    setTimeout(() => {
      if (this.isTabActive) {
        this.fetchRestaurantStatus(restaurantId);
      }
    }, 2000); // Wait 2 seconds before first poll

    // Set up interval
    const intervalId = setInterval(() => {
      if (this.isTabActive) {
        this.fetchRestaurantStatus(restaurantId);
      }
    }, this.pollingInterval);

    this.intervals.set(restaurantId, intervalId);
  }

  // Stop polling for a restaurant
  stopPolling(restaurantId) {
    console.log(`Stopping polling for restaurant ${restaurantId}`);

    if (this.intervals.has(restaurantId)) {
      clearInterval(this.intervals.get(restaurantId));
      this.intervals.delete(restaurantId);
    }
    
    // ✅ CLEANUP TRACKING
    this.isFetching.delete(restaurantId);
    this.lastFetchTime.delete(restaurantId);
  }

  // Pause all polling (when tab is inactive)
  pausePolling() {
    console.log("Pausing polling (tab inactive)");
    this.intervals.forEach((intervalId, restaurantId) => {
      clearInterval(intervalId);
    });
  }

  // Resume polling (when tab becomes active)
  resumePolling() {
    console.log("Resuming polling (tab active)");
    this.subscribers.forEach((callbacks, restaurantId) => {
      if (callbacks.size > 0 && !this.intervals.has(restaurantId)) {
        this.startPolling(restaurantId);
      }
    });
  }

  // Fetch restaurant status from API
  async fetchRestaurantStatus(restaurantId) {
    // ✅ CHECK IF ALREADY FETCHING THIS RESTAURANT
    if (this.isFetching.get(restaurantId)) {
      console.log(`Already fetching ${restaurantId}, skipping`);
      return;
    }
    
    // ✅ CHECK LAST FETCH TIME (MINIMUM 25 SECONDS BETWEEN CALLS)
    const lastFetch = this.lastFetchTime.get(restaurantId);
    const now = Date.now();
    if (lastFetch && (now - lastFetch) < 25000) {
      console.log(`Skipping fetch for ${restaurantId}, last fetch was ${Math.round((now - lastFetch)/1000)}s ago`);
      return;
    }

    try {
      // Set fetching flag
      this.isFetching.set(restaurantId, true);
      
      // Check if we're in a retry delay
      const currentDelay = this.retryDelays.get(restaurantId) || 0;
      if (currentDelay > 0) {
        console.log(`Waiting ${currentDelay}ms before polling ${restaurantId}`);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/restaurants/${restaurantId}/status`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      // Handle rate limiting
      if (response.status === 429) {
        console.warn(`Rate limited for restaurant ${restaurantId}`);

        // Exponential backoff
        const currentDelay = this.retryDelays.get(restaurantId) || 30000; // Start with 30 seconds
        const newDelay = Math.min(currentDelay * 2, 300000); // Max 5 minutes
        this.retryDelays.set(restaurantId, newDelay);

        console.log(`Will retry in ${newDelay / 1000} seconds`);
        return;
      }

      // Reset retry delay on success
      this.retryDelays.delete(restaurantId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant) {
          // ✅ UPDATE LAST FETCH TIME
          this.lastFetchTime.set(restaurantId, Date.now());
          this.notifySubscribers(restaurantId, data.restaurant);
        }
      }
    } catch (error) {
      console.error(`Error polling restaurant ${restaurantId}:`, error);

      // Increment retry delay on error
      const currentDelay = this.retryDelays.get(restaurantId) || 30000;
      const newDelay = Math.min(currentDelay * 1.5, 300000);
      this.retryDelays.set(restaurantId, newDelay);
    } finally {
      // ✅ ALWAYS CLEAR FETCHING FLAG
      this.isFetching.set(restaurantId, false);
    }
  }

  // Notify all subscribers of a restaurant
  notifySubscribers(restaurantId, restaurantData) {
    if (this.subscribers.has(restaurantId)) {
      const callbacks = this.subscribers.get(restaurantId);
      callbacks.forEach((callback) => {
        try {
          callback(restaurantData);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }

  // Manual refresh (can be called from UI)
  async refreshRestaurant(restaurantId) {
    // ✅ FORCE CLEAR LAST FETCH TIME FOR MANUAL REFRESH
    this.lastFetchTime.delete(restaurantId);
    await this.fetchRestaurantStatus(restaurantId);
  }
}

// Export singleton instance
export default new PollingService();