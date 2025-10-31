import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Calculator as CalcIcon, Package, AlertCircle, CheckCircle, ArrowRight, Ruler } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1: Ebat girişi, 2: Ürün seçimi
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [customerData, setCustomerData] = useState<any>(null);
  const [cuttingFeePerPackage, setCuttingFeePerPackage] = useState(0);

  // Form States - Ebat
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  
  // Form States - Ürün
  const [selectedProductType, setSelectedProductType] = useState('');
  const [kusheType, setKusheType] = useState<'mat' | 'parlak' | ''>('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
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
        const productTypeLower = p.product_type.toLowerCase();
        
        if (selectedProductType === '1. Hamur') {
          return productTypeLower.includes('hamur');
        } else if (selectedProductType === 'Kuşe') {
          // Mat/Parlak kontrolü yapma, tüm Kuşe ürünlerinin gramajlarını göster
          const hasKuse = productTypeLower.includes('kuşe') || productTypeLower.includes('kuse');
          const hasNotKarton = !productTypeLower.includes('karton');
          return hasKuse && hasNotKarton;
        } else if (selectedProductType === 'Bristol') {
          return productTypeLower.includes('karton') || productTypeLower.includes('bristol');
        }
        return false;
      }).map(p => p.weight))].sort((a, b) => a - b)
    : [];

  // Ürün seç - Mat/Parlak sadece sipariş notunda kullanılacak
  useEffect(() => {
    if (selectedProductType && selectedWeight) {
      const product = products.find(p => {
        const matchesWeight = p.weight === selectedWeight;
        const productTypeLower = p.product_type.toLowerCase();
        
        if (selectedProductType === '1. Hamur') {
          return productTypeLower.includes('hamur') && matchesWeight;
        } else if (selectedProductType === 'Kuşe') {
          // Mat/Parlak kontrolü yapma, sadece Kuşe olup olmadığına bak
          const hasKuse = productTypeLower.includes('kuşe') || productTypeLower.includes('kuse');
          const hasNotKarton = !productTypeLower.includes('karton');
          return hasKuse && hasNotKarton && matchesWeight;
        } else if (selectedProductType === 'Bristol') {
          return (productTypeLower.includes('karton') || productTypeLower.includes('bristol')) && matchesWeight;
        }
        return false;
      });
      
      setSelectedProduct(product || null);
      setCalculatedPrice(null);
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductType, selectedWeight, kusheType, products]);

  const handleStep1Continue = () => {
    if (!width || !height) {
      setMessage({ type: 'error', text: 'Lütfen kağıt ölçülerini giriniz!' });
      return;
    }

    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (widthNum <= 0 || heightNum <= 0) {
      setMessage({ type: 'error', text: 'Geçerli bir ebat giriniz!' });
      return;
    }

    setMessage(null);
    setCurrentStep(2);
  };

  const calculatePrice = async () => {
    // Detaylı validasyon
    if (!selectedProductType) {
      setMessage({ type: 'error', text: 'Lütfen ürün tipi seçiniz!' });
      return;
    }
    
    if (selectedProductType === 'Kuşe' && !kusheType) {
      setMessage({ type: 'error', text: 'Lütfen Mat veya Parlak seçiniz!' });
      return;
    }
    
    if (!selectedWeight) {
      setMessage({ type: 'error', text: 'Lütfen gramaj seçiniz!' });
      return;
    }
    
    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Seçtiğiniz özelliklerde ürün bulunamadı! Lütfen başka bir gramaj deneyin.' });
      return;
    }
    
    if (!packageQuantity || packageQuantity <= 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir paket adedi giriniz!' });
      return;
    }

    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    try {
      // Fiyat hesaplama mantığı
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
      paper_price: calculatedPrice,
      cutting_fee_per_package: cuttingFeePerPackage,
      cutting_fee_total: cuttingFeeTotal,
      subtotal: basePriceWithoutVat,
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
    setCurrentStep(1);
    setWidth('');
    setHeight('');
    setSelectedProductType('');
    setKusheType('');
    setSelectedWeight(null);
    setPackageQuantity(1);
    setSelectedProduct(null);
    setCalculatedPrice(null);
    setMessage(null);
  };

  const isStep1Valid = width && height && parseFloat(width) > 0 && parseFloat(height) > 0;
  const isStep2Valid = selectedProductType && 
    selectedWeight && 
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

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              currentStep === 1 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {currentStep === 1 ? '1' : '✓'}
            </div>
            <div className={`h-1 w-16 mx-2 ${currentStep === 2 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              currentStep === 2 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
          </div>
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

        {/* ADIM 1: Kağıt Ölçüsü Girişi */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 md:p-12 shadow-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-yellow-100 w-20 h-20 rounded-3xl mb-4">
                <Ruler className="h-10 w-10 text-yellow-600" strokeWidth={2} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Makinanızda Kullandığınız Kağıt Ölçüsünü Giriniz
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                Lütfen makinanıza uygun kağıt ebatınızı santimetre (cm) cinsinden girin
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {/* En */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  En (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Örnek: 33"
                  className="w-full px-6 py-4 text-center text-xl border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                />
              </div>

              {/* Çarpı İşareti */}
              <div className="flex justify-center">
                <div className="text-3xl font-light text-gray-300">×</div>
              </div>

              {/* Boy */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Boy (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Örnek: 48.7"
                  className="w-full px-6 py-4 text-center text-xl border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                />
              </div>

              {/* Örnek Notları */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mt-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Örnek Ölçüler:</p>
                    <p>• 33 x 48.7 cm</p>
                    <p>• 35.5 x 66.5 cm</p>
                    <p>• 70 x 100 cm</p>
                  </div>
                </div>
              </div>

              {/* İleri Butonu */}
              <button
                onClick={handleStep1Continue}
                disabled={!isStep1Valid}
                className="w-full bg-yellow-500 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-yellow-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl mt-8"
              >
                Devam Et
                <ArrowRight className="h-6 w-6 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ADIM 2: Ürün Seçimi */}
        {currentStep === 2 && (
          <>
            {/* Seçilen Ebat Özeti */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <Ruler className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Seçilen Ebat</p>
                  <p className="text-lg font-bold text-gray-900">{width} × {height} cm</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Değiştir
              </button>
            </div>

            {/* Ürün Bilgileri Kartı */}
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

                {/* Kuşe Tipi */}
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
                  {selectedWeight && !selectedProduct && (
                    <p className="text-xs text-red-600 mt-2 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Bu gramajda ürün bulunamadı. Lütfen başka bir gramaj deneyin.
                    </p>
                  )}
                </div>

                {/* Paket Adedi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paket Adedi *
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
                      1 paket = <span className="font-semibold text-yellow-600">{selectedProduct.sheets_per_package} yaprak</span>
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
                  disabled={!isStep2Valid}
                  className="w-full bg-yellow-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <CalcIcon className="h-5 w-5 mr-2" />
                  Fiyat Hesapla
                </button>
              </div>
            </div>
          </>
        )}

        {/* Fiyat Sonuçları */}
        {calculatedPrice !== null && selectedProduct && currentStep === 2 && (
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
                <span className="font-semibold text-gray-900">{width} × {height} cm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Paket Başına</span>
                <span className="font-semibold text-gray-900">{selectedProduct.sheets_per_package} yaprak</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Paket Adedi</span>
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
