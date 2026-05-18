import { QrCode as QrIcon } from 'lucide-react';

export default function QrCode() {
  // Menggunakan file QR statis lokal dari folder public
  const qrUrl = `/qrcode.png`;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <QrIcon className="w-5 h-5 text-violet-400" />
          Store QRIS
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center pb-12">
        {/* Hanya menampilkan gambar murni tanpa card/text tambahan */}
        <img 
          src={qrUrl} 
          alt="Official QRIS" 
          className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl" 
        />
      </div>
    </div>
  );
}
