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

  // Form States
  const [selectedProductType, setSelectedProductType] = useState('');
  const [kusheType, setKusheType] = useState<'mat' | 'parlak' | ''>('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [sheetsPerPackage, setSheetsPerPackage] = useState('');
  const [packageQuantity, setPackageQuantity] = useState(1);
  
  // Calculation Results
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchExchangeRates();
    fetchProducts();
    fetchCustomerData();
  }, []);

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

  // Mevcut paketteki yaprak sayılarını getir
  const availableSheetsPerPackage = selectedProductType && selectedWeight
    ? [...new Set(products.filter(p => {
        const matchesWeight = p.weight === selectedWeight;
        if (selectedProductType === '1. Hamur') {
          return p.product_type.includes('Hamur') && matchesWeight;
        } else if (selectedProductType === 'Kuşe') {
          return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton') && matchesWeight;
        } else if (selectedProductType === 'Bristol') {
          return (p.product_type.includes('Karton') || p.product_type.includes('Bristol')) && matchesWeight;
        }
        return p.product_type === selectedProductType && matchesWeight;
      }).map(p => p.sheets_per_package))].sort((a, b) => a - b)
    : [];

  // Ürün seç
  useEffect(() => {
    if (selectedProductType && selectedWeight && sheetsPerPackage) {
      const product = products.find(p => {
        const matchesWeight = p.weight === selectedWeight;
        const matchesSheets = p.sheets_per_package === parseInt(sheetsPerPackage);
        
        if (selectedProductType === '1. Hamur') {
          return p.product_type.includes('Hamur') && matchesWeight && matchesSheets;
        } else if (selectedProductType === 'Kuşe') {
          // Kuşe tip kontrolü
          if (kusheType === 'mat') {
            return p.product_type.includes('Kuşe') && p.product_type.includes('Mat') && matchesWeight && matchesSheets;
          } else if (kusheType === 'parlak') {
            return p.product_type.includes('Kuşe') && !p.product_type.includes('Mat') && !p.product_type.includes('Karton') && matchesWeight && matchesSheets;
          }
          return p.product_type.includes('Kuşe') && !p.product_type.includes('Karton') && matchesWeight && matchesSheets;
        } else if (selectedProductType === 'Bristol') {
          return (p.product_type.includes('Karton') || p.product_type.includes('Bristol')) && matchesWeight && matchesSheets;
        }
        return false;
      });
      setSelectedProduct(product || null);
      setCalculatedPrice(null);
    }
  }, [selectedProductType, selectedWeight, sheetsPerPackage, kusheType, products]);

  const calculatePrice = () => {
    if (!selectedProduct || !width || !height || !packageQuantity) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun!' });
      return;
    }

    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (!widthNum || !heightNum) {
      setMessage({ type: 'error', text: 'Geçerli ebat giriniz!' });
      return;
    }

    try {
      const exchange_rate = exchangeRates[selectedProduct.currency] || 1;
      
      // Özel ebat hesaplama (custom mantığı)
      const en = widthNum / 100; // cm'den m'ye
      const boy = heightNum / 100;
      const gramaj = selectedProduct.weight / 1000; // gr'dan kg'ya
      const sheetsInPackage = selectedProduct.sheets_per_package;
      const ton_price_kg = selectedProduct.ton_price / 1000;
      const fire = 1.03; // %3 fire

      // Fiyat = En × Boy × Gramaj × (Yaprak/Paket) × Paket Sayısı × Ton Fiyatı × Döviz × Fire
      const result = en * boy * gramaj * sheetsInPackage * packageQuantity * ton_price_kg * exchange_rate * fire;

      setCalculatedPrice(result);
      setMessage({ type: 'success', text: 'Fiyat hesaplandı!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Calculation error:', error);
      setMessage({ type: 'error', text: 'Hesaplama sırasında hata oluştu!' });
    }
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

    // KDV hesaplama
    const vatRate = selectedProduct.vat_rate || 20;
    const basePriceWithoutVat = calculatedPrice;
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
      unit_price: totalPriceWithVat / packageQuantity,
      total_price: totalPriceWithVat,
      vat_rate: vatRate,
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
    setSheetsPerPackage('');
    setPackageQuantity(1);
    setSelectedProduct(null);
    setCalculatedPrice(null);
  };

  const isFormValid = selectedProductType && 
    selectedWeight && 
    width && 
    height && 
    sheetsPerPackage && 
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
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <CalcIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Ürün Bilgileri
          </h2>

          <div className="space-y-4">
            {/* Ürün Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Tipi *
              </label>
              <select
                value={selectedProductType}
                onChange={(e) => {
                  setSelectedProductType(e.target.value);
                  setKusheType('');
                  setSelectedWeight(null);
                  setSheetsPerPackage('');
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                <option value="Kuşe">Kuşe</option>
                <option value="1. Hamur">1. Hamur</option>
                <option value="Bristol">Bristol</option>
              </select>
            </div>

            {/* Kuşe Tipi (sadece Kuşe seçiliyse) */}
            {selectedProductType === 'Kuşe' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kuşe Tipi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setKusheType('mat')}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      kusheType === 'mat'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Mat
                  </button>
                  <button
                    onClick={() => setKusheType('parlak')}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      kusheType === 'parlak'
                        ? 'bg-yellow-500 text-white'
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
                  setSelectedWeight(parseInt(e.target.value));
                  setSheetsPerPackage('');
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

            {/* Özel Ebat - En ve Boy */}
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
                  placeholder="33.5"
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
                Özel ebat girişi: Ondalıklı sayı kullanabilirsiniz (örn: 33.5 x 48.7 cm)
              </p>
            </div>

            {/* Paketteki Yaprak Sayısı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paketteki Yaprak Sayısı *
              </label>
              <select
                value={sheetsPerPackage}
                onChange={(e) => setSheetsPerPackage(e.target.value)}
                disabled={!selectedWeight}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seçiniz</option>
                {availableSheetsPerPackage.map(sheets => (
                  <option key={sheets} value={sheets}>{sheets} yaprak/paket</option>
                ))}
              </select>
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
            </div>

            {/* Toplam Yaprak */}
            {sheetsPerPackage && packageQuantity > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">Toplam Yaprak Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(parseInt(sheetsPerPackage) * packageQuantity).toLocaleString()} adet
                </p>
              </div>
            )}

            {/* Hesapla Butonu */}
            <button
              onClick={calculatePrice}
              disabled={!isFormValid}
              className="w-full bg-yellow-500 text-white py-3 px-6 rounded-full font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Fiyat Hesapla
            </button>
          </div>
        </div>

        {/* Hesaplama Sonucu */}
        {calculatedPrice !== null && selectedProduct && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Fiyat Detayları
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ürün</span>
                <span className="font-semibold text-gray-900">
                  {selectedProductType}
                  {kusheType && ` (${kusheType === 'mat' ? 'Mat' : 'Parlak'})`}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Gramaj</span>
                <span className="font-semibold text-gray-900">{selectedWeight}gr</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ebat</span>
                <span className="font-semibold text-gray-900">{width} x {height} cm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Paket Başına</span>
                <span className="font-semibold text-gray-900">{sheetsPerPackage} yaprak</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Paket Sayısı</span>
                <span className="font-semibold text-gray-900">{packageQuantity} paket</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Toplam Yaprak</span>
                <span className="font-semibold text-gray-900">
                  {(parseInt(sheetsPerPackage) * packageQuantity).toLocaleString()} adet
                </span>
              </div>
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Ara Toplam (KDV Hariç)</span>
                  <span className="font-semibold text-gray-900">{calculatedPrice.toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">KDV (%{selectedProduct.vat_rate})</span>
                  <span className="font-semibold text-gray-900">
                    {(calculatedPrice * (selectedProduct.vat_rate / 100)).toFixed(2)} TL
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-yellow-50 rounded-xl px-4">
                  <span className="text-lg font-semibold text-gray-900">Toplam Fiyat</span>
                  <span className="text-xl font-bold text-yellow-600">
                    {(calculatedPrice * (1 + selectedProduct.vat_rate / 100)).toFixed(2)} TL
                  </span>
                </div>
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
