import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Trash2, 
  Play, 
  Square, 
  ChevronLeft, 
  Code2, 
  Cpu, 
  Zap, 
  Clock, 
  MessageSquare,
  Shield,
  Save,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { ConnectedBot, LogEntry } from '../types';
import { useToast } from '../context/ToastContext';

interface BotDetailsProps {
  bots: ConnectedBot[];
  onUpdateBot: (bot: ConnectedBot) => Promise<void>;
  onDeleteBot: (id: string) => Promise<void>;
  onTogglePolling: (id: string) => Promise<void>;
  logs: LogEntry[];
}

const BotDetails: React.FC<BotDetailsProps> = ({ bots, onUpdateBot, onDeleteBot, onTogglePolling, logs }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const botId = searchParams.get('id');
  const toast = useToast();
  
  const bot = bots.find(b => b.id === botId);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'script'>('overview');
  
  const [localBot, setLocalBot] = useState<ConnectedBot | null>(null);

  useEffect(() => {
    if (bot) {
      setLocalBot({ ...bot });
    }
  }, [bot]);

  if (!botId || !bot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Bot size={48} className="mb-4 opacity-20" />
        <p>Bot not found or missing ID.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-500 font-bold">Back to Dashboard</button>
      </div>
    );
  }

  if (!localBot) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateBot(localBot);
      toast.success('Changes saved successfully!');
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
               {bot.photoUrl ? (
                 <img src={bot.photoUrl} alt={bot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <Bot size={24} className="text-slate-400" />
               )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{bot.name}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    bot.isPolling ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                    {bot.isPolling ? 'Active' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-slate-500">@{bot.username}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onTogglePolling(bot.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm ${
               bot.isPolling 
                ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/10'
            }`}
          >
            {bot.isPolling ? <><Square size={16} fill="currentColor" /> Stop Polling</> : <><Play size={16} fill="currentColor" /> Start Polling</>}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
            Save
          </button>

          <button 
            onClick={() => onDeleteBot(bot.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 flex gap-8">
        {[
          { id: 'overview', label: 'Overview', icon: Zap },
          { id: 'ai', label: 'AI Agent', icon: Cpu },
          { id: 'script', label: 'Code Engine', icon: Code2 }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 border-b-2 font-bold text-sm transition-all ${
              activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex gap-0">
        <div className="flex-1 p-8 overflow-y-auto">
           {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                 {/* Identity Card */}
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <Bot size={18} className="text-blue-500" /> Identity Details
                    </h3>
                    <div className="space-y-4">
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                          <textarea 
                            value={localBot.description}
                            onChange={(e) => setLocalBot({...localBot, description: e.target.value})}
                            className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                            rows={4}
                          />
                       </div>
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-lg shadow-sm">
                                <ExternalLink size={16} className="text-slate-400" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-700">Telegram Link</p>
                                <p className="text-xs text-slate-400">t.me/{bot.username}</p>
                             </div>
                          </div>
                          <a href={`https://t.me/${bot.username}`} target="_blank" rel="noreferrer" className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg transition">
                             <ExternalLink size={16} />
                          </a>
                       </div>
                    </div>
                 </div>

                 {/* Maintenance Mode */}
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <Shield size={18} className="text-amber-500" /> Maintenance Mode
                    </h3>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="text-sm font-bold text-slate-700">Enable Maintenance</p>
                             <p className="text-xs text-slate-400">Bot will reply with a set message to all input.</p>
                          </div>
                          <button 
                             onClick={() => setLocalBot({...localBot, maintenanceConfig: { ...localBot.maintenanceConfig, enabled: !localBot.maintenanceConfig.enabled }})}
                             className={`w-12 h-6 rounded-full transition-all relative ${localBot.maintenanceConfig.enabled ? 'bg-amber-500' : 'bg-slate-200'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localBot.maintenanceConfig.enabled ? 'left-7' : 'left-1'}`} />
                          </button>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Maintenance Message</label>
                          <input 
                            type="text"
                            value={localBot.maintenanceConfig.message}
                            onChange={(e) => setLocalBot({...localBot, maintenanceConfig: { ...localBot.maintenanceConfig, message: e.target.value }})}
                            className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all outline-none disabled:opacity-50"
                            disabled={!localBot.maintenanceConfig.enabled}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-2 bg-blue-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                    <div className="relative z-10 space-y-4">
                       <h3 className="text-xl font-bold">Automation Stats</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                             { label: 'Uptime', value: '99.9%', icon: Clock },
                             { label: 'Msgs Handled', value: logs.length, icon: MessageSquare },
                             { label: 'AI Tokens', value: '1.2k', icon: Cpu },
                             { label: 'Avg Latency', value: '450ms', icon: Zap }
                          ].map(stat => (
                             <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <stat.icon size={16} className="text-blue-300 mb-2" />
                                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                                <p className="text-[10px] uppercase font-bold text-blue-200">{stat.label}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                 </div>
              </div>
           )}

           {activeTab === 'ai' && (
              <div className="max-w-3xl space-y-8 animate-fadeIn">
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-50 rounded-2xl">
                             <Cpu className="text-blue-600" />
                          </div>
                          <div>
                             <h3 className="font-bold text-slate-800">Gemini-Powered Agent</h3>
                             <p className="text-xs text-slate-400">Automate replies using advanced LLMs</p>
                          </div>
                       </div>
                       <button 
                          onClick={() => setLocalBot({...localBot, aiConfig: { ...localBot.aiConfig, enabled: !localBot.aiConfig.enabled }})}
                          className={`w-14 h-8 rounded-full transition-all relative ${localBot.aiConfig.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                       >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${localBot.aiConfig.enabled ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-100">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                             <label className="text-sm font-bold text-slate-700">System Instruction</label>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">
                                <Zap size={10} /> Powered by Gemini
                             </div>
                          </div>
                          <textarea 
                            value={localBot.aiConfig.systemInstruction}
                            onChange={(e) => setLocalBot({...localBot, aiConfig: { ...localBot.aiConfig, systemInstruction: e.target.value }})}
                            placeholder="You are a helpful customer support bot for our store. Be polite and concise."
                            className="w-full text-sm bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-h-[200px]"
                            disabled={!localBot.aiConfig.enabled}
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <button 
                             onClick={() => setLocalBot({...localBot, aiConfig: { ...localBot.aiConfig, useReasoning: !localBot.aiConfig.useReasoning }})}
                             disabled={!localBot.aiConfig.enabled}
                             className={`p-4 rounded-2xl border transition-all text-left group ${
                                localBot.aiConfig.useReasoning 
                                 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                 : 'bg-white border-slate-100 hover:border-slate-200'
                             }`}
                          >
                             <Cpu size={24} className={localBot.aiConfig.useReasoning ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-500'} />
                             <p className={`font-bold mt-2 text-sm ${localBot.aiConfig.useReasoning ? 'text-white' : 'text-slate-700'}`}>Full Reasoning</p>
                             <p className={`text-[10px] ${localBot.aiConfig.useReasoning ? 'text-blue-100' : 'text-slate-400'}`}>Use Gemini 1.5 Pro</p>
                          </button>

                          <button 
                             onClick={() => setLocalBot({...localBot, aiConfig: { ...localBot.aiConfig, useSearch: !localBot.aiConfig.useSearch }})}
                             disabled={!localBot.aiConfig.enabled}
                             className={`p-4 rounded-2xl border transition-all text-left group ${
                                localBot.aiConfig.useSearch 
                                 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                 : 'bg-white border-slate-100 hover:border-slate-200'
                             }`}
                          >
                             <Zap size={24} className={localBot.aiConfig.useSearch ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-500'} />
                             <p className={`font-bold mt-2 text-sm ${localBot.aiConfig.useSearch ? 'text-white' : 'text-slate-700'}`}>Search Grounding</p>
                             <p className={`text-[10px] ${localBot.aiConfig.useSearch ? 'text-blue-100' : 'text-slate-400'}`}>Live Internet Access</p>
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 rounded-3xl p-6 text-white flex gap-4 items-center">
                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                       <Info className="text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-300 italic leading-snug">
                       "AI Agents will only trigger if the message text doesn't match a defined command."
                    </p>
                 </div>
              </div>
           )}

           {activeTab === 'script' && (
              <div className="h-full flex flex-col space-y-4 animate-fadeIn">
                 <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200">
                    <div>
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Code2 size={18} className="text-purple-500" /> Custom Scripting
                       </h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">JavaScript Runtime v1.0</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition">Reset Template</button>
                       <button className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition shadow-lg shadow-purple-500/20">Analyze Logic (AI)</button>
                    </div>
                 </div>
                 
                 <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500/50" />
                       <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                       <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <textarea 
                      value={localBot.script}
                      onChange={(e) => setLocalBot({...localBot, script: e.target.value})}
                      className="w-full h-full bg-transparent text-blue-300 font-mono text-sm p-8 outline-none resize-none"
                    />
                 </div>
              </div>
           )}
        </div>

        {/* Console / Logs Sidebar */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full bg-slate-50/30">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
             <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400" /> Live Terminal
             </h3>
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
             {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-300 uppercase tracking-widest text-[10px] font-bold">No activity recorded</div>
             ) : (
                logs.map((log) => (
                   <div key={log.id} className="animate-slideUp flex gap-3">
                      <span className="text-slate-300 flex-shrink-0">
                         {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div className="flex-1 break-words">
                         <span className={`font-bold mr-1 ${
                            log.type === 'in' ? 'text-blue-500' : 
                            log.type === 'out' ? 'text-green-500' : 
                            log.type === 'error' ? 'text-red-500' : 'text-slate-400'
                         }`}>
                            {log.type === 'in' ? '→ In:' : 
                             log.type === 'out' ? '← Out:' : 
                             log.type === 'error' ? '✖ Error:' : '• Info:'}
                         </span>
                         <span className={log.type === 'error' ? 'text-red-600' : 'text-slate-600'}>
                            {log.message}
                         </span>
                         {log.details && <p className="text-[10px] text-slate-400 mt-0.5 ml-2 italic">{log.details}</p>}
                      </div>
                   </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDetails;
