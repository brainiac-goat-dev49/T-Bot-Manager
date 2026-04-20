import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Moon, Sun, Database, Download, Upload, Activity, Check, X, Loader2, LogOut, User as UserIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
    const toast = useToast();
    const { user, logout } = useAuth();
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const [apiStatus, setApiStatus] = useState<'idle' | 'healthy' | 'error'>('idle');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [notifications, setNotifications] = useState(true);

    const checkApiHealth = async () => {
        setIsCheckingApi(true);
        setApiStatus('idle');
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            if (data.status === 'ok') {
                setApiStatus('healthy');
                toast.success('API services are operational!');
            } else {
                setApiStatus('error');
            }
        } catch (e) {
            setApiStatus('error');
            toast.error('Could not connect to backend services.');
        } finally {
            setIsCheckingApi(false);
        }
    };

    const handleExportData = () => {
        const bots = localStorage.getItem('tbot_manager_bots');
        if (!bots) {
            toast.warning('No data found to export.');
            return;
        }
        const blob = new Blob([bots], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `t-bot-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup file generated and downloading.');
    };

    return (
        <div className="p-8 w-full h-full overflow-y-auto bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <SettingsIcon className="text-blue-500" /> Global Settings
                    </h1>
                    <p className="text-slate-500 mt-1">Configure your workspace preferences and system settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Account */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserIcon size={20} className="text-blue-500" /> Account Settings
                        </h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{user?.displayName || 'User'}</p>
                                    <p className="text-sm text-slate-500">{user?.email}</p>
                                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block border border-green-100 italic">Verified Account</span>
                                </div>
                            </div>
                            <button 
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition text-sm font-bold"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sun size={20} className="text-amber-500" /> Appearance
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Dark Mode</span>
                                <button 
                                    onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Enable Notifications</span>
                                <button 
                                    onClick={() => setNotifications(!notifications)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System & Health */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-green-500" /> System Health
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-slate-600 font-medium block">API Gateway</span>
                                    <span className="text-xs text-slate-400">Verifies connection to backend</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {apiStatus === 'healthy' && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Check size={12}/> Online</span>}
                                    {apiStatus === 'error' && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><X size={12}/> Offline</span>}
                                    <button 
                                        onClick={checkApiHealth}
                                        disabled={isCheckingApi}
                                        className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
                                    >
                                        {isCheckingApi ? <Loader2 size={16} className="animate-spin" /> : <Loader2 size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div>
                                    <span className="text-slate-600 font-medium block">Gemini AI Engine</span>
                                    <span className="text-xs text-slate-400">Status of server-side AI model</span>
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Security & Token */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-blue-600" /> Platform Security
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 space-y-2">
                                <p className="text-sm text-slate-600">
                                    Tokens and API keys are stored locally in your browser's <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">LocalStorage</span>. 
                                    The Gemini AI integration uses the platform's native secure key injection for AI Studio models.
                                </p>
                                <p className="text-xs text-slate-400">
                                    We do not store your bot tokens on our servers. The backend acts only as a secure proxy to bypass CORS restrictions.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium">
                                    Change Password
                                </button>
                                <button className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition text-sm font-medium">
                                    Enable 2FA
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Backup & Recovery */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Database size={20} className="text-indigo-500" /> Data Management
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                <h4 className="font-bold text-slate-700 text-sm mb-1">Export Backup</h4>
                                <p className="text-xs text-slate-400 mb-4">Download a JSON file containing all your bots, AI configurations, and custom scripts.</p>
                                <button 
                                    onClick={handleExportData}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-xs font-bold"
                                >
                                    <Download size={14} /> Download .json
                                </button>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                <h4 className="font-bold text-slate-700 text-sm mb-1">Import Backup</h4>
                                <p className="text-xs text-slate-400 mb-4">Restore your dashboard from a previously exported configuration file.</p>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-xs font-bold">
                                    <Upload size={14} /> Upload File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-xs text-slate-400">T-Bot Manager v1.2.0 • Build 2024.04.17</p>
                    <div className="mt-2 flex justify-center gap-4">
                        <a href="#" className="text-xs text-blue-500 hover:underline">Privacy Policy</a>
                        <a href="#" className="text-xs text-blue-500 hover:underline">Terms of Service</a>
                        <a href="#" className="text-xs text-blue-500 hover:underline">Support Docs</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
