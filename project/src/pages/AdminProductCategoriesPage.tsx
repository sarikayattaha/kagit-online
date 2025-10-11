import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export default function AdminProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Kategoriler yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Kategori adı zorunludur' });
      return;
    }

    try {
      setSaving(true);
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) : 0;

      const { error } = await supabase
        .from('product_categories')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim(),
          is_active: formData.is_active,
          display_order: maxOrder + 1,
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Kategori başarıyla eklendi' });
      setFormData({ name: '', description: '', is_active: true });
      setIsAddingNew(false);
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Kategori eklenirken hata oluştu: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category || !category.name.trim()) {
      setMessage({ type: 'error', text: 'Kategori adı zorunludur' });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('product_categories')
        .update({
          name: category.name.trim(),
          description: category.description.trim(),
          is_active: category.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Kategori güncellendi' });
      setEditingId(null);
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Kategori güncellenirken hata oluştu: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye bağlı ürünlerin kategori bağlantısı kaldırılacaktır.')) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Kategori silindi' });
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Kategori silinirken hata oluştu: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newCategories = [...categories];
    const temp = newCategories[index].display_order;
    newCategories[index].display_order = newCategories[index - 1].display_order;
    newCategories[index - 1].display_order = temp;

    try {
      await Promise.all([
        supabase.from('product_categories').update({ display_order: newCategories[index].display_order }).eq('id', newCategories[index].id),
        supabase.from('product_categories').update({ display_order: newCategories[index - 1].display_order }).eq('id', newCategories[index - 1].id),
      ]);
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Sıralama güncellenirken hata oluştu' });
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;

    const newCategories = [...categories];
    const temp = newCategories[index].display_order;
    newCategories[index].display_order = newCategories[index + 1].display_order;
    newCategories[index + 1].display_order = temp;

    try {
      await Promise.all([
        supabase.from('product_categories').update({ display_order: newCategories[index].display_order }).eq('id', newCategories[index].id),
        supabase.from('product_categories').update({ display_order: newCategories[index + 1].display_order }).eq('id', newCategories[index + 1].id),
      ]);
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Sıralama güncellenirken hata oluştu' });
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ürün Kategorileri</h1>
          <p className="text-gray-600">Ürün kategorilerini yönetin, ekleyin veya düzenleyin</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
              disabled={saving}
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Kategori Ekle</span>
            </button>
          </div>

          {isAddingNew && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Kuşe Kağıt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={saving}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kategori açıklaması (opsiyonel)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  disabled={saving}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setFormData({ name: '', description: '', is_active: true });
                  }}
                  disabled={saving}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>İptal</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Sıra</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Kategori Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Açıklama</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Henüz kategori eklenmemiş. Yukarıdaki butona tıklayarak yeni kategori ekleyebilirsiniz.
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || saving}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </button>
                          <span className="text-sm text-gray-600">{index + 1}</span>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === categories.length - 1 || saving}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => {
                              const newCategories = [...categories];
                              newCategories[index].name = e.target.value;
                              setCategories(newCategories);
                            }}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                            disabled={saving}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === category.id ? (
                          <textarea
                            value={category.description}
                            onChange={(e) => {
                              const newCategories = [...categories];
                              newCategories[index].description = e.target.value;
                              setCategories(newCategories);
                            }}
                            rows={2}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                            disabled={saving}
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{category.description || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === category.id ? (
                          <select
                            value={category.is_active ? 'active' : 'inactive'}
                            onChange={(e) => {
                              const newCategories = [...categories];
                              newCategories[index].is_active = e.target.value === 'active';
                              setCategories(newCategories);
                            }}
                            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                            disabled={saving}
                          >
                            <option value="active">Aktif</option>
                            <option value="inactive">Pasif</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === category.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdate(category.id)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              <Save className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                fetchCategories();
                              }}
                              disabled={saving}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingId(category.id)}
                              disabled={saving}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              disabled={saving}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
