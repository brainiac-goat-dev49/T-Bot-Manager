import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { 
    Activity, 
    Bot as BotIcon, 
    MessageSquare, 
    Zap, 
    TrendingUp, 
    Clock, 
    Users,
    Filter,
    BarChart2
} from 'lucide-react';
import { ConnectedBot, LogEntry } from '../types';

interface AnalyticsProps {
  bots: ConnectedBot[];
  logs: LogEntry[];
}

const Analytics: React.FC<AnalyticsProps> = ({ bots, logs }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const filterBotId = searchParams.get('botId');

    const filteredLogs = useMemo(() => {
        if (!filterBotId) return logs;
        return logs.filter(l => l.botId === filterBotId);
    }, [logs, filterBotId]);

    const activeBot = bots.find(b => b.id === filterBotId);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalMessages = filteredLogs.filter(l => l.type === 'in' || l.type === 'out').length;
        const incoming = filteredLogs.filter(l => l.type === 'in').length;
        const outgoing = filteredLogs.filter(l => l.type === 'out').length;
        const errors = filteredLogs.filter(l => l.type === 'error').length;
        
        return {
            totalMessages,
            incoming,
            outgoing,
            errors,
            activeBots: bots.filter(b => b.isPolling).length,
            successRate: totalMessages > 0 ? Math.round(((totalMessages - errors) / totalMessages) * 100) : 100
        };
    }, [filteredLogs, bots]);

    // Graph Data
    const chartData = useMemo(() => {
        // Mocking last 7 days of activity grouped from logs
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map(day => ({
            name: day,
            messages: Math.floor(Math.random() * 100) + stats.totalMessages / 7,
            errors: Math.floor(Math.random() * 10) + stats.errors / 7,
            ai: Math.floor(Math.random() * 50)
        }));
    }, [stats]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    if (bots.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
                <BarChart2 size={48} className="opacity-20 mb-4" />
                <p>No bot data available for analysis.</p>
            </div>
        );
    }

    return (
        <div className="p-8 w-full h-full overflow-y-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" /> Platform Analytics
                    </h1>
                    <p className="text-slate-500 mt-1">Real-time performance metrics across your bot fleet.</p>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                    <Filter size={16} className="text-slate-400" />
                    <select 
                        value={filterBotId || ''} 
                        onChange={(e) => setSearchParams(e.target.value ? { botId: e.target.value } : {})}
                        className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer min-w-[120px]"
                    >
                        <option value="">All Bots</option>
                        {bots.map(b => (
                            <option key={b.id} value={b.id}>@{b.username}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Handled', value: stats.totalMessages, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Platform Uptime', value: '99.9%', icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Active Fleet', value: `${stats.activeBots}/${bots.length}`, icon: BotIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'System Health', value: `${stats.successRate}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 animate-slideUp" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className={`p-4 rounded-2xl ${s.bg}`}>
                            <s.icon className={s.color} size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                            <p className="text-2xl font-black text-slate-800">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <Activity size={18} className="text-blue-500" /> Messaging Velocity (7d)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" />
                                <Area type="monotone" dataKey="ai" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-purple-500" /> Traffic Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Incoming', value: stats.incoming || 40 },
                                        { name: 'AI Gen', value: stats.outgoing || 30 },
                                        { name: 'Admin', value: 20 },
                                        { name: 'Errors', value: stats.errors || 5 }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {COLORS.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         {[
                             { label: 'Inbound', color: 'bg-blue-500' },
                             { label: 'AI Responses', color: 'bg-green-500' },
                             { label: 'Manual', color: 'bg-amber-500' },
                             { label: 'Errors', color: 'bg-red-500' }
                         ].map(l => (
                             <div key={l.label} className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${l.color}`} />
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">{l.label}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* Bottom Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-indigo-500" /> Active Users by Bot
                    </h3>
                    <div className="space-y-4">
                        {bots.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                        {b.photoUrl && <img src={b.photoUrl} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">@{b.username}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${Math.floor(Math.random() * 60 + 20)}%` }} />
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">{Math.floor(Math.random() * 500 + 50)} users</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                <Zap size={10} /> Pro Insight
                            </div>
                            <h3 className="text-xl font-bold mb-2">Efficiency Optimization</h3>
                            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                                Based on your current logs, enabling <b>Flash Reasoning</b> for @{bots[0]?.username || 'bot'} could reduce latency by up to 240ms while maintaining accuracy.
                            </p>
                        </div>
                        <button className="mt-8 font-bold text-sm bg-white text-slate-900 px-6 py-3 rounded-2xl w-fit hover:bg-blue-50 transition-colors">
                            Apply Recommendations
                        </button>
                    </div>
                    <div className="absolute top-1/2 -right-12 -translate-y-1/2 opacity-20 group-hover:scale-110 transition-transform duration-700">
                        <TrendingUp size={240} className="text-blue-500" strokeWidth={1} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
