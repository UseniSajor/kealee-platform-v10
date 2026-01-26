
import { prisma } from '../../core/db';
import { MatchCriteria, MatchResult } from './types';

export class ContractorMatcher {
    private readonly MAX_DISTANCE_MILES = 50;
    private readonly MIN_RATING = 3.5;
    private readonly MAX_MATCHES = 10;

    async findMatches(criteria: MatchCriteria): Promise<MatchResult[]> {
        const contractors = await prisma.contractor.findMany({
            where: {
                status: 'ACTIVE',
                trades: { hasSome: criteria.trades },
                rating: { gte: criteria.minRating || this.MIN_RATING },
            },
            include: {
                credentials: { where: { expiresAt: { gt: new Date() } } },
                projects: { take: 10, orderBy: { completedAt: 'desc' }, where: { status: 'COMPLETED' } },
                reviews: { take: 20, orderBy: { createdAt: 'desc' } },
            },
        });

        const matches = contractors
            .map(contractor => this.scoreContractor(contractor, criteria))
            .filter(match => match !== null && match.score >= 0.4)
            .sort((a, b) => b!.score - a!.score)
            .slice(0, this.MAX_MATCHES) as MatchResult[];

        return matches;
    }

    private scoreContractor(contractor: any, criteria: MatchCriteria): MatchResult | null {
        let score = 0;
        const matchReasons: string[] = [];

        const distance = this.calculateDistance(
            criteria.location,
            { lat: contractor.latitude, lng: contractor.longitude }
        );

        if (distance > this.MAX_DISTANCE_MILES) return null;

        const distanceScore = 25 * (1 - distance / this.MAX_DISTANCE_MILES);
        score += distanceScore;
        matchReasons.push(`${Math.round(distance)} miles from project`);

        const matchedTrades = contractor.trades.filter((t: string) =>
            criteria.trades.map(ct => ct.toLowerCase()).includes(t.toLowerCase())
        );
        const tradeScore = (matchedTrades.length / criteria.trades.length) * 25;
        score += tradeScore;
        matchReasons.push(`${matchedTrades.length}/${criteria.trades.length} required trades`);

        const ratingScore = ((contractor.rating - 3) / 2) * 20;
        score += Math.max(0, ratingScore);
        matchReasons.push(`${contractor.rating.toFixed(1)}★ rating (${contractor.reviews.length} reviews)`);

        const similarProjects = contractor.projects.filter((p: any) => {
            const budget = Number(p.contractValue);
            return budget >= criteria.budgetRange.min * 0.5 && budget <= criteria.budgetRange.max * 2;
        });
        const historyScore = Math.min(similarProjects.length, 5) * 3;
        score += historyScore;
        if (similarProjects.length > 0) {
            matchReasons.push(`${similarProjects.length} similar projects completed`);
        }

        const requiredCreds = criteria.requiredCredentials || ['LICENSE', 'INSURANCE', 'BOND'];
        const validCredentials = contractor.credentials.filter((c: any) =>
            requiredCreds.some(req => c.type.toUpperCase().includes(req))
        );
        const credScore = (validCredentials.length / requiredCreds.length) * 15;
        score += credScore;
        matchReasons.push(`${validCredentials.length}/${requiredCreds.length} credentials verified`);

        return {
            contractorId: contractor.id,
            contractor: {
                id: contractor.id,
                name: contractor.contactName,
                company: contractor.companyName,
                email: contractor.email,
                phone: contractor.phone,
                rating: contractor.rating,
                trades: contractor.trades,
            },
            score: score / 100,
            matchReasons,
            distance,
            availability: true,
        };
    }

    private calculateDistance(
        point1: { lat: number; lng: number },
        point2: { lat: number; lng: number }
    ): number {
        const R = 3959;
        const dLat = this.toRad(point2.lat - point1.lat);
        const dLng = this.toRad(point2.lng - point1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(point1.lat)) *
            Math.cos(this.toRad(point2.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
