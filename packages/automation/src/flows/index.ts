/**
 * Automation Flows — Registration Entry Point
 *
 * Imports all lifecycle automation flows and provides a single
 * registerAllFlows() function called from workers/index.ts.
 */

import { OnboardingFlow } from './onboarding-flow.js';
import { SubscriptionFlow } from './subscription-flow.js';

export { OnboardingFlow } from './onboarding-flow.js';
export { SubscriptionFlow } from './subscription-flow.js';

/**
 * Register all automation flows.
 * Each flow subscribes to relevant EventBus events and orchestrates
 * cross-app automation chains.
 */
export function registerAllFlows(): void {
  const onboarding = new OnboardingFlow();
  onboarding.register();

  const subscription = new SubscriptionFlow();
  subscription.register();

  console.log('[Flows] All automation flows registered');
}
