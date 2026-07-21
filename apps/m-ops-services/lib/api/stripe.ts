// apps/m-ops-services/lib/api/stripe.ts
// Stripe integration for payments and subscriptions

export interface CheckoutSession {
  id: string;
  url: string;
  customerId?: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
  trialEnd?: string;
  packageId: string;
}

class StripeService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = '/api/stripe';
  }

  async createCheckoutSession(
    packageId: string,
    email: string,
    name: string
  ): Promise<CheckoutSession> {
    try {
      const response = await fetch(`${this.apiUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          email,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async createSubscription(
    packageId: string,
    customerId: string
  ): Promise<Subscription> {
    try {
      const response = await fetch(`${this.apiUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await fetch(`${this.apiUrl}/subscriptions/${subscriptionId}`);

      if (!response.ok) {
        throw new Error('Failed to get subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
