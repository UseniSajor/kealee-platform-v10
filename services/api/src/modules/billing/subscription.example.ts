/**
 * Example: How to use Stripe config for subscriptions
 * This shows how to create subscriptions using the centralized config
 */

import Stripe from 'stripe';
import { stripeConfig, getPMServicePackages, calculatePlatformFee } from '../../config/stripe.config';

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2023-10-16',
});

/**
 * Example 1: Create PM Services subscription
 */
export async function createPMSubscription(
  customerId: string,
  packageType: 'packageA' | 'packageB' | 'packageC' | 'packageD'
) {
  const packageConfig = stripeConfig.pmServices[packageType];

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: packageConfig.priceId,
      },
    ],
    metadata: {
      package: packageType,
      hoursPerWeek: packageConfig.hoursPerWeek,
      projectLimit: packageConfig.projectLimit.toString(),
    },
  });

  return subscription;
}

/**
 * Example 2: Get all available PM packages for display
 */
export function getAvailablePMPackages() {
  return getPMServicePackages();
}

/**
 * Example 3: Create marketplace subscription
 */
export async function createMarketplaceSubscription(
  customerId: string,
  tier: 'basic' | 'professional' | 'premium'
) {
  const tierConfig = stripeConfig.marketplace[tier];

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: tierConfig.priceId,
      },
    ],
    metadata: {
      tier,
      leadLimit: tierConfig.leadLimit.toString(),
      photoLimit: tierConfig.photoLimit.toString(),
    },
  });

  return subscription;
}

/**
 * Example 4: Calculate and charge platform fee
 */
export async function chargePlatformFee(
  customerId: string,
  projectAmount: number,
  feeType: 'standard' | 'milestone' | 'architect' | 'architectPro'
) {
  const feeAmount = calculatePlatformFee(projectAmount, feeType);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: feeAmount,
    currency: 'usd',
    customer: customerId,
    description: `Platform fee for ${feeType} transaction`,
    metadata: {
      projectAmount: projectAmount.toString(),
      feeType,
      feePercentage: stripeConfig.fees[feeType].percentage.toString(),
    },
  });

  return paymentIntent;
}

/**
 * Example 5: Get subscription details
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Get the price ID from the subscription
  const priceId = subscription.items.data[0].price.id;

  // Find which package this is
  let packageInfo;
  
  // Check PM Services
  for (const [key, value] of Object.entries(stripeConfig.pmServices)) {
    if (value.priceId === priceId) {
      packageInfo = {
        type: 'pmServices',
        package: key,
        ...value,
      };
      break;
    }
  }

  // Check Marketplace
  if (!packageInfo) {
    for (const [key, value] of Object.entries(stripeConfig.marketplace)) {
      if (value.priceId === priceId) {
        packageInfo = {
          type: 'marketplace',
          tier: key,
          ...value,
        };
        break;
      }
    }
  }

  return {
    subscription,
    packageInfo,
  };
}

/**
 * Example 6: Upgrade/Downgrade subscription
 */
export async function changeSubscription(
  subscriptionId: string,
  newPackage: 'packageA' | 'packageB' | 'packageC' | 'packageD'
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const newPriceId = stripeConfig.pmServices[newPackage].priceId;

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations', // Pro-rate the difference
  });

  return updatedSubscription;
}

/**
 * Example 7: Create checkout session for new subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Example 8: Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
) {
  if (immediate) {
    // Cancel immediately
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } else {
    // Cancel at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  }
}
