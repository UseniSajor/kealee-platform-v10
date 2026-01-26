
import { Check } from 'lucide-react';

export default function SubscriptionPage() {
    const tiers = [
        {
            name: 'Starter',
            price: '$49',
            features: ['Access to Bid Agent', 'Visit Scheduler', '50 API calls/mo'],
            cta: 'Start Trial'
        },
        {
            name: 'Professional',
            price: '$199',
            features: ['All 14 Agents', 'Unlimited Command Center', 'Priority Support', '5,000 API calls/mo'],
            highlight: true,
            cta: 'Get Started'
        },
        {
            name: 'Enterprise API',
            price: 'Custom',
            features: ['Raw API Access', 'Dedicated Instances', 'SLA', 'Unlimited Scaling'],
            cta: 'Contact Sales'
        }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
                <p className="text-muted-foreground text-lg">
                    Rent the full Command Center or integrate our Agents into your own software via API.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => (
                    <div key={tier.name} className={`p-8 rounded-2xl border ${tier.highlight ? 'border-primary shadow-lg bg-primary/5' : 'bg-card'}`}>
                        <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                        <div className="text-3xl font-bold mb-6">{tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>

                        <ul className="space-y-4 mb-8">
                            {tier.features.map((feat) => (
                                <li key={feat} className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="text-sm">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button className={`w-full py-2 rounded-md font-medium transition-colors ${tier.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}>
                            {tier.cta}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-16 p-8 bg-muted rounded-xl">
                <h2 className="text-2xl font-bold mb-4">API Documentation for Developers</h2>
                <p className="mb-4 text-muted-foreground">
                    Want to build your own dashboard? Use our Agent API directly.
                </p>
                <div className="bg-background p-4 rounded-md font-mono text-sm overflow-x-auto text-foreground">
                    <p className="text-green-500">POST https://api.kealee.ai/v1/projects/:id/predict</p>
                    <p className="text-muted-foreground mt-2">Authorization: Bearer kealee_sk_...</p>
                    <p className="text-blue-500 mt-2">{`{ "projectId": "123" }`}</p>
                </div>
            </div>
        </div>
    )
}
