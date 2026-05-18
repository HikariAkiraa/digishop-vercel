import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../services/api';

const emptyForm = { name: '', sku: '', cost_price: '', price: '', stock: '', category_id: '', description: '' };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  
  // State untuk melacak input penyesuaian stok tiap produk
  const [adjustments, setAdjustments] = useState({});

  const fetchProducts = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModal(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, sku: p.sku, cost_price: p.cost_price, price: p.price,
      stock: p.stock, category_id: p.category_id || '',
      description: p.description || '',
    });
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, cost_price: Number(form.cost_price), price: Number(form.price), stock: Number(form.stock), category_id: form.category_id || null };
      if (editing) {
        await api.put(`/products/${editing}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  // Fungsi untuk memproses bulk stok masuk atau keluar
  const submitStock = async (type) => {
    const promises = [];
    const keys = Object.keys(adjustments);
    
    let hasValid = false;
    for (const key of keys) {
      const qty = parseInt(adjustments[key], 10);
      if (qty && qty > 0) {
        hasValid = true;
        promises.push(api.post(`/stock/${type}`, { 
            product_id: key, 
            quantity: qty, 
            note: 'Penyesuaian cepat via Inventory' 
        }));
      }
    }

    if (!hasValid) {
        return alert('Masukkan angka lebih dari 0 pada kolom penyesuaian stok produk');
    }

    try {
      await Promise.all(promises);
      setAdjustments({}); // Kosongkan inputan
      fetchProducts(); // Refresh data stok terbaru
    } catch (err) {
      alert('Gagal menyesuaikan sebagian/seluruh stok: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-white">Inventory</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex-1 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl flex flex-col">
        {/* Scroll Container untuk table */}
        <div className="flex-1 overflow-auto rounded-xl">
            <table className="w-full text-sm min-w-[800px]">
            <thead className="sticky top-0 bg-[#1a1a2e] z-10 shadow-sm">
                <tr className="border-b border-[#2d2d4a] text-slate-400">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-center font-medium">Cost</th>
                <th className="px-4 py-3 text-center font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">+/- Stock</th>
                <th className="px-4 py-3 text-center font-medium">Action</th>
                </tr>
            </thead>
            <tbody>
                {products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">No products in inventory</td></tr>
                ) : products.map((p) => (
                <tr key={p.id} className="border-b border-[#2d2d4a] last:border-0 hover:bg-[#12122a] transition-colors">
                    <td className="px-4 py-3 text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-400">{p.category_name || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{formatRp(p.cost_price || 0)}</td>
                    <td className="px-4 py-3 text-center text-slate-200">{formatRp(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.stock <= 5 ? 'text-red-400 font-bold' : 'text-slate-200 font-bold'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="number" 
                        min="0"
                        value={adjustments[p.id] || ''}
                        onChange={(e) => setAdjustments({...adjustments, [p.id]: e.target.value})}
                        placeholder="0"
                        className="w-20 bg-[#12122a] border border-[#2d2d4a] rounded px-2 py-1.5 text-sm text-slate-200 text-right focus:outline-none focus:border-violet-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-violet-600/20 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer">
                        <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Action bar tombol di luar scroll container */}
        <div className="shrink-0 p-4 border-t border-[#2d2d4a] bg-[#12122a] flex items-center justify-end gap-3 rounded-b-xl z-20">
           <button onClick={() => submitStock('in')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer font-semibold shadow-sm shadow-emerald-900/20">
             Stock In
           </button>
           <button onClick={() => submitStock('out')} className="bg-rose-600 hover:bg-rose-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer font-semibold shadow-sm shadow-rose-900/20">
             Stock Out
           </button>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d4a]">
              <h2 className="text-white font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required
                  className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">SKU *</label>
                  <input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} required 
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cost Price *</label>
                  <input type="number" value={form.cost_price} onChange={(e) => setForm({...form, cost_price: e.target.value})} required min="0" 
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Price *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required min="0"
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} min="0" disabled={!!editing}
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm disabled:opacity-50 text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})}
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500">
                    <option value="">- Select -</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                {editing ? 'Save Changes' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
