import { useState, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle } from 'lucide-react';
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

interface ExchangeRate {
  currency: string;
  rate: number;
}

interface RollWidth {
  id: string;
  width: number;
  is_active: boolean;
}

export default function CalculatorPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [rollWidths, setRollWidths] = useState<RollWidth[]>([]);

  const [sizeType, setSizeType] = useState<'standard' | 'custom'>('standard');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedRollWidth, setSelectedRollWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customSheets, setCustomSheets] = useState('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [packageQuantity, setPackageQuantity] = useState(1); // Paket adeti
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [selectedFormula, setSelectedFormula] = useState('1');

  const fetchExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency, rate');

      if (error) throw error;
      
      const rates: Record<string, number> = {};
      data?.forEach((item: ExchangeRate) => {
        rates[item.currency] = item.rate;
      });
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({ USD: 43, EUR: 46, TRY: 1 });
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

  const fetchRollWidths = async () => {
    try {
      const { data, error } = await supabase
        .from('roll_widths')
        .select('*')
        .eq('is_active', true)
        .order('width');

      if (error) throw error;
      setRollWidths(data || []);
    } catch (error) {
      console.error('Error fetching roll widths:', error);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    fetchProducts();
    fetchRollWidths();
  }, []);

  const uniqueProductTypes = [...new Set(products.map(p => p.product_type))];
  
  // Ana ürün türlerini grupla
  const mainProductTypes = uniqueProductTypes.reduce((acc, type) => {
    // Ana ürün türünü belirle
    let mainType = '';
    if (type.includes('Hamur')) {
      mainType = '1. Hamur';
    } else if (type.includes('Kuşe') && !type.includes('Karton')) {
      mainType = 'Kuşe';
    } else if (type.includes('Karton') || type.includes('Bristol')) {
      mainType = 'Kuşeli Karton';
    } else {
      mainType = type;
    }
    
    if (!acc.includes(mainType)) {
      acc.push(mainType);
    }
    return acc;
  }, [] as string[]);
  
  const availableDimensions = selectedProductType 
    ? [...new Set(products.filter(p => {
        // Ana ürün türüne göre filtrele
        if (selectedProductType === '1. Hamur') {
          return p.product_type.includes('Hamur');
        } else if (selectedProductType === 'Kuşe') {
          return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton');
        } else if (selectedProductType === 'Kuşeli Karton') {
          return p.product_type.includes('Karton') || p.product_type.includes('Bristol');
        }
        return p.product_type === selectedProductType;
      }).map(p => p.dimensions))]
    : [];
    
  const availableWeights = selectedProductType
    ? [...new Set(products.filter(p => {
        // Ana ürün türüne göre filtrele
        if (selectedProductType === '1. Hamur') {
          return p.product_type.includes('Hamur');
        } else if (selectedProductType === 'Kuşe') {
          return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton');
        } else if (selectedProductType === 'Kuşeli Karton') {
          return p.product_type.includes('Karton') || p.product_type.includes('Bristol');
        }
        return p.product_type === selectedProductType;
      }).map(p => p.weight))].sort((a, b) => a - b)
    : [];

  useEffect(() => {
    if (selectedProductType && selectedWeight) {
      let product;
      if (sizeType === 'standard' && selectedDimension) {
        // Ana ürün türüne göre uygun ürünü bul
        product = products.find(p => {
          const matchesDimension = p.dimensions === selectedDimension;
          const matchesWeight = p.weight === selectedWeight;
          
          if (selectedProductType === '1. Hamur') {
            return p.product_type.includes('Hamur') && matchesDimension && matchesWeight;
          } else if (selectedProductType === 'Kuşe') {
            return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton') && matchesDimension && matchesWeight;
          } else if (selectedProductType === 'Kuşeli Karton') {
            return (p.product_type.includes('Karton') || p.product_type.includes('Bristol')) && matchesDimension && matchesWeight;
          }
          return p.product_type === selectedProductType && matchesDimension && matchesWeight;
        });
      } else if (sizeType === 'custom') {
        // Özel ebat için ilk uygun ürünü al
        product = products.find(p => {
          const matchesWeight = p.weight === selectedWeight;
          
          if (selectedProductType === '1. Hamur') {
            return p.product_type.includes('Hamur') && matchesWeight;
          } else if (selectedProductType === 'Kuşe') {
            return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton') && matchesWeight;
          } else if (selectedProductType === 'Kuşeli Karton') {
            return (p.product_type.includes('Karton') || p.product_type.includes('Bristol')) && matchesWeight;
          }
          return p.product_type === selectedProductType && matchesWeight;
        });
      }
      setSelectedProduct(product || null);
      setCalculatedPrice(null);
    }
  }, [selectedProductType, selectedDimension, selectedWeight, products, sizeType]);

  const calculatePrice = () => {
    if (!selectedProduct) return;

    const exchange_rate = exchangeRates[selectedProduct.currency] || 1;
    let result = 0;

    if (sizeType === 'standard') {
      // Standart ebat formülü
      const dims = selectedProduct.dimensions.split('x');
      const length = parseFloat(dims[0]) / 100;
      const width = parseFloat(dims[1]) / 100;
      const weight_kg = selectedProduct.weight / 1000;
      const ton_price_kg = selectedProduct.ton_price / 1000;
      const sheetsPerPackage = selectedProduct.sheets_per_package;

      // Paket adeti × (ebat × gramaj × tabaka/paket × ton_fiyat × döviz)
      if (selectedFormula === '1') {
        result = packageQuantity * (length * width * weight_kg * sheetsPerPackage * ton_price_kg * exchange_rate);
      } else {
        result = packageQuantity * (length * width * weight_kg * ton_price_kg * exchange_rate);
      }
    } else {
      // Özel ebat formülü: (en * boy * gramaj * miktar * ton_fiyatı * döviz_kuru * 1.03)
      const en = parseFloat(selectedRollWidth) / 100; // cm'den m'ye
      const boy = parseFloat(customHeight) / 100; // cm'den m'ye
      const gramaj = selectedProduct.weight / 1000; // gr'den kg'ye
      const miktar = parseInt(customSheets) || 1;
      const ton_price_kg = selectedProduct.ton_price / 1000;
      const fire = 1.03;

      result = en * boy * gramaj * miktar * ton_price_kg * exchange_rate * fire;
    }

    setCalculatedPrice(result);
    setMessage({ type: 'success', text: 'Fiyat hesaplandı!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setSelectedProductType('');
    setSelectedDimension('');
    setSelectedRollWidth('');
    setCustomHeight('');
    setCustomSheets('');
    setSelectedWeight(null);
    setSelectedProduct(null);
    setCalculatedPrice(null);
    setPackageQuantity(1); // Reset paket adeti
  };

  const isCustomFormValid = selectedProductType && selectedRollWidth && customHeight && selectedWeight && customSheets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Calculator className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fiyat Hesaplama</h1>
          <p className="text-xl text-gray-600">
            Ürün, ebat ve miktar bilgilerinizi girerek anlık fiyat teklifi alın
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 max-w-4xl mx-auto ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesaplama Formu</h2>
              
              {/* Ebat Tipi Seçimi */}
              <div>
                <label className="block text-sm font-semibold mb-2">Ebat Tipi *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSizeType('standard');
                      resetForm();
                    }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      sizeType === 'standard'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📏 Standart Ebat
                  </button>
                  <button
                    onClick={() => {
                      setSizeType('custom');
                      resetForm();
                    }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      sizeType === 'custom'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✂️ Özel Ebat
                  </button>
                </div>
              </div>

              {/* Ürün Türü */}
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
                  <option value="">Ürün seçiniz</option>
                  {mainProductTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Standart Ebat */}
              {sizeType === 'standard' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">2. Standart Ebat *</label>
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
              )}

              {/* Özel Ebat */}
              {sizeType === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2">2. Bobin Genişliği (En) *</label>
                    <select 
                      value={selectedRollWidth} 
                      onChange={(e) => setSelectedRollWidth(e.target.value)}
                      disabled={!selectedProductType} 
                      className="w-full px-4 py-3 border rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Seçiniz</option>
                      {rollWidths.map(rw => (
                        <option key={rw.id} value={rw.width}>{rw.width} cm</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">3. Boy (cm) *</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="Boy giriniz (örn: 100)"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedRollWidth}
                    />
                  </div>
                </>
              )}

              {/* Gramaj */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {sizeType === 'custom' ? '4' : '3'}. Gramaj *
                </label>
                <select 
                  value={selectedWeight || ''} 
                  onChange={(e) => setSelectedWeight(Number(e.target.value))}
                  disabled={!selectedProductType || (sizeType === 'standard' ? !selectedDimension : !customHeight)} 
                  className="w-full px-4 py-3 border rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Seçiniz</option>
                  {availableWeights.map(w => <option key={w} value={w}>{w} gr/m²</option>)}
                </select>
              </div>

              {/* Paket Adeti - SADECE STANDART EBAT İÇİN */}
              {sizeType === 'standard' && selectedProduct && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    4. Paket Adeti *
                  </label>
                  <input 
                    type="number" 
                    value={packageQuantity} 
                    onChange={(e) => setPackageQuantity(Number(e.target.value))} 
                    min="1"
                    placeholder="Kaç paket istiyorsunuz?"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 pakette {selectedProduct.sheets_per_package} tabaka var
                  </p>
                </div>
              )}

              {/* Özel Ebat için Tabaka Sayısı */}
              {sizeType === 'custom' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">5. Tabaka Sayısı *</label>
                  <input
                    type="number"
                    value={customSheets}
                    onChange={(e) => setCustomSheets(e.target.value)}
                    placeholder="Tabaka sayısı giriniz"
                    min="1"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!selectedWeight}
                  />
                </div>
              )}



              {/* Hesapla Butonu */}
              <button 
                onClick={calculatePrice} 
                disabled={sizeType === 'standard' ? !selectedProduct : !isCustomFormValid}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-lg">
                <Calculator className="h-6 w-6" />
                <span>Fiyat Hesapla</span>
              </button>
            </div>

            {/* Fiyat Özeti */}
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
                    <p className="font-bold">
                      {sizeType === 'standard' 
                        ? `${selectedProduct.dimensions} cm` 
                        : `${selectedRollWidth}x${customHeight} cm (Özel)`
                      }
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Gramaj</p>
                    <p className="font-bold">{selectedProduct.weight} gr/m²</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      {sizeType === 'custom' ? 'Tabaka Sayısı' : 'Paket Başına Tabaka'}
                    </p>
                    <p className="font-bold">
                      {sizeType === 'custom' ? customSheets : selectedProduct.sheets_per_package} adet
                    </p>
                  </div>

                  {calculatedPrice !== null && (
                    <>
                      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 mt-4 shadow-lg">
                        <p className="text-sm opacity-90">Toplam Fiyat</p>
                        <p className="text-3xl md:text-4xl font-bold">{calculatedPrice.toFixed(2)} ₺</p>
                        <p className="text-xs opacity-75 mt-2">KDV Dahil Değildir</p>
                      </div>

                      {/* Özel Ebat Uyarısı */}
                      {sizeType === 'custom' && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mt-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-amber-900 mb-2">Önemli Bilgilendirme</h4>
                              <div className="space-y-2 text-sm text-amber-800">
                                <p>
                                  <strong>• Minimum Sipariş:</strong> Özel ebat siparişlerde minimum 1 bobin sipariş verilebilir.
                                </p>
                                <p>
                                  <strong>• Stok Onayı:</strong> Siparişiniz oluşturulduktan sonra stok durumu kontrol edilerek en kısa sürede onay için iletişime geçilecektir.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
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
      </div>
    </div>
  );
}
