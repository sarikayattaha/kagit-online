import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2, Save, X, Calculator } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'upload' | 'calculate'>('calculate');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRulesManager, setShowRulesManager] = useState(false);
  const [loading, setLoading] = useState(false);

  const [productRules, setProductRules] = useState<ProductRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newRule, setNewRule] = useState({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD' });
  const [editingRule, setEditingRule] = useState<ProductRule | null>(null);

  const exchangeRates = { USD: 43, EUR: 46, TRY: 1 };

  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [selectedFormula, setSelectedFormula] = useState('1');

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
      setMessage({ type: 'error', text: 'Ürün türleri yüklenemedi!' });
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

  useEffect(() => {
    fetchProductRules();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (productRules.length > 0) {
      generateProductsFromRules();
    }
  }, [productRules]);

  const generateProductsFromRules = async () => {
    try {
      const newProducts: any[] = [];
      productRules.forEach(rule => {
        rule.weights.forEach(weight => {
          rule.common_dimensions.forEach(dimension => {
            newProducts.push({
              product_type: rule.type,
              weight,
              dimensions: dimension,
              sheets_per_package: 250,
              ton_price: 850,
              currency: 'USD'
            });
          });
        });
      });

      if (newProducts.length > 0) {
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('products').insert(newProducts);
        if (error) throw error;
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error generating products:', error);
    }
  };

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

    const dims = selectedProduct.dimensions.split('x');
    const length = parseFloat(dims[0]) / 100;
    const width = parseFloat(dims[1]) / 100;
    const weight_kg = selectedProduct.weight / 1000;
    const ton_price_kg = selectedProduct.ton_price / 1000;
    const exchange_rate = exchangeRates[selectedProduct.currency as keyof typeof exchangeRates] || 1;

    let result = 0;
    if (selectedFormula === '1') {
      result = length * width * weight_kg * selectedProduct.sheets_per_package * ton_price_kg * exchange_rate;
    } else {
      result = length * width * weight_kg * ton_price_kg * exchange_rate;
    }

    setCalculatedPrice(result * quantity);
    setMessage({ type: 'success', text: 'Fiyat hesaplandı!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const addNewRule = async () => {
    if (!newRule.type || !newRule.weights || !newRule.tonPrice) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const weights = newRule.weights.split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w)).sort((a, b) => a - b);
      const dimensions = newRule.dimensions ? newRule.dimensions.split(',').map(d => d.trim()) : ['70x100'];

      const { error } = await supabase
        .from('product_rules')
        .upsert({
          type: newRule.type,
          weights,
          common_dimensions: dimensions
        }, { onConflict: 'type' });

      if (error) throw error;

      await fetchProductRules();
      setNewRule({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD' });
      setMessage({ type: 'success', text: 'Ürün eklendi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error adding rule:', error);
      setMessage({ type: 'error', text: 'Ürün eklenirken hata oluştu!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string, ruleType: string) => {
    if (!confirm(`"${ruleType}" ürün türünü silmek istediğinizden emin misiniz?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      await fetchProductRules();
      setMessage({ type: 'success', text: 'Ürün türü silindi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting rule:', error);
      setMessage({ type: 'error', text: 'Silme işlemi başarısız!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const startEditRule = (rule: ProductRule) => {
    setEditingRule(rule);
    setNewRule({
      type: rule.type,
      weights: rule.weights.join(', '),
      dimensions: rule.common_dimensions.join(', '),
      tonPrice: '',
      currency: 'USD'
    });
  };

  const saveEditedRule = async () => {
    if (!newRule.weights || !editingRule) {
      setMessage({ type: 'error', text: 'Gramajlar zorunludur!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const weights = newRule.weights.split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w)).sort((a, b) => a - b);
      const dimensions = newRule.dimensions ? newRule.dimensions.split(',').map(d => d.trim()) : ['70x100'];

      const { error } = await supabase
        .from('product_rules')
        .update({
          weights,
          common_dimensions: dimensions,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRule.id);

      if (error) throw error;

      await fetchProductRules();
      setEditingRule(null);
      setNewRule({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD' });
      setMessage({ type: 'success', text: 'Kural güncellendi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating rule:', error);
      setMessage({ type: 'error', text: 'Güncelleme başarısız!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setNewRule({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD' });
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

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-2 flex space-x-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 md:px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'upload' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              📤 Ürün Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('calculate')}
              className={`px-6 md:px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'calculate' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              🧮 Fiyat Hesaplama
            </button>
          </div>
        </div>

        {activeTab === 'upload' ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Ürün Yönetimi</h1>
              <button
                onClick={() => setShowRulesManager(!showRulesManager)}
                className="bg-purple-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-3 mx-auto">
                <Edit2 className="h-5 w-5 md:h-6 md:w-6" />
                <span>{showRulesManager ? 'Listeye Dön' : 'Ürün Türlerini Yönet'}</span>
              </button>
            </div>

            {showRulesManager && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRulesManager(false)}
                    disabled={loading}
                    className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition-all shadow-lg flex items-center space-x-2 font-semibold disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    <span>Listeye Dön</span>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
                  <h3 className="font-bold text-blue-900 mb-4">
                    {editingRule ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün Ekle'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <input 
                      type="text" 
                      value={newRule.type} 
                      onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                      className="px-4 py-2 border rounded-lg" 
                      placeholder="Ürün Türü"
                      disabled={!!editingRule || loading}
                    />
                    <input 
                      type="text" 
                      value={newRule.weights} 
                      onChange={(e) => setNewRule({ ...newRule, weights: e.target.value })}
                      className="px-4 py-2 border rounded-lg" 
                      placeholder="Gramajlar (70,80)"
                      disabled={loading}
                    />
                    <input 
                      type="text" 
                      value={newRule.dimensions} 
                      onChange={(e) => setNewRule({ ...newRule, dimensions: e.target.value })}
                      className="px-4 py-2 border rounded-lg" 
                      placeholder="Ebatlar (70x100)"
                      disabled={loading}
                    />
                    <input 
                      type="number" 
                      value={newRule.tonPrice} 
                      onChange={(e) => setNewRule({ ...newRule, tonPrice: e.target.value })}
                      className="px-4 py-2 border rounded-lg" 
                      placeholder="Ton Fiyatı"
                      disabled={loading}
                    />
                    <select 
                      value={newRule.currency} 
                      onChange={(e) => setNewRule({ ...newRule, currency: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                      disabled={loading}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {editingRule ? (
                      <>
                        <button 
                          onClick={saveEditedRule}
                          disabled={loading}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
                          <Save className="h-4 w-4" /><span>Kaydet</span>
                        </button>
                        <button 
                          onClick={cancelEdit}
                          disabled={loading}
                          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50">
                          <X className="h-4 w-4" /><span>İptal</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={addNewRule}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50">
                        <Plus className="h-4 w-4" /><span>Ekle</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg border">
                  <div className="p-4 border-b">
                    <h3 className="font-bold">Ürün Türleri ({productRules.length})</h3>
                  </div>
                  <div className="divide-y">
                    {productRules.map((rule) => (
                      <div key={rule.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{rule.type}</h4>
                          <p className="text-sm text-gray-600">Gramajlar: {rule.weights.join(', ')} gr</p>
                          <p className="text-sm text-gray-600">Ebatlar: {rule.common_dimensions.join(', ')} cm</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEditRule(rule)}
                            disabled={loading}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors disabled:opacity-50"
                            title="Düzenle">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteRule(rule.id!, rule.type)}
                            disabled={loading}
                            className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50"
                            title="Sil">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!showRulesManager && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xl">Toplam Ürün Sayısı: {products.length}</h3>
                  <button
                    onClick={() => setShowRulesManager(true)}
                    className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-all flex items-center space-x-2 font-semibold shadow-md"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Türleri Yönet</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {uniqueProductTypes.map(type => (
                      <div key={type} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <h4 className="font-semibold text-lg mb-2">{type}</h4>
                        <p className="text-gray-600 text-sm">
                          {products.filter(p => p.product_type === type).length} ürün
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">🧮 Fiyat Hesaplama</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">1. Ürün Türü *</label>
                  <select 
                    value={selectedProductType} 
                    onChange={(e) => { 
                      setSelectedProductType(e.target.value); 
                      setSelectedDimension(''); 
                      setSelectedWeight(null); 
                    }}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Seçiniz</option>
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
                    className="w-full px-4 py-3 border rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                    className="w-full px-4 py-3 border rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Seçiniz</option>
                    {availableWeights.map(w => <option key={w} value={w}>{w} gr/m²</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">4. Hesaplama Türü *</label>
                  <select 
                    value={selectedFormula} 
                    onChange={(e) => setSelectedFormula(e.target.value)} 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>

                <button 
                  onClick={calculatePrice} 
                  disabled={!selectedProduct}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all">
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
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Ürün seçimi yapın</p>
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
