import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface AdminA4ProductsPageProps {
  onNavigate: (page: string) => void;
}

interface A4Product {
  id: string;
  brand: string;
  size: string;
  weight: number;
  price_per_box: number;
  vat_rate: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminA4ProductsPage({ onNavigate }: AdminA4ProductsPageProps) {
  const [products, setProducts] = useState<A4Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    brand: '',
    size: 'A4',
    weight: 80,
    price_per_box: 0,
    vat_rate: 20,
    stock_quantity: 0,
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('a4_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('a4_products')
        .insert([formData]);

      if (error) throw error;
      
      alert('Ürün başarıyla eklendi!');
      setShowAddForm(false);
      setFormData({
        brand: '',
        size: 'A4',
        weight: 80,
        price_per_box: 0,
        vat_rate: 20,
        stock_quantity: 0,
        is_active: true
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Ürün eklenirken hata oluştu');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<A4Product>) => {
    try {
      const { error } = await supabase
        .from('a4_products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      fetchProducts();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ürün güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('a4_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Ürün başarıyla silindi!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ürün silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Admin Panele Dön
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">A4 Kağıt Ürünleri</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Ürün Ekle
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Yeni A4 Ürün Ekle</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka
                </label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Mondi, Double A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ebat
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gram
                </label>
                <input
                  type="number"
                  required
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 80, 90, 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Koli Fiyatı (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price_per_box}
                  onChange={(e) => setFormData({ ...formData, price_per_box: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KDV Oranı (%)
                </label>
                <select
                  value={formData.vat_rate}
                  onChange={(e) => setFormData({ ...formData, vat_rate: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>%10</option>
                  <option value={20}>%20</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Miktarı (Koli)
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Aktif</span>
                </label>
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ebat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gram
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Koli Fiyatı (€)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KDV (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="text"
                          defaultValue={product.brand}
                          className="w-full px-2 py-1 border rounded"
                          id={`brand-${product.id}`}
                        />
                      ) : (
                        product.brand
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <select
                          defaultValue={product.size}
                          className="w-full px-2 py-1 border rounded"
                          id={`size-${product.id}`}
                        >
                          <option value="A4">A4</option>
                          <option value="A3">A3</option>
                        </select>
                      ) : (
                        product.size
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          defaultValue={product.weight}
                          className="w-20 px-2 py-1 border rounded"
                          id={`weight-${product.id}`}
                        />
                      ) : (
                        `${product.weight}gr`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={product.price_per_box}
                          className="w-24 px-2 py-1 border rounded"
                          id={`price-${product.id}`}
                        />
                      ) : (
                        `€${product.price_per_box.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <select
                          defaultValue={product.vat_rate}
                          className="w-20 px-2 py-1 border rounded"
                          id={`vat-${product.id}`}
                        >
                          <option value={10}>%10</option>
                          <option value={20}>%20</option>
                        </select>
                      ) : (
                        `%${product.vat_rate}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          defaultValue={product.stock_quantity}
                          className="w-20 px-2 py-1 border rounded"
                          id={`stock-${product.id}`}
                        />
                      ) : (
                        `${product.stock_quantity} koli`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="checkbox"
                          defaultChecked={product.is_active}
                          className="w-4 h-4"
                          id={`active-${product.id}`}
                        />
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const brand = (document.getElementById(`brand-${product.id}`) as HTMLInputElement)?.value;
                              const size = (document.getElementById(`size-${product.id}`) as HTMLSelectElement)?.value;
                              const weight = parseInt((document.getElementById(`weight-${product.id}`) as HTMLInputElement)?.value);
                              const price = parseFloat((document.getElementById(`price-${product.id}`) as HTMLInputElement)?.value);
                              const vat = parseInt((document.getElementById(`vat-${product.id}`) as HTMLSelectElement)?.value);
                              const stock = parseInt((document.getElementById(`stock-${product.id}`) as HTMLInputElement)?.value);
                              const active = (document.getElementById(`active-${product.id}`) as HTMLInputElement)?.checked;
                              
                              handleUpdate(product.id, {
                                brand,
                                size,
                                weight,
                                price_per_box: price,
                                vat_rate: vat,
                                stock_quantity: stock,
                                is_active: active
                              });
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(product.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz ürün eklenmemiş
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
