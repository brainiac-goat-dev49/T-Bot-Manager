import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where, 
  serverTimestamp, 
  orderBy, 
  limit, 
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './context/AuthContext';
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

// Login Page Component
const Login: React.FC = () => {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 animate-fadeIn">
        <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-2">
           <span className="text-white text-3xl font-bold">T</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">T-Bot Manager</h1>
        <p className="text-slate-500">The ultimate workspace for AI-powered Telegram bot management. Secure, real-time, and collaborative.</p>
        
        <button 
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <div className="pt-4 text-xs text-slate-400">
          Secure authentication powered by Firebase
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  // --- STATE ---
  const [bots, setBots] = useState<ConnectedBot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Refs for Polling Logic
  const isRequestPending = useRef(false);
  const errorCountRef = useRef(0);
  const offsetsRef = useRef<Record<string, number>>({});

  // --- FIRESTORE SYNC ---

  // Seed initial data for new users
  useEffect(() => {
    if (!user) return;
    
    const seedBilling = async () => {
      const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          const initialTxs = [
            { userId: user.uid, amount: 49.00, plan: 'Enterprise Pro', status: 'Paid', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            { userId: user.uid, amount: 49.00, plan: 'Enterprise Pro', status: 'Paid', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
          ];
          for (const tx of initialTxs) {
            await addDoc(collection(db, 'transactions'), {
              ...tx,
              date: Timestamp.fromDate(tx.date)
            });
          }
        }
      });
      return unsubscribe;
    };

    seedBilling();
  }, [user]);

  // Sync Bots
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bots'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const botsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Fallbacks for data consistency
            aiConfig: data.aiConfig || { enabled: false, systemInstruction: '', useReasoning: false, useSearch: false },
            maintenanceConfig: data.maintenanceConfig || { enabled: false, message: "⚠️ System under maintenance." },
            integrations: data.integrations || {},
            script: data.script || '// Write your custom logic here',
            commands: data.commands || []
          } as ConnectedBot;
      });
      setBots(botsData);
    });

    return unsubscribe;
  }, [user]);

  // Sync Logs for active bot
  useEffect(() => {
    if (!user) return;
    const activeBot = bots.find(b => b.isPolling);
    if (!activeBot) {
        setLogs([]);
        return;
    }

    const q = query(
      collection(db, 'bots', activeBot.id, 'logs'), 
      orderBy('timestamp', 'desc'), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate()
          } as LogEntry;
      }).reverse(); // Most recent at bottom for UI
      setLogs(logsData);
    });

    return unsubscribe;
  }, [user, bots.find(b => b.isPolling)?.id]);

  // --- HELPERS ---
  const addLog = useCallback(async (type: LogEntry['type'], message: string, details?: string) => {
    const activeBot = bots.find(b => b.isPolling);
    if (!activeBot || !user) return;

    try {
        await addDoc(collection(db, 'bots', activeBot.id, 'logs'), {
            type,
            message,
            details: details || null,
            timestamp: serverTimestamp(),
            botId: activeBot.id
        });
    } catch (e) {
        console.error("Log write failed", e);
    }
  }, [bots, user]);

  // --- ACTIONS ---

  const handleConnectBot = async (token: string) => {
    if (!user) return;
    setIsConnecting(true);
    try {
      if (bots.some(b => b.token === token)) {
        toast.warning('This bot is already connected.');
        return;
      }

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

      const botId = me.username || token.split(':')[0];
      const botData = {
        token,
        name: me.first_name,
        username: me.username || 'Unknown',
        description: desc.description || '',
        shortDescription: shortDesc.short_description || '',
        commands: cmds,
        photoUrl: photoUrl || null,
        isPolling: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
        aiConfig: { enabled: false, systemInstruction: '', useReasoning: false, useSearch: false },
        maintenanceConfig: { enabled: false, message: "⚠️ System under maintenance. Please try again later." },
        integrations: {},
        script: '// Write your custom logic here\n// Access "lib" for integrations\n\nconsole.log("Script loaded!");'
      };

      await setDoc(doc(db, 'bots', botId), botData);
      
      setIsModalOpen(false);
      toast.success(`Successfully connected ${me.username}!`);
      
    } catch (e: any) {
      toast.error(`Failed to connect: ${e.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (confirm('Are you sure you want to remove this bot? All logs will be lost.')) {
      try {
          await deleteDoc(doc(db, 'bots', botId));
          toast.info('Bot removed');
      } catch (e: any) {
          toast.error("Delete failed: " + e.message);
      }
    }
  };

  const handleTogglePolling = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    const newState = !bot.isPolling;
    
    try {
        // Turn off all others first
        const batchPromise = bots
            .filter(b => b.id !== botId && b.isPolling)
            .map(b => updateDoc(doc(db, 'bots', b.id), { isPolling: false }));
        
        await Promise.all(batchPromise);
        await updateDoc(doc(db, 'bots', botId), { isPolling: newState });
        
        if (newState) toast.info('Polling started');
        else toast.info('Polling stopped');

        errorCountRef.current = 0;
        isRequestPending.current = false;
    } catch (e: any) {
        toast.error("Toggle failed: " + e.message);
    }
  };

  const handleUpdateBot = async (updatedBot: ConnectedBot) => {
    try {
        const { id, ...data } = updatedBot;
        await updateDoc(doc(db, 'bots', id), { ...data });
    } catch (e: any) {
        toast.error("Update failed: " + e.message);
    }
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


  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold tracking-widest text-sm uppercase">Initializing Core...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
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
             <Route path="/bot" element={
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
    </BrowserRouter>
  );
};

export default App;
