import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Calculator as CalcIcon, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DigitalPrintPageProps {
  onNavigate: (page: string) => void;
}

interface Formula {
  id: string;
  product_type: string;
  weight: number;
  formula_type: string;
  formula_value: number;
  is_active: boolean;
}

interface RollWidth {
  id: string;
  width: number;
  is_active: boolean;
}

export default function DigitalPrintPage({ onNavigate }: DigitalPrintPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Form States
  const [productType, setProductType] = useState('');
  const [weight, setWeight] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Data States
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [rollWidths, setRollWidths] = useState<RollWidth[]>([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [customerData, setCustomerData] = useState<any>(null);

  // Calculation Results
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const productTypes = [
    { value: 'Kuşe', label: 'Kuşe' },
    { value: '1.Hamur', label: '1.Hamur' },
    { value: 'Bristol', label: 'Bristol' },
  ];

  const weights = [
    { value: '70', label: '70gr' },
    { value: '80', label: '80gr' },
    { value: '90', label: '90gr' },
    { value: '100', label: '100gr' },
    { value: '115', label: '115gr' },
    { value: '130', label: '130gr' },
    { value: '150', label: '150gr' },
    { value: '170', label: '170gr' },
    { value: '200', label: '200gr' },
    { value: '250', label: '250gr' },
    { value: '300', label: '300gr' },
    { value: '350', label: '350gr' },
  ];

  useEffect(() => {
    fetchData();
    fetchCustomerData();
  }, []);

  const fetchData = async () => {
    try {
      const [formulasRes, rollWidthsRes, exchangeRateRes] = await Promise.all([
        supabase.from('formulas').select('*').eq('is_active', true),
        supabase.from('roll_widths').select('*').eq('is_active', true).order('width'),
        supabase.from('exchange_rates').select('*').eq('is_active', true).single()
      ]);

      if (formulasRes.data) setFormulas(formulasRes.data);
      if (rollWidthsRes.data) setRollWidths(rollWidthsRes.data);
      if (exchangeRateRes.data) setExchangeRate(exchangeRateRes.data.rate);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const calculatePrice = () => {
    setCalculating(true);

    try {
      const widthNum = parseFloat(width);
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);
      const quantityNum = parseInt(quantity);

      if (!widthNum || !heightNum || !weightNum || !quantityNum) {
        alert('Lütfen tüm alanları doldurun');
        setCalculating(false);
        return;
      }

      // Formülü bul
      const formula = formulas.find(
        f => f.product_type === productType && f.weight === weightNum
      );

      if (!formula) {
        alert('Bu ürün ve gramaj kombinasyonu için formül bulunamadı');
        setCalculating(false);
        return;
      }

      // En yakın rulo genişliğini bul
      const nearestRollWidth = rollWidths.reduce((prev, curr) => {
        return (Math.abs(curr.width - widthNum) < Math.abs(prev.width - widthNum) ? curr : prev);
      });

      // Hesaplama
      const areaM2 = (widthNum * heightNum) / 10000;
      const totalAreaM2 = areaM2 * quantityNum;
      
      let basePrice = 0;
      if (formula.formula_type === 'fixed') {
        basePrice = formula.formula_value * totalAreaM2;
      } else if (formula.formula_type === 'exchange_rate') {
        basePrice = formula.formula_value * exchangeRate * totalAreaM2;
      }

      // Fire hesabı (roll width'e göre)
      const wastePercentage = Math.abs(nearestRollWidth.width - widthNum) / nearestRollWidth.width * 10;
      const wasteAmount = basePrice * (wastePercentage / 100);
      const priceWithWaste = basePrice + wasteAmount;

      // KDV
      const vatRate = customerData?.vat_rate || 20;
      const vatAmount = priceWithWaste * (vatRate / 100);
      const totalPrice = priceWithWaste + vatAmount;

      setCalculationResult({
        dimensions: `${widthNum} x ${heightNum} cm`,
        areaPerPiece: areaM2.toFixed(4),
        totalArea: totalAreaM2.toFixed(4),
        nearestRollWidth: nearestRollWidth.width,
        wastePercentage: wastePercentage.toFixed(2),
        basePrice: basePrice.toFixed(2),
        wasteAmount: wasteAmount.toFixed(2),
        priceWithWaste: priceWithWaste.toFixed(2),
        vatRate: vatRate,
        vatAmount: vatAmount.toFixed(2),
        totalPrice: totalPrice.toFixed(2)
      });

    } catch (error) {
      console.error('Calculation error:', error);
      alert('Hesaplama sırasında hata oluştu');
    } finally {
      setCalculating(false);
    }
  };

  const handleOrder = async () => {
    if (!calculationResult) {
      alert('Lütfen önce fiyat hesaplayın');
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `DIG-${Date.now()}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id,
          order_number: orderNumber,
          product_type: productType,
          weight: parseFloat(weight),
          dimensions: calculationResult.dimensions,
          size_type: 'custom',
          quantity: parseInt(quantity),
          total_price: parseFloat(calculationResult.totalPrice),
          vat_rate: calculationResult.vatRate,
          status: 'pending',
          customer_note: customerNote || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Email gönder
      try {
        await supabase.functions.invoke('send-order-email', {
          body: {
            order: {
              order_number: orderNumber,
              customer_name: `${customerData?.first_name} ${customerData?.last_name}`,
              company_name: customerData?.company_name || '-',
              product_type: productType,
              dimensions: calculationResult.dimensions,
              weight: parseFloat(weight),
              quantity: parseInt(quantity),
              size_type: 'custom',
              total_price: calculationResult.totalPrice,
              phone: customerData?.phone || '-',
              email: customerData?.email || user?.email || '-',
              customer_note: customerNote || '-',
              created_at: new Intl.DateTimeFormat('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date())
            }
          }
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      setOrderSuccess(true);
      
      setTimeout(() => {
        onNavigate('profile');
      }, 2000);

    } catch (error: any) {
      console.error('Order error:', error);
      alert('Sipariş oluşturulurken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetCalculation = () => {
    setCalculationResult(null);
    setCustomerNote('');
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sipariş Oluşturuldu!
          </h2>
          <p className="text-gray-600 mb-4">
            Siparişiniz başarıyla oluşturuldu. Profilinize yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

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
                Ürün Tipi
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                {productTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Gramaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gramaj
              </label>
              <select
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                {weights.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* Özel Ebat - En ve Boy */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  En (cm)
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
                  Boy (cm)
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

            {/* Adet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adet
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Hesapla Butonu */}
            <button
              onClick={calculatePrice}
              disabled={calculating || !productType || !weight || !width || !height || !quantity}
              className="w-full bg-yellow-500 text-white py-3 px-6 rounded-full font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {calculating ? 'Hesaplanıyor...' : 'Fiyat Hesapla'}
            </button>
          </div>
        </div>

        {/* Hesaplama Sonucu */}
        {calculationResult && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Fiyat Detayları
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ebat</span>
                <span className="font-semibold text-gray-900">{calculationResult.dimensions}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Adet Başı Alan</span>
                <span className="font-semibold text-gray-900">{calculationResult.areaPerPiece} m²</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Toplam Alan</span>
                <span className="font-semibold text-gray-900">{calculationResult.totalArea} m²</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Temel Fiyat</span>
                <span className="font-semibold text-gray-900">{calculationResult.basePrice} TL</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Fire (%{calculationResult.wastePercentage})</span>
                <span className="font-semibold text-gray-900">{calculationResult.wasteAmount} TL</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ara Toplam</span>
                <span className="font-semibold text-gray-900">{calculationResult.priceWithWaste} TL</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">KDV (%{calculationResult.vatRate})</span>
                <span className="font-semibold text-gray-900">{calculationResult.vatAmount} TL</span>
              </div>
              <div className="flex justify-between py-3 bg-yellow-50 rounded-xl px-4 mt-4">
                <span className="text-lg font-semibold text-gray-900">Toplam Fiyat</span>
                <span className="text-xl font-bold text-yellow-600">{calculationResult.totalPrice} TL</span>
              </div>
            </div>

            {/* Not Alanı */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sipariş Notu (Opsiyonel)
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={3}
                placeholder="Siparişiniz hakkında eklemek istediğiniz notlar..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Butonlar */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={resetCalculation}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Yeniden Hesapla
              </button>
              <button
                onClick={handleOrder}
                disabled={loading}
                className="px-6 py-3 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300"
              >
                {loading ? 'Sipariş Oluşturuluyor...' : 'Sipariş Oluştur'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
