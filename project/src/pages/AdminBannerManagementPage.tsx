import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Plus, Trash2, Image as ImageIcon, Eye, EyeOff, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminBannerManagementPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newBanner, setNewBanner] = useState({ title: '', image_url: '' });
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setMessage({ type: 'error', text: 'Banner\'lar yüklenemedi!' });
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Dosya adını temizle ve benzersiz yap
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Dosyayı yükle
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Public URL al
      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Görsel yüklenirken hata oluştu!' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Dosya boyutu 5MB\'dan küçük olmalıdır!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Sadece görsel dosyaları yükleyebilirsiniz!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setNewBanner({ ...newBanner, image_url: imageUrl });
      setMessage({ type: 'success', text: 'Görsel yüklendi!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const addBanner = async () => {
    if (!newBanner.image_url) {
      setMessage({ type: 'error', text: 'Görsel URL\'si veya dosya yüklemesi zorunludur!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order_index)) : 0;
      
      const { error } = await supabase
        .from('banners')
        .insert([{
          title: newBanner.title || null,
          image_url: newBanner.image_url,
          order_index: maxOrder + 1,
          is_active: true
        }]);

      if (error) throw error;

      await fetchBanners();
      setNewBanner({ title: '', image_url: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setMessage({ type: 'success', text: 'Banner eklendi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error adding banner:', error);
      setMessage({ type: 'error', text: 'Banner eklenirken hata oluştu!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (id: string, imageUrl: string) => {
    if (!confirm('Bu banner\'ı silmek istediğinizden emin misiniz?')) return;

    setLoading(true);
    try {
      // Eğer Supabase storage'dan yüklenmiş bir görselse, onu da sil
      if (imageUrl.includes('supabase.co/storage')) {
        const path = imageUrl.split('/public/')[1];
        if (path) {
          await supabase.storage.from('banners').remove([`public/${path}`]);
        }
      }

      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchBanners();
      setMessage({ type: 'success', text: 'Banner silindi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting banner:', error);
      setMessage({ type: 'error', text: 'Silme işlemi başarısız!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await fetchBanners();
      setMessage({ type: 'success', text: 'Durum güncellendi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Güncelleme başarısız!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === banners.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentBanner = banners[currentIndex];
    const targetBanner = banners[newIndex];

    setLoading(true);
    try {
      await supabase
        .from('banners')
        .update({ order_index: targetBanner.order_index })
        .eq('id', currentBanner.id);

      await supabase
        .from('banners')
        .update({ order_index: currentBanner.order_index })
        .eq('id', targetBanner.id);

      await fetchBanners();
    } catch (error) {
      console.error('Error updating order:', error);
      setMessage({ type: 'error', text: 'Sıralama güncellenemedi!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <ImageIcon className="h-16 w-16 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Banner Yönetimi</h1>
            <p className="text-gray-600">Ana sayfa slider banner'larını yönetin</p>
          </div>

          {/* Yeni Banner Ekleme */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-blue-900 mb-4">➕ Yeni Banner Ekle</h3>
            
            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMode('file')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  uploadMode === 'file' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📁 Dosyadan Yükle
              </button>
              <button
                onClick={() => setUploadMode('url')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  uploadMode === 'url' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔗 URL ile Ekle
              </button>
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                value={newBanner.title} 
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" 
                placeholder="Başlık (opsiyonel)"
                disabled={loading || uploading}
              />

              {uploadMode === 'file' ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading || uploading}
                    className="w-full px-4 py-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
                  />
                  <p className="text-sm text-gray-500">Maksimum dosya boyutu: 5MB</p>
                </div>
              ) : (
                <input 
                  type="url" 
                  value={newBanner.image_url} 
                  onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg" 
                  placeholder="Görsel URL'si (örn: https://example.com/image.jpg)"
                  disabled={loading || uploading}
                />
              )}

              {newBanner.image_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
                  <img 
                    src={newBanner.image_url} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/1920x600/CCCCCC/666666?text=Görsel+Yüklenemedi';
                    }}
                  />
                </div>
              )}

              <button 
                onClick={addBanner}
                disabled={loading || uploading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50">
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Banner Ekle</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Banner Listesi */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-bold">Mevcut Banner'lar ({banners.length})</h3>
            </div>
            <div className="divide-y">
              {banners.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Henüz banner eklenmemiş
                </div>
              ) : (
                banners.map((banner, index) => (
                  <div key={banner.id} className="p-4 hover:bg-gray-50">
                    <div className="flex gap-4">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title || 'Banner'} 
                        className="w-48 h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x200/CCCCCC/666666?text=Görsel+Yüklenemedi';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">
                          {banner.title || 'Banner ' + (index + 1)}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 break-all line-clamp-2">{banner.image_url}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {banner.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                          <span className="text-sm text-gray-500">Sıra: {banner.order_index}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => moveOrder(banner.id, 'up')}
                          disabled={loading || index === 0}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                          title="Yukarı Taşı">
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => moveOrder(banner.id, 'down')}
                          disabled={loading || index === banners.length - 1}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                          title="Aşağı Taşı">
                          <ChevronDown className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => toggleActive(banner.id, banner.is_active)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title={banner.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                          {banner.is_active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                        <button 
                          onClick={() => deleteBanner(banner.id, banner.image_url)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Sil">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
