import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectedBot, LogEntry } from './types';
import { telegramService } from './services/telegramService';
import { geminiService } from './services/geminiService';
import { useToast } from './context/ToastContext';

// Components
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import AddBotModal from './components/AddBotModal';

// Pages
import Dashboard from './pages/Dashboard';
import BotDetails from './pages/BotDetails';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import Settings from './pages/Settings';

const App: React.FC = () => {
  // --- STATE ---
  
  // Initialize from LocalStorage so data persists across refreshes
  const [bots, setBots] = useState<ConnectedBot[]>(() => {
    try {
      const saved = localStorage.getItem('tbot_manager_bots');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Ensure it is always an array to prevent crashes
      return Array.isArray(parsed) ? parsed.map((b: any) => ({
          ...b,
          // Backwards compatibility: ensure aiConfig exists
          aiConfig: b.aiConfig || { 
              enabled: false, 
              systemInstruction: '', 
              useReasoning: false, 
              useSearch: false 
          },
          // Backwards compatibility: maintenanceConfig
          maintenanceConfig: b.maintenanceConfig || {
              enabled: false,
              message: "⚠️ System under maintenance. Please try again later."
          },
          // Backwards compatibility: integrations
          integrations: b.integrations || {},
          // Backwards compatibility: script
          script: b.script || '// Write your custom logic here\n// Access "lib" for integrations\n\nconsole.log("Script loaded!");'
      })) : [];
    } catch (e) {
      console.error("Failed to load bots from storage", e);
      return [];
    }
  });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Polling / Logs (Kept in App root to persist across views)
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Refs for Polling Logic
  const isRequestPending = useRef(false);
  const errorCountRef = useRef(0);
  // Store offsets in a Ref so they persist across state updates (re-renders)
  const offsetsRef = useRef<Record<string, number>>({});

  const toast = useToast();

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem('tbot_manager_bots', JSON.stringify(bots));
  }, [bots]);

  // --- HELPERS ---
  const addLog = useCallback((type: LogEntry['type'], message: string, details?: string) => {
    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
    setLogs(prev => [...prev.slice(-49), { 
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
      details
    }]);
  }, []);

  // --- ACTIONS ---

  const handleConnectBot = async (token: string) => {
    setIsConnecting(true);
    try {
      // Check if already exists
      if (bots.some(b => b.token === token)) {
        toast.warning('This bot is already connected.');
        return;
      }

      // Fetch details
      const me = await telegramService.getMe(token);
      const desc = await telegramService.getMyDescription(token);
      const shortDesc = await telegramService.getMyShortDescription(token);
      const cmds = await telegramService.getMyCommands(token);
      
      let photoUrl: string | undefined;
      try {
        const url = await telegramService.getBotProfilePhotoUrl(token, me.id);
        if (url) photoUrl = url;
      } catch (err) {
        console.warn('Image fetch failed', err);
      }

      const newBot: ConnectedBot = {
        id: token, // Using token as ID for simplicity
        token,
        name: me.first_name,
        username: me.username || 'Unknown',
        description: desc.description,
        shortDescription: shortDesc.short_description,
        commands: cmds,
        photoUrl,
        isPolling: false, // Start inactive
        aiConfig: {
            enabled: false,
            systemInstruction: '',
            useReasoning: false,
            useSearch: false
        },
        maintenanceConfig: {
            enabled: false,
            message: "⚠️ System under maintenance. Please try again later."
        },
        integrations: {},
        script: '// Write your custom logic here\n// Access "lib" for integrations\n\nconsole.log("Script loaded!");'
      };

      setBots(prev => [...prev, newBot]);
      setIsModalOpen(false);
      addLog('info', `Connected new bot: ${me.username}`);
      toast.success(`Successfully connected ${me.username}!`);
      
    } catch (e: any) {
      toast.error(`Failed to connect: ${e.message}`);
      addLog('error', 'Connection failed', e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteBot = (botId: string) => {
    if (confirm('Are you sure you want to remove this bot from your dashboard?')) {
      setBots(prev => prev.filter(b => b.id !== botId));
      addLog('info', 'Bot removed');
      toast.info('Bot removed from dashboard');
    }
  };

  const handleTogglePolling = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    const newState = !bot.isPolling;
    if (newState) toast.info('Polling started');
    else toast.info('Polling stopped');

    setBots(prev => prev.map(b => {
      if (b.id === botId) {
         return { ...b, isPolling: newState };
      }
      return { ...b, isPolling: false }; // Auto-turn off others
    }));
    
    // Reset error tracking on toggle
    errorCountRef.current = 0;
    isRequestPending.current = false;
  };

  const handleUpdateBot = (updatedBot: ConnectedBot) => {
    setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));
  };


  // --- POLLING EFFECT ---
  useEffect(() => {
    const activeBot = bots.find(b => b.isPolling);
    
    if (!activeBot) return;

    let intervalId: any;
    // Initialize offset from Ref to prevent resetting to 0 on state changes
    let currentOffset = offsetsRef.current[activeBot.id] || 0; 

    const poll = async () => {
      if (isRequestPending.current) return;
      isRequestPending.current = true;

      try {
        const updates = await telegramService.getUpdates(activeBot.token, currentOffset);
        errorCountRef.current = 0;

        if (updates.length > 0) {
          const maxId = Math.max(...updates.map(u => u.update_id));
          currentOffset = maxId + 1;
          offsetsRef.current[activeBot.id] = currentOffset;

          for (const update of updates) {
            if (update.message && update.message.text) {
              const text = update.message.text;
              const chatId = update.message.chat.id;
              const user = update.message.from.first_name;
              
              addLog('in', `[${activeBot.username}] ${user}: ${text}`);

              if (activeBot.maintenanceConfig?.enabled) {
                   const reply = activeBot.maintenanceConfig.message || "⚠️ System under maintenance.";
                   await telegramService.sendMessage(activeBot.token, chatId, reply);
                   addLog('out', `Maintenance Reply: ${reply.substring(0, 20)}...`);
                   continue;
              }

              const isCommand = text.startsWith('/');
              if (isCommand) {
                 const cmdKey = text.split(' ')[0].substring(1);
                 const knownCmd = activeBot.commands.find(c => c.command === cmdKey);
                 if (knownCmd) {
                    const reply = knownCmd.response || knownCmd.description;
                    await telegramService.sendMessage(activeBot.token, chatId, reply);
                    addLog('out', `Command Reply: ${reply.substring(0, 20)}...`);
                 }
              } else {
                 if (activeBot.aiConfig.enabled) {
                     addLog('info', 'Generating AI response...');
                     const aiResponse = await geminiService.generateResponse(
                        text,
                        activeBot.name,
                        activeBot.description,
                        activeBot.commands,
                        activeBot.aiConfig
                      );
                      await telegramService.sendMessage(activeBot.token, chatId, aiResponse);
                      addLog('out', `AI Reply: ${aiResponse.substring(0, 50)}...`, `Model: ${activeBot.aiConfig.useReasoning ? 'Pro' : 'Flash'}`);
                 }
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Polling error', error);
        
        // Auto-fix for Webhook Conflict
        if (error.message.includes('webhook is active')) {
            addLog('info', `[${activeBot.username}] Conflict detected (webhook is active). Attempting to delete webhook...`);
            try {
                await telegramService.deleteWebhook(activeBot.token);
                addLog('info', `[${activeBot.username}] Webhook deleted successfully. Polling will resume.`);
                return;
            } catch (err: any) {
                addLog('error', `[${activeBot.username}] Critical: Failed to delete webhook`, err.message);
            }
        }

        errorCountRef.current++;
        if (errorCountRef.current > 5) {
             handleTogglePolling(activeBot.id); // Turn off
             toast.error(`Polling stopped for @${activeBot.username} due to too many errors. Check console.`);
        }
      } finally {
        isRequestPending.current = false;
      }
    };

    intervalId = setInterval(poll, 3000);

    return () => {
      clearInterval(intervalId);
      isRequestPending.current = false;
    };
  }, [bots]);


  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 md:pb-0">
          
          <Routes>
             <Route path="/" element={
                 <Dashboard 
                    bots={bots} 
                    onAddBot={() => setIsModalOpen(true)}
                 />
             } />
             <Route path="/bot/:id" element={
                 <BotDetails 
                    bots={bots}
                    onUpdateBot={handleUpdateBot}
                    onDeleteBot={handleDeleteBot}
                    onTogglePolling={handleTogglePolling}
                    logs={logs}
                 />
             } />
             <Route path="/analytics" element={<Analytics bots={bots} logs={logs} />} />
             <Route path="/billing" element={<Billing bots={bots} />} />
             <Route path="/settings" element={<Settings />} />
             
             {/* Fallback route: Redirect unknown paths to home */}
             <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Modal */}
          <AddBotModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onConnect={handleConnectBot}
            isLoading={isConnecting}
          />

          {/* Mobile Navigation */}
          <MobileNav />

        </div>
      </div>
    </HashRouter>
  );
};

export default App;
