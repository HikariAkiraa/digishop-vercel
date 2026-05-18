import { useEffect, useState } from 'react';
import { ShoppingCart, Eye, X, Minus, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPOS, setShowPOS] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [txRes, prodRes] = await Promise.all([api.get('/transactions'), api.get('/products')]);
      setTransactions(txRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock <= 0) return prev;
      return [...prev, { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1, stock: product.stock }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty < 1 || newQty > i.stock) return i;
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product_id !== productId));

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    setError(''); setSuccess('');
    if (cart.length === 0) { setError('Keranjang kosong'); return; }
    try {
      const items = cart.map(({ product_id, quantity }) => ({ product_id, quantity }));
      await api.post('/transactions', { items });
      setSuccess('Transaksi berhasil!');
      setCart([]);
      fetchData();
      setTimeout(() => { setShowPOS(false); setSuccess(''); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Transaksi gagal');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await api.get(`/transactions/${id}`);
      setDetail(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Yakin ingin menghapus transaksi #${id}? \nStok barang akan otomatis dikembalikan.`)) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus transaksi');
    }
  };

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Transactions</h1>
        <button onClick={() => { setShowPOS(true); setCart([]); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer">
          <ShoppingCart className="w-4 h-4" /> New Transaction
        </button>
      </div>

      {/* Transaction List */}
      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1 h-full">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
            <tr className="border-b border-[#2d2d4a] text-slate-400">
              <th className="px-4 py-3 text-left font-medium">#ID</th>
              <th className="px-4 py-3 text-left font-medium">Cashier</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Profit</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">No transactions yet</td></tr>
            ) : transactions.map(tx => (
              <tr key={tx.id} className="border-b border-[#2d2d4a] last:border-0 hover:bg-[#12122a] transition-colors">
                <td className="px-4 py-3 text-slate-300">#{tx.id}</td>
                <td className="px-4 py-3 text-slate-400">{tx.user_name || tx.cashier || '-'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-medium">{formatRp(tx.total)}</td>
                <td className="px-4 py-3 text-right text-amber-400 font-medium">{formatRp(tx.profit || 0)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => viewDetail(tx.id)} className="text-violet-400 hover:text-violet-300 cursor-pointer" title="View Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(tx.id)} className="text-red-400 hover:text-red-300 cursor-pointer" title="Delete Transaction">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* POS Modal */}
      {showPOS && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-[#2d2d4a]">
              <h2 className="text-white font-semibold">New Transaction</h2>
              <button onClick={() => setShowPOS(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Product List */}
              <div className="flex-1 md:border-r border-b md:border-b-0 border-[#2d2d4a] overflow-y-auto p-3 sm:p-4 max-h-[45vh] md:max-h-none">
                <p className="text-xs text-slate-400 mb-2 font-medium">Select Product</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {products.filter(p => p.stock > 0).map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1a2e] hover:bg-[#12122a] text-left transition-colors cursor-pointer border border-[#2d2d4a] hover:border-violet-500/50 relative overflow-hidden group">
                      <div className="pr-4 z-10">
                        <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">{formatRp(p.price)} <span className="text-slate-500 font-normal">· stok: {p.stock}</span></p>
                      </div>
                      <div className="bg-violet-500/10 p-1.5 rounded-md group-hover:bg-violet-500 group-hover:text-white text-violet-400 transition-colors z-10">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <div className="w-full md:w-80 lg:w-96 flex flex-col p-3 sm:p-4 max-h-[50vh] md:max-h-none bg-[#0f0f1d] md:bg-transparent">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium">Shopping Cart</p>
                  <span className="bg-violet-500/20 text-violet-300 text-[10px] px-2 py-0.5 rounded-full font-medium">{cart.length} items</span>
                </div>
                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg mb-2">{error}</div>}
                {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-lg mb-2">{success}</div>}

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-8">
                       <ShoppingCart className="w-12 h-12 text-slate-600 mb-2" />
                       <p className="text-slate-400 text-sm">Cart is empty</p>
                       <p className="text-slate-500 text-xs mt-1">Select products from the list</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={item.product_id} className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-lg p-3 text-sm flex flex-col gap-2 relative group">
                      <div className="flex items-start justify-between">
                        <span className="text-slate-200 text-sm font-medium pr-6 leading-tight">{item.name}</span>
                        <button onClick={() => removeFromCart(item.product_id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1 rounded-md transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-end justify-between mt-1">
                        <div className="flex items-center gap-1 bg-[#12122a] rounded-md border border-[#2d2d4a] p-0.5">
                          <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#2d2d4a] transition-colors cursor-pointer disabled:opacity-50">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs text-slate-200 w-6 text-center font-medium font-mono">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#2d2d4a] transition-colors cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">{formatRp(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2d2d4a] pt-3 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">Total</span>
                    <span className="text-lg font-bold text-white">{formatRp(cartTotal)}</span>
                  </div>
                  <button onClick={handleCheckout} disabled={cart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                    Pay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d4a]">
              <h2 className="text-white font-semibold">Transaction #{detail.id}</h2>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xs text-slate-400">
                <p>Cashier: {detail.user_name || detail.cashier || '-'}</p>
                <p>Date: {new Date(detail.created_at).toLocaleString('id-ID')}</p>
              </div>
              <div className="space-y-1">
                {(detail.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#2d2d4a] last:border-0">
                    <div>
                      <p className="text-sm text-slate-200">{item.product_name || item.name}</p>
                      <p className="text-xs text-slate-500">{item.quantity} × {formatRp(item.price)}</p>
                    </div>
                    <span className="text-sm text-slate-300">{formatRp(item.subtotal || item.quantity * item.price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#2d2d4a]">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-emerald-400">{formatRp(detail.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
