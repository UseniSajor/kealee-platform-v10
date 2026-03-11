import { useState } from 'react';
import type { GetServerSideProps } from 'next';

interface Campaign {
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  benefits: string[];
}

interface Props {
  campaign: Campaign;
}

export default function CampaignPage({ campaign }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: campaign.slug,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          window.location.href = '/thank-you';
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '1rem' }}>Success!</h1>
          <p style={{ fontSize: '1.25rem' }}>Redirecting you now...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #2563eb, #1e40af)', color: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>{campaign.headline}</h1>
          <p style={{ fontSize: '1.5rem', color: '#bfdbfe' }}>{campaign.subheadline}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Why Choose Kealee?</h2>
            {campaign.benefits.map((benefit, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '2rem', height: '2rem', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>✓</span>
                </div>
                <p style={{ fontSize: '1.25rem' }}>{benefit}</p>
              </div>
            ))}
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e40af', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Or Call Us Directly:</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>(240) 467-3388</p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '0.5rem', padding: '2rem', color: '#1f2937' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Get Your Free Estimate</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Fill out the form and we will get back to you within 24 hours</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Full Name</label>
                <input type="text" placeholder="John Smith" required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Email Address</label>
                <input type="email" placeholder="john@example.com" required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Phone Number</label>
                <input type="tel" placeholder="(240) 555-0123" required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Project Type</label>
                <select required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                  value={formData.projectType} onChange={e => setFormData({...formData, projectType: e.target.value})}>
                  <option value="">Select One</option>
                  <option value="renovation">Renovation / Remodel</option>
                  <option value="home-addition">Home Addition</option>
                  <option value="new-home">New Home Construction</option>
                  <option value="commercial">Commercial Build-Out</option>
                  <option value="multifamily">Multifamily Development</option>
                  <option value="mixed-use">Mixed-Use Development</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting}
                style={{ width: '100%', background: '#f97316', color: 'white', padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}>
                {isSubmitting ? 'Submitting...' : 'Get FREE Estimate Now'}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '1rem' }}>
                We respect your privacy. Your information will never be shared.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const slug = context.params?.slug as string;
  
  const campaign: Campaign = {
    slug,
    name: 'Home Renovation AI Concepts',
    headline: 'See Your Dream Home Renovation in 3D - From $99',
    subheadline: 'AI-Powered Design Concepts Ready in 48 Hours',
    benefits: [
      'Digital Twin for Every Project — L1/L2/L3 Tiers',
      '7 Integrated Operating Systems (Land to Ops)',
      '13 AI KeaBot Assistants Powered by Claude',
      'Escrow-Protected Milestone Payments (7-Step Schedule)',
      'Full 12-Phase Lifecycle Tracking',
      'Serving DC-Baltimore Corridor & Beyond'
    ]
  };

  return { props: { campaign } };
};