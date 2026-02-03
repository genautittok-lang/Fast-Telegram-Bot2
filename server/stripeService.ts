import { getUncachableStripeClient, getStripePublishableKey } from './stripeClient';
import { db } from './db';
import { sql } from 'drizzle-orm';

function getDb() {
  if (!db) {
    throw new Error('Database not configured');
  }
  return db;
}

export class StripeService {
  async createCustomer(email: string, userId: string, metadata?: Record<string, string>) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId, ...metadata },
    });
  }

  async createCheckoutSession(options: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    mode?: 'payment' | 'subscription';
  }) {
    const stripe = await getUncachableStripeClient();
    
    return await stripe.checkout.sessions.create({
      customer: options.customerId,
      customer_email: options.customerId ? undefined : options.customerEmail,
      payment_method_types: ['card'],
      line_items: [{ price: options.priceId, quantity: 1 }],
      mode: options.mode || 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata,
      payment_intent_data: options.mode === 'payment' ? {
        metadata: options.metadata,
      } : undefined,
      allow_promotion_codes: true,
    });
  }

  async createPaymentLink(priceId: string, metadata?: Record<string, string>) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      allow_promotion_codes: true,
    });
  }

  async getPublishableKey() {
    return await getStripePublishableKey();
  }

  async getProduct(productId: string) {
    const result = await getDb().execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true) {
    const result = await getDb().execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} ORDER BY name`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true) {
    const result = await getDb().execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY pr.unit_amount ASC
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await getDb().execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true) {
    const result = await getDb().execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} ORDER BY unit_amount`
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await getDb().execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }
}

export const stripeService = new StripeService();
