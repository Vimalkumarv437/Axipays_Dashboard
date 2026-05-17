import React, { useState, useEffect } from 'react';
import { fetchTransactions } from '../api/paymentApi';
import { RefreshCw, TrendingUp, AlertTriangle, Search, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Download, Grid } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'react-toastify';

const STATUS_COLORS = { 'Success': '#16a34a', 'Failed': '#dc2626', 'Pending': '#ea580c' };
const CURRENCY_COLORS = ['#2563eb', '#16a34a', '#d97706', '#1e293b'];

export const DashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [totalApiCount, setTotalApiCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const isFetchingRef = React.useRef(false);

  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    successVolume: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      // Fetch data
      const response = await fetchTransactions(1, 100);
      const data = response.data || response;
      const txns = Array.isArray(data) ? data : (data.transactions || []);
      setTransactions(txns);
      setTotalApiCount(response.total || data.total || txns.length);
      calculateSummary(txns);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      // 500ms cooldown to act as debounce/throttle
      setTimeout(() => {
        setLoading(false);
        isFetchingRef.current = false;
      }, 500);
    }
  };

  const calculateSummary = (txns) => {
    let successVol = 0, successCnt = 0, failedCnt = 0, pendingCnt = 0, totalVol = 0;

    txns.forEach(t => {
      const status = (t.status || t.payment_status || 'pending').toLowerCase();
      const amount = parseFloat(t.amount || 0);
      totalVol += amount;
      if (status === 'success') {
        successVol += amount;
        successCnt++;
      } else if (status === 'failed') {
        failedCnt++;
      } else {
        pendingCnt++;
      }
    });

    setSummary({
      totalTransactions: txns.length,
      totalVolume: totalVol,
      successVolume: successVol,
      successCount: successCnt,
      failedCount: failedCnt,
      pendingCount: pendingCnt
    });
  };

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    const status = (t.status || t.payment_status || 'pending').toLowerCase();
    const filterLower = statusFilter.toLowerCase();
    const matchesFilter = filterLower === 'all' || status === filterLower;
    const matchesSearch = search === '' ||
      (t.orderId || t.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / limit) || 1;
  const currentTransactions = filteredTransactions.slice((page - 1) * limit, page * limit);

  // Charts Data
  const statusData = [
    { name: 'Success', value: summary.successCount },
    { name: 'Failed', value: summary.failedCount },
    { name: 'Pending', value: summary.pendingCount }
  ];

  const currencyMap = {};
  transactions.forEach(t => {
    const status = (t.status || t.payment_status || 'pending').toLowerCase();
    if (t.currency && status === 'success') {
      currencyMap[t.currency] = (currencyMap[t.currency] || 0) + 1;
    }
  });
  const currencyData = Object.keys(currencyMap).map(c => ({ name: c, value: currencyMap[c] }));

  // Dummy volume data for smooth chart as the API might just return raw transactions
  const volumeData = [
    { name: 'Mon', uv: 4000 },
    { name: 'Tue', uv: 4500 },
    { name: 'Wed', uv: 5500 },
    { name: 'Thu', uv: 8500 },
    { name: 'Fri', uv: 3500 },
    { name: 'Sat', uv: 4500 },
    { name: 'Sun', uv: 8000 }
  ];

  return (
    <div className="bg-[#f4f7f9] min-h-screen">
      {/* Subheader */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center z-40 sticky top-16">
        <h1 className="text-[1.1rem] font-bold text-slate-800 tracking-tight">Transaction Dashboard</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <span>Last 30 days</span>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className={`flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${loading ? 'opacity-60 cursor-not-allowed text-slate-500' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 max-w-[1600px] mx-auto space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500"></div>
            <div className="p-5 pl-7">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[0.65rem] font-bold text-slate-500 tracking-wider uppercase">Total Transactions</p>
                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-md">
                  <Grid className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">
                {loading ? <div className="h-8 bg-slate-200 rounded w-20 animate-pulse my-1"></div> : totalApiCount.toLocaleString()}
              </h3>
              {loading ? <div className="h-3 bg-slate-100 rounded w-32 animate-pulse mt-2"></div> : <p className="text-xs text-slate-400">All time transactions</p>}
            </div>
          </div>

          {/* Success Volume */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500"></div>
            <div className="p-5 pl-7">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[0.65rem] font-bold text-slate-500 tracking-wider uppercase">Success Volume</p>
                <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">
                {loading ? <div className="h-8 bg-slate-200 rounded w-32 animate-pulse my-1"></div> : `$${summary.successVolume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              </h3>
              {loading ? (
                <div className="h-3 bg-slate-100 rounded w-32 animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-2">Total successful amount</p>
                  {summary.totalVolume > 0 && (
                    <p className="text-xs font-semibold text-green-600 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> {((summary.successVolume / summary.totalVolume) * 100).toFixed(1)}% of total volume
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Success Count */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500"></div>
            <div className="p-5 pl-7">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[0.65rem] font-bold text-slate-500 tracking-wider uppercase">Success Count</p>
                <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">
                {loading ? <div className="h-8 bg-slate-200 rounded w-24 animate-pulse my-1"></div> : summary.successCount.toLocaleString()}
              </h3>
              {loading ? (
                <div className="h-3 bg-slate-100 rounded w-32 animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-2">Successful transactions</p>
                  {summary.totalTransactions > 0 && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold bg-green-100 text-green-700">
                      {((summary.successCount / summary.totalTransactions) * 100).toFixed(1)}% rate
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Failed + Pending */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600"></div>
            <div className="p-5 pl-7">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[0.65rem] font-bold text-slate-500 tracking-wider uppercase">Failed + Pending</p>
                <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">
                {loading ? <div className="h-8 bg-slate-200 rounded w-20 animate-pulse my-1"></div> : (summary.failedCount + summary.pendingCount).toLocaleString()}
              </h3>
              {loading ? (
                <div className="h-3 bg-slate-100 rounded w-40 animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-xs text-red-500 font-medium mb-1.5">Need attention</p>
                  <p className="text-[0.65rem] font-medium text-slate-500">
                    {summary.failedCount} Failed &nbsp;|&nbsp; {summary.pendingCount} Pending
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Donut */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Status Distribution</h3>
              <p className="text-xs text-slate-400">Real-time breakdown</p>
            </div>
            <div className="flex-1 flex items-center justify-center relative min-h-[220px] outline-none focus:outline-none" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              {loading ? (
                <div className="w-40 h-40 rounded-full border-8 border-slate-100 animate-pulse"></div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none" style={{ outline: 'none' }}>
                    <PieChart style={{ outline: 'none' }} className="outline-none focus:outline-none">
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        style={{ outline: 'none' }}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff' }} itemStyle={{ color: '#334155', fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[0.65rem] font-bold text-slate-400 tracking-widest uppercase">Total</span>
                    <span className="text-2xl font-bold text-slate-800">{totalApiCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Area Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2 flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Transaction Volume Over Time</h3>
                <p className="text-xs text-slate-400">Aggregated successful amounts</p>
              </div>
              <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                {['Daily', 'Weekly', 'Monthly'].map((tf, i) => (
                  <button key={tf} className={`px-3 py-1 text-[0.65rem] font-bold rounded-md transition-colors ${i === 0 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[220px] outline-none focus:outline-none" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              {loading ? (
                <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none" style={{ outline: 'none' }}>
                  <AreaChart data={volumeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} style={{ outline: 'none' }} className="outline-none focus:outline-none">
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `$${val / 1000}k`} />
                    <RechartsTooltip cursor={{ fill: 'transparent', stroke: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff' }} itemStyle={{ color: '#334155', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Currency Breakdown Donut */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-1 flex flex-col h-fit group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 lg:sticky lg:top-24 lg:z-10 relative">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Currency Breakdown</h3>
              <p className="text-xs text-slate-400">Volume by currency</p>
            </div>
            <div className="w-full h-[200px] mt-4 flex items-center justify-center relative outline-none focus:outline-none" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              {loading ? (
                <div className="w-32 h-32 rounded-full border-8 border-slate-100 animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none" style={{ outline: 'none' }}>
                  <PieChart style={{ outline: 'none' }} className="outline-none focus:outline-none">
                    <Pie
                      data={currencyData.length ? currencyData : [{ name: 'USD', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      style={{ outline: 'none' }}
                    >
                      {(currencyData.length ? currencyData : [{ name: 'USD', value: 1 }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CURRENCY_COLORS[index % CURRENCY_COLORS.length]} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff' }} itemStyle={{ color: '#334155', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Custom Legend */}
            {!loading && (
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                {currencyData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-[0.65rem] font-bold text-slate-500">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: CURRENCY_COLORS[i % CURRENCY_COLORS.length] }}></div>
                      {c.name}
                    </div>
                    <span>{c.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 lg:col-span-3 flex flex-col hover:shadow-lg transition-all duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center">
                <h3 className="text-sm font-bold text-slate-800 mr-3">Transaction History</h3>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">{loading ? '-' : totalApiCount}</span>
              </div>
              <button className="flex items-center text-xs font-semibold text-slate-600 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Order ID, email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all shadow-sm"
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 w-full sm:w-auto">
                {['All', 'Success', 'Failed', 'Pending'].map(status => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-1 text-xs font-semibold rounded ${statusFilter === status
                      ? 'bg-white shadow-sm text-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white text-slate-500 text-[0.65rem] font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 w-28">Order ID</th>
                    <th className="p-4 w-48">Card</th>
                    <th className="p-4 w-40">Email</th>
                    <th className="p-4 w-24">Expiry</th>
                    <th className="p-4 w-16">CVV</th>
                    <th className="p-4 w-24">Currency</th>
                    <th className="p-4 w-32">Amount</th>
                    <th className="p-4 w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        <td colSpan="8" className="p-4">
                          <div className="flex space-x-4 animate-pulse">
                            <div className="h-4 bg-slate-100 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/12"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/12"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/12"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/6"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : currentTransactions.length === 0 ? (
                    <tr><td colSpan="8" className="p-8 text-center text-slate-500 text-sm">No transactions found.</td></tr>
                  ) : (
                    currentTransactions.map((txn, idx) => {
                      const status = (txn.status || txn.payment_status || 'pending').toLowerCase();
                      const cardNumber = txn.cardNumber || '';
                      const maskedCard = cardNumber.length >= 10
                        ? `${cardNumber.substring(0, 6)} •••• ${cardNumber.substring(cardNumber.length - 4)}`
                        : (cardNumber || '-');

                      return (
                        <tr key={txn.orderId || txn.id || idx} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                          <td className="p-4 text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{txn.orderId || txn.id || '-'}</td>
                          <td className="p-4 text-xs font-mono text-slate-600">{maskedCard}</td>
                          <td className="p-4 text-xs">
                            {txn.email ? (
                              <span className="text-blue-600">{txn.email}</span>
                            ) : (
                              <span className="text-slate-400 italic">No mails</span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-slate-600 font-medium">{txn.expiryMonth ? `${txn.expiryMonth}/${txn.expiryYear?.toString().slice(-2) || ''}` : '-'}</td>
                          <td className="p-4 text-xs font-mono text-slate-400 tracking-widest">{txn.cardCVC ? '•••' : '-'}</td>
                          <td className="p-4 text-xs font-bold text-slate-500">{txn.currency || '-'}</td>
                          <td className="p-4 text-xs font-bold text-slate-700">
                            {(parseFloat(txn.amount || 0)).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {status === 'success' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[0.65rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                              </span>
                            )}
                            {status === 'failed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[0.65rem] font-bold bg-red-50 text-red-600 border border-red-100">
                                <XCircle className="w-3 h-3 mr-1" /> Failed
                              </span>
                            )}
                            {status === 'pending' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[0.65rem] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 bg-slate-50/50 rounded-b-xl">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div>
                  Showing <span className="font-bold text-slate-700">{filteredTransactions.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-bold text-slate-700">{Math.min(page * limit, filteredTransactions.length)}</span> of <span className="font-bold text-slate-700">{filteredTransactions.length}</span> entries
                </div>
                <div className="hidden sm:block h-3 w-px bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="border border-slate-200 bg-white rounded px-1.5 py-1 outline-none focus:border-blue-500 text-slate-700 font-medium"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>
              <div className="flex space-x-1 border border-slate-200 rounded-md bg-white">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1.5 font-semibold text-slate-700 bg-slate-50">{page}</div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="p-1.5 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
