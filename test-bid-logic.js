
const { ContractorMatcher } = require('./repo/server/src/agents/bid-agent/matcher');
const { MatchCriteria } = require('./repo/server/src/agents/bid-agent/types');

async function testLogic() {
    console.log('🧪 Testing Bid Matching Logic...');
    const matcher = new ContractorMatcher();

    const criteria = {
        projectId: 'test-1',
        trades: ['HVAC'],
        location: { lat: 40.7128, lng: -74.0060 },
        budgetRange: { min: 0, max: 100000 },
        timeline: { start: new Date(), end: new Date() }
    };

    try {
        const results = await matcher.findMatches(criteria);
        console.log(`✅ Success: Found ${results.length} matches.`);
        results.forEach((r, i) => {
            console.log(`  [${i + 1}] ${r.contractor.company} - Score: ${r.score}`);
        });
    } catch (err) {
        console.error('❌ Logic error:', err.message);
    }
}

testLogic();
