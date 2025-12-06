/**
 * Analytics and Event Tracking
 *
 * Simple analytics service for tracking user events and page views.
 * Can be extended to integrate with services like PostHog, Mixpanel, etc.
 */

interface EventProperties {
  [key: string]: string | number | boolean | null;
}

class Analytics {
  private userId: string | null = null;
  private enabled: boolean = true;

  /**
   * Initialize analytics with user ID
   */
  identify(userId: string, properties?: EventProperties) {
    this.userId = userId;
    this.track("user_identified", { ...properties, user_id: userId });
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: EventProperties) {
    if (!this.enabled) return;

    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        user_id: this.userId,
        url: typeof window !== "undefined" ? window.location.href : null,
      },
    };

    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", event);
    }

    // Send to analytics endpoint
    if (typeof window !== "undefined") {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch((err) => {
        console.error("Analytics error:", err);
      });
    }
  }

  /**
   * Track page view
   */
  page(pageName?: string, properties?: EventProperties) {
    this.track("page_viewed", {
      page_name: pageName || (typeof window !== "undefined" ? window.location.pathname : null),
      ...properties,
    });
  }

  /**
   * Track card scan
   */
  cardScanned(cardData: {
    player: string;
    set: string;
    estimatedValue: number;
  }) {
    this.track("card_scanned", {
      player: cardData.player,
      set: cardData.set,
      estimated_value: cardData.estimatedValue,
    });
  }

  /**
   * Track card saved
   */
  cardSaved(cardId: string) {
    this.track("card_saved", { card_id: cardId });
  }

  /**
   * Track listing generated
   */
  listingGenerated(platform: string, cardId: string) {
    this.track("listing_generated", {
      platform,
      card_id: cardId,
    });
  }

  /**
   * Track subscription event
   */
  subscriptionEvent(event: "checkout_started" | "checkout_completed" | "subscription_cancelled", plan?: string) {
    this.track(event, { plan: plan || null });
  }

  /**
   * Track CSV import
   */
  csvImported(cardCount: number) {
    this.track("csv_imported", { card_count: cardCount });
  }

  /**
   * Track export
   */
  dataExported(format: string, itemCount: number) {
    this.track("data_exported", {
      format,
      item_count: itemCount,
    });
  }

  /**
   * Track error
   */
  error(errorMessage: string, errorContext?: EventProperties) {
    this.track("error_occurred", {
      error_message: errorMessage,
      ...errorContext,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// React hook for analytics
export function useAnalytics() {
  return analytics;
}
