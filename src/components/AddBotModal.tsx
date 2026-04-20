import React, { useState } from 'react';
import { X, Bot, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string) => Promise<void>;
  isLoading: boolean;
}

const AddBotModal: React.FC<AddBotModalProps> = ({ isOpen, onClose, onConnect, isLoading }) => {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onConnect(token.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Bot className="text-blue-500" /> Connect Telegram Bot
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Bot API Token</label>
                <input 
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456789:ABCDefghIJKLmnopQRSTuvwxYZ..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                <div className="p-2 bg-white rounded-lg h-fit shadow-sm">
                  <Info size={16} className="text-blue-500" />
                </div>
                <div className="text-xs text-blue-700 leading-relaxed">
                  <p className="font-bold mb-1">How to get a token?</p>
                  Message <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline font-bold">@BotFather</a> on Telegram. Send <b>/newbot</b> and follow the steps.
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading || !token.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  'Connect My Bot'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddBotModal;
