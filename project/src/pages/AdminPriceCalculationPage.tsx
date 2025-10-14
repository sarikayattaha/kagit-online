import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2, Save, X, Upload, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  product_type: string;
  weight: number;
  dimensions: string;
  sheets_per_package: number;
  ton_price: number;
  currency: string;
}

export default function AdminPriceCalculationPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [addMode, setAddMode] = useState<'single' | 'bulk' | null>(null);
  
  // Toplu ürün ekleme
  const [bulkProduct, setBulkProduct] = useState({
    product_type: '',
    weights: '',
    dimensions: '',
    sheets_per_package: '250',
    ton_price: '',
    currency: 'USD'
  });

  // Tek ürün ekleme
  const [singleProduct, setSingleProduct] = useState({
    product_type: '',
    dimensions: '',
    weight: '',
    sheets_per_package: '250',
    ton_price: '',
    currency: 'USD'
  });

  // Ürün düzenleme
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    product_type: '',
    dimensions: '',
    weight: '',
    sheets_per_package: '',
    ton_price: '',
    currency: ''
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_type, weight, dimensions');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Toplu ürün ekleme
  const addBulkProducts = async () => {
    if (!bulkProduct.product_type || !bulkProduct.weights || !bulkProduct.dimensions || !bulkProduct.ton_price) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      return;
    }

    try {
      const weights = bulkProduct.weights.split(',').map(w => parseFloat(w.trim()));
      const dimensions = bulkProduct.dimensions.split(',').map(d => d.trim());

      const productsToAdd = [];
      for (const weight of weights) {
        for (const dimension of dimensions) {
          productsToAdd.push({
            product_type: bulkProduct.product_type,
            dimensions: dimension,
            weight: weight,
            sheets_per_package: parseInt(bulkProduct.sheets_per_package),
            ton_price: parseFloat(bulkProduct.ton_price),
            currency: bulkProduct.currency
          });
        }
      }

      const { error } = await supabase
        .from('products')
        .insert(productsToAdd);

      if (error) throw error;

      setMessage({ type: 'success', text: `${productsToAdd.length} ürün eklendi!` });
      setBulkProduct({
        product_type: '',
        weights: '',
        dimensions: '',
        sheets_per_package: '250',
        ton_price: '',
        currency: 'USD'
      });
      setAddMode(null);
      fetchProducts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Tek ürün ekleme
  const addSingleProduct = async () => {
    if (!singleProduct.product_type || !singleProduct.dimensions || !singleProduct.weight || !singleProduct.ton_price) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          product_type: singleProduct.product_type,
          dimensions: singleProduct.dimensions,
          weight: parseFloat(singleProduct.weight),
          sheets_per_package: parseInt(singleProduct.sheets_per_package),
          ton_price: parseFloat(singleProduct.ton_price),
          currency: singleProduct.currency
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün eklendi!' });
      setSingleProduct({
        product_type: '',
        dimensions: '',
        weight: '',
        sheets_per_package: '250',
        ton_price: '',
        currency: 'USD'
      });
      setAddMode(null);
      fetchProducts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Ürün düzenleme başlat
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      product_type: product.product_type,
      dimensions: product.dimensions,
      weight: product.weight.toString(),
      sheets_per_package: product.sheets_per_package.toString(),
      ton_price: product.ton_price.toString(),
      currency: product.currency
    });
  };

  // Ürün düzenleme kaydet
  const saveEdit = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          product_type: editForm.product_type,
          dimensions: editForm.dimensions,
          weight: parseFloat(editForm.weight),
          sheets_per_package: parseInt(editForm.sheets_per_package),
          ton_price: parseFloat(editForm.ton_price),
          currency: editForm.currency
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün güncellendi!' });
      setEditingProduct(null);
      fetchProducts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Ürün silme
  const deleteProduct = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün silindi!' });
      fetchProducts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // CSV export
  const exportToCSV = () => {
    const csvContent = [
      ['Ürün Türü', 'Ebat', 'Gramaj', 'Paket Başına Tabaka', 'Ton Fiyatı', 'Döviz'].join(','),
      ...products.map(p => 
        [p.product_type, p.dimensions, p.weight, p.sheets_per_package, p.ton_price, p.currency].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urunler.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // CSV import
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1);
        
        const newProducts = rows
          .filter(row => row.trim())
          .map(row => {
            const [product_type, dimensions, weight, sheets_per_package, ton_price, currency] = row.split(',');
            return {
              product_type: product_type.trim(),
              dimensions: dimensions.trim(),
              weight: parseFloat(weight),
              sheets_per_package: parseInt(sheets_per_package),
              ton_price: parseFloat(ton_price),
              currency: currency.trim()
            };
          });

        const { error } = await supabase
          .from('products')
          .insert(newProducts);

        if (error) throw error;

        setMessage({ type: 'success', text: `${newProducts.length} ürün yüklendi!` });
        fetchProducts();
        setTimeout(() => setMessage(null), 3000);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
        setTimeout(() => setMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 max-w-4xl mx-auto ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Ürün Yönetim Sistemi</h1>
            <p className="text-gray-600 text-center mb-6">Ürünleri yönetin ve toplu ürün yükleyin</p>
            
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => setAddMode(addMode === 'bulk' ? null : 'bulk')}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{addMode === 'bulk' ? 'İptal' : 'Toplu Ürün Ekle'}</span>
              </button>

              <button
                onClick={() => setAddMode(addMode === 'single' ? null : 'single')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{addMode === 'single' ? 'İptal' : 'Tek Ürün Ekle'}</span>
              </button>

              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>CSV İndir</span>
              </button>

              <label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center space-x-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                <span>CSV Yükle</span>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Toplu Ürün Ekleme Formu */}
          {addMode === 'bulk' && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-purple-900 mb-6 text-xl">📦 Toplu Ürün Ekle</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ürün Türü *</label>
                    <input
                      type="text"
                      placeholder="Örn: 1. Hamur, Bristol, Parlak Kuşe"
                      value={bulkProduct.product_type}
                      onChange={(e) => setBulkProduct({...bulkProduct, product_type: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Gramajlar (virgülle ayırın) *</label>
                    <input
                      type="text"
                      placeholder="Örn: 80, 90, 110, 120"
                      value={bulkProduct.weights}
                      onChange={(e) => setBulkProduct({...bulkProduct, weights: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Virgülle ayırarak birden fazla gramaj girebilirsiniz</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Ebatlar (virgülle ayırın) *</label>
                    <input
                      type="text"
                      placeholder="Örn: 57x82, 64x90, 70x100"
                      value={bulkProduct.dimensions}
                      onChange={(e) => setBulkProduct({...bulkProduct, dimensions: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Virgülle ayırarak birden fazla ebat girebilirsiniz</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Paket Başına Tabaka Sayısı *</label>
                    <input
                      type="number"
                      placeholder="Örn: 250"
                      value={bulkProduct.sheets_per_package}
                      onChange={(e) => setBulkProduct({...bulkProduct, sheets_per_package: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ton Fiyatı *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Örn: 850"
                        value={bulkProduct.ton_price}
                        onChange={(e) => setBulkProduct({...bulkProduct, ton_price: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Döviz Cinsi *</label>
                      <select
                        value={bulkProduct.currency}
                        onChange={(e) => setBulkProduct({...bulkProduct, currency: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={addBulkProducts}
                    className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center space-x-2 mt-6"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Toplu Ürün Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tek Ürün Ekleme Formu */}
          {addMode === 'single' && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="font-bold text-indigo-900 mb-6 text-xl">➕ Tek Ürün Ekle</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ürün Türü *</label>
                    <input
                      type="text"
                      placeholder="Örn: 1. Hamur"
                      value={singleProduct.product_type}
                      onChange={(e) => setSingleProduct({...singleProduct, product_type: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ebat (cm) *</label>
                      <input
                        type="text"
                        placeholder="Örn: 70x100"
                        value={singleProduct.dimensions}
                        onChange={(e) => setSingleProduct({...singleProduct, dimensions: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Gramaj (gr/m²) *</label>
                      <input
                        type="number"
                        placeholder="Örn: 80"
                        value={singleProduct.weight}
                        onChange={(e) => setSingleProduct({...singleProduct, weight: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Paket Başına Tabaka Sayısı *</label>
                    <input
                      type="number"
                      placeholder="Örn: 250"
                      value={singleProduct.sheets_per_package}
                      onChange={(e) => setSingleProduct({...singleProduct, sheets_per_package: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ton Fiyatı *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Örn: 850"
                        value={singleProduct.ton_price}
                        onChange={(e) => setSingleProduct({...singleProduct, ton_price: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Döviz Cinsi *</label>
                      <select
                        value={singleProduct.currency}
                        onChange={(e) => setSingleProduct({...singleProduct, currency: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={addSingleProduct}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center space-x-2 mt-6"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Ürünü Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ürün Düzenleme Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-2xl mb-6">✏️ Ürün Düzenle</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ürün Türü *</label>
                    <input
                      type="text"
                      value={editForm.product_type}
                      onChange={(e) => setEditForm({...editForm, product_type: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ebat *</label>
                      <input
                        type="text"
                        value={editForm.dimensions}
                        onChange={(e) => setEditForm({...editForm, dimensions: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Gramaj *</label>
                      <input
                        type="number"
                        value={editForm.weight}
                        onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Paket Başına Tabaka *</label>
                    <input
                      type="number"
                      value={editForm.sheets_per_package}
                      onChange={(e) => setEditForm({...editForm, sheets_per_package: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ton Fiyatı *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.ton_price}
                        onChange={(e) => setEditForm({...editForm, ton_price: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Döviz *</label>
                      <select
                        value={editForm.currency}
                        onChange={(e) => setEditForm({...editForm, currency: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={saveEdit}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>Kaydet</span>
                    </button>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 flex items-center justify-center space-x-2"
                    >
                      <X className="h-5 w-5" />
                      <span>İptal</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ürün Listesi */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Ürün Türü</th>
                  <th className="px-4 py-3 text-left">Ebat</th>
                  <th className="px-4 py-3 text-left">Gramaj</th>
                  <th className="px-4 py-3 text-left">Paket/Tabaka</th>
                  <th className="px-4 py-3 text-left">Ton Fiyatı</th>
                  <th className="px-4 py-3 text-left">Döviz</th>
                  <th className="px-4 py-3 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{product.product_type}</td>
                    <td className="px-4 py-3">{product.dimensions} cm</td>
                    <td className="px-4 py-3">{product.weight} gr/m²</td>
                    <td className="px-4 py-3">{product.sheets_per_package}</td>
                    <td className="px-4 py-3">{product.ton_price}</td>
                    <td className="px-4 py-3">{product.currency}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(product)}
                          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
