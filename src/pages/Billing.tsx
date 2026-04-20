import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    Check, 
    Shield, 
    Zap, 
    Download, 
    ArrowUpRight, 
    Clock, 
    AlertCircle,
    Info,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ConnectedBot, BillingTransaction } from '../types';

interface BillingProps {
  bots: ConnectedBot[];
}

const Billing: React.FC<BillingProps> = ({ bots }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date()
            } as BillingTransaction));
            setTransactions(txs);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    const activePlan = {
        name: 'Enterprise Pro',
        price: 49,
        billingCycle: 'Monthly',
        nextBilling: 'May 1, 2026',
        features: [
            'Unlimited AI Bots',
            'Advanced Scripting Engine',
            'Full Gemini 1.5 Pro Access',
            'Dedicated Proxy Nodes',
            'Custom Domain APIs'
        ]
    };

    return (
        <div className="p-8 w-full h-full overflow-y-auto space-y-8 pb-20 bg-slate-50">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Billing & Subscriptions</h1>
                <p className="text-slate-500 mt-1">Manage your plan, payment methods, and view platform usage.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Plan Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">Active Plan</span>
                                    <h2 className="text-3xl font-black text-slate-800">{activePlan.name}</h2>
                                    <p className="text-slate-500 font-medium">${activePlan.price} / {activePlan.billingCycle}</p>
                                </div>
                                <button className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition shadow-sm border border-slate-100">
                                    <ArrowUpRight size={20} className="text-slate-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activePlan.features.map(f => (
                                    <div key={f} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <div className="flex-shrink-0 w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-green-600" strokeWidth={3} />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Clock size={14} /> Next invoice on {activePlan.nextBilling}
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-5 py-2 text-slate-600 font-bold text-xs hover:bg-slate-50 rounded-xl transition">Downgrade</button>
                                    <button className="px-6 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition">Change Plan</button>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                    </div>

                    {/* Usage Card */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <Zap size={18} className="text-amber-500" /> Usage This Period
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-slate-600">AI Request Tokens</span>
                                    <span className="text-xs text-slate-400">12.5k / 50k used</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '25%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-slate-600">Active Bot Instances</span>
                                    <span className="text-xs text-slate-400">{bots.filter(b=>b.isPolling).length} / 10 used</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${(bots.filter(b=>b.isPolling).length / 10) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Payment Method */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-widest opacity-50">
                            Payment Method
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Visa •••• 4242</p>
                                    <p className="text-[10px] text-white/50 uppercase font-bold">Exp 12/26</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-white/30" />
                        </div>
                        <button className="w-full py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                            Edit Payment Methods
                        </button>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
                        <div className="flex gap-3">
                            <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <span className="font-bold">Next payment processing soon.</span> Please ensure your primary payment method has sufficient funds to avoid service interruption.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
                        <div className="p-3 bg-white/10 rounded-2xl w-fit">
                            <Shield size={20} className="text-blue-400" />
                        </div>
                        <h4 className="font-bold text-sm">Security Guarantee</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            All transactions are encrypted and processed securely. We never store your full credit card details.
                        </p>
                    </div>
                </div>

                {/* Billing History Table */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Invoice History</h3>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Download size={16} className="text-slate-400" />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-blue-500" />
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Loading Records...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <CreditCard size={32} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">No Invoices Found</p>
                                <p className="text-sm text-slate-400">Your first billing cycle has not completed yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-slate-300" />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {tx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-800">{tx.plan} Subscription</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-slate-700">${tx.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    tx.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                                                    tx.status === 'Failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-blue-500 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-lg">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Billing;
