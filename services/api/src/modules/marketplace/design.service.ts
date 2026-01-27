import Stripe from 'stripe'
import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
})

// Source of truth for design packages (matching mock data in frontend)
export const DESIGN_PACKAGES = [
    {
        id: 'd1',
        title: 'The Bethesda Modern ADU',
        price: 249900, // in cents
        description: 'Full blueprints, material list, and permit support for modern ADU.',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'd2',
        title: 'Chef\'s Dream Open Kitchen',
        price: 89900, // in cents
        description: '3D renderings, cabinet plans, and electrical layout for chef-style kitchen.',
        image: 'https://images.unsplash.com/photo-1556911220-e15224bbbe39?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'd3',
        title: 'Scandinavian Master Suite',
        price: 145000, // in cents
        description: 'BIM model, lighting specs, and permit-ready plans for master suite.',
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'd4',
        title: 'The Arlington Urban Loft',
        price: 495000, // in cents
        description: 'Full architectural set, engineering review, and cost estimate for urban loft.',
        image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=800&auto=format&fit=crop'
    }
]

export const designService = {
    /**
     * Create a Stripe Checkout Session for a design package
     */
    async createCheckoutSession(packageId: string, userId: string) {
        const pkg = DESIGN_PACKAGES.find(p => p.id === packageId)
        if (!pkg) {
            throw new NotFoundError('DesignPackage', packageId)
        }

        const user = await prismaAny.user.findUnique({
            where: { id: userId },
            select: { email: true, stripeCustomerId: true },
        })

        if (!user) {
            throw new NotFoundError('User', userId)
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: pkg.title,
                            description: pkg.description,
                            images: [pkg.image],
                        },
                        unit_amount: pkg.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer: user.stripeCustomerId || undefined,
            customer_email: user.stripeCustomerId ? undefined : user.email,
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/design/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/design`,
            metadata: {
                packageId,
                userId,
                type: 'DESIGN_HUB_PURCHASE'
            },
        })

        return {
            sessionId: session.id,
            url: session.url,
        }
    }
}
