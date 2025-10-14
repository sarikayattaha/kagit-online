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
  
  // Manuel ürün ekleme
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_type: '',
    dimensions: '',
    weight: '',
    sheets_per_package: '250',
    ton_price: '',
    currency: 'USD'
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_type, weight');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Manuel ürün ekleme
  const addProduct = async () => {
    if (!newProduct.product_type || !newProduct.dimensions || !newProduct.weight || !newProduct.ton_price || !newProduct.sheets_per_package) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          product_type: newProduct.product_type,
          dimensions: newProduct.dimensions,
          weight: parseFloat(newProduct.weight),
          sheets_per_package: parseInt(newProduct.sheets_per_package),
          ton_price: parseFloat(newProduct.ton_price),
          currency: newProduct.currency
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün eklendi!' });
      setNewProduct({
        product_type: '',
        dimensions: '',
        weight: '',
        sheets_per_package: '250',
        ton_price: '',
        currency: 'USD'
      });
      setShowProductForm(false);
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
        [p.product_type, p.dimensions, p.weight, p.sheets_per_package || 250, p.ton_price, p.currency].join(',')
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
        const rows = text.split('\n').slice(1); // İlk satırı atla (başlık)
        
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
            <p className="text-gray-600 text-center mb-6">Ürün türlerini yönetin ve toplu ürün yükleyin</p>
            
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{showProductForm ? 'Listeye Dön' : 'Yeni Ürün Ekle'}</span>
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

          {showProductForm ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="font-bold text-indigo-900 mb-6 text-xl">➕ Yeni Ürün Ekle</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ürün Türü *</label>
                    <input
                      type="text"
                      placeholder="Örn: 1. Hamur, Bristol, Parlak Kuşe"
                      value={newProduct.product_type}
                      onChange={(e) => setNewProduct({...newProduct, product_type: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Ebat (cm) *</label>
                    <input
                      type="text"
                      placeholder="Örn: 70x100"
                      value={newProduct.dimensions}
                      onChange={(e) => setNewProduct({...newProduct, dimensions: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Gramaj (gr/m²) *</label>
                    <input
                      type="number"
                      placeholder="Örn: 80"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Paket Başına Tabaka Sayısı *</label>
                    <input
                      type="number"
                      placeholder="Örn: 250"
                      value={newProduct.sheets_per_package}
                      onChange={(e) => setNewProduct({...newProduct, sheets_per_package: e.target.value})}
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
                        value={newProduct.ton_price}
                        onChange={(e) => setNewProduct({...newProduct, ton_price: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Döviz Cinsi *</label>
                      <select
                        value={newProduct.currency}
                        onChange={(e) => setNewProduct({...newProduct, currency: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={addProduct}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center space-x-2 mt-6"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Ürünü Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
