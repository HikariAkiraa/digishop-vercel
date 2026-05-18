import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Package, FolderOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const [dailyData, setDailyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState({ start: '', end: '' });

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/daily?days=30');
      const fetchedData = res.data.data || [];
      
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last30Days.push({
          date: d.toISOString().split('T')[0],
          total_revenue: 0,
          total_profit: 0,
          total_transactions: 0
        });
      }

      fetchedData.forEach(item => {
        const dStr = new Date(item.date).toISOString().split('T')[0];
        const index = last30Days.findIndex(d => d.date === dStr);
        if (index !== -1) {
          last30Days[index].total_revenue = item.total_revenue;
          last30Days[index].total_profit = item.total_profit;
          last30Days[index].total_transactions = item.total_transactions;
        }
      });

      setDailyData(last30Days);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/top-products?limit=1000');
      setTopProducts(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/categories');
      setCategoryData(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSales = async () => {
    if (!period.start || !period.end) return;
    setLoading(true);
    try {
      const res = await api.get(`/reports/sales?start=${period.start}&end=${period.end}`);
      setSalesData(res.data.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'daily') fetchDaily();
    else if (tab === 'top') fetchTopProducts();
    else if (tab === 'category') fetchCategories();
  }, [tab]);

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  const tabs = [
    { id: 'daily', label: 'Daily', icon: TrendingUp },
    { id: 'top', label: 'Top Products', icon: Package },
    { id: 'category', label: 'By Category', icon: FolderOpen },
    { id: 'period', label: 'By Period', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Sales Report</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-1 no-scrollbar shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
              tab === id ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">Loading...</div>
      ) : (
        <>
          {/* Daily Sales */}
          {tab === 'daily' && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#2d2d4a]">
                <h2 className="text-sm font-semibold text-white">30 Days Sales</h2>
              </div>
              {dailyData.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No data</p>
              ) : (
                <>
                  {/* Recharts Bar Chart */}
                  <div className="px-5 py-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(tick) => new Date(tick).getDate()}
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => value > 0 ? (value / 1000) + 'k' : 0}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" vertical={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f0f14', borderColor: '#2d2d4a', borderRadius: '0.5rem', color: '#f1f5f9' }}
                          itemStyle={{ color: '#10b981' }}
                          cursor={{ fill: '#2d2d4a', opacity: 0.4 }}
                          formatter={(value, name) => [name === 'total_profit' ? formatRp(value) : value, name === 'total_profit' ? 'Profit' : 'Transactions']}
                          labelFormatter={(label) => new Date(label).toISOString().split('T')[0]}
                        />
                        <Bar 
                          dataKey="total_profit" 
                          fill="#8b5cf6" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#2d2d4a] text-slate-400">
                        <th className="px-4 py-2.5 text-left font-medium">Date</th>
                        <th className="px-4 py-2.5 text-right font-medium">Transactions</th>
                        <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                        <th className="px-4 py-2.5 text-right font-medium">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.filter(d => d.total_transactions > 0).length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-6 text-slate-500">No transactions in this period</td></tr>
                      ) : dailyData.filter(d => d.total_transactions > 0).map((d, i) => (
                        <tr key={i} className="border-b border-[#2d2d4a] last:border-0">
                          <td className="px-4 py-2.5 text-slate-300">
                            {new Date(d.date).toISOString().split('T')[0]}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-400">{d.total_transactions}</td>
                          <td className="px-4 py-2.5 text-right text-amber-400">{formatRp(d.total_revenue || 0)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-400">{formatRp(d.total_profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>                  </div>                </>
              )}
            </div>
          )}

          {/* Top Products */}
          {tab === 'top' && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden flex flex-col max-h-[600px]">
              <div className="px-5 py-3 border-b border-[#2d2d4a] shrink-0">
                <h2 className="text-sm font-semibold text-white">Best Selling Products</h2>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No data</p>
              ) : (
                <div className="overflow-auto flex-1 p-0 w-full">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="sticky top-0 bg-[#1a1a2e] z-10 shadow-sm">
                      <tr className="border-b border-[#2d2d4a] text-slate-400">
                      <th className="px-4 py-2.5 text-center font-medium w-12">#</th>
                      <th className="px-4 py-2.5 text-left font-medium">Product</th>
                      <th className="px-4 py-2.5 text-right font-medium">Sold</th>
                      <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                        <th className="px-4 py-2.5 text-right font-medium">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i} className="border-b border-[#2d2d4a] last:border-0">
                        <td className="px-4 py-2.5 text-center">
                          <span className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 text-xs inline-flex items-center justify-center font-semibold">{i + 1}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-200">{p.name || p.product_name}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{p.total_sold || p.total_quantity}</td>
                        <td className="px-4 py-2.5 text-right text-amber-400">{formatRp(p.total_revenue || 0)}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-400">{formatRp(p.total_profit || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
              )}
            </div>
          )}

          {/* Category Sales */}
          {tab === 'category' && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#2d2d4a]">
                <h2 className="text-sm font-semibold text-white">Sales by Category</h2>
              </div>
              {categoryData.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No data</p>
              ) : (
                <div className="p-5 space-y-3">
                  {categoryData.map((c, i) => {
                    const maxRev = Math.max(...categoryData.map(x => Number(x.total_profit || 0)), 1);
                    const width = (Number(c.total_profit || 0) / maxRev) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-200">{c.category_name || c.name || 'Tanpa Kategori'}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-amber-400" title="Revenue">{formatRp(c.total_revenue || 0)}</span>
                            <span className="text-sm text-emerald-400" title="Profit">{formatRp(c.total_profit || 0)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-[#12122a] rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${Math.max(width, 2)}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{c.total_sold || c.total_quantity || 0} item sold</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Period Sales */}
          {tab === 'period' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">From</label>
                    <input type="date" value={period.start} onChange={(e) => setPeriod({...period, start: e.target.value})} 
                      className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">To</label>
                    <input type="date" value={period.end} onChange={(e) => setPeriod({...period, end: e.target.value})} 
                      className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]" />
                  </div>
                  <button onClick={fetchSales}
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white text-sm px-6 py-2 rounded-lg transition-colors cursor-pointer text-center">
                    Show
                  </button>
                </div>
              </div>

              {salesData && (
                <div className="space-y-4">
                  {salesData.summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
                        <p className="text-xs text-slate-400 mb-1">Total Transactions</p>
                        <p className="text-2xl font-bold text-white">{salesData.summary.total_transactions || 0}</p>
                      </div>
                      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
                        <p className="text-xs text-slate-400 mb-1">Total Items Sold</p>
                        <p className="text-2xl font-bold text-white">{salesData.summary.total_items || 0}</p>
                      </div>
                      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
                        <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-amber-400">{formatRp(salesData.summary.total_revenue || 0)}</p>
                      </div>
                      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
                        <p className="text-xs text-slate-400 mb-1">Total Net Profit</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatRp(salesData.summary.total_profit || 0)}</p>
                      </div>
                    </div>
                  )}

                  {salesData.transactions && salesData.transactions.length > 0 && (
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[400px]">
                        <thead>
                          <tr className="border-b border-[#2d2d4a] text-slate-400">
                            <th className="px-4 py-2.5 text-left font-medium">#</th>
                            <th className="px-4 py-2.5 text-left font-medium">Date</th>
                            <th className="px-4 py-2.5 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.transactions.map(tx => (
                            <tr key={tx.id} className="border-b border-[#2d2d4a] last:border-0">
                              <td className="px-4 py-2.5 text-slate-300">#{tx.id}</td>
                              <td className="px-4 py-2.5 text-slate-400 text-xs">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-400">{formatRp(tx.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
