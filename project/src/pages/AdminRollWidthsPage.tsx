import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RollWidth {
  id: string;
  width: number;
  active: boolean;
  created_at: string;
}

export default function AdminRollWidthsPage() {
  const [rollWidths, setRollWidths] = useState<RollWidth[]>([]);
  const [newWidth, setNewWidth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRollWidths();
  }, []);

  const loadRollWidths = async () => {
    try {
      const { data, error } = await supabase
        .from('roll_widths')
        .select('*')
        .order('width', { ascending: true });

      if (error) throw error;
      setRollWidths(data || []);
    } catch (err) {
      setError('Bobin genişlikleri yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const width = parseInt(newWidth);

    if (!width || width < 50) {
      setError('Lütfen geçerli bir genişlik girin (minimum 50 cm)');
      return;
    }

    if (rollWidths.some(rw => rw.width === width)) {
      setError('Bu genişlik zaten mevcut');
      return;
    }

    try {
      const { error } = await supabase
        .from('roll_widths')
        .insert([{ width, active: true }]);

      if (error) throw error;

      setSuccess('Bobin genişliği başarıyla eklendi');
      setNewWidth('');
      setError('');
      loadRollWidths();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Bobin genişliği eklenirken hata oluştu');
      console.error(err);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('roll_widths')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Durum başarıyla güncellendi');
      loadRollWidths();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Durum güncellenirken hata oluştu');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu bobin genişliğini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roll_widths')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Bobin genişliği başarıyla silindi');
      loadRollWidths();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Bobin genişliği silinirken hata oluştu');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bobin Genişlikleri Yönetimi</h1>
          <p className="text-gray-600">Özel kesim için kullanılabilecek bobin genişliklerini yönetin</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Yeni Bobin Genişliği Ekle</h2>
          <div className="flex gap-4">
            <input
              type="number"
              value={newWidth}
              onChange={(e) => setNewWidth(e.target.value)}
              placeholder="Genişlik (cm)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              min="50"
              step="5"
            />
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Ekle</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Not: Bobin genişlikleri genellikle 50cm'den başlar ve 5'er cm artarak gider.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Mevcut Bobin Genişlikleri</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {rollWidths.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Henüz bobin genişliği eklenmemiş
              </div>
            ) : (
              rollWidths.map((rw) => (
                <div key={rw.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-gray-900">{rw.width} cm</div>
                    {rw.active ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <X className="h-3 w-3 mr-1" />
                        Pasif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(rw.id, rw.active)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rw.active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {rw.active ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      onClick={() => handleDelete(rw.id)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Pasif yapılan bobin genişlikleri özel kesim sayfasında görünmez.
            Silinen genişlikler kalıcı olarak silinir ve geri alınamaz.
          </p>
        </div>
      </div>
    </div>
  );
}
