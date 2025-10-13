import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2, Save, X, Package } from 'lucide-react';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRulesManager, setShowRulesManager] = useState(false);
  const [loading, setLoading] = useState(false);

  const [productRules, setProductRules] = useState<ProductRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newRule, setNewRule] = useState({ 
    type: '', 
    weights: '', 
    dimensions: '', 
    tonPrice: '', 
    currency: 'USD',
    sheetsPerPackage: '250'
  });
  const [editingRule, setEditingRule] = useState<ProductRule | null>(null);

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
              sheets_per_package: parseInt(newRule.sheetsPerPackage) || 250,
              ton_price: parseFloat(newRule.tonPrice) || 850,
              currency: newRule.currency
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

  const addNewRule = async () => {
    if (!newRule.type || !newRule.weights || !newRule.tonPrice) {
      setMessage({ type: 'error', text: 'Ürün türü, gramajlar ve ton fiyatı zorunludur!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const weights = newRule.weights.split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w)).sort((a, b) => a - b);
      const dimensions = newRule.dimensions ? newRule.dimensions.split(',').map(d => d.trim()) : ['70x100'];
      const sheetsPerPackage = parseInt(newRule.sheetsPerPackage) || 250;
      const tonPrice = parseFloat(newRule.tonPrice);

      // Önce product_rules'a ekle
      const { error: ruleError } = await supabase
        .from('product_rules')
        .upsert({
          type: newRule.type,
          weights,
          common_dimensions: dimensions
        }, { onConflict: 'type' });

      if (ruleError) throw ruleError;

      // Sonra products'a ekle
      const productsToInsert: any[] = [];
      weights.forEach(weight => {
        dimensions.forEach(dimension => {
          productsToInsert.push({
            product_type: newRule.type,
            weight,
            dimensions: dimension,
            sheets_per_package: sheetsPerPackage,
            ton_price: tonPrice,
            currency: newRule.currency
          });
        });
      });

      if (productsToInsert.length > 0) {
        const { error: productError } = await supabase.from('products').insert(productsToInsert);
        if (productError) throw productError;
      }

      await fetchProductRules();
      await fetchProducts();
      setNewRule({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD', sheetsPerPackage: '250' });
      setMessage({ type: 'success', text: 'Ürün başarıyla eklendi!' });
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
      // Önce products'tan sil
      await supabase.from('products').delete().eq('product_type', ruleType);
      
      // Sonra product_rules'tan sil
      const { error } = await supabase.from('product_rules').delete().eq('id', ruleId);
      if (error) throw error;

      await fetchProductRules();
      await fetchProducts();
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
      currency: 'USD',
      sheetsPerPackage: '250'
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
      setNewRule({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD', sheetsPerPackage: '250' });
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
    setNewRule({ type: '', weights: '', dimensions: '', tonPrice: '', currency: 'USD', sheetsPerPackage: '250' });
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
              <Package className="h-16 w-16 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ürün Yönetimi</h1>
            <p className="text-gray-600">Ürün türlerini, gramajları ve ebatları yönetin</p>
          </div>

          {!showRulesManager ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl">Toplam Ürün Sayısı: {products.length}</h3>
                <button
                  onClick={() => setShowRulesManager(true)}
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-all flex items-center space-x-2 font-semibold shadow-md"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Ürün Türlerini Yönet</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {uniqueProductTypes.map(type => (
                    <div key={type} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-lg mb-2">{type}</h4>
                      <p className="text-gray-600 text-sm">
                        {products.filter(p => p.product_type === type).length} ürün varyasyonu
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
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
                  {editingRule ? '✏️ Ürün Türünü Düzenle' : '➕ Yeni Ürün Türü Ekle'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  <input 
                    type="text" 
                    value={newRule.type} 
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                    className="px-4 py-2 border rounded-lg" 
                    placeholder="Ürün Türü (örn: 1.Hamur)"
                    disabled={!!editingRule || loading}
                  />
                  <input 
                    type="text" 
                    value={newRule.weights} 
                    onChange={(e) => setNewRule({ ...newRule, weights: e.target.value })}
                    className="px-4 py-2 border rounded-lg" 
                    placeholder="Gramajlar (70,80,90)"
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
                    value={newRule.sheetsPerPackage} 
                    onChange={(e) => setNewRule({ ...newRule, sheetsPerPackage: e.target.value })}
                    className="px-4 py-2 border rounded-lg" 
                    placeholder="Paket/Tabaka"
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
                  <h3 className="font-bold">Kayıtlı Ürün Türleri ({productRules.length})</h3>
                </div>
                <div className="divide-y">
                  {productRules.map((rule) => (
                    <div key={rule.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{rule.type}</h4>
                        <p className="text-sm text-gray-600">Gramajlar: {rule.weights.join(', ')} gr/m²</p>
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
        </div>
      </div>
    </div>
  );
}
