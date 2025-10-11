import { useState, useEffect } from 'react';
import { Scissors, Ruler, Calculator, Layers, Weight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  type: string;
  pricePerKg: number;
  currency: string;
}

interface CustomCutPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function CustomCutPage({ onNavigate }: CustomCutPageProps) {
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Kuşe Kağıt',
      type: 'Kuşe Kağıt',
      pricePerKg: 750,
      currency: 'USD'
    },
    {
      id: '2',
      name: 'Bristol Karton',
      type: 'Bristol Karton',
      pricePerKg: 800,
      currency: 'USD'
    },
    {
      id: '3',
      name: 'Hamur Kağıt',
      type: 'Hamur Kağıt',
      pricePerKg: 650,
      currency: 'USD'
    },
    {
      id: '4',
      name: 'Sticker',
      type: 'Sticker',
      pricePerKg: 900,
      currency: 'USD'
    },
  ]);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [gramaj, setGramaj] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [quantity, setQuantity] = useState('');
  const [usdToTry, setUsdToTry] = useState(43);

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('currency_pair', 'USD/TRY')
        .maybeSingle();

      if (error) {
        console.error('Error fetching exchange rate:', error);
        return;
      }

      if (data) {
        setUsdToTry(parseFloat(data.rate));
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  const calculatePrice = () => {
    if (!selectedProductData || !gramaj || !customHeight || !customWidth || !quantity) {
      return null;
    }

    const heightInMeters = parseFloat(customHeight) / 100;
    const widthInMeters = parseFloat(customWidth) / 100;
    const gramajInKg = parseFloat(gramaj) / 1000;
    const quantityValue = parseFloat(quantity);
    const pricePerKg = selectedProductData.pricePerKg / 1000;
    const exchangeRate = usdToTry;

    const totalPrice = heightInMeters * widthInMeters * gramajInKg * quantityValue * pricePerKg * exchangeRate;

    return {
      price: totalPrice.toFixed(2),
      currency: 'TRY'
    };
  };

  const handleGetQuote = () => {
    if (!selectedProduct) {
      alert('Lütfen bir kağıt türü seçin');
      return;
    }

    if (!gramaj) {
      alert('Lütfen gramaj girin');
      return;
    }

    if (!customHeight || !customWidth) {
      alert('Lütfen yükseklik ve genişlik bilgilerini girin');
      return;
    }

    if (!quantity) {
      alert('Lütfen tabaka adedi girin');
      return;
    }

    const height = parseFloat(customHeight);
    const width = parseFloat(customWidth);
    const gramajValue = parseFloat(gramaj);
    const qty = parseFloat(quantity);

    if (isNaN(height) || isNaN(width) || isNaN(gramajValue) || isNaN(qty) || height <= 0 || width <= 0 || gramajValue <= 0 || qty <= 0) {
      alert('Lütfen geçerli değerler girin');
      return;
    }

    const calculation = calculatePrice();

    if (onNavigate && calculation) {
      onNavigate('calculator', {
        product: selectedProductData,
        gramaj: gramajValue,
        customSize: `${height}x${width}`,
        height: height,
        width: width,
        quantity: qty,
        totalPrice: calculation.price,
        currency: calculation.currency
      });
    }
  };

  const height = parseFloat(customHeight) || 0;
  const width = parseFloat(customWidth) || 0;
  const hasValidDimensions = height > 0 && width > 0;

  const maxDimension = Math.max(width, height);
  const scale = maxDimension > 0 ? 300 / maxDimension : 1;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  const priceCalculation = calculatePrice();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Scissors className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Özel Kesim Hizmeti</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            İhtiyacınız olan özel ölçülerde kağıt kesimi yapıyoruz.
            İstediğiniz ölçü ve miktarda fiyat hesaplayın.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Özel Kesim Hesaplama</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Kağıt Türü <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Kağıt türü seçiniz</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Kağıt Gramajı (gr/m²) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={gramaj}
                    onChange={(e) => setGramaj(e.target.value)}
                    placeholder="Örnek: 350"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Yükseklik (cm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="Örnek: 65"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Genişlik (cm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="Örnek: 70"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tabaka Adedi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Örnek: 100"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {hasValidDimensions && (
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
              )}

              {priceCalculation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Tahmini Fiyat</span>
                    <span className="text-3xl font-bold text-green-600">
                      {priceCalculation.price} {priceCalculation.currency}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGetQuote}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Calculator className="h-5 w-5" />
                <span>Teklif Al</span>
              </button>
            </div>

          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Özel Kesim Avantajları</h2>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">İhtiyacınıza özel ölçülerde kesim</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">Fire oranını minimize edin</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">Maliyet optimizasyonu</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">Hızlı üretim ve teslimat</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">Her türlü ebatta üretim imkanı</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md p-8 text-white">
              <h3 className="text-xl font-bold mb-2">Toplu Sipariş Avantajı</h3>
              <p className="text-blue-100 mb-4">
                Özel kesim siparişlerinizde toplu alımlarda özel indirim fırsatlarından yararlanın.
              </p>
              <p className="text-sm text-blue-100">
                Detaylı bilgi için bizimle iletişime geçin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
