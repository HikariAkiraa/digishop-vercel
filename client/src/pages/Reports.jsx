import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Package, FolderOpen, WalletCards,
  Plus, Trash2, ArrowUpRight, ArrowDownRight, Landmark,
  UserMinus, Receipt, Search, X, CheckCircle2, AlertCircle,
  Calendar, RefreshCw, ChevronRight, ChevronLeft, HelpCircle, DollarSign,
  Pencil
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const [dailyData, setDailyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cash Flow States
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [cashFlowData, setCashFlowData] = useState(null);
  const [cashFlowLoading, setCashFlowLoading] = useState(false);
  const [cashFlowFilter, setCashFlowFilter] = useState('quartal'); // 'quartal' | 'year' | 'all' | 'custom'
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('all'); // 'all' | 'omzet' | 'spend' | 'modal' | 'prive'
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Cash Flow Modal & Form
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cashFlowForm, setCashFlowForm] = useState({
    type: 'spend',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [submittingCashFlow, setSubmittingCashFlow] = useState(false);

  const [cashFlowMessage, setCashFlowMessage] = useState(null);


  const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

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

  const fetchCashFlow = async () => {
    setCashFlowLoading(true);
    try {
      let url = `/reports/cash-flow?filter=${cashFlowFilter}&year=${selectedYear}&quarter=${selectedQuarter}`;
      if (cashFlowFilter === 'custom') {
        if (!customStart || !customEnd) {
          setCashFlowLoading(false);
          return;
        }
        url += `&start=${customStart}&end=${customEnd}`;
      }
      const res = await api.get(url);
      setCashFlowData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch cash flow:', err);
    } finally {
      setCashFlowLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'daily') fetchDaily();
    else if (tab === 'top') fetchTopProducts();
    else if (tab === 'category') fetchCategories();
    else if (tab === 'cashflow' || tab === 'period') fetchCashFlow();
  }, [tab, cashFlowFilter, selectedYear, selectedQuarter]);

  const handleSaveCashFlow = async (e) => {
    e.preventDefault();
    const rawAmt = Number(cashFlowForm.amount);
    if (!rawAmt || rawAmt <= 0) {
      setCashFlowMessage({ type: 'error', text: 'Nominal harus lebih besar dari 0' });
      return;
    }
    if (!cashFlowForm.description.trim()) {
      setCashFlowMessage({ type: 'error', text: 'Keterangan wajib diisi' });
      return;
    }
    setSubmittingCashFlow(true);
    setCashFlowMessage(null);
    try {
      if (editingId) {
        await api.put(`/reports/cash-flow/${editingId}`, {
          type: cashFlowForm.type,
          amount: rawAmt,
          description: cashFlowForm.description.trim(),
          date: cashFlowForm.date
        });
        setCashFlowMessage({ type: 'success', text: 'Catatan kas berhasil diperbarui!' });
      } else {
        await api.post('/reports/cash-flow', {
          type: cashFlowForm.type,
          amount: rawAmt,
          description: cashFlowForm.description.trim(),
          date: cashFlowForm.date
        });
        setCashFlowMessage({ type: 'success', text: 'Catatan kas berhasil disimpan!' });
      }
      setTimeout(() => {
        setShowCashFlowModal(false);
        setEditingId(null);
        setCashFlowMessage(null);
        setCashFlowForm({
          type: 'spend',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }, 900);
      fetchCashFlow();
    } catch (err) {
      setCashFlowMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan catatan kas'
      });
    } finally {
      setSubmittingCashFlow(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setCashFlowForm({
      type: 'spend',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setCashFlowMessage(null);
    setShowCashFlowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.numeric_id);
    setCashFlowForm({
      type: item.type,
      amount: item.amount || item.in_amount || item.out_amount || '',
      description: item.description || '',
      date: item.date_str || (item.raw_date ? new Date(item.raw_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    });
    setCashFlowMessage(null);
    setShowCashFlowModal(true);
  };


  const handleDeleteCashFlow = async (numericId, description) => {
    if (!window.confirm(`Hapus catatan kas "${description}"?`)) return;
    try {
      await api.delete(`/reports/cash-flow/${numericId}`);
      fetchCashFlow();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus catatan kas');
    }
  };

  const filteredLedger = useMemo(() => {
    if (!cashFlowData?.ledger) return [];
    return cashFlowData.ledger
      .filter(item => {
        const matchCategory = ledgerFilter === 'all' || item.type === ledgerFilter;
        const matchSearch = !ledgerSearch.trim() ||
          (item.description && item.description.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
          (item.type_label && item.type_label.toLowerCase().includes(ledgerSearch.toLowerCase()));
        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.raw_date).getTime();
        const timeB = new Date(b.raw_date).getTime();
        if (timeA !== timeB) return timeB - timeA; // Urutan pasti dari yang TERBARU ke TERLAMA
        return (b.numeric_id || 0) - (a.numeric_id || 0);
      });
  }, [cashFlowData?.ledger, ledgerFilter, ledgerSearch]);

  const totalPages = Math.ceil(filteredLedger.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [ledgerFilter, ledgerSearch, cashFlowFilter, selectedYear, selectedQuarter]);

  const paginatedLedger = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLedger.slice(start, start + pageSize);
  }, [filteredLedger, currentPage, pageSize]);



  const tabs = [
    { id: 'daily', label: 'Daily', icon: TrendingUp },
    { id: 'top', label: 'Top Products', icon: Package },
    { id: 'category', label: 'By Category', icon: FolderOpen },
    { id: 'cashflow', label: 'Cash Flow', icon: WalletCards },
  ];

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const quarters = [
    { q: 1, label: 'Q1 (Jan - Mar)' },
    { q: 2, label: 'Q2 (Apr - Jun)' },
    { q: 3, label: 'Q3 (Jul - Sep)' },
    { q: 4, label: 'Q4 (Okt - Des)' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            {tab === 'cashflow' || tab === 'period' ? 'Cash Flow & Buku Kas' : 'Sales Analytics'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {tab === 'cashflow' || tab === 'period'
              ? 'Buku besar pergerakan arus kas masuk dan keluar secara real-time'
              : 'Pantau tren penjualan dan performa produk'}
          </p>
        </div>

        {(tab === 'cashflow' || tab === 'period') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Catat Kas (Spend / Modal / Prive)
          </button>
        )}

      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-1 no-scrollbar shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id || (id === 'cashflow' && tab === 'period');
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer whitespace-nowrap font-medium ${
                isActive
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {loading && (tab !== 'cashflow' && tab !== 'period') ? (
        <div className="flex items-center justify-center py-12 text-slate-500">Loading data...</div>
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
                          <tr><td colSpan={4} className="text-center py-6 text-slate-500">No transactions in this period</td></tr>
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
                    </table>
                  </div>
                </>
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

          {/* CASH FLOW (Buku Besar Arus Kas) */}
          {(tab === 'cashflow' || tab === 'period') && (
            <div className="space-y-6">
              {/* Period Filter Card */}
              <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                {/* Filter Mode Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d4a] pb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setCashFlowFilter('quartal')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cashFlowFilter === 'quartal'
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                          : 'bg-[#12122a] text-slate-400 hover:text-slate-200 border border-[#2d2d4a]'
                      }`}
                    >
                      🏢 By Quartal
                    </button>
                    <button
                      onClick={() => setCashFlowFilter('year')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cashFlowFilter === 'year'
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                          : 'bg-[#12122a] text-slate-400 hover:text-slate-200 border border-[#2d2d4a]'
                      }`}
                    >
                      📅 By Year
                    </button>
                    <button
                      onClick={() => setCashFlowFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cashFlowFilter === 'all'
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                          : 'bg-[#12122a] text-slate-400 hover:text-slate-200 border border-[#2d2d4a]'
                      }`}
                    >
                      🌐 All Time
                    </button>
                    <button
                      onClick={() => setCashFlowFilter('custom')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cashFlowFilter === 'custom'
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                          : 'bg-[#12122a] text-slate-400 hover:text-slate-200 border border-[#2d2d4a]'
                      }`}
                    >
                      📆 Custom Range
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Periode: <strong className="text-slate-200">{cashFlowData?.period_info?.label || 'Memuat...'}</strong></span>
                  </div>
                </div>

                {/* Sub-Filters based on mode */}
                <div className="flex flex-wrap items-center gap-3">
                  {cashFlowFilter === 'quartal' && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Tahun:</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="bg-[#12122a] border border-[#2d2d4a] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        {quarters.map(({ q, label }) => (
                          <button
                            key={q}
                            onClick={() => setSelectedQuarter(q)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                              selectedQuarter === q
                                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/50'
                                : 'bg-[#12122a] text-slate-400 hover:text-slate-200 border border-[#2d2d4a]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {cashFlowFilter === 'year' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Pilih Tahun:</label>
                      <div className="flex items-center gap-1.5">
                        {yearOptions.map(y => (
                          <button
                            key={y}
                            onClick={() => setSelectedYear(y)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              selectedYear === y
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'bg-[#12122a] text-slate-400 hover:text-slate-200 border border-[#2d2d4a]'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cashFlowFilter === 'custom' && (
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Dari:</label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="bg-[#12122a] border border-[#2d2d4a] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Sampai:</label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="bg-[#12122a] border border-[#2d2d4a] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]"
                        />
                      </div>
                      <button
                        onClick={fetchCashFlow}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        Tampilkan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {cashFlowLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                  <p className="text-sm">Menghitung buku besar arus kas...</p>
                </div>
              ) : !cashFlowData ? (
                <div className="text-center py-12 text-slate-500">Tidak ada data arus kas untuk periode ini.</div>
              ) : (
                <>
                  {/* SECTION 1: Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Omzet Card */}
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] hover:border-emerald-500/40 rounded-2xl p-4 transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">Omzet (Penjualan)</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          + Kas Masuk
                        </span>
                      </div>
                      <p className="text-2xl font-black text-emerald-400 tracking-tight">
                        {formatRp(cashFlowData.summary?.omzet)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Dari {cashFlowData.summary?.total_transactions || 0} transaksi POS
                      </p>
                    </div>

                    {/* Spend Card */}
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] hover:border-rose-500/40 rounded-2xl p-4 transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">Spend (Pengeluaran)</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          - Kas Keluar
                        </span>
                      </div>
                      <p className="text-2xl font-black text-rose-400 tracking-tight">
                        {formatRp(cashFlowData.summary?.spend)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        Biaya belanja & operasional toko
                      </p>
                    </div>

                    {/* Tambah Modal Card */}
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] hover:border-sky-500/40 rounded-2xl p-4 transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">Tambah Modal</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          + Kas Masuk
                        </span>
                      </div>
                      <p className="text-2xl font-black text-sky-400 tracking-tight">
                        {formatRp(cashFlowData.summary?.modal)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        Suntikan dana modal baru
                      </p>
                    </div>

                    {/* Prive Card */}
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] hover:border-amber-500/40 rounded-2xl p-4 transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">Prive (Ambil Pribadi)</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          - Kas Keluar
                        </span>
                      </div>
                      <p className="text-2xl font-black text-amber-400 tracking-tight">
                        {formatRp(cashFlowData.summary?.prive)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <UserMinus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        Penarikan pribadi oleh pemilik
                      </p>
                    </div>
                  </div>

                  {/* Highlight Hero Card: NET CASH FLOW */}
                  <div
                    className={`border rounded-2xl p-5 sm:p-6 transition-all ${
                      (cashFlowData.summary?.net_cash_flow || 0) >= 0
                        ? 'bg-gradient-to-br from-[#1a1a2e] via-[#162032] to-[#10241e] border-emerald-500/30'
                        : 'bg-gradient-to-br from-[#1a1a2e] via-[#241724] to-[#26121b] border-rose-500/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                            Arus Kas Bersih (Net Cash Flow)
                          </h3>
                          {(cashFlowData.summary?.net_cash_flow || 0) >= 0 ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✅ Surplus Kas (Positif)
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              ⚠️ Defisit Kas (Negatif)
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-3xl sm:text-4xl font-black tracking-tight ${
                            (cashFlowData.summary?.net_cash_flow || 0) >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatRp(cashFlowData.summary?.net_cash_flow)}
                        </p>

                        <p className="text-xs text-slate-400 mt-2">
                          <strong className="text-slate-300">Penjelasan Sederhana:</strong> Total Uang Masuk{' '}
                          <span className="text-emerald-400">({formatRp(cashFlowData.summary?.total_inflow)})</span> dikurangi
                          Total Uang Keluar <span className="text-rose-400">({formatRp(cashFlowData.summary?.total_outflow)})</span>.
                        </p>
                      </div>

                      <div className="bg-[#12122a]/80 border border-[#2d2d4a] rounded-xl p-4 md:min-w-[280px] space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Total Kas Masuk (Omzet + Modal):</span>
                          <span className="text-emerald-400 font-bold">
                            {formatRp(cashFlowData.summary?.total_inflow)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Total Kas Keluar (Spend + Prive):</span>
                          <span className="text-rose-400 font-bold">
                            {formatRp(cashFlowData.summary?.total_outflow)}
                          </span>
                        </div>
                        <div className="border-t border-[#2d2d4a] pt-2 flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">Laba Toko (Omzet - Spend):</span>
                          <span className={cashFlowData.summary?.operating_margin >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                            {formatRp(cashFlowData.summary?.operating_margin)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Grafik Ilustrasi Pergerakan Kas */}
                  <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d2d4a] pb-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-violet-400" />
                          Grafik Ilustrasi Kas Masuk vs Kas Keluar
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Perbandingan visual pergerakan uang masuk (Hijau), uang keluar (Merah), dan kas bersih (Ungu)
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Masuk</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Keluar</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500 inline-block" /> Net</span>
                      </div>
                    </div>

                    {(!cashFlowData.chart_data || cashFlowData.chart_data.length === 0) ? (
                      <p className="text-slate-500 text-sm text-center py-10">Belum ada riwayat pergerakan kas pada periode ini.</p>
                    ) : (
                      <div className="h-72 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cashFlowData.chart_data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" vertical={false} />
                            <XAxis
                              dataKey="label"
                              stroke="#64748b"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#64748b"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                if (Math.abs(value) >= 1000) return (value / 1000).toFixed(0) + 'k';
                                return value;
                              }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f0f14', borderColor: '#2d2d4a', borderRadius: '0.75rem', color: '#f1f5f9', fontSize: '12px' }}
                              formatter={(value, name) => {
                                const labels = {
                                  inflow: 'Total Kas Masuk',
                                  outflow: 'Total Kas Keluar',
                                  net: 'Arus Kas Bersih (Net)',
                                  omzet: 'Omzet',
                                  spend: 'Spend',
                                  modal: 'Modal',
                                  prive: 'Prive'
                                };
                                return [formatRp(value), labels[name] || name];
                              }}
                            />
                            <Bar dataKey="inflow" name="inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
                            <Bar dataKey="outflow" name="outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={38} />
                            <Bar dataKey="net" name="net" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={38} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: Buku Besar Seluruh Arus Kas (General Cash Ledger Table) */}
                  <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-5 border-b border-[#2d2d4a] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <WalletCards className="w-5 h-5 text-violet-400" />
                            Buku Besar Seluruh Arus Kas
                          </h2>
                          <span className="text-[10px] font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
                            🔽 Terbaru ke Terlama
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Daftar kronologis uang kas dari transaksi terkini ke terlama beserta saldo berjalan
                        </p>
                      </div>


                      {/* Ledger Search & Filter */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Cari keterangan..."
                            value={ledgerSearch}
                            onChange={(e) => setLedgerSearch(e.target.value)}
                            className="bg-[#12122a] border border-[#2d2d4a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 w-44 sm:w-56"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filter Pills for Ledger */}
                    <div className="px-4 sm:px-5 py-2.5 bg-[#12122a]/50 border-b border-[#2d2d4a] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-xs text-slate-500 mr-1 shrink-0">Filter:</span>
                      {[
                        { id: 'all', label: 'Semua' },
                        { id: 'omzet', label: '🟢 Omzet' },
                        { id: 'spend', label: '🔴 Spend' },
                        { id: 'modal', label: '🔵 Modal' },
                        { id: 'prive', label: '🟣 Prive' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => setLedgerFilter(id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                            ledgerFilter === id
                              ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <span className="ml-auto text-xs text-slate-500 shrink-0">
                        {filteredLedger.length} entri
                      </span>
                    </div>

                    {/* Ledger Table */}
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead>
                          <tr className="border-b border-[#2d2d4a] text-slate-400 bg-[#141424]">
                            <th className="px-4 py-3 text-left font-semibold">Tanggal & Waktu</th>
                            <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                            <th className="px-4 py-3 text-left font-semibold">Keterangan</th>
                            <th className="px-4 py-3 text-right font-semibold text-emerald-400">Kas Masuk (+)</th>
                            <th className="px-4 py-3 text-right font-semibold text-rose-400">Kas Keluar (-)</th>
                            <th className="px-4 py-3 text-right font-semibold">Saldo Kas Berjalan</th>
                            <th className="px-4 py-3 text-center font-semibold w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d2d4a]">
                          {filteredLedger.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-slate-500">
                                Tidak ada entri kas yang cocok dengan filter.
                              </td>
                            </tr>
                          ) : (
                            paginatedLedger.map((item) => {
                              const isPositive = item.in_amount > 0;
                              return (
                                <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                                    {new Date(item.raw_date).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}{' '}
                                    <span className="text-slate-500">
                                      {new Date(item.raw_date).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {item.type === 'omzet' && (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                                        🟢 Penjualan Kasir
                                      </span>
                                    )}
                                    {item.type === 'spend' && (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium text-[11px]">
                                        🔴 Spend (Pengeluaran)
                                      </span>
                                    )}
                                    {item.type === 'modal' && (
                                      <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium text-[11px]">
                                        🔵 Tambah Modal
                                      </span>
                                    )}
                                    {item.type === 'prive' && (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[11px]">
                                        🟣 Prive (Pribadi)
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-slate-200">
                                    <span className="font-medium">{item.description}</span>
                                    {item.user_name && (
                                      <span className="text-[10px] text-slate-500 block">
                                        Oleh: {item.user_name}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                                    {item.in_amount > 0 ? `+ ${formatRp(item.in_amount)}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-rose-400 whitespace-nowrap">
                                    {item.out_amount > 0 ? `- ${formatRp(item.out_amount)}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-200 whitespace-nowrap">
                                    {formatRp(item.running_balance)}
                                  </td>
                                  <td className="px-4 py-3 text-center whitespace-nowrap">
                                    {!item.is_system ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleOpenEdit(item)}
                                          title="Edit catatan kas ini"
                                          className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCashFlow(item.numeric_id, item.description)}
                                          title="Hapus catatan kas manual ini"
                                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic" title="Otomatis dari kasir POS">
                                        POS
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar (Maks 20 List) */}
                    {filteredLedger.length > 0 && (
                      <div className="px-4 sm:px-5 py-3 border-t border-[#2d2d4a] bg-[#141424] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="text-slate-400">
                          Menampilkan <strong className="text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-200">{Math.min(currentPage * pageSize, filteredLedger.length)}</strong> dari <strong className="text-slate-200">{filteredLedger.length}</strong> entri
                          <span className="ml-2 text-slate-500">(Maks 20 per halaman)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-[#2d2d4a] bg-[#1a1a2e] text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#1a1a2e] disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 font-medium"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => {
                                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                              })
                              .map((page, idx, arr) => {
                                const prevPage = arr[idx - 1];
                                const showEllipsis = prevPage && page - prevPage > 1;
                                return (
                                  <span key={page} className="flex items-center">
                                    {showEllipsis && <span className="px-1 text-slate-500">...</span>}
                                    <button
                                      onClick={() => setCurrentPage(page)}
                                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        currentPage === page
                                          ? 'bg-violet-600 text-white shadow-sm'
                                          : 'border border-[#2d2d4a] bg-[#1a1a2e] text-slate-400 hover:text-white hover:bg-slate-800'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  </span>
                                );
                              })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-[#2d2d4a] bg-[#1a1a2e] text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#1a1a2e] disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 font-medium"
                          >
                            Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: Tambah / Edit Catatan Kas (Spend / Modal / Prive) */}
      {showCashFlowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#2d2d4a] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {editingId ? (
                    <>
                      <Pencil className="w-4 h-4 text-amber-400" />
                      Edit Catatan Kas
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Catat Arus Kas Baru
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingId
                    ? 'Perbarui nominal, jenis, keterangan, atau tanggal kas'
                    : 'Catat belanja, suntikan modal, atau prive pribadi'}
                </p>
              </div>
              <button
                onClick={() => setShowCashFlowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#12122a] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCashFlow} className="p-5 space-y-4 pt-0">
              {cashFlowMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    cashFlowMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {cashFlowMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{cashFlowMessage.text}</span>
                </div>
              )}

              {/* Tipe Kas Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Jenis Transaksi Kas:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashFlowForm({ ...cashFlowForm, type: 'spend' })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                      cashFlowForm.type === 'spend'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-[#12122a] border-[#2d2d4a] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔴 Spend
                    <span className="block text-[10px] font-normal text-slate-400">Pengeluaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCashFlowForm({ ...cashFlowForm, type: 'modal' })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                      cashFlowForm.type === 'modal'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                        : 'bg-[#12122a] border-[#2d2d4a] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔵 Modal
                    <span className="block text-[10px] font-normal text-slate-400">Suntik Dana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCashFlowForm({ ...cashFlowForm, type: 'prive' })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                      cashFlowForm.type === 'prive'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-[#12122a] border-[#2d2d4a] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🟣 Prive
                    <span className="block text-[10px] font-normal text-slate-400">Ambil Pribadi</span>
                  </button>
                </div>
              </div>

              {/* Nominal Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal (Rupiah):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 150000"
                    value={cashFlowForm.amount}
                    onChange={(e) => setCashFlowForm({ ...cashFlowForm, amount: e.target.value })}
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-xl pl-10 pr-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
                {Number(cashFlowForm.amount) > 0 && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                    Format: {formatRp(cashFlowForm.amount)}
                  </p>
                )}
              </div>

              {/* Keterangan Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan / Catatan:
                </label>
                <input
                  type="text"
                  placeholder={
                    cashFlowForm.type === 'spend'
                      ? 'Contoh: Beli kabel jumper, solder, dan biaya listrik'
                      : cashFlowForm.type === 'modal'
                      ? 'Contoh: Suntikan modal awal toko dari owner'
                      : 'Contoh: Tarik tunai keperluan keluarga'
                  }
                  value={cashFlowForm.description}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, description: e.target.value })}
                  className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              {/* Tanggal Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tanggal Transaksi:
                </label>
                <input
                  type="date"
                  value={cashFlowForm.date}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, date: e.target.value })}
                  className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2d2d4a]">
                <button
                  type="button"
                  onClick={() => setShowCashFlowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCashFlow}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingCashFlow ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
