import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calculator, Package, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CalculatorPageProps {
  onNavigate: (page: string) => void;
}

interface FormData {
  calculationType: 'standard' | 'custom';
  productType: string;
  standardSize: string;
  rollWidth: number;
  length: number;
  weight: number;
  packageCount: number;
}

interface CalculationResult {
  rollArea: number;
  sheetArea: number;
  sheetsPerRoll: number;
  totalSheets: number;
  pricePerSheet: number;
  pricePerRoll: number;
  subtotal: number;
  vatAmount: number;
  totalWithVat: number;
}

interface RollWidth {
  id: string;
  width_cm: number;
  is_active: boolean;
}

interface ExchangeRate {
  eur_rate: number;
  usd_rate: number;
}

interface PriceFormula {
  id: string;
  product_type: string;
  base_price_eur: number;
  weight_factor: number;
  vat_rate: number;
  is_active: boolean;
}

const STANDARD_SIZES = [
  { label: '70x100 cm', width: 70, length: 100 },
  { label: '72x102 cm', width: 72, length: 102 },
];

export default function CalculatorPage({ onNavigate }: CalculatorPageProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    calculationType: 'standard',
    productType: '1. Hamur (80-120gr)',
    standardSize: '70x100 cm',
    rollWidth: 70,
    length: 100,
    weight: 80,
    packageCount: 1,
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [rollWidths, setRollWidths] = useState<RollWidth[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [priceFormula, setPriceFormula] = useState<PriceFormula | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.calculationType === 'standard') {
      const selectedSize = STANDARD_SIZES.find(s => s.label === formData.standardSize);
      if (selectedSize) {
        setFormData(prev => ({
          ...prev,
          rollWidth: selectedSize.width,
          length: selectedSize.length
        }));
      }
    }
  }, [formData.calculationType, formData.standardSize]);

  const fetchData = async () => {
    try {
      // Fetch roll widths
      const { data: widthsData, error: widthsError } = await supabase
        .from('roll_widths')
        .select('*')
        .eq('is_active', true)
        .order('width_cm');

      if (widthsError) throw widthsError;
      setRollWidths(widthsData || []);

      // Fetch exchange rate for EUR
      const { data: rateData, error: rateError } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('currency', 'EUR')
        .single();

      if (rateError) throw rateError;
      setExchangeRate(rateData.rate);

      // Fetch price formula for 1. Hamur
      const { data: formulaData, error: formulaError } = await supabase
        .from('price_formulas')
        .select('*')
        .eq('product_type', '1. Hamur (80-120gr)')
        .eq('is_active', true)
        .single();

      if (formulaError) throw formulaError;
      setPriceFormula(formulaData);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!priceFormula || !exchangeRate) {
      alert('Fiyat formülü veya döviz kuru yüklenemedi');
      return;
    }

    // Calculate roll and sheet areas
    const rollArea = formData.rollWidth * formData.length;
    const sheetArea = 70 * 100; // Standard A4-like sheet size
    const sheetsPerRoll = Math.floor(rollArea / sheetArea);
    const totalSheets = sheetsPerRoll * formData.packageCount;

    // Calculate price per sheet in EUR
    const basePriceEur = priceFormula.base_price_eur;
    const weightFactor = priceFormula.weight_factor;
    const pricePerSheetEur = basePriceEur * (1 + (formData.weight - 80) * weightFactor);
    
    // Convert to TRY
    const pricePerSheetTry = pricePerSheetEur * exchangeRate;
    const pricePerRollTry = pricePerSheetTry * sheetsPerRoll;
    
    // Calculate totals
    const subtotal = pricePerRollTry * formData.packageCount;
    const vatAmount = subtotal * (priceFormula.vat_rate / 100);
    const totalWithVat = subtotal + vatAmount;

    setResult({
      rollArea,
      sheetArea,
      sheetsPerRoll,
      totalSheets,
      pricePerSheet: pricePerSheetTry,
      pricePerRoll: pricePerRollTry,
      subtotal,
      vatAmount,
      totalWithVat,
    });
  };

  const handleSubmitOrder = () => {
    if (!result) {
      alert('Lütfen önce fiyat hesaplaması yapın');
      return;
    }

    // Store order data in localStorage
    localStorage.setItem('pendingOrder', JSON.stringify({
      orderType: 'standard',
      productType: formData.productType,
      width: formData.rollWidth,
      length: formData.length,
      weight: formData.weight,
      quantity_value: formData.packageCount,
      total_price: result.subtotal,
      vat_amount: result.vatAmount,
      total_with_vat: result.totalWithVat
    }));

    // Navigate to order confirmation
    onNavigate('order-confirmation');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <Calculator className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Fiyat Hesaplama
          </h1>
          <p className="text-xl text-gray-600">
            Ürün özelliklerinize göre anlık fiyat hesaplayın
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculation Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Hesaplama Formu</h2>

            {/* Calculation Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ebat Tipi *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, calculationType: 'standard' })}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    formData.calculationType === 'standard'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  📏 Standart Ebat
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, calculationType: 'custom' })}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    formData.calculationType === 'custom'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  🎨 Özel Ebat
                </button>
              </div>
            </div>

            {/* Product Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Ürün Türü *
              </label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1. Hamur (80-120gr)">1. Hamur (80-120gr)</option>
                <option value="2. Hamur (50-70gr)">2. Hamur (50-70gr)</option>
              </select>
            </div>

            {/* Size Selection */}
            {formData.calculationType === 'standard' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Standart Ebat *
                </label>
                <select
                  value={formData.standardSize}
                  onChange={(e) => setFormData({ ...formData, standardSize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STANDARD_SIZES.map(size => (
                    <option key={size.label} value={size.label}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genişlik (cm) *
                  </label>
                  <select
                    value={formData.rollWidth}
                    onChange={(e) => setFormData({ ...formData, rollWidth: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {rollWidths.map(width => (
                      <option key={width.id} value={width.width_cm}>
                        {width.width_cm} cm
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boy (cm) *
                  </label>
                  <input
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Weight */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. Gramaj *
              </label>
              <select
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={80}>80 gr/m²</option>
                <option value={90}>90 gr/m²</option>
                <option value={100}>100 gr/m²</option>
                <option value={115}>115 gr/m²</option>
                <option value={120}>120 gr/m²</option>
              </select>
            </div>

            {/* Package Count */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4. Paket Adeti *
              </label>
              <input
                type="number"
                value={formData.packageCount}
                onChange={(e) => setFormData({ ...formData, packageCount: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-2">
                1 pakette 500 tabaka var
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Fiyat Hesapla
            </button>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Fiyat Özeti</h2>

            {result ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Ürün Türü</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formData.productType}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm text-gray-500 mb-1">Ebat</h3>
                      <p className="text-base font-medium">
                        {formData.rollWidth}x{formData.length} cm
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm text-gray-500 mb-1">Gramaj</h3>
                      <p className="text-base font-medium">{formData.weight} gr/m²</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Paket Başına Tabaka</h3>
                    <p className="text-base font-medium">{result.sheetsPerRoll} adet</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Paket Adedi</h3>
                    <p className="text-base font-medium">
                      {formData.packageCount} paket
                      <span className="text-sm text-gray-500 ml-2">
                        ({formData.packageCount} pakette {result.totalSheets} tabaka var)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Ürün Tutarı (KDV Hariç)</span>
                    <span className="font-semibold">₺{result.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>KDV (%20)</span>
                    <span className="font-semibold">₺{result.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₺{result.totalWithVat.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">+KDV Dahil</p>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Sipariş Ver
                </button>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Lütfen bir ürün seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
