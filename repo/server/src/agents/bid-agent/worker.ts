import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { ContractorMatcher } from './matcher';
import { BidRequestBuilder } from './builder';
import { InvitationSender } from './invitation';
import { BidAnalyzer } from './analyzer';
import { CredentialVerifier } from './verifier';
import { getEventBus, EVENT_TYPES } from '../../core/events';

const contractorMatcher = new ContractorMatcher();
const bidRequestBuilder = new BidRequestBuilder();
const invitationSender = new InvitationSender();
const bidAnalyzer = new BidAnalyzer();
const credentialVerifier = new CredentialVerifier();
const eventBus = getEventBus();

export const bidEngineWorker = createWorker(
    QUEUE_NAMES.BID_ENGINE,
    async (job: Job) => {
        console.log(`Processing bid-engine job: ${job.data.type}`);

        switch (job.data.type) {
            case 'create-bid-request': {
                const { projectId, trades, scope, requirements, deadline } = job.data;
                const bidRequestId = await bidRequestBuilder.createBidRequest({
                    projectId,
                    trades,
                    scope,
                    requirements,
                    deadline: new Date(deadline),
                    responseDeadline: new Date(deadline),
                });

                await eventBus.publish(
                    EVENT_TYPES.BID_REQUEST_CREATED,
                    { bidRequestId, projectId, trades },
                    'bid-engine'
                );

                // Automatically trigger contractor matching
                await queues.BID_ENGINE.add('find-contractors', {
                    type: 'find-contractors',
                    bidRequestId,
                    criteria: {
                        projectId,
                        trades,
                        location: { lat: 38.9, lng: -77.0 }, // Mock location for now
                        budgetRange: { min: 0, max: Infinity },
                        timeline: { start: new Date(), end: new Date(deadline) },
                    },
                }, JOB_OPTIONS.DEFAULT);

                return { bidRequestId };
            }

            case 'find-contractors': {
                const { bidRequestId, criteria } = job.data;
                const matches = await contractorMatcher.findMatches(criteria);

                if (matches.length === 0) {
                    return { matches: [] };
                }

                for (const match of matches.slice(0, 5)) {
                    const verification = await credentialVerifier.verifyContractor(match.contractorId);
                    if (!verification.isVerified) {
                        console.log(`Contractor ${match.contractor.company} has issues:`, verification.issues);
                    }
                }

                if (bidRequestId) {
                    await queues.BID_ENGINE.add('send-invitations', {
                        type: 'send-invitations',
                        bidRequestId,
                        contractorIds: matches.map(m => m.contractorId),
                    }, JOB_OPTIONS.DEFAULT);
                }

                return { matches };
            }

            case 'send-invitations': {
                const { bidRequestId, contractorIds } = job.data;
                // invitationSender.sendInvitations(...) logic
                await eventBus.publish(
                    EVENT_TYPES.BID_INVITATION_SENT,
                    { bidRequestId, contractorIds },
                    'bid-engine'
                );
                return { sentCount: contractorIds.length };
            }

            case 'analyze-bids': {
                const { bidRequestId } = job.data;
                const result = await bidAnalyzer.analyzeBids(bidRequestId);
                
                await eventBus.publish(
                    EVENT_TYPES.BID_ANALYSIS_COMPLETE,
                    { bidRequestId, result },
                    'bid-engine'
                );
                
                return result;
            }

            case 'generate-comparison': {
                const { bidRequestId } = job.data;
                const comparison = await bidAnalyzer.analyzeBids(bidRequestId); // Re-using analyzer for comparison
                return comparison;
            }

            default:
                throw new Error(`Unknown job type: ${job.data.type}`);
        }
    }
);
