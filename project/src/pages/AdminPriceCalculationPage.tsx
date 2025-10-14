import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2, Save, X, Calculator, Upload, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductRule {
  id?: string;
  type: string;
  weights: number[];
  common_dimensions: string[];
}

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
  const [activeTab, setActiveTab] = useState<'products' | 'calculate'>('products');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRulesManager, setShowRulesManager] = useState(false);

  const [productRules, setProductRules] = useState<ProductRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newRule, setNewRule] = useState({ type: '', weights: '', dimensions: '' });
  const [editingRule, setEditingRule] = useState<ProductRule | null>(null);
  
  // Manuel ürün ekleme state'leri
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_type: '',
    dimensions: '',
    weight: '',
    sheets_per_package: '250',
    ton_price: '',
    currency: 'USD'
  });

  // Fiyat hesaplama state'leri
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [selectedFormula, setSelectedFormula] = useState('1');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Supabase'den verileri çek
  const fetchProductRules = async () => {
    try {
      const { data, error } = await supabase
        .from('product_rules')
        .select('*')
        .order('type');

      if (error) throw error;
      setProductRules(data || []);
    } catch (error) {
      console.error('Error fetching product rules:', error);
    }
  };

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

  const fetchExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency, rate');

      if (error) throw error;
      
      const rates: Record<string, number> = {};
      data?.forEach((item: any) => {
        rates[item.currency] = item.rate;
      });
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({ USD: 43, EUR: 46, TRY: 1 });
    }
  };

  useEffect(() => {
    fetchProductRules();
    fetchProducts();
    fetchExchangeRates();
  }, []);

  // Ürün türü ekleme
  const addProductRule = async () => {
    if (!newRule.type || !newRule.weights || !newRule.dimensions) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      return;
    }

    try {
      const weights = newRule.weights.split(',').map(w => parseFloat(w.trim()));
      const dimensions = newRule.dimensions.split(',').map(d => d.trim());

      const { error } = await supabase
        .from('product_rules')
        .insert([{ 
          type: newRule.type, 
          weights, 
          common_dimensions: dimensions 
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün türü eklendi!' });
      setNewRule({ type: '', weights: '', dimensions: '' });
      fetchProductRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Ürün türü düzenleme
  const startEditRule = (rule: ProductRule) => {
    setEditingRule(rule);
    setNewRule({
      type: rule.type,
      weights: rule.weights.join(', '),
      dimensions: rule.common_dimensions.join(', ')
    });
  };

  const saveEditedRule = async () => {
    if (!editingRule || !newRule.type || !newRule.weights || !newRule.dimensions) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      return;
    }

    try {
      const weights = newRule.weights.split(',').map(w => parseFloat(w.trim()));
      const dimensions = newRule.dimensions.split(',').map(d => d.trim());

      const { error } = await supabase
        .from('product_rules')
        .update({ 
          type: newRule.type, 
          weights, 
          common_dimensions: dimensions 
        })
        .eq('id', editingRule.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün türü güncellendi!' });
      setEditingRule(null);
      setNewRule({ type: '', weights: '', dimensions: '' });
      fetchProductRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setNewRule({ type: '', weights: '', dimensions: '' });
  };

  // Manuel ürün ekleme
  const addProduct = async () => {
    if (!newProduct.product_type || !newProduct.dimensions || !newProduct.weight || !newProduct.ton_price) {
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Ürün türü silme
  const deleteRule = async (id: string) => {
    if (!confirm('Bu ürün türünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('product_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ürün türü silindi!' });
      fetchProductRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
      }
    };
    reader.readAsText(file);
  };

  // Fiyat hesaplama
  const uniqueProductTypes = [...new Set(products.map(p => p.product_type))];
  const availableDimensions = selectedProductType 
    ? [...new Set(products.filter(p => p.product_type === selectedProductType).map(p => p.dimensions))]
    : [];
  const availableWeights = selectedProductType && selectedDimension
    ? [...new Set(products.filter(p => p.product_type === selectedProductType && p.dimensions === selectedDimension).map(p => p.weight))].sort((a, b) => a - b)
    : [];

  useEffect(() => {
    if (selectedProductType && selectedDimension && selectedWeight) {
      const product = products.find(p => 
        p.product_type === selectedProductType && 
        p.dimensions === selectedDimension && 
        p.weight === selectedWeight
      );
      setSelectedProduct(product || null);
      setCalculatedPrice(null);
    }
  }, [selectedProductType, selectedDimension, selectedWeight, products]);

  const calculatePrice = () => {
    if (!selectedProduct) return;

    const exchange_rate = exchangeRates[selectedProduct.currency] || 1;
    const dims = selectedProduct.dimensions.split('x');
    const length = parseFloat(dims[0]) / 100;
    const width = parseFloat(dims[1]) / 100;
    const weight_kg = selectedProduct.weight / 1000;
    const ton_price_kg = selectedProduct.ton_price / 1000;
    const sheetsPerPackage = selectedProduct.sheets_per_package;

    let result = 0;
    if (selectedFormula === '1') {
      result = length * width * weight_kg * sheetsPerPackage * ton_price_kg * exchange_rate * quantity;
    } else {
      result = length * width * weight_kg * ton_price_kg * exchange_rate * quantity;
    }

    setCalculatedPrice(result);
    setMessage({ type: 'success', text: 'Fiyat hesaplandı!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-2 flex space-x-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📦 Ürün Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('calculate')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'calculate'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🧮 Fiyat Hesaplama
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 max-w-4xl mx-auto ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        {activeTab === 'products' ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Ürün Yönetim Sistemi</h1>
              <p className="text-gray-600 text-center mb-6">Ürün türlerini yönetin ve toplu ürün yükleyin</p>
              
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => setShowRulesManager(!showRulesManager)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg flex items-center space-x-2"
                >
                  <Edit2 className="h-5 w-5" />
                  <span>{showRulesManager ? 'Ürün Listesi' : 'Ürün Türlerini Yönet'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowProductForm(!showProductForm);
                    setShowRulesManager(false);
                  }}
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

            {showRulesManager ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-4">
                    {editingRule ? '✏️ Ürün Türünü Düzenle' : '➕ Yeni Ürün Türü Ekle'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Ürün Türü (örn: Bristol)"
                      value={newRule.type}
                      onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                      className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Gramajlar (örn: 180, 200, 250)"
                      value={newRule.weights}
                      onChange={(e) => setNewRule({...newRule, weights: e.target.value})}
                      className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Ebatlar (örn: 70x100, 64x90)"
                      value={newRule.dimensions}
                      onChange={(e) => setNewRule({...newRule, dimensions: e.target.value})}
                      className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    {editingRule ? (
                      <>
                        <button
                          onClick={saveEditedRule}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center space-x-2"
                        >
                          <Save className="h-5 w-5" />
                          <span>Kaydet</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 flex items-center justify-center space-x-2"
                        >
                          <X className="h-5 w-5" />
                          <span>İptal</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={addProductRule}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center space-x-2"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Ürün Türü Ekle</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Mevcut Ürün Türleri</h3>
                  {productRules.map((rule) => (
                    <div key={rule.id} className="bg-gray-50 border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg mb-2">{rule.type}</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Gramajlar:</strong> {rule.weights.join(', ')} gr/m²
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Ebatlar:</strong> {rule.common_dimensions.join(', ')} cm
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditRule(rule)}
                            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rule.id && deleteRule(rule.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : showProductForm ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-bold text-indigo-900 mb-6 text-xl">➕ Yeni Ürün Ekle</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ürün Türü *</label>
                      <input
                        type="text"
                        placeholder="Örn: 1. Hamur, Bristol, Kuşe"
                        value={newProduct.product_type}
                        onChange={(e) => setNewProduct({...newProduct, product_type: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <label className="block text-sm font-semibold mb-2">Döviz *</label>
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
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Fiyat Hesaplama</h2>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">1. Ürün Türü *</label>
                  <select 
                    value={selectedProductType} 
                    onChange={(e) => { 
                      setSelectedProductType(e.target.value); 
                      setSelectedDimension(''); 
                      setSelectedWeight(null); 
                    }}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Ürün seçiniz</option>
                    {uniqueProductTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">2. Ebat *</label>
                  <select 
                    value={selectedDimension} 
                    onChange={(e) => { 
                      setSelectedDimension(e.target.value); 
                      setSelectedWeight(null); 
                    }}
                    disabled={!selectedProductType} 
                    className="w-full px-4 py-3 border rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500">
                    <option value="">Seçiniz</option>
                    {availableDimensions.map(d => <option key={d} value={d}>{d} cm</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">3. Gramaj *</label>
                  <select 
                    value={selectedWeight || ''} 
                    onChange={(e) => setSelectedWeight(Number(e.target.value))}
                    disabled={!selectedDimension} 
                    className="w-full px-4 py-3 border rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500">
                    <option value="">Seçiniz</option>
                    {availableWeights.map(w => <option key={w} value={w}>{w} gr/m²</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">4. Hesaplama Türü *</label>
                  <select 
                    value={selectedFormula} 
                    onChange={(e) => setSelectedFormula(e.target.value)} 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="1">Paket Fiyatı</option>
                    <option value="2">Tabaka Fiyatı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">5. Miktar *</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))} 
                    min="1"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <button 
                  onClick={calculatePrice} 
                  disabled={!selectedProduct}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-lg">
                  <Calculator className="h-6 w-6" />
                  <span>Fiyat Hesapla</span>
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-bold mb-4 text-lg">Fiyat Özeti</h3>
                {selectedProduct ? (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Ürün Türü</p>
                      <p className="font-bold text-lg">{selectedProduct.product_type}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Ebat</p>
                      <p className="font-bold">{selectedProduct.dimensions} cm</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Gramaj</p>
                      <p className="font-bold">{selectedProduct.weight} gr/m²</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Paket Başına Tabaka</p>
                      <p className="font-bold">{selectedProduct.sheets_per_package} adet</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Ton Fiyatı</p>
                      <p className="font-bold">{selectedProduct.ton_price} {selectedProduct.currency}/ton</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Miktar</p>
                      <p className="font-bold">{quantity} {selectedFormula === '1' ? 'Paket' : 'Tabaka'}</p>
                    </div>
                    {calculatedPrice !== null && (
                      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 mt-4 shadow-lg">
                        <p className="text-sm opacity-90">Toplam Fiyat</p>
                        <p className="text-3xl md:text-4xl font-bold">{calculatedPrice.toFixed(2)} ₺</p>
                        <p className="text-xs opacity-75 mt-2">KDV Dahil Değildir</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Fiyat hesaplamak için formu doldurun</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
