import React from 'react';
import { CreditCard, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Billing = () => {
  const { organization } = useAuth();

  const subscription = organization?.subscription || {
    plan: 'Enterprise Pro',
    status: 'active',
    amount: 499,
    nextBillingDate: '2026-06-01'
  };

  const paymentHistory = organization?.paymentHistory || [
    { id: 'inv_1', date: '2026-05-01', amount: 499.00, status: 'paid' },
    { id: 'inv_0', date: '2026-04-01', amount: 499.00, status: 'paid' }
  ];

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Subscription & Billing</h2>
        <p className="text-gray-500 font-medium text-lg">Manage your organization's SaaS licensing and financial records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Plan Card */}
        <div className="p-10 rounded-[40px] border-2 border-blue-600 bg-blue-50/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-3xl">
            Active Subscription
          </div>
          <div>
            <h3 className="text-blue-600 text-sm font-black uppercase tracking-widest mb-2">{subscription.plan}</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-6xl font-black text-gray-900">${subscription.amount}</span>
              <span className="text-gray-400 font-bold ml-2">/month</span>
            </div>
            <p className="text-sm font-bold text-gray-500 leading-relaxed">
              Billed per physical room license. Includes unlimited concurrent sessions and 24/7 technical support.
            </p>
          </div>
          <button className="mt-10 w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-gray-200">
            Modify Licensing
          </button>
        </div>

        {/* Subscription Status Card */}
        <div className="p-10 rounded-[40px] border border-gray-100 bg-white flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                <div className="flex items-center text-green-600 font-black">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Healthy & Paid
                </div>
              </div>
              <CreditCard className="w-6 h-6 text-gray-300" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Payment Method</p>
              <p className="text-gray-900 font-bold">Visa ending in 4242</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Next Invoice</p>
              <div className="flex items-center text-gray-900 font-bold">
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                {subscription.nextBillingDate}
              </div>
            </div>
          </div>
          <button className="mt-10 w-full bg-white border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 text-gray-500 font-black py-4 rounded-2xl transition-all">
            Update Payment Info
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-900">Payment History</h3>
          <button className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center hover:underline">
            Export All (CSV) <ExternalLink className="w-3.5 h-3.5 ml-2" />
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Invoice</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Amount</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paymentHistory.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-6 text-sm font-bold text-gray-900">{payment.date}</td>
                <td className="px-10 py-6 text-sm font-bold text-gray-500">{payment.id.toUpperCase()}</td>
                <td className="px-10 py-6 text-sm font-black text-gray-900">${payment.amount.toFixed(2)}</td>
                <td className="px-10 py-6 text-right">
                  <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Billing;
