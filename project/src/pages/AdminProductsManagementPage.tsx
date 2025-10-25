import { useState, useEffect, useRef } from 'react';
import { Package, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, Image, Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  currency: string;
  category_id: string;
  image_url: string;
  min_order_quantity: number;
  available_sizes: string[];
  specifications: Record<string, string>;
  is_active: boolean;
  display_order: number;
  product_type: string;
  dimensions: string;
  weight: number;
  sale_unit: string;
  ton_price: number;
  sheets_per_package: number;
  sale_type: string;
  vat_rate: number; // ✅ YENİ: KDV oranı
}

interface Category {
  id: string;
  name: string;
}

interface CSVRow {
  name: string;
  product_type: string;
  dimensions: string;
  weight: string;
  min_order_quantity: string;
  currency: string;
  sale_unit: string;
  base_price: string;
  ton_price: string;
  sheets_per_package?: string;
  sale_type?: string;
  description?: string;
  category?: string;
  vat_rate?: string; // ✅ YENİ: CSV'de KDV oranı
}

export default function AdminProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    base_price: 0,
    currency: 'USD',
    category_id: '',
    image_url: '',
    min_order_quantity: 1,
    available_sizes: [],
    specifications: {},
    is_active: true,
    display_order: 0,
    product_type: '',
    dimensions: '',
    weight: 0,
    sale_unit: 'package',
    ton_price: 0,
    sheets_per_package: 250,
    sale_type: 'package',
    vat_rate: 20, // ✅ YENİ: Varsayılan KDV %20
  });

  const [sizesInput, setSizesInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error loading products: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: unknown) {
      console.error('Error loading categories:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setSizesInput(product.available_sizes.join(', '));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Product deleted successfully' });
      fetchProducts();
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error deleting product: ' + err.message });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setSaving(true);

      const sizesArray = sizesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const productData = {
        name: formData.name,
        description: formData.description || '',
        base_price: formData.base_price || 0,
        currency: formData.currency || 'USD',
        category_id: formData.category_id,
        image_url: formData.image_url || '',
        min_order_quantity: formData.min_order_quantity || 1,
        available_sizes: sizesArray,
        specifications: formData.specifications || {},
        is_active: formData.is_active !== false,
        display_order: formData.display_order || 0,
        product_type: formData.product_type || '',
        dimensions: formData.dimensions || '',
        weight: formData.weight || 0,
        sale_unit: formData.sale_unit || 'package',
        ton_price: formData.ton_price || 0,
        sheets_per_package: formData.sheets_per_package || 250,
        sale_type: formData.sale_type || 'package',
        vat_rate: formData.vat_rate || 20, // ✅ YENİ: KDV oranı
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Product updated successfully' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Product added successfully' });
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error saving product: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: 0,
      currency: 'USD',
      category_id: '',
      image_url: '',
      min_order_quantity: 1,
      available_sizes: [],
      specifications: {},
      is_active: true,
      display_order: 0,
      product_type: '',
      dimensions: '',
      weight: 0,
      sale_unit: 'package',
      ton_price: 0,
      sheets_per_package: 250,
      sale_type: 'package',
      vat_rate: 20, // ✅ YENİ
    });
    setSizesInput('');
    setSpecKey('');
    setSpecValue('');
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (categories.length === 0) {
              setMessage({ 
                type: 'error', 
                text: 'No categories found. Please create a category first.' 
              });
              setUploading(false);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              return;
            }

            const defaultCategory = categories[0].id;

            const productsToInsert = results.data
              .filter(row => row.name && row.name.trim() !== '')
              .map((row) => {
                let categoryId = defaultCategory;
                if (row.category) {
                  const matchedCategory = categories.find(
                    c => c.name.toLowerCase() === row.category.toLowerCase()
                  );
                  categoryId = matchedCategory?.id || defaultCategory;
                }

                return {
                  name: row.name.trim(),
                  product_type: row.product_type?.trim() || '',
                  dimensions: row.dimensions?.trim() || '',
                  weight: !isNaN(parseFloat(row.weight)) ? parseFloat(row.weight) : 0,
                  min_order_quantity: !isNaN(parseInt(row.min_order_quantity)) ? parseInt(row.min_order_quantity) : 1,
                  currency: row.currency?.trim() || 'USD',
                  sale_unit: row.sale_unit?.trim() || 'package',
                  base_price: !isNaN(parseFloat(row.base_price)) ? parseFloat(row.base_price) : 0,
                  ton_price: !isNaN(parseFloat(row.ton_price)) ? parseFloat(row.ton_price) : 0,
                  sheets_per_package: row.sheets_per_package && !isNaN(parseInt(row.sheets_per_package)) 
                    ? parseInt(row.sheets_per_package) 
                    : 250,
                  sale_type: row.sale_type?.trim() || 'package',
                  description: row.description?.trim() || '',
                  category_id: categoryId,
                  image_url: '',
                  available_sizes: [],
                  specifications: {},
                  is_active: true,
                  display_order: 0,
                  vat_rate: row.vat_rate && !isNaN(parseInt(row.vat_rate)) ? parseInt(row.vat_rate) : 20, // ✅ YENİ: CSV'den KDV oranı
                };
              });

            if (productsToInsert.length === 0) {
              setMessage({ type: 'error', text: 'No valid products found in CSV file' });
              setUploading(false);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              return;
            }

            const { error } = await supabase
              .from('products')
              .insert(productsToInsert);

            if (error) throw error;

            setMessage({ 
              type: 'success', 
              text: `Successfully imported ${productsToInsert.length} products` 
            });
            fetchProducts();
          } catch (error: unknown) {
            const err = error as Error;
            setMessage({ type: 'error', text: 'Error importing products: ' + err.message });
          } finally {
            setUploading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        },
        error: (error) => {
          setMessage({ type: 'error', text: 'Error parsing CSV file: ' + error.message });
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      });
    } catch (error: unknown) {
      const err = error as Error;
      setMessage({ type: 'error', text: 'Error reading file: ' + err.message });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: 'Sample Product',
        product_type: '1. Hamur',
        dimensions: '70x100',
        weight: '80',
        min_order_quantity: '1',
        currency: 'USD',
        sale_unit: 'package',
        base_price: '100',
        ton_price: '2000',
        sheets_per_package: '250',
        sale_type: 'package',
        description: 'Sample product description',
        category: 'Paper',
        vat_rate: '20' // ✅ YENİ: Örnek CSV'de KDV
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_products.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addSpecification = () => {
    if (specKey && specValue) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specKey]: specValue
        }
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="mt-2 text-gray-600">Manage your product inventory</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className={message.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setEditingProduct(null);
                  resetForm();
                }
              }}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Product</span>
            </button>

            <div className="flex-1 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className={`flex-1 border-2 border-dashed border-gray-300 rounded-lg py-3 px-4 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  {uploading ? 'Uploading...' : 'Import CSV'}
                </span>
              </label>

              <button
                onClick={downloadSampleCSV}
                className="border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                title="Download Sample CSV"
              >
                <FileSpreadsheet className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Sample</span>
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Product Type</label>
                  <input
                    type="text"
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g. 1. Hamur, Bristol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Dimensions</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g. 70x100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Weight (g/m²)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g. 80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>

                {/* ✅ YENİ: KDV Oranı Seçimi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">KDV Oranı (%)</label>
                  <select
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({ ...formData, vat_rate: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="10">%10</option>
                    <option value="20">%20</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Ton Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ton_price}
                    onChange={(e) => setFormData({ ...formData, ton_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sheets per Package</label>
                  <input
                    type="number"
                    value={formData.sheets_per_package}
                    onChange={(e) => setFormData({ ...formData, sheets_per_package: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Min Order Quantity</label>
                  <input
                    type="number"
                    value={formData.min_order_quantity}
                    onChange={(e) => setFormData({ ...formData, min_order_quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sale Unit</label>
                  <select
                    value={formData.sale_unit}
                    onChange={(e) => setFormData({ ...formData, sale_unit: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="package">Package</option>
                    <option value="sheet">Sheet</option>
                    <option value="ton">Ton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sale Type</label>
                  <select
                    value={formData.sale_type}
                    onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="package">Package</option>
                    <option value="sheet">Sheet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Image URL</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter image URL"
                  />
                  {formData.image_url && (
                    <div className="w-12 h-12 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Available Sizes</label>
                <input
                  type="text"
                  value={sizesInput}
                  onChange={(e) => setSizesInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="e.g. 70x100, 64x90, 50x70 (comma separated)"
                />
                <p className="mt-1 text-xs text-gray-500">Enter sizes separated by commas</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Specifications</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Property name"
                    />
                    <input
                      type="text"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Value"
                    />
                    <button
                      onClick={addSpecification}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>
                  {formData.specifications && Object.keys(formData.specifications).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {Object.entries(formData.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">
                            <strong>{key}:</strong> {String(value)}
                          </span>
                          <button
                            onClick={() => removeSpecification(key)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm font-semibold text-gray-900">Active</label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{saving ? 'Saving...' : 'Save Product'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Products ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No products found</p>
              <p className="text-sm text-gray-500">Add your first product to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Dimensions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">KDV</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Sale Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.product_type || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.dimensions || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.weight ? `${product.weight} g/m²` : '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {product.base_price.toFixed(2)} {product.currency}
                      </td>
                      {/* ✅ YENİ: KDV Oranı Kolonu */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.vat_rate === 10
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          %{product.vat_rate}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{product.sale_unit}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
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
