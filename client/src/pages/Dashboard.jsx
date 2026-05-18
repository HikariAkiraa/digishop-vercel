import { useEffect, useState } from 'react';
import { Package, ShoppingCart, TrendingUp, FolderOpen } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, todayProfit: 0, totalProfit: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, txRes, topRes, dailyRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/transactions'),
          api.get('/reports/top-products?limit=5').catch(() => ({ data: { data: [] } })),
          api.get('/reports/daily?days=1').catch(() => ({ data: { data: [] } })),
        ]);

        const todayProfit = dailyRes.data.data?.[0]?.total_profit || 0;

        setStats({
          products: productsRes.data.data?.length || 0,
          categories: categoriesRes.data.data?.length || 0,
          todayProfit: Number(todayProfit),
          totalProfit: (txRes.data.data || []).reduce((sum, t) => sum + Number(t.profit), 0),
        });

        setRecentTx((txRes.data.data || []).slice(0, 5));
        setTopProducts(topRes.data.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'violet' },
    { label: 'Categories', value: stats.categories, icon: FolderOpen, color: 'blue' },
    { label: 'Today Profit', value: formatRp(stats.todayProfit), icon: TrendingUp, color: 'emerald' },
    { label: 'Total Profit', value: formatRp(stats.totalProfit), icon: ShoppingCart, color: 'amber' },
  ];

  const colorMap = {
    violet: 'bg-violet-600/20 text-violet-400',
    blue: 'bg-blue-600/20 text-blue-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/20 text-amber-400',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Transactions</h2>
          {recentTx.length === 0 ? (
            <p className="text-slate-500 text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#2d2d4a] last:border-0">
                  <div>
                    <p className="text-sm text-slate-200">#{tx.id}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">{formatRp(tx.profit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.product_id || i} className="flex items-center justify-between py-2 border-b border-[#2d2d4a] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                    <span className="text-sm text-slate-200">{p.name || p.product_name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{p.total_sold || p.total_quantity} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
