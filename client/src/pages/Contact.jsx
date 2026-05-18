import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { ImagePlus, X, Save, Trash, Plus, Pencil, MessageCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export default function Contact() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  
  // Detail/Edit Modal States
  const [viewingContact, setViewingContact] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editDiscordId, setEditDiscordId] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts');
      setContacts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleUploadClick = (e, contactId) => {
    e.stopPropagation();
    setSelectedContactId(contactId);
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleOpenContact = (c) => {
    setIsNew(false);
    setIsEditing(false);
    setViewingContact(c);
    setEditName(c.name || "");
    setEditDiscord(c.discord || "");
    setEditDiscordId(c.discord_id || "");
    setEditWhatsapp(c.whatsapp || "");
  };

  const handleAddNew = () => {
    setIsNew(true);
    setIsEditing(true);
    setViewingContact({ name: "", discord: "", discord_id: "", whatsapp: "" });
    setEditName("");
    setEditDiscord("");
    setEditDiscordId("");
    setEditWhatsapp("");
  };

  const handleCloseModal = () => {
    setViewingContact(null);
  };

  const handleSaveContact = async () => {
    if (!editName || !editDiscord || !editDiscordId) {
        alert("Nama, Discord Username, dan Discord ID wajib diisi");
        return;
    }
    setIsSaving(true);
    try {
        const payload = { 
            name: editName, 
            discord: editDiscord, 
            discord_id: editDiscordId,
            whatsapp: editWhatsapp 
        };
        
        let savedContact = null;
        if (isNew) {
            const res = await api.post('/contacts', payload);
            savedContact = res.data.data;
        } else {
            const res = await api.put(`/contacts/${viewingContact.id}`, payload);
            savedContact = res.data.data;
        }
        await fetchContacts();
        
        // Return to view mode showing updated data
        setIsNew(false);
        setIsEditing(false);
        setViewingContact(savedContact);
    } catch (err) {
        alert("Gagal menyimpan kontak");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteContact = async (id) => {
      if (window.confirm("Yakin ingin menghapus kontak ini?")) {
        try {
            await api.delete(`/contacts/${id}`);
            await fetchContacts();
            handleCloseModal();
        } catch (err) {
            alert("Gagal menghapus kontak");
        }
      }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedContactId) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingId(selectedContactId);
    try {
      await api.put(`/contacts/${selectedContactId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchContacts(); 
      
      // Update viewing image if it is the current open modal
      if (viewingContact && viewingContact.id === selectedContactId) {
          // Trigger a fetch or optimally we just fetchContacts
          const res = await api.get('/contacts');
          setContacts(res.data.data || []);
          const updatedContact = res.data.data.find(c => c.id === selectedContactId);
          if (updatedContact) setViewingContact(updatedContact);
      }
    } catch (err) {
      console.error('Failed to upload image', err);
      alert('Gagal mengupload gambar.');
    } finally {
      setUploadingId(null);
      setSelectedContactId(null);
      e.target.value = '';
    }
  };

  if (loading && contacts.length === 0) {
    return <div className="flex items-center justify-center p-8 text-slate-400">Loading contacts...</div>;
  }

  // Helper to format WhatsApp number to redirect link (start with 62)
  const formatWaLink = (wa) => {
      if (!wa) return "";
      let clean = wa.replace(/\D/g, "");
      if (clean.startsWith('0')) clean = '62' + clean.substring(1);
      return `https://wa.me/${clean}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Contact Person</h1>
        {user && (
          <button onClick={handleAddNew} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium cursor-pointer">
            <Plus className="w-4 h-4" />
            Add New Contact
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {contacts.map((c) => (
          <div 
            key={c.id} 
            onClick={() => handleOpenContact(c)}
            className="cursor-pointer bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group flex flex-col"
          >
            <div className="relative aspect-square bg-[#12122a] border-b border-[#2d2d4a]">
              {c.image_url ? (
                <img 
                  src={c.image_url} 
                  alt={c.name} 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 border-2 border-dashed border-[#2d2d4a] m-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-lg">
                  No Image
                </div>
              )}
              
              {user && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={(e) => handleUploadClick(e, c.id)}
                  disabled={uploadingId === c.id}
                  className="bg-violet-600 hover:bg-violet-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm transition-transform scale-95 group-hover:scale-100 shadow-xl cursor-pointer disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  {uploadingId === c.id ? 'Uploading...' : 'Update Image'}
                </button>
              </div>
              )}
            </div>
            
            <div className="p-3 flex-1 flex flex-col text-center justify-center">
              <h3 className="text-md font-semibold text-slate-200 line-clamp-1">{c.name}</h3>
              <div className="text-xs text-violet-400 mt-1">{c.discord}</div>
            </div>
          </div>
        ))}

        {contacts.length === 0 && !loading && (
           <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-[#2d2d4a] rounded-xl">
             No Contact Found. Click "Add New Contact" button above.
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

      {/* Detail/Edit Modal */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#2d2d4a]">
                <h2 className="text-lg font-bold text-white leading-tight">
                    {isNew ? 'Add New Contact' : (isEditing ? 'Edit Contact' : 'Contact Info')}
                </h2>
                <div className="flex items-center gap-2">
                    {user && !isEditing && !isNew && (
                        <button 
                         onClick={() => setIsEditing(true)} 
                         className="text-slate-400 hover:text-white transition-colors bg-[#12122a] p-1.5 rounded-lg border border-[#2d2d4a]"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors p-1.5">
                    <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            {/* Image Banner Section */}
            {(!isEditing && viewingContact.image_url) && (
                 <div className="w-full aspect-square bg-[#12122a] border-b border-[#2d2d4a] relative">
                    <img 
                    src={viewingContact.image_url} 
                    alt={viewingContact.name} 
                    className="w-full h-full object-cover absolute inset-0"
                    />
                </div>
            )}
            
            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {isEditing ? (
                    // --- EDIT MODE ---
                    <>
                        <div>
                        <label className="text-sm font-medium text-slate-300 mb-1 block">Name *</label>
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                        </div>
                        <div>
                        <label className="text-sm font-medium text-slate-300 mb-1 block">Discord Username *</label>
                        <input
                            value={editDiscord}
                            onChange={(e) => setEditDiscord(e.target.value)}
                            placeholder="Username (Ex: user.name_67)"
                            className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                        </div>
                        <div>
                        <label className="text-sm font-medium text-slate-300 mb-1 block">Discord User ID *</label>
                        <input
                            value={editDiscordId}
                            onChange={(e) => setEditDiscordId(e.target.value)}
                            placeholder="ID Number (Ex: 123456789012345678)"
                            className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                        </div>
                        <div>
                        <label className="text-sm font-medium text-slate-300 mb-1 block">WhatsApp</label>
                        <input
                            value={editWhatsapp}
                            onChange={(e) => setEditWhatsapp(e.target.value)}
                            placeholder="08123456789"
                            className="w-full bg-[#12122a] border border-[#2d2d4a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                        </div>
                        
                        <div className="flex gap-3 mt-4">
                            <button 
                            onClick={handleSaveContact}
                            disabled={isSaving}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 "
                            >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            {!isNew && (
                                <button 
                                onClick={() => handleDeleteContact(viewingContact.id)}
                                className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white py-2 px-4 rounded-lg transition-colors border border-red-500/20"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    // --- VIEW MODE ---
                    <>
                        <div className="text-center mb-2">
                           <h3 className="text-2xl font-bold text-white">{viewingContact.name}</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <a 
                                href={`https://discordapp.com/users/${viewingContact.discord_id}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 bg-[#12122a] p-3 rounded-lg border border-[#2d2d4a] hover:border-indigo-500 transition-colors group"
                            >
                                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Discord</div>
                                    <div className="text-white font-medium">{viewingContact.discord}</div>
                                </div>
                            </a>

                            {viewingContact.whatsapp && (
                                <a 
                                    href={formatWaLink(viewingContact.whatsapp)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-3 bg-[#12122a] p-3 rounded-lg border border-[#2d2d4a] hover:border-emerald-500 transition-colors group"
                                >
                                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">WhatsApp</div>
                                        <div className="text-white font-medium">{viewingContact.whatsapp}</div>
                                    </div>
                                </a>
                            )}
                        </div>
                    </>
                )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
