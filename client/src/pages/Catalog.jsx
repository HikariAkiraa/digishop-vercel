import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { ImagePlus, X, Save } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export default function Catalog() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Product Detail Modal States
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
  
  const handleUploadClick = (e, productId) => {
    e.stopPropagation();
    setSelectedProductId(productId);
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleOpenProduct = (p) => {
    setViewingProduct(p);
    setEditDescription(p.description || "");
  };

  const handleCloseModal = () => {
    setViewingProduct(null);
    setEditDescription("");
  };

  const handleSaveDescription = async () => {
    if (!viewingProduct) return;
    setIsSavingDesc(true);
    try {
        await api.put(`/products/${viewingProduct.id}`, {
            ...viewingProduct,
            description: editDescription
        });
        setProducts(products.map(p => p.id === viewingProduct.id ? {...p, description: editDescription} : p));
        setViewingProduct({...viewingProduct, description: editDescription});
    } catch (err) {
        alert("Gagal menyimpan deskripsi");
    } finally {
        setIsSavingDesc(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProductId) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingId(selectedProductId);
    try {
      await api.put(`/products/${selectedProductId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProducts(); // Refresh to get the new image URL
    } catch (err) {
      console.error('Failed to upload image', err);
      alert('Gagal mengupload gambar. Pastikan ukuran di bawah 2MB.');
    } finally {
      setUploadingId(null);
      setSelectedProductId(null);
      e.target.value = ''; // Reset input
    }
  };

  if (loading && products.length === 0) {
    return <div className="flex items-center justify-center p-8 text-slate-400">Loading catalog...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Product Catalog</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <div 
            key={p.id} 
            onClick={() => handleOpenProduct(p)}
            className="cursor-pointer bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group flex flex-col"
          >
            <div className="relative aspect-square bg-[#12122a] border-b border-[#2d2d4a]">
              {p.image_url ? (
                <img 
                  src={p.image_url} 
                  alt={p.name} 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 border-2 border-dashed border-[#2d2d4a] m-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-lg">
                  No Image
                </div>
              )}
              
              {/* Overlay for uploading */}
              {user && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={(e) => handleUploadClick(e, p.id)}
                  disabled={uploadingId === p.id}
                  className="bg-violet-600 hover:bg-violet-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm transition-transform scale-95 group-hover:scale-100 shadow-xl cursor-pointer disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  {uploadingId === p.id ? 'Uploading...' : 'Update Image'}
                </button>
              </div>
              )}
              
              {/* Stock Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold leading-none shadow-md ${p.stock <= 5 ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                {p.stock} in stock
              </div>
            </div>
            
            <div className="p-3 flex-1 flex flex-col">
              <div className="text-xs text-violet-400 font-mono mb-1">{p.sku}</div>
              <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug flex-1">{p.name}</h3>
              <div className="mt-2 text-md font-bold text-emerald-400">
                {formatRp(p.price)}
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && !loading && (
           <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-[#2d2d4a] rounded-xl">
             No Product. Try adding via Inventory.
           </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Product Detail Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-[#12122a] border-r border-[#2d2d4a] relative min-h-[250px] md:min-h-[auto]">
              {viewingProduct.image_url ? (
                <img 
                  src={viewingProduct.image_url} 
                  alt={viewingProduct.name} 
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 absolute inset-0">
                  <ImagePlus className="w-12 h-12 opacity-50 mb-2" />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-6 flex flex-col max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-violet-400 font-mono mb-1">{viewingProduct.sku}</div>
                  <h2 className="text-xl font-bold text-white leading-tight">{viewingProduct.name}</h2>
                </div>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="bg-[#12122a] px-3 py-2 rounded-lg border border-[#2d2d4a] flex-1">
                  <div className="text-xs text-slate-400 mb-1">Price</div>
                  <div className="font-bold text-emerald-400">{formatRp(viewingProduct.price)}</div>
                </div>
                <div className="bg-[#12122a] px-3 py-2 rounded-lg border border-[#2d2d4a] flex-1">
                  <div className="text-xs text-slate-400 mb-1">Stock</div>
                  <div className={`font-bold ${viewingProduct.stock <= 5 ? 'text-red-400' : 'text-white'}`}>
                    {viewingProduct.stock} unit
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Description <span className="text-slate-500 font-normal"></span>
                </label>
                {user ? (
                   <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add description here..."
                    className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 flex-1 resize-y min-h-[120px]"
                  />
                ) : (
                   <div className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-4 py-3 text-slate-300 flex-1 min-h-[120px] whitespace-pre-wrap">
                      {viewingProduct.description || "No description."}
                   </div>
                )}
                
                {user && (
                <button 
                  onClick={handleSaveDescription}
                  disabled={isSavingDesc}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingDesc ? 'Saving...' : 'Save Description'}
                </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
