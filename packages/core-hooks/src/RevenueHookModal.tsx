'use client';
/**
 * packages/core-hooks/src/RevenueHookModal.tsx
 *
 * Revenue Hook Modal — displays tiered pricing options at lifecycle moments.
 * Used in portal-owner and portal-contractor apps.
 *
 * Usage:
 *   import { RevenueHookModal } from '@kealee/core-hooks'
 *
 *   <RevenueHookModal
 *     stage="permit_detected"
 *     projectId="proj_abc"
 *     onSelect={(tier) => handleSelection(tier)}
 *     onDismiss={() => setOpen(false)}
 *   />
 */

import React, { useEffect, useState } from 'react';
import { X, Check, Star, ArrowRight, Loader2 } from 'lucide-react';
import {
  type HookStage,
  type HookTier,
  getHook,
} from './hooks.config.js';
import {
  trackHookShown,
  trackTierSelected,
  trackHookDismissed,
  trackCheckoutStarted,
} from './analytics.js';
import { createCheckoutSession } from './payment.js';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RevenueHookModalProps {
  stage:      HookStage;
  projectId?: string;
  userId?:    string;
  onSelect?:  (tier: HookTier) => void;
  onDismiss?: () => void;
  /** Override headline (e.g. include trade name: "Framing permits detected") */
  headlineOverride?: string;
  /** Show immediately on render */
  autoOpen?: boolean;
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  onSelect,
  loading,
}: {
  tier:     HookTier;
  onSelect: (t: HookTier) => void;
  loading:  boolean;
}) {
  const isFree = tier.price === 0;

  return (
    <div
      style={{
        border:        tier.highlighted ? '2px solid #2ABFBF' : '1px solid #e2e8f0',
        borderRadius:  '12px',
        padding:       '24px',
        position:      'relative',
        background:    tier.highlighted ? 'rgba(42,191,191,0.04)' : '#fff',
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
        minWidth:      '200px',
        flex:          '1',
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <div style={{
          position:        'absolute',
          top:             '-12px',
          left:            '50%',
          transform:       'translateX(-50%)',
          background:      '#2ABFBF',
          color:           '#fff',
          fontSize:        '11px',
          fontWeight:      700,
          padding:         '4px 12px',
          borderRadius:    '20px',
          whiteSpace:      'nowrap',
          letterSpacing:   '0.05em',
          textTransform:   'uppercase',
        }}>
          {tier.badge}
        </div>
      )}

      {/* Name + Price */}
      <div>
        <p style={{ margin: 0, fontSize: '13px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {tier.name}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#1A2B4A' }}>
          {tier.priceLabel}
          {tier.price > 0 && tier.priceLabel.includes('/') === false && (
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#718096', marginLeft: '4px' }}>one-time</span>
          )}
        </p>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: '14px', color: '#4a5568', lineHeight: '1.5', flexGrow: 1 }}>
        {tier.description}
      </p>

      {/* Features */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#4a5568' }}>
            <Check size={14} style={{ color: '#2ABFBF', flexShrink: 0, marginTop: '2px' }} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSelect(tier)}
        disabled={loading}
        style={{
          marginTop:     '8px',
          padding:       '12px 20px',
          background:    tier.highlighted ? '#E8793A' : isFree ? 'transparent' : '#1A2B4A',
          color:         tier.highlighted ? '#fff' : isFree ? '#1A2B4A' : '#fff',
          border:        isFree ? '2px solid #1A2B4A' : 'none',
          borderRadius:  '8px',
          fontWeight:    700,
          fontSize:      '14px',
          cursor:        loading ? 'not-allowed' : 'pointer',
          opacity:       loading ? 0.7 : 1,
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'center',
          gap:           '6px',
          transition:    'opacity 0.15s',
        }}
      >
        {loading ? (
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <>
            {tier.cta}
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function RevenueHookModal({
  stage,
  projectId,
  userId,
  onSelect,
  onDismiss,
  headlineOverride,
  autoOpen = true,
}: RevenueHookModalProps) {
  const hook = getHook(stage);
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(autoOpen);

  // Track when shown
  useEffect(() => {
    if (isVisible) {
      trackHookShown({ stage, projectId, userId });
    }
  }, [isVisible, stage, projectId, userId]);

  if (!isVisible) return null;

  const handleSelect = async (tier: HookTier) => {
    trackTierSelected({
      stage, tierId: tier.id, tierName: tier.name, price: tier.price, projectId, userId,
    });

    if (tier.price === 0) {
      // Free tier — no checkout needed
      onSelect?.(tier);
      setIsVisible(false);
      return;
    }

    if (!tier.priceId) {
      // No Stripe price configured yet
      onSelect?.(tier);
      setIsVisible(false);
      return;
    }

    // Paid tier — initiate Stripe checkout
    setLoadingTierId(tier.id);
    try {
      const { url, sessionId } = await createCheckoutSession({
        priceId:   tier.priceId,
        tierId:    tier.id,
        stage,
        projectId,
        userId,
      });

      trackCheckoutStarted({
        stage, tierId: tier.id, tierName: tier.name,
        price: tier.price, sessionId, projectId, userId,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoadingTierId(null);
    }
  };

  const handleDismiss = () => {
    if (!hook.dismissable) return;
    trackHookDismissed({ stage, projectId, userId });
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={hook.dismissable ? handleDismiss : undefined}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'rgba(0,0,0,0.5)',
          zIndex:     9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hook-headline"
        style={{
          position:       'fixed',
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%, -50%)',
          zIndex:         9999,
          background:     '#fff',
          borderRadius:   '16px',
          width:          'min(92vw, 960px)',
          maxHeight:      '90vh',
          overflowY:      'auto',
          boxShadow:      '0 25px 50px rgba(0,0,0,0.25)',
          padding:        '40px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Star size={16} style={{ color: '#E8793A', fill: '#E8793A' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#E8793A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Kealee Services
              </span>
            </div>
            <h2 id="hook-headline" style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1A2B4A' }}>
              {headlineOverride ?? hook.headline}
            </h2>
            {hook.subheadline && (
              <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#718096' }}>
                {hook.subheadline}
              </p>
            )}
          </div>

          {hook.dismissable && (
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px', color: '#a0aec0', borderRadius: '4px',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Tiers */}
        <div style={{
          display:   'flex',
          gap:       '16px',
          flexWrap:  'wrap',
          alignItems: 'stretch',
        }}>
          {hook.tiers.map(tier => (
            <TierCard
              key={tier.id}
              tier={tier}
              onSelect={handleSelect}
              loading={loadingTierId === tier.id}
            />
          ))}
        </div>

        {/* Footer note */}
        <p style={{ margin: '24px 0 0', fontSize: '12px', color: '#a0aec0', textAlign: 'center' }}>
          Secure payment via Stripe. Cancel anytime for subscription services.
          {hook.dismissable && ' You can access these options later from your project dashboard.'}
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─── Inline version (no modal backdrop) ──────────────────────────────────────

export function RevenueHookInline({
  stage,
  projectId,
  userId,
  onSelect,
  headlineOverride,
}: Omit<RevenueHookModalProps, 'onDismiss' | 'autoOpen'>) {
  const hook = getHook(stage);
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);

  useEffect(() => {
    trackHookShown({ stage, projectId, userId });
  }, [stage, projectId, userId]);

  const handleSelect = async (tier: HookTier) => {
    trackTierSelected({ stage, tierId: tier.id, tierName: tier.name, price: tier.price, projectId, userId });

    if (tier.price === 0 || !tier.priceId) {
      onSelect?.(tier);
      return;
    }

    setLoadingTierId(tier.id);
    try {
      const { url, sessionId } = await createCheckoutSession({ priceId: tier.priceId, tierId: tier.id, stage, projectId, userId });
      trackCheckoutStarted({ stage, tierId: tier.id, tierName: tier.name, price: tier.price, sessionId, projectId, userId });
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setLoadingTierId(null);
    }
  };

  return (
    <div style={{ padding: '32px 0' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#1A2B4A' }}>
        {headlineOverride ?? hook.headline}
      </h3>
      {hook.subheadline && (
        <p style={{ margin: '4px 0 24px', color: '#718096', fontSize: '14px' }}>{hook.subheadline}</p>
      )}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {hook.tiers.map(tier => (
          <TierCard key={tier.id} tier={tier} onSelect={handleSelect} loading={loadingTierId === tier.id} />
        ))}
      </div>
    </div>
  );
}
