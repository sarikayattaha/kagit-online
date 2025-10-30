import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Calculator as CalcIcon, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DigitalPrintPageProps {
  onNavigate: (page: string) => void;
}

interface Product {
  id: string;
  product_type: string;
  weight: number;
  dimensions: string;
  sheets_per_package: number;
  ton_price: number;
  currency: string;
  vat_rate: number;
}

interface ExchangeRate {
  currency: string;
  rate: number;
}

export default function DigitalPrintPage({ onNavigate }: DigitalPrintPageProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [customerData, setCustomerData] = useState<any>(null);
  const [cuttingFeePerPackage, setCuttingFeePerPackage] = useState(0);

  // Form States
  const [selectedProductType, setSelectedProductType] = useState('');
  const [kusheType, setKusheType] = useState<'mat' | 'parlak' | ''>('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [packageQuantity, setPackageQuantity] = useState(1);
  
  // Calculation Results
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // Fetch data
  useEffect(() => {
    fetchProducts();
    fetchExchangeRates();
    fetchCuttingFee();
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_type')
        .order('weight');
      
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
        .select('*');
      
      if (error) throw error;
      
      const rates: Record<string, number> = {};
      data?.forEach((rate: ExchangeRate) => {
        rates[rate.currency] = rate.rate;
      });
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const fetchCustomerData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setCustomerData(data);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchCuttingFee = async () => {
    try {
      const { data, error } = await supabase
        .from('cutting_fees')
        .select('fee_per_package')
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching cutting fee:', error);
        setCuttingFeePerPackage(0);
      } else {
        setCuttingFeePerPackage(data?.fee_per_package || 0);
      }
    } catch (error) {
      console.error('Error fetching cutting fee:', error);
      setCuttingFeePerPackage(0);
    }
  };

  // Mevcut gramajları getir
  const availableWeights = selectedProductType
    ? [...new Set(products.filter(p => {
        if (selectedProductType === '1. Hamur') {
          return p.product_type.includes('Hamur');
        } else if (selectedProductType === 'Kuşe') {
          return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton');
        } else if (selectedProductType === 'Bristol') {
          return p.product_type.includes('Karton') || p.product_type.includes('Bristol');
        }
        return p.product_type === selectedProductType;
      }).map(p => p.weight))].sort((a, b) => a - b)
    : [];

  // Ürün seç - İlk uygun ürünü otomatik seç
  useEffect(() => {
    if (selectedProductType && selectedWeight) {
      const product = products.find(p => {
        const matchesWeight = p.weight === selectedWeight;
        
        if (selectedProductType === '1. Hamur') {
          return p.product_type.includes('Hamur') && matchesWeight;
        } else if (selectedProductType === 'Kuşe') {
          // Kuşe tip kontrolü
          if (kusheType === 'mat') {
            return p.product_type.includes('Kuşe') && p.product_type.includes('Mat') && matchesWeight;
          } else if (kusheType === 'parlak') {
            return p.product_type.includes('Kuşe') && !p.product_type.includes('Mat') && !p.product_type.includes('Karton') && matchesWeight;
          }
          // Kuşe seçiliyse ama tip seçilmediyse ürün seçme
          return false;
        } else if (selectedProductType === 'Bristol') {
          return (p.product_type.includes('Karton') || p.product_type.includes('Bristol')) && matchesWeight;
        }
        return false;
      });
      setSelectedProduct(product || null);
      setCalculatedPrice(null);
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductType, selectedWeight, kusheType, products]);

  const calculatePrice = async () => {
    if (!selectedProduct || !width || !height || !packageQuantity) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun!' });
      return;
    }

    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (widthNum <= 0 || heightNum <= 0) {
      setMessage({ type: 'error', text: 'Geçerli bir ebat giriniz!' });
      return;
    }

    try {
      // Fiyat hesaplama mantığı (standart ebat ile aynı)
      const sheetsPerPackage = selectedProduct.sheets_per_package;
      const totalSheets = sheetsPerPackage * packageQuantity;
      
      // Alan hesabı (m²)
      const areaPerSheet = (widthNum * heightNum) / 10000; // cm² to m²
      const totalArea = areaPerSheet * totalSheets;
      
      // Ton fiyatını kg fiyatına çevir
      const pricePerKg = selectedProduct.ton_price / 1000;
      
      // Gramajı kg'a çevir
      const weightPerM2 = selectedProduct.weight / 1000;
      
      // Toplam ağırlık (kg)
      const totalWeight = totalArea * weightPerM2;
      
      // Temel fiyat hesabı
      let basePrice = totalWeight * pricePerKg;
      
      // Döviz çevirisi
      if (selectedProduct.currency !== 'TRY' && exchangeRates[selectedProduct.currency]) {
        basePrice *= exchangeRates[selectedProduct.currency];
      }
      
      // KDV hariç fiyat
      setCalculatedPrice(basePrice);
      setMessage(null);
    } catch (error) {
      console.error('Error calculating price:', error);
      setMessage({ type: 'error', text: 'Fiyat hesaplanırken bir hata oluştu!' });
    }
  };

  const createOrder = () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Sipariş oluşturmak için giriş yapmalısınız!' });
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
      return;
    }

    if (!selectedProduct || calculatedPrice === null) {
      setMessage({ type: 'error', text: 'Lütfen önce fiyat hesaplayın!' });
      return;
    }

    // Kesim ücreti hesaplama
    const cuttingFeeTotal = cuttingFeePerPackage * packageQuantity;
    
    // KDV hesaplama
    const vatRate = selectedProduct.vat_rate || 20;
    const basePriceWithoutVat = calculatedPrice + cuttingFeeTotal; // Kağıt fiyatı + kesim ücreti
    const vatAmount = basePriceWithoutVat * (vatRate / 100);
    const totalPriceWithVat = basePriceWithoutVat + vatAmount;

    const orderData = {
      product_type: selectedProductType === 'Kuşe' && kusheType 
        ? `${selectedProduct.product_type} (${kusheType === 'mat' ? 'Mat' : 'Parlak'})`
        : selectedProduct.product_type,
      weight: selectedProduct.weight,
      dimensions: `${width}x${height}`,
      size_type: 'custom',
      roll_width: parseFloat(width),
      custom_height: parseFloat(height),
      quantity: packageQuantity,
      sheets_per_package: selectedProduct.sheets_per_package,
      paper_price: calculatedPrice, // Sadece kağıt fiyatı
      cutting_fee_per_package: cuttingFeePerPackage,
      cutting_fee_total: cuttingFeeTotal,
      subtotal: basePriceWithoutVat, // KDV hariç ara toplam
      vat_rate: vatRate,
      vat_amount: vatAmount,
      unit_price: totalPriceWithVat / packageQuantity,
      total_price: totalPriceWithVat,
      currency: 'TRY'
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    onNavigate('order-confirmation');
  };

  const resetForm = () => {
    setSelectedProductType('');
    setKusheType('');
    setSelectedWeight(null);
    setWidth('');
    setHeight('');
    setPackageQuantity(1);
    setSelectedProduct(null);
    setCalculatedPrice(null);
  };

  const isFormValid = selectedProductType && 
    selectedWeight && 
    width && 
    height && 
    packageQuantity > 0 &&
    (selectedProductType !== 'Kuşe' || kusheType);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Geri Dön */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-medium">Geri Dön</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-yellow-500 w-16 h-16 rounded-2xl mb-4">
            <Printer className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Dijital Baskı Kağıtları
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Kuşe, Bristol ve 1.Hamur kağıtlarda özel ebatlarda fiyat hesaplama
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center mb-6">
            <Package className="h-6 w-6 text-yellow-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Ürün Bilgileri</h2>
          </div>

          <div className="space-y-6">
            {/* Ürün Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Tipi *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Kuşe', 'Bristol', '1. Hamur'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedProductType(type);
                      setSelectedWeight(null);
                      setKusheType('');
                      setSelectedProduct(null);
                      setCalculatedPrice(null);
                    }}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedProductType === type
                        ? 'bg-yellow-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Kuşe Tipi (Sadece Kuşe seçiliyse göster) */}
            {selectedProductType === 'Kuşe' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kuşe Tipi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setKusheType('mat');
                      setSelectedWeight(null);
                      setSelectedProduct(null);
                      setCalculatedPrice(null);
                    }}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      kusheType === 'mat'
                        ? 'bg-yellow-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Mat
                  </button>
                  <button
                    onClick={() => {
                      setKusheType('parlak');
                      setSelectedWeight(null);
                      setSelectedProduct(null);
                      setCalculatedPrice(null);
                    }}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      kusheType === 'parlak'
                        ? 'bg-yellow-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Parlak
                  </button>
                </div>
              </div>
            )}

            {/* Gramaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gramaj *
              </label>
              <select
                value={selectedWeight || ''}
                onChange={(e) => {
                  setSelectedWeight(Number(e.target.value));
                  setCalculatedPrice(null);
                }}
                disabled={!selectedProductType || (selectedProductType === 'Kuşe' && !kusheType)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seçiniz</option>
                {availableWeights.map(weight => (
                  <option key={weight} value={weight}>{weight}gr</option>
                ))}
              </select>
            </div>

            {/* Özel Ebat Girişi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  En (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="33"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boy (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="48.7"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Lütfen makinanıza uygun kağıt ebatınızı girin! Örnek: 33x48.7 veya 35.5x66.5
              </p>
            </div>

            {/* Paket Sayısı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paket Sayısı *
              </label>
              <input
                type="number"
                min="1"
                value={packageQuantity}
                onChange={(e) => setPackageQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-2">
                  Paketteki yaprak sayısı: <span className="font-semibold">{selectedProduct.sheets_per_package} adet</span>
                </p>
              )}
            </div>

            {/* Toplam Yaprak */}
            {selectedProduct && packageQuantity > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">Toplam Yaprak Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(selectedProduct.sheets_per_package * packageQuantity).toLocaleString()} adet
                </p>
              </div>
            )}

            {/* Hesapla Butonu */}
            <button
              onClick={calculatePrice}
              disabled={!isFormValid}
              className="w-full bg-yellow-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <CalcIcon className="h-5 w-5 mr-2" />
              Fiyat Hesapla
            </button>
          </div>
        </div>

        {/* Fiyat Sonuçları */}
        {calculatedPrice !== null && selectedProduct && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-center mb-6">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Fiyat Detayları</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ürün</span>
                <span className="font-semibold text-gray-900">
                  {selectedProductType === 'Kuşe' && kusheType 
                    ? `${selectedProductType} (${kusheType === 'mat' ? 'Mat' : 'Parlak'})`
                    : selectedProductType
                  }
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Gramaj</span>
                <span className="font-semibold text-gray-900">{selectedProduct.weight}gr</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ebat</span>
                <span className="font-semibold text-gray-900">{width} x {height} cm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Paket Başına</span>
                <span className="font-semibold text-gray-900">{selectedProduct.sheets_per_package} yaprak</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Paket Sayısı</span>
                <span className="font-semibold text-gray-900">{packageQuantity} paket</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Toplam Yaprak</span>
                <span className="font-semibold text-gray-900">
                  {(selectedProduct.sheets_per_package * packageQuantity).toLocaleString()} adet
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
                <span className="text-gray-700 font-medium">Ara Toplam (KDV Hariç)</span>
                <span className="font-bold text-gray-900">
                  {(calculatedPrice + cuttingFeePerPackage * packageQuantity).toFixed(2)} TL
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">KDV (%{selectedProduct.vat_rate})</span>
                <span className="font-semibold text-gray-900">
                  {((calculatedPrice + cuttingFeePerPackage * packageQuantity) * (selectedProduct.vat_rate / 100)).toFixed(2)} TL
                </span>
              </div>
              <div className="flex justify-between py-3 bg-yellow-50 rounded-xl px-4">
                <span className="text-lg font-semibold text-gray-900">Toplam Fiyat</span>
                <span className="text-xl font-bold text-yellow-600">
                  {((calculatedPrice + cuttingFeePerPackage * packageQuantity) * (1 + selectedProduct.vat_rate / 100)).toFixed(2)} TL
                </span>
              </div>
            </div>

            {/* Butonlar */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Yeniden Hesapla
              </button>
              <button
                onClick={createOrder}
                className="px-6 py-3 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition-colors"
              >
                Sipariş Oluştur
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
