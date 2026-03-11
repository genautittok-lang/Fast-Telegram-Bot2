import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

const TIER_REQUESTS: Record<string, number> = {
  'FREE': 15,
  'PRO': 50,
  'ENTERPRISE': 9999,
};

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event: Stripe.Event;
    try {
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not set. Rejecting webhook for security.');
        throw new Error('Webhook secret not configured');
      }
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return;
    }

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await WebhookHandlers.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await WebhookHandlers.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await WebhookHandlers.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private static async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userTgId = session.metadata?.userTgId;
    const tier = session.metadata?.tier?.toUpperCase() || 'PRO';

    if (!userTgId) {
      console.log('No userTgId in checkout session metadata');
      return;
    }

    console.log(`Upgrading user ${userTgId} to tier ${tier}`);

    try {
      const user = await storage.getUserByTgId(userTgId);
      if (user) {
        const requestsLeft = TIER_REQUESTS[tier] || 50;
        await storage.updateUser(user.id, {
          tier,
          requestsLeft,
        });
        console.log(`User ${userTgId} upgraded to ${tier} with ${requestsLeft} requests`);
      } else {
        console.log(`User ${userTgId} not found in database`);
      }
    } catch (err) {
      console.error('Error updating user tier:', err);
    }
  }

  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const tier = subscription.metadata?.tier?.toUpperCase() || 'PRO';
    
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      console.log(`Subscription ${subscription.id} is active for customer ${customerId}, tier: ${tier}`);
    }
  }

  private static async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const userTgId = subscription.metadata?.userTgId;
    if (!userTgId) return;

    try {
      const user = await storage.getUserByTgId(userTgId);
      if (user) {
        await storage.updateUser(user.id, {
          tier: 'FREE',
          requestsLeft: TIER_REQUESTS['FREE'],
        });
        console.log(`User ${userTgId} downgraded to FREE after subscription cancellation`);
      }
    } catch (err) {
      console.error('Error downgrading user:', err);
    }
  }

  private static async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    console.log(`Invoice paid for subscription ${subscriptionId}`);
  }
}
