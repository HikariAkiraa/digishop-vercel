import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setError(''); setModal(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, description: c.description || '' }); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/categories/${editing}`, form);
      } else {
        await api.post('/categories', form);
      }
      setModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Categories</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
            <tr className="border-b border-[#2d2d4a] text-slate-400">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-slate-500">Belum ada kategori</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="border-b border-[#2d2d4a] last:border-0 hover:bg-[#12122a] transition-colors">
                <td className="px-4 py-3 text-slate-200">{c.name}</td>
                <td className="px-4 py-3 text-slate-400">{c.description || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-violet-600/20 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
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

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d4a]">
              <h2 className="text-white font-semibold">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required
                  className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                {editing ? 'Save' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
