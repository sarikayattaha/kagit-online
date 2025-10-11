import { useState, useEffect } from 'react';
import { Calculator, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Formula {
  id: string;
  name: string;
  formula: string;
  description: string;
  variables: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  formula_id: string | null;
}

export default function AdminFormulaManagementPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Formula>>({
    name: '',
    formula: '',
    description: '',
    variables: {},
    is_active: true,
  });

  const [varKey, setVarKey] = useState('');
  const [varDesc, setVarDesc] = useState('');

  useEffect(() => {
    fetchFormulas();
    fetchProducts();
  }, []);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('price_formulas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFormulas(data || []);
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error loading formulas: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, formula_id')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: unknown) {
      console.error('Error loading products:', error);
    }
  };

  const handleEdit = (formula: Formula) => {
    setEditingFormula(formula);
    setFormData(formula);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const productsUsingFormula = products.filter(p => p.formula_id === id);

    if (productsUsingFormula.length > 0) {
      const productNames = productsUsingFormula.map(p => p.name).join(', ');
      if (!confirm(`This formula is used by: ${productNames}. Are you sure you want to delete it? Products will have no formula assigned.`)) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to delete this formula?')) {
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('price_formulas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Formula deleted successfully' });
      fetchFormulas();
      fetchProducts();
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error deleting formula: ' + err.message });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.formula) {
      setMessage({ type: 'error', text: 'Please fill in formula name and expression' });
      return;
    }

    try {
      setSaving(true);

      const formulaData = {
        name: formData.name,
        formula: formData.formula,
        description: formData.description || '',
        variables: formData.variables || {},
        is_active: formData.is_active !== false,
      };

      if (editingFormula) {
        const { error } = await supabase
          .from('price_formulas')
          .update(formulaData)
          .eq('id', editingFormula.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Formula updated successfully' });
      } else {
        const { error } = await supabase
          .from('price_formulas')
          .insert([formulaData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Formula added successfully' });
      }

      setShowForm(false);
      setEditingFormula(null);
      resetForm();
      fetchFormulas();
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error saving formula: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      formula: '',
      description: '',
      variables: {},
      is_active: true,
    });
    setVarKey('');
    setVarDesc('');
  };

  const addVariable = () => {
    if (varKey && varDesc) {
      setFormData({
        ...formData,
        variables: {
          ...(formData.variables || {}),
          [varKey]: varDesc,
        },
      });
      setVarKey('');
      setVarDesc('');
    }
  };

  const removeVariable = (key: string) => {
    const newVars = { ...(formData.variables || {}) };
    delete newVars[key];
    setFormData({ ...formData, variables: newVars });
  };

  const handleProductFormulaChange = async (productId: string, formulaId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ formula_id: formulaId || null })
        .eq('id', productId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Product formula updated successfully' });
      fetchProducts();
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error updating product formula: ' + err.message });
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
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Formula Management</h1>
            <p className="text-gray-600">Create and manage price calculation formulas</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingFormula(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Formula</span>
          </button>
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

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFormula ? 'Edit Formula' : 'Add New Formula'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingFormula(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Formula Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="e.g. Standard Paper Price Formula"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Optional description of what this formula calculates"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Formula Expression <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
                  placeholder="e.g. (width * height * weight * quantity * usd_rate) / 1000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use variables like: width, height, weight, quantity, usd_rate, eur_rate
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Variables & Descriptions</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={varKey}
                      onChange={(e) => setVarKey(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Variable name (e.g., width)"
                    />
                    <input
                      type="text"
                      value={varDesc}
                      onChange={(e) => setVarDesc(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Description (e.g., Paper width in cm)"
                    />
                    <button
                      onClick={addVariable}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>
                  {formData.variables && Object.keys(formData.variables).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {Object.entries(formData.variables).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">
                            <strong className="font-mono text-blue-600">{key}:</strong> {value}
                          </span>
                          <button
                            onClick={() => removeVariable(key)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <label className="text-sm font-semibold text-gray-900">Active</label>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{saving ? 'Saving...' : 'Save Formula'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingFormula(null);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Formulas ({formulas.length})</h2>
            </div>

            {formulas.length === 0 ? (
              <div className="p-12 text-center">
                <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No formulas found</p>
                <p className="text-sm text-gray-500">Add your first formula to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {formulas.map((formula) => (
                  <div key={formula.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{formula.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            formula.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {formula.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {formula.description && (
                          <p className="text-sm text-gray-600 mt-1">{formula.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(formula)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(formula.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Formula:</p>
                      <code className="text-sm text-gray-900 font-mono break-all">{formula.formula}</code>
                    </div>

                    {formula.variables && Object.keys(formula.variables).length > 0 && (
                      <div className="text-xs text-gray-600">
                        <p className="font-semibold mb-1">Variables:</p>
                        <div className="space-y-1">
                          {Object.entries(formula.variables).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-mono text-blue-600">{key}</span>: {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-3">
                      Products using this formula: {products.filter(p => p.formula_id === formula.id).length}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Product Formulas</h2>
              <p className="text-sm text-gray-600 mt-1">Assign formulas to products</p>
            </div>

            {products.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600 mb-2">No products found</p>
                <p className="text-sm text-gray-500">Add products first to assign formulas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <div key={product.id} className="p-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {product.name}
                    </label>
                    <select
                      value={product.formula_id || ''}
                      onChange={(e) => handleProductFormulaChange(product.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    >
                      <option value="">No formula assigned</option>
                      {formulas.filter(f => f.is_active).map((formula) => (
                        <option key={formula.id} value={formula.id}>
                          {formula.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Formula Information</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Available Variables:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">width</code> - Paper width in cm</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">height</code> - Paper height in cm</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">weight</code> - Paper weight in g/m²</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">quantity</code> - Order quantity</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">ton_price</code> - Product ton price (₺/ton)</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">usd_rate</code> - Current USD exchange rate (from exchange rates)</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">eur_rate</code> - Current EUR exchange rate (from exchange rates)</li>
            </ul>
            <p className="mt-3"><strong>Custom Cut Variables (only for custom cut formulas):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">cutting_fee</code> - Cutting fee per unit (set manually in formula)</li>
              <li><code className="bg-blue-100 px-2 py-0.5 rounded">waste_rate</code> - Waste percentage (e.g. 0.05 for 5% waste)</li>
            </ul>
            <p className="mt-3"><strong>Example Standard Formula:</strong></p>
            <code className="block bg-blue-100 px-3 py-2 rounded mt-2">
              (width * height * weight * quantity * ton_price) / 1000000
            </code>
            <p className="mt-3"><strong>Example Custom Cut Formula:</strong></p>
            <code className="block bg-blue-100 px-3 py-2 rounded mt-2">
              ((width * height * weight * quantity * ton_price) / 1000000) * (1 + waste_rate) + (cutting_fee * quantity)
            </code>
            <p className="mt-3 text-xs"><strong>Note:</strong> When creating formulas for custom cut, you must define cutting_fee and waste_rate as variables with actual numeric values.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
