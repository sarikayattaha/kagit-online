import { useState, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  product_type: string;
  weight: number;
  dimensions: string;
  sheets_per_package: number;
  ton_price: number;
  currency: string;
  vat_rate: number; // ✅ KDV oranı
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

interface CalculatorPageProps {
  onNavigate: (page: string) => void;
}

export default function CalculatorPage({ onNavigate }: CalculatorPageProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [rollWidths, setRollWidths] = useState<RollWidth[]>([]);

  const [sizeType, setSizeType] = useState<'standard' | 'custom'>('standard');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [kusheType, setKusheType] = useState<'mat' | 'parlak' | ''>(''); // YENİ: Kuşe tipi
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedRollWidth, setSelectedRollWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customSheets, setCustomSheets] = useState('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [packageQuantity, setPackageQuantity] = useState(1);
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
  
  const mainProductTypes = uniqueProductTypes.reduce((acc, type) => {
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
      const dims = selectedProduct.dimensions.split('x');
      const length = parseFloat(dims[0]) / 100;
      const width = parseFloat(dims[1]) / 100;
      const weight_kg = selectedProduct.weight / 1000;
      const ton_price_kg = selectedProduct.ton_price / 1000;
      const sheetsPerPackage = selectedProduct.sheets_per_package;

      if (selectedFormula === '1') {
        result = packageQuantity * (length * width * weight_kg * sheetsPerPackage * ton_price_kg * exchange_rate);
      } else {
        result = packageQuantity * (length * width * weight_kg * ton_price_kg * exchange_rate);
      }
    } else {
      const en = parseFloat(selectedRollWidth) / 100;
      const boy = parseFloat(customHeight) / 100;
      const gramaj = selectedProduct.weight / 1000;
      const miktar = parseInt(customSheets) || 1;
      const ton_price_kg = selectedProduct.ton_price / 1000;
      const fire = 1.03;

      result = en * boy * gramaj * miktar * ton_price_kg * exchange_rate * fire;
    }

    setCalculatedPrice(result);
    setMessage({ type: 'success', text: 'Fiyat hesaplandı!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const createOrder = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Sipariş vermek için giriş yapmalısınız!' });
      return;
    }

    if (!selectedProduct || calculatedPrice === null) {
      setMessage({ type: 'error', text: 'Lütfen önce fiyat hesaplayın!' });
      return;
    }

    // Sipariş bilgilerini localStorage'a kaydet
    // calculatedPrice KDV HARİÇ, UI'da KDV DAHİL gösterdiğimiz için burada da KDV DAHİL kaydetmeliyiz
    const vatRate = selectedProduct.vat_rate || 20;
    const basePriceWithoutVat = calculatedPrice;
    const vatAmount = basePriceWithoutVat * (vatRate / 100);
    const totalPriceWithVat = basePriceWithoutVat + vatAmount;

    const orderData = {
      product_type: selectedProductType === 'Kuşe' && kusheType 
        ? `${selectedProduct.product_type} (${kusheType === 'mat' ? 'Mat' : 'Parlak'})`
        : selectedProduct.product_type,
      weight: selectedProduct.weight,
      dimensions: sizeType === 'standard' ? selectedProduct.dimensions : `${selectedRollWidth}x${customHeight}`,
      size_type: sizeType,
      roll_width: sizeType === 'custom' ? parseInt(selectedRollWidth) : null,
      custom_height: sizeType === 'custom' ? parseInt(customHeight) : null,
      quantity: sizeType === 'standard' ? packageQuantity : parseInt(customSheets),
      sheets_per_package: selectedProduct.sheets_per_package,
      unit_price: sizeType === 'standard' 
        ? totalPriceWithVat / packageQuantity 
        : totalPriceWithVat / parseInt(customSheets),
      total_price: totalPriceWithVat, // ✅ KDV DAHİL fiyat
      vat_rate: vatRate, // ✅ KDV oranı eklendi
      currency: 'TRY'
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Sipariş onay sayfasına yönlendir
    onNavigate('order-confirmation');
  };

  const resetForm = () => {
    setSelectedProductType('');
    setKusheType('');
    setSelectedDimension('');
    setSelectedRollWidth('');
    setCustomHeight('');
    setCustomSheets('');
    setSelectedWeight(null);
    setSelectedProduct(null);
    setCalculatedPrice(null);
    setPackageQuantity(1);
  };

  const isCustomFormValid = selectedProductType && 
    (selectedProductType === 'Kuşe' ? kusheType : true) &&
    selectedRollWidth && 
    customHeight && 
    selectedWeight && 
    customSheets;

  return (
    <div className="min-h-screen bg-white py-6 md:py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
            Fiyat Hesaplama
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Ürün, ebat ve miktar bilgilerinizi girerek anlık fiyat teklifi alın
          </p>
        </div>

        {message && (
          <div className={`mb-8 p-5 rounded-2xl flex items-center space-x-3 max-w-4xl mx-auto border ${
            message.type === 'success' ? 'bg-white border-gray-200' : 'bg-red-50 border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-gray-900" strokeWidth={2} /> : <AlertCircle className="h-5 w-5 text-red-600" strokeWidth={2} />}
            <p className={message.type === 'success' ? 'text-gray-900 font-medium' : 'text-red-600 font-medium'}>{message.text}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">Hesaplama Formu</h2>
              
              {/* Ebat Tipi Seçimi */}
              <div>
                <label className="block text-base font-semibold mb-3 text-gray-900">Ebat Tipi *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setSizeType('standard');
                      resetForm();
                    }}
                    className={`px-5 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                      sizeType === 'standard'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    📏 Standart Ebat
                  </button>
                  <button
                    onClick={() => {
                      setSizeType('custom');
                      resetForm();
                    }}
                    className={`px-5 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                      sizeType === 'custom'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    ✂️ Özel Ebat
                  </button>
                </div>
              </div>

              {/* Ürün Türü */}
              <div>
                <label className="block text-base font-semibold mb-3 text-gray-900">1. Ürün Türü *</label>
                <select 
                  value={selectedProductType} 
                  onChange={(e) => { 
                    setSelectedProductType(e.target.value);
                    setKusheType('');
                    setSelectedDimension(''); 
                    setSelectedWeight(null); 
                  }}
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 text-base">
                  <option value="">Ürün seçiniz</option>
                  {mainProductTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* KUŞE TİPİ SEÇİMİ - SADECE KUŞE İÇİN */}
              {selectedProductType === 'Kuşe' && (
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-900">2. Kuşe Tipi *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setKusheType('mat')}
                      className={`px-5 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                        kusheType === 'mat'
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      Mat
                    </button>
                    <button
                      type="button"
                      onClick={() => setKusheType('parlak')}
                      className={`px-5 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                        kusheType === 'parlak'
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      Parlak
                    </button>
                  </div>
                </div>
              )}

              {/* Standart Ebat */}
              {sizeType === 'standard' && (
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-900">
                    {selectedProductType === 'Kuşe' ? '3' : '2'}. Standart Ebat *
                  </label>
                  <select 
                    value={selectedDimension} 
                    onChange={(e) => { 
                      setSelectedDimension(e.target.value); 
                      setSelectedWeight(null); 
                    }}
                    disabled={!selectedProductType || (selectedProductType === 'Kuşe' && !kusheType)} 
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl disabled:bg-gray-100 focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                    <option value="">Seçiniz</option>
                    {availableDimensions.map(d => <option key={d} value={d}>{d} cm</option>)}
                  </select>
                </div>
              )}

              {/* Özel Ebat */}
              {sizeType === 'custom' && (
                <>
                  <div>
                    <label className="block text-base font-semibold mb-3 text-gray-900">
                      {selectedProductType === 'Kuşe' ? '3' : '2'}. Bobin Genişliği (En) *
                    </label>
                    <select 
                      value={selectedRollWidth} 
                      onChange={(e) => setSelectedRollWidth(e.target.value)}
                      disabled={!selectedProductType || (selectedProductType === 'Kuşe' && !kusheType)} 
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl disabled:bg-gray-100 focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                      <option value="">Seçiniz</option>
                      {rollWidths.map(rw => (
                        <option key={rw.id} value={rw.width}>{rw.width} cm</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-semibold mb-3 text-gray-900">
                      {selectedProductType === 'Kuşe' ? '4' : '3'}. Boy (cm) *
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="Boy giriniz (örn: 100)"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      disabled={!selectedRollWidth}
                    />
                  </div>
                </>
              )}

              {/* Gramaj */}
              <div>
                <label className="block text-base font-semibold mb-3 text-gray-900">
                  {selectedProductType === 'Kuşe' 
                    ? (sizeType === 'custom' ? '5' : '4')
                    : (sizeType === 'custom' ? '4' : '3')
                  }. Gramaj *
                </label>
                <select 
                  value={selectedWeight || ''} 
                  onChange={(e) => setSelectedWeight(Number(e.target.value))}
                  disabled={!selectedProductType || (selectedProductType === 'Kuşe' && !kusheType) || (sizeType === 'standard' ? !selectedDimension : !customHeight)} 
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl disabled:bg-gray-100 focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="">Seçiniz</option>
                  {availableWeights.map(w => <option key={w} value={w}>{w} gr/m²</option>)}
                </select>
              </div>

              {/* Paket Adeti - SADECE STANDART EBAT İÇİN */}
              {sizeType === 'standard' && selectedProduct && (
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-900">
                    {selectedProductType === 'Kuşe' ? '5' : '4'}. Paket Adeti *
                  </label>
                  <input 
                    type="number" 
                    value={packageQuantity} 
                    onChange={(e) => setPackageQuantity(Number(e.target.value))} 
                    min="1"
                    placeholder="Kaç paket istiyorsunuz?"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 pakette {selectedProduct.sheets_per_package} tabaka var
                  </p>
                </div>
              )}

              {/* Özel Ebat için Tabaka Sayısı */}
              {sizeType === 'custom' && (
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-900">
                    {selectedProductType === 'Kuşe' ? '6' : '5'}. Tabaka Sayısı *
                  </label>
                  <input
                    type="number"
                    value={customSheets}
                    onChange={(e) => setCustomSheets(e.target.value)}
                    placeholder="Tabaka sayısı giriniz"
                    min="1"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    disabled={!selectedWeight}
                  />
                </div>
              )}

              {/* Hesapla Butonu */}
              <button 
                onClick={calculatePrice} 
                disabled={
                  sizeType === 'standard' 
                    ? (!selectedProduct || (selectedProductType === 'Kuşe' && !kusheType))
                    : (!isCustomFormValid)
                }
                className="w-full bg-gray-900 text-white py-5 rounded-full font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                <Calculator className="h-6 w-6" strokeWidth={2} />
                <span>Fiyat Hesapla</span>
              </button>
            </div>

            {/* Fiyat Özeti */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 tracking-tight">Fiyat Özeti</h3>
              {selectedProduct ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4">
                    <p className="text-sm text-gray-600">Ürün Türü</p>
                    <p className="font-bold text-lg">{selectedProduct.product_type}</p>
                  </div>
                  
                  {/* KUŞE TİPİ GÖSTER */}
                  {selectedProductType === 'Kuşe' && kusheType && (
                    <div className="bg-white rounded-2xl p-4">
                      <p className="text-sm text-gray-600">Kuşe Tipi</p>
                      <p className="font-bold text-lg">{kusheType === 'mat' ? 'Mat' : 'Parlak'}</p>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-2xl p-4">
                    <p className="text-sm text-gray-600">Ebat</p>
                    <p className="font-bold">
                      {sizeType === 'standard' 
                        ? `${selectedProduct.dimensions} cm` 
                        : `${selectedRollWidth}x${customHeight} cm (Özel)`
                      }
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-4">
                    <p className="text-sm text-gray-600">Gramaj</p>
                    <p className="font-bold">{selectedProduct.weight} gr/m²</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4">
                    <p className="text-sm text-gray-600">
                      {sizeType === 'custom' ? 'Tabaka Sayısı' : 'Paket Başına Tabaka'}
                    </p>
                    <p className="font-bold">
                      {sizeType === 'custom' ? customSheets : selectedProduct.sheets_per_package} adet
                    </p>
                  </div>
                  {calculatedPrice !== null && selectedProduct && (
                    <>
                      {(() => {
                        const basePrice = calculatedPrice;
                        const vatRate = selectedProduct.vat_rate || 20;
                        const vatAmount = basePrice * (vatRate / 100);
                        const totalPrice = basePrice + vatAmount;
                        
                        return (
                          <>
                            {/* Ürün Tutarı (KDV Hariç) */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">Ürün Tutarı (KDV Hariç)</p>
                              <p className="text-2xl font-bold text-gray-900">{basePrice.toFixed(2)} ₺</p>
                            </div>

                            {/* KDV Tutarı */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">KDV Tutarı (%{vatRate})</p>
                              <p className="text-2xl font-bold text-gray-900">{vatAmount.toFixed(2)} ₺</p>
                            </div>

                            {/* Toplam Tutar (KDV Dahil) */}
                            <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-lg">
                              <p className="text-sm opacity-80 mb-2">Toplam Tutar (KDV Dahil)</p>
                              <p className="text-4xl md:text-5xl font-bold tracking-tight">{totalPrice.toFixed(2)} ₺</p>
                            </div>
                          </>
                        );
                      })()}


                      {/* Özel Ebat Uyarısı */}
                      {sizeType === 'custom' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-amber-100 p-2 rounded-xl">
                              <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-amber-900 mb-3">Önemli Bilgilendirme</h4>
                              <div className="space-y-2 text-sm text-amber-800 leading-relaxed">
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

                      {/* SİPARİŞ VER BUTONU */}
                      <button
                        onClick={createOrder}
                        disabled={!user}
                        className="w-full bg-gray-900 text-white py-5 rounded-full font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform mt-6"
                      >
                        {!user ? (
                          <span>Sipariş vermek için giriş yapın</span>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Sipariş Ver</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 md:py-32">
                  <div className="bg-gray-100 p-6 rounded-3xl inline-flex mb-6">
                    <Calculator className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg text-gray-500">Fiyat hesaplamak için formu doldurun</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
