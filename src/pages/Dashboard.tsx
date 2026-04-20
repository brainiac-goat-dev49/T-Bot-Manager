import React from 'react';
import { Bot, Plus, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { ConnectedBot } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  bots: ConnectedBot[];
  onAddBot: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bots, onAddBot }) => {
  const navigate = useNavigate();

  return (
    <div className="p-8 w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Bots</h1>
          <p className="text-slate-500 mt-1">Manage your connected Telegram bots.</p>
        </div>
        <button
          onClick={onAddBot}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Add New Bot
        </button>
      </div>

      {/* Empty State */}
      {bots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
            <Bot size={40} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Bots Connected</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            It looks like you haven't added any bots yet. Click the "Add New Bot" button to get started.
          </p>
        </div>
      ) : (
        /* Bot Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                    {bot.photoUrl ? (
                      <img src={bot.photoUrl} alt={bot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Bot size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{bot.name}</h3>
                    <p className="text-sm text-slate-500">@{bot.username}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    bot.isPolling ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                    {bot.isPolling ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[2.5em]">
                {bot.shortDescription || "No description available."}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate(`/bot?id=${encodeURIComponent(bot.id)}`)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium transition"
                >
                  <SettingsIcon size={16} /> Manage
                </button>
                <button 
                  onClick={() => navigate(`/analytics?botId=${encodeURIComponent(bot.id)}`)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium transition"
                >
                  <BarChart2 size={16} /> Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
