
export interface MatchCriteria {
    projectId: string;
    trades: string[];
    location: { lat: number; lng: number };
    budgetRange: { min: number; max: number };
    timeline: { start: Date; end: Date };
    minRating?: number;
    requiredCredentials?: string[];
}

export interface MatchResult {
    contractorId: string;
    contractor: {
        id: string;
        name: string;
        company: string;
        email: string;
        phone: string;
        rating: number;
        trades: string[];
    };
    score: number;
    matchReasons: string[];
    distance: number;
    availability: boolean;
}

export interface BidAnalysis {
    submissionId: string;
    contractorName: string;
    amount: number;
    priceScore: number;
    timelineScore: number;
    scopeScore: number;
    qualificationScore: number;
    overallScore: number;
    strengths: string[];
    concerns: string[];
    recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
    rank: number;
}

export interface BidComparison {
    projectId: string;
    bidRequestId: string;
    analyses: BidAnalysis[];
    summary: {
        totalBids: number;
        averagePrice: number;
        priceRange: { min: number; max: number };
        recommendedContractor: string;
        aiNarrative: string;
    };
    generatedAt: Date;
}
