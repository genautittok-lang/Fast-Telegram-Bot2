import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating DARKSHARE subscription products...');

  const existingProducts = await stripe.products.search({ query: "name:'DARKSHARE PRO'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation');
    return;
  }

  const proPlan = await stripe.products.create({
    name: 'DARKSHARE PRO',
    description: 'Professional OSINT security plan with 50 checks/day, priority support, and PDF reports',
    metadata: {
      tier: 'PRO',
      checksPerDay: '50',
      features: 'priority_support,pdf_reports,monitoring'
    }
  });

  const proMonthlyPrice = await stripe.prices.create({
    product: proPlan.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'PRO', billing: 'monthly' }
  });

  const proYearlyPrice = await stripe.prices.create({
    product: proPlan.id,
    unit_amount: 9999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'PRO', billing: 'yearly' }
  });

  console.log(`Created PRO plan: ${proPlan.id}`);
  console.log(`  Monthly price: ${proMonthlyPrice.id} ($9.99/mo)`);
  console.log(`  Yearly price: ${proYearlyPrice.id} ($99.99/yr)`);

  const enterprisePlan = await stripe.products.create({
    name: 'DARKSHARE ENTERPRISE',
    description: 'Enterprise OSINT security plan with unlimited checks, API access, dedicated support',
    metadata: {
      tier: 'ENTERPRISE',
      checksPerDay: 'unlimited',
      features: 'api_access,dedicated_support,custom_reports,priority_monitoring'
    }
  });

  const enterpriseMonthlyPrice = await stripe.prices.create({
    product: enterprisePlan.id,
    unit_amount: 2999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'ENTERPRISE', billing: 'monthly' }
  });

  const enterpriseYearlyPrice = await stripe.prices.create({
    product: enterprisePlan.id,
    unit_amount: 29999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'ENTERPRISE', billing: 'yearly' }
  });

  console.log(`Created ENTERPRISE plan: ${enterprisePlan.id}`);
  console.log(`  Monthly price: ${enterpriseMonthlyPrice.id} ($29.99/mo)`);
  console.log(`  Yearly price: ${enterpriseYearlyPrice.id} ($299.99/yr)`);

  console.log('\nProducts created successfully!');
  console.log('They will be synced to the database automatically via webhooks.');
}

createProducts().catch(console.error);
