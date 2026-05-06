
import { useState } from 'react';

const API_BASE = '/api/v1';

export interface BidRequest {
    projectId: string;
    trades: string[];
    scope: any;
    requirements: any;
    deadline: string;
}

export function useBidAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function createBidRequest(data: BidRequest) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/bid-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to create bid request');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    async function findMatches(criteria: any) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/contractors/match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(criteria),
            });

            if (!response.ok) throw new Error('Failed to find matches');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return {
        createBidRequest,
        findMatches,
        loading,
        error
    };
}
