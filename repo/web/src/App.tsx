
import { useState, useRef, useEffect } from 'react'
import { HelmetProvider, Helmet } from 'react-helmet-async';
import {
    Bot, Activity, MessageSquare, LayoutDashboard, Send,
    FileText, BadgeCheck, HardHat, DollarSign, Mail, ListTodo, File,
    AlertTriangle, Calendar, Camera, BrainCircuit, CreditCard
} from 'lucide-react';

import { useBidAgent } from './hooks/useBidAgent';
import { useSchedulerAgent } from './hooks/useSchedulerAgent';
import { useChangeOrderAgent } from './hooks/useChangeOrderAgent';
import { useReportAgent } from './hooks/useReportAgent';
import { usePermitAgent } from './hooks/usePermitAgent';
import { useInspectionAgent } from './hooks/useInspectionAgent';
import { useBudgetAgent } from './hooks/useBudgetAgent';
import { useCommunicationAgent } from './hooks/useCommunicationAgent';
import { useTaskAgent } from './hooks/useTaskAgent';
import { useDocAgent } from './hooks/useDocAgent';
import { usePredictiveAgent } from './hooks/usePredictiveAgent';
import { useSmartSchedulerAgent } from './hooks/useSmartSchedulerAgent';
import { useQAAgent } from './hooks/useQAAgent';
import { useDecisionAgent } from './hooks/useDecisionAgent';

import SubscriptionPage from './pages/Subscription';

interface Message {
    role: 'system' | 'user' | 'agent';
    content: string;
    timestamp: Date;
}

function App() {
    const [activeView, setActiveView] = useState<'agents' | 'subscription'>('agents');
    const [activeAgent, setActiveAgent] = useState<string | null>('Bid Agent');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: 'System online. All 14 Agents initialized.', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');

    // Hooks
    const bidParams = useBidAgent();
    const schedParams = useSchedulerAgent();
    const coParams = useChangeOrderAgent();
    const reportParams = useReportAgent();
    const permitParams = usePermitAgent();
    const inspParams = useInspectionAgent();
    const budgetParams = useBudgetAgent();
    const commParams = useCommunicationAgent();
    const taskParams = useTaskAgent();
    const docParams = useDocAgent();
    const predParams = usePredictiveAgent();
    const smartParams = useSmartSchedulerAgent();
    const qaParams = useQAAgent();
    const decisionParams = useDecisionAgent();

    const chatEndRef = useRef<HTMLDivElement>(null);
    const loading = bidParams.loading || schedParams.loading || coParams.loading ||
        reportParams.loading || permitParams.loading || inspParams.loading ||
        budgetParams.loading || commParams.loading || taskParams.loading || docParams.loading ||
        predParams.loading || smartParams.loading || qaParams.loading || decisionParams.loading;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleCommand(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);

        const lowerMsg = userMsg.toLowerCase();

        // Agent Dispatch Logic
        try {
            if (activeAgent === 'Bid Agent' && lowerMsg.includes('find')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Searching contractors...', timestamp: new Date() }]);
                const res = await bidParams.findMatches({ projectId: 'demo', trades: ['HVAC'], location: { lat: 0, lng: 0 }, budgetRange: { min: 0, max: 0 }, timeline: { start: new Date(), end: new Date() } });
                setMessages(prev => [...prev, { role: 'agent', content: `Found ${res.matches?.length || 0} contractors.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Visit Scheduler' && lowerMsg.includes('schedule')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Scheduling visit...', timestamp: new Date() }]);
                const res = await schedParams.scheduleVisit({ projectId: 'demo', visitType: 'progress' });
                setMessages(prev => [...prev, { role: 'agent', content: `Visit confirmed: ${res.id}`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Change Order' && lowerMsg.includes('analyze')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Analyzing impact...', timestamp: new Date() }]);
                const res = await coParams.createChangeOrder({ projectId: 'demo', amount: 5000, description: 'Test', reason: 'Test' });
                setMessages(prev => [...prev, { role: 'agent', content: `Change Order ${res.changeOrderId} created.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Report Generator' && lowerMsg.includes('generate')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Generating report...', timestamp: new Date() }]);
                await reportParams.generateReport({ projectId: 'demo', type: 'WEEKLY', periodStart: new Date().toISOString(), periodEnd: new Date().toISOString() });
                setMessages(prev => [...prev, { role: 'agent', content: `Report generated successfully.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Permit Tracker' && lowerMsg.includes('status')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Checking permit...', timestamp: new Date() }]);
                const res = await permitParams.checkStatus('P-123');
                setMessages(prev => [...prev, { role: 'agent', content: `Permit Status: ${res.status}`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Inspection Coord' && lowerMsg.includes('schedule')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Scheduling inspection...', timestamp: new Date() }]);
                const res = await inspParams.scheduleInspection({ permitId: 'P-123', type: 'FINAL', preferredDates: [] });
                setMessages(prev => [...prev, { role: 'agent', content: `Inspection ${res.inspectionId} scheduled.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Budget Tracker' && lowerMsg.includes('summary')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Fetching budget...', timestamp: new Date() }]);
                const res = await budgetParams.getSummary('demo');
                setMessages(prev => [...prev, { role: 'agent', content: `Budget: ${res.percentComplete}% spent.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Comm Hub' && lowerMsg.includes('send')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Sending message...', timestamp: new Date() }]);
                await commParams.sendMessage({ projectId: 'demo', recipients: [{ email: 'test@test.com' }], subject: 'Test', message: 'Test', type: 'EMAIL' });
                setMessages(prev => [...prev, { role: 'agent', content: `Message sent.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Task Queue' && lowerMsg.includes('create')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Creating task...', timestamp: new Date() }]);
                const res = await taskParams.createTask({ projectId: 'demo', type: 'TEST' });
                setMessages(prev => [...prev, { role: 'agent', content: `Task ${res.taskId} created.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Doc Generator' && lowerMsg.includes('generate')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Creating document...', timestamp: new Date() }]);
                const res = await docParams.generateDoc({ projectId: 'demo', type: 'CONTRACT', variables: {} });
                setMessages(prev => [...prev, { role: 'agent', content: `Document ${res.documentId} created.`, timestamp: new Date() }]);
            }
            // NEW AGENTS
            else if (activeAgent === 'Predictive Engine' && lowerMsg.includes('predict')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Running prediction model...', timestamp: new Date() }]);
                const res = await predParams.predictDelay('demo');
                setMessages(prev => [...prev, { role: 'agent', content: `Prediction: ${Number((res.probability * 100).toFixed(1))}% chance of delay. Recommendation: ${res.recommendation}`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Smart Scheduler' && lowerMsg.includes('optimize')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Optimizing schedule...', timestamp: new Date() }]);
                const res = await smartParams.optimizeSchedule({ projectId: 'demo' });
                setMessages(prev => [...prev, { role: 'agent', content: `Schedule optimized. Found ${res.conflicts?.length || 0} conflicts.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'QA Inspector' && lowerMsg.includes('analyze')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Analyzing photo...', timestamp: new Date() }]);
                const res = await qaParams.analyzePhoto({ projectId: 'demo', photoUrl: 'http://example.com/photo.jpg' });
                setMessages(prev => [...prev, { role: 'agent', content: `Analysis complete. Detected: ${res.labels?.join(', ')}. Issues: ${res.issues?.length || 0}.`, timestamp: new Date() }]);
            }
            else if (activeAgent === 'Decision Support' && lowerMsg.includes('recommend')) {
                setMessages(prev => [...prev, { role: 'agent', content: 'Analyzing decision context...', timestamp: new Date() }]);
                const res = await decisionParams.getRecommendation({ projectId: 'demo', decisionType: 'CHANGE_ORDER' });
                setMessages(prev => [...prev, { role: 'agent', content: `Recommendation: ${res.recommendation} (Confidence: ${res.confidence})`, timestamp: new Date() }]);
            }
            else {
                setMessages(prev => [...prev, { role: 'agent', content: `Command not recognized for ${activeAgent}.`, timestamp: new Date() }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'agent', content: 'Operation failed.', timestamp: new Date() }]);
        }
    }

    const agents = [
        { name: 'Bid Agent', icon: Bot },
        { name: 'Visit Scheduler', icon: Activity },
        { name: 'Change Order', icon: FileText },
        { name: 'Report Generator', icon: FileText },
        { name: 'Permit Tracker', icon: BadgeCheck },
        { name: 'Inspection Coord', icon: HardHat },
        { name: 'Budget Tracker', icon: DollarSign },
        { name: 'Comm Hub', icon: Mail },
        { name: 'Task Queue', icon: ListTodo },
        { name: 'Doc Generator', icon: File },
        { name: 'Predictive Engine', icon: AlertTriangle },
        { name: 'Smart Scheduler', icon: Calendar },
        { name: 'QA Inspector', icon: Camera },
        { name: 'Decision Support', icon: BrainCircuit },
    ];

    return (
        <HelmetProvider>
            <div className="min-h-screen bg-background text-foreground font-sans antialiased text-sm">
                <Helmet>
                    <title>Kealee Command Center</title>
                </Helmet>

                {/* Sidebar */}
                <div className="fixed inset-y-0 left-0 w-64 border-r bg-card/50 backdrop-blur-xl p-4 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex items-center gap-2 px-2 py-4">
                        <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Kealee Agents</span>
                    </div>

                    <nav className="flex flex-col gap-1">
                        <button
                            onClick={() => setActiveView('agents')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeView === 'agents' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                            <LayoutDashboard className="h-4 w-4" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveView('subscription')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeView === 'subscription' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                            <CreditCard className="h-4 w-4" />
                            Subscription
                        </button>
                    </nav>

                    <div className="mt-8">
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground mb-2">ACTIVE AGENTS ({agents.length})</h3>
                        <div className="flex flex-col gap-1 pb-4">
                            {agents.map((agent) => (
                                <button
                                    key={agent.name}
                                    onClick={() => { setActiveView('agents'); setActiveAgent(agent.name); setMessages([]); }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${activeView === 'agents' && activeAgent === agent.name ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${activeView === 'agents' && activeAgent === agent.name ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                        {agent.name}
                                    </span>
                                    <agent.icon className="h-3 w-3 opacity-50" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="ml-64 p-8">
                    {activeView === 'subscription' ? (
                        <SubscriptionPage />
                    ) : (
                        <>
                            <header className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
                                    <p className="text-muted-foreground mt-1">
                                        Manage your autonomous construction agents
                                    </p>
                                </div>
                            </header>

                            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Chat Interface */}
                                <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-[600px] flex flex-col">
                                    <div className="p-4 border-b font-medium flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Live Agent Chat &mdash; <span className="text-primary font-bold">{activeAgent}</span>
                                    </div>

                                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
                                                    {msg.role === 'user' ? <div className="text-xs font-bold">U</div> : <Bot className="h-4 w-4" />}
                                                </div>
                                                <div className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="flex gap-3">
                                                <div className="h-8 w-8 rounded flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div className="flex items-center gap-1 p-3 bg-muted rounded-lg">
                                                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                                                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-75" />
                                                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-150" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <form onSubmit={handleCommand} className="p-4 border-t flex gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder={`Command ${activeAgent}...`}
                                            className="flex-1 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                        <button type="submit" disabled={loading} className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </HelmetProvider>
    )
}

export default App
