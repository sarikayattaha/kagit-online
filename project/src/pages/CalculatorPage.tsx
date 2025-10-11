import { useState, useEffect } from 'react';
import { Calculator, Package, Ruler, Weight, User, Mail, Phone, Building, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  weight: number;
  dimensions: string;
  min_order_quantity: number;
  product_type: string;
  available_sizes: string[];
  ton_price: number;
}

interface CalculatorPageProps {
  onNavigate?: (page: string) => void;
}

interface OrderFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export default function CalculatorPage({ onNavigate }: CalculatorPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedProductData, setSelectedProductData] = useState<Product | null>(null);
  const [sizeType, setSizeType] = useState<'standard' | 'custom'>('custom');
  const [standardSize, setStandardSize] = useState<string>('');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [availableWeights, setAvailableWeights] = useState<number[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string>('');

  const [orderFormData, setOrderFormData] = useState<OrderFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct);
      setSelectedProductData(product || null);

      if (product) {
        fetchAvailableWeights(product.product_type);
        setStandardSize('');
        setSelectedWeight('');
        setSizeType('custom');
      }
    } else {
      setSelectedProductData(null);
      setAvailableWeights([]);
    }
  }, [selectedProduct, products]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, weight, dimensions, min_order_quantity, product_type, available_sizes, ton_price')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Ürünler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAvailableWeights = async (productType: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('weight')
        .eq('product_type', productType)
        .eq('is_active', true)
        .gt('weight', 0);

      if (error) throw error;

      const weights = [...new Set(data?.map(p => p.weight) || [])].sort((a, b) => a - b);
      setAvailableWeights(weights);
    } catch (error) {
      console.error('Error loading weights:', error);
    }
  };

  const getAvailableDimensions = (): string[] => {
    if (!selectedProductData) return [];

    if (selectedProductData.available_sizes && selectedProductData.available_sizes.length > 0) {
      return selectedProductData.available_sizes;
    }

    if (selectedProductData.dimensions) {
      return [selectedProductData.dimensions];
    }

    return [];
  };

  const handleCalculate = async () => {
    setError('');

    if (!selectedProduct) {
      setError('Lütfen ürün türü seçin');
      return;
    }

    if (sizeType === 'standard' && !standardSize) {
      setError('Lütfen standart ebat seçin');
      return;
    }

    if (sizeType === 'custom' && (!customWidth || !customHeight)) {
      setError('Lütfen özel ebat bilgilerini girin');
      return;
    }

    if (!selectedWeight) {
      setError('Lütfen gramaj seçin');
      return;
    }

    if (!quantity) {
      setError('Lütfen adet girin');
      return;
    }

    const qty = parseFloat(quantity);
    const gramajValue = parseFloat(selectedWeight);

    if (isNaN(qty) || qty <= 0) {
      setError('Lütfen geçerli bir adet girin');
      return;
    }

    if (isNaN(gramajValue) || gramajValue <= 0) {
      setError('Lütfen geçerli bir gramaj seçin');
      return;
    }

    if (selectedProductData && qty < selectedProductData.min_order_quantity) {
      setError(`Minimum sipariş adedi ${selectedProductData.min_order_quantity}`);
      return;
    }

    if (sizeType === 'custom') {
      const width = parseFloat(customWidth);
      const height = parseFloat(customHeight);

      if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
        setError('Lütfen geçerli ölçüler girin');
        return;
      }
    }

    setLoading(true);

    try {
      const product = products.find(p => p.id === selectedProduct);

      const payload = {
        urun_turu: product?.name,
        ebat: sizeType === 'standard' ? standardSize : `${customHeight}x${customWidth}`,
        ebat_tipi: sizeType,
        gramaj: gramajValue,
        adet: qty
      };

      const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_CALCULATOR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Fiyat hesaplama başarısız oldu');
      }

      const data = await response.json();

      if (data.fiyat !== undefined) {
        setCalculatedPrice(data.fiyat);
      } else {
        throw new Error('Geçersiz cevap formatı');
      }
    } catch (err) {
      console.error('Error calculating price:', err);
      setError('Fiyat hesaplanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedProduct('');
    setSelectedProductData(null);
    setSizeType('custom');
    setStandardSize('');
    setCustomWidth('');
    setCustomHeight('');
    setSelectedWeight('');
    setAvailableWeights([]);
    setQuantity('');
    setCalculatedPrice(null);
    setError('');
    setShowOrderForm(false);
    setOrderSuccess(false);
    setTrackingCode('');
    setOrderFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
    });
  };

  const handleOrderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateOrderForm = (): boolean => {
    if (!orderFormData.name.trim()) {
      setError('Lütfen ad soyad girin');
      return false;
    }

    if (!orderFormData.email.trim()) {
      setError('Lütfen e-posta adresi girin');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderFormData.email)) {
      setError('Lütfen geçerli bir e-posta adresi girin');
      return false;
    }

    if (!orderFormData.phone.trim()) {
      setError('Lütfen telefon numarası girin');
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateOrderForm()) {
      return;
    }

    setOrderLoading(true);

    try {
      const product = products.find(p => p.id === selectedProduct);

      const payload = {
        ad_soyad: orderFormData.name,
        email: orderFormData.email,
        telefon: orderFormData.phone,
        sirket_adi: orderFormData.company || null,
        urun_turu: product?.name,
        ebat: sizeType === 'standard' ? standardSize : `${customHeight}x${customWidth}`,
        gramaj: parseFloat(selectedWeight),
        adet: parseFloat(quantity),
        toplam_fiyat: calculatedPrice
      };

      const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Sipariş gönderilemedi');
      }

      const data = await response.json();

      if (data.takip_kodu) {
        setTrackingCode(data.takip_kodu);
      } else {
        setTrackingCode('#' + Math.random().toString(36).substr(2, 9).toUpperCase());
      }

      setOrderSuccess(true);
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Sipariş gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setOrderLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Siparişiniz Alındı!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Siparişiniz başarıyla oluşturuldu. En kısa sürede size dönüş yapacağız.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Takip Kodunuz</p>
              <p className="text-3xl font-bold text-blue-600">{trackingCode}</p>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleReset}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Yeni Hesaplama
              </button>
              <button
                onClick={() => onNavigate && onNavigate('orders')}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Sipariş Takip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const availableDimensions = getAvailableDimensions();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Calculator className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fiyat Hesaplama</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ürün, ebat ve miktar bilgilerinizi girerek anlık fiyat teklifi alın.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesaplama Formu</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    1. Ürün Türü <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={showOrderForm}
                  >
                    <option value="">Ürün seçiniz</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProductData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProductData.product_type && (
                        <div>
                          <span className="text-gray-600">Tür:</span>
                          <span className="font-semibold ml-2">{selectedProductData.product_type}</span>
                        </div>
                      )}
                      {selectedProductData.min_order_quantity > 0 && (
                        <div>
                          <span className="text-gray-600">Min Sipariş:</span>
                          <span className="font-semibold ml-2">{selectedProductData.min_order_quantity} adet</span>
                        </div>
                      )}
                      {selectedProductData.ton_price > 0 && (
                        <div>
                          <span className="text-gray-600">Ton Fiyatı:</span>
                          <span className="font-semibold ml-2">{selectedProductData.ton_price} ₺</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedProduct && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        2. Ebat Türü <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSizeType('custom')}
                          disabled={showOrderForm}
                          className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                            sizeType === 'custom'
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${showOrderForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Özel Kesim
                        </button>
                        <button
                          onClick={() => setSizeType('standard')}
                          disabled={showOrderForm || availableDimensions.length === 0}
                          className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                            sizeType === 'standard'
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${(showOrderForm || availableDimensions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Standart Ebat
                        </button>
                      </div>
                    </div>

                    {sizeType === 'custom' ? (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            3. Özel Ebat (cm) <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="number"
                                value={customHeight}
                                onChange={(e) => setCustomHeight(e.target.value)}
                                placeholder="Yükseklik"
                                disabled={showOrderForm}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
                                step="0.1"
                              />
                            </div>
                            <div className="relative">
                              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="number"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(e.target.value)}
                                placeholder="Genişlik"
                                disabled={showOrderForm}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const height = parseFloat(customHeight) || 0;
                          const width = parseFloat(customWidth) || 0;
                          const hasValidDimensions = height > 0 && width > 0;

                          if (!hasValidDimensions) return null;

                          const maxDimension = Math.max(width, height);
                          const scale = maxDimension > 0 ? 300 / maxDimension : 1;
                          const scaledWidth = width * scale;
                          const scaledHeight = height * scale;

                          return (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                              <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">
                                Ölçü Önizlemesi
                              </h3>
                              <div className="flex items-center justify-center">
                                <div className="relative">
                                  <svg
                                    width={scaledWidth + 80}
                                    height={scaledHeight + 80}
                                    className="overflow-visible"
                                  >
                                    <rect
                                      x="40"
                                      y="40"
                                      width={scaledWidth}
                                      height={scaledHeight}
                                      fill="#E5E7EB"
                                      stroke="#3B82F6"
                                      strokeWidth="3"
                                    />

                                    <line
                                      x1="40"
                                      y1="20"
                                      x2={40 + scaledWidth}
                                      y2="20"
                                      stroke="#3B82F6"
                                      strokeWidth="2"
                                      markerStart="url(#arrowStart)"
                                      markerEnd="url(#arrowEnd)"
                                    />
                                    <text
                                      x={40 + scaledWidth / 2}
                                      y="15"
                                      textAnchor="middle"
                                      className="fill-blue-600 font-semibold text-sm"
                                    >
                                      {width} cm
                                    </text>

                                    <line
                                      x1={scaledWidth + 60}
                                      y1="40"
                                      x2={scaledWidth + 60}
                                      y2={40 + scaledHeight}
                                      stroke="#3B82F6"
                                      strokeWidth="2"
                                      markerStart="url(#arrowStart)"
                                      markerEnd="url(#arrowEnd)"
                                    />
                                    <text
                                      x={scaledWidth + 70}
                                      y={40 + scaledHeight / 2}
                                      textAnchor="start"
                                      className="fill-blue-600 font-semibold text-sm"
                                    >
                                      {height} cm
                                    </text>

                                    <defs>
                                      <marker
                                        id="arrowStart"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="5"
                                        refY="5"
                                        orient="auto"
                                      >
                                        <polygon points="10,5 5,2 5,8" fill="#3B82F6" />
                                      </marker>
                                      <marker
                                        id="arrowEnd"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="5"
                                        refY="5"
                                        orient="auto"
                                      >
                                        <polygon points="0,5 5,2 5,8" fill="#3B82F6" />
                                      </marker>
                                    </defs>
                                  </svg>
                                </div>
                              </div>
                              <p className="text-center text-sm text-gray-600 mt-4">
                                Kesim Ölçüsü: <span className="font-semibold text-gray-900">{height} x {width} cm</span>
                              </p>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          3. Standart Ebat <span className="text-red-500">*</span>
                        </label>
                        {availableDimensions.length > 0 ? (
                          <div className="grid grid-cols-3 gap-3">
                            {availableDimensions.map((size) => (
                              <button
                                key={size}
                                onClick={() => setStandardSize(size)}
                                disabled={showOrderForm}
                                className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                                  standardSize === size
                                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                                    : 'border-gray-300 hover:border-gray-400'
                                } ${showOrderForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {size} cm
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                            Bu ürün için standart ebat bulunmuyor. Lütfen özel kesim seçeneğini kullanın.
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        4. Gramaj (gr/m²) <span className="text-red-500">*</span>
                      </label>
                      {availableWeights.length > 0 ? (
                        <div className="grid grid-cols-4 gap-3">
                          {availableWeights.map((weight) => (
                            <button
                              key={weight}
                              onClick={() => setSelectedWeight(weight.toString())}
                              disabled={showOrderForm}
                              className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                                selectedWeight === weight.toString()
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : 'border-gray-300 hover:border-gray-400'
                              } ${showOrderForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {weight}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            value={selectedWeight}
                            onChange={(e) => setSelectedWeight(e.target.value)}
                            placeholder="Örnek: 350"
                            disabled={showOrderForm}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
                            min="1"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        5. Adet <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Örnek: 1000"
                          disabled={showOrderForm}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
                          min={selectedProductData?.min_order_quantity || 1}
                        />
                      </div>
                      {selectedProductData && selectedProductData.min_order_quantity > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Minimum sipariş adedi: {selectedProductData.min_order_quantity} adet
                        </p>
                      )}
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                    {error}
                  </div>
                )}

                {!showOrderForm && selectedProduct && (
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleCalculate}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Hesaplanıyor...' : 'Fiyat Hesapla'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Sıfırla
                    </button>
                  </div>
                )}

                {showOrderForm && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
                    <form onSubmit={handleSubmitOrder} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={orderFormData.name}
                            onChange={handleOrderFormChange}
                            placeholder="Örnek: Ahmet Yılmaz"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          E-posta <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={orderFormData.email}
                            onChange={handleOrderFormChange}
                            placeholder="ornek@email.com"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Telefon <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={orderFormData.phone}
                            onChange={handleOrderFormChange}
                            placeholder="0555 123 45 67"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Şirket Adı
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="company"
                            value={orderFormData.company}
                            onChange={handleOrderFormChange}
                            placeholder="İsteğe bağlı"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4 pt-4">
                        <button
                          type="submit"
                          disabled={orderLoading}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {orderLoading ? 'Gönderiliyor...' : 'Sipariş Ver'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOrderForm(false)}
                          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fiyat Özeti</h3>

              {calculatedPrice !== null ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Toplam Fiyat</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ₺{calculatedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ürün:</span>
                      <span className="font-semibold">
                        {products.find(p => p.id === selectedProduct)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ebat:</span>
                      <span className="font-semibold">
                        {sizeType === 'standard' ? standardSize : `${customHeight}x${customWidth}`} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gramaj:</span>
                      <span className="font-semibold">{selectedWeight} gr/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adet:</span>
                      <span className="font-semibold">{quantity}</span>
                    </div>
                  </div>

                  {!showOrderForm && (
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Sipariş Ver
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Fiyat hesaplamak için formu doldurun
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
