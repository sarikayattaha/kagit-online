import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ShoppingCart, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface StickerOrderPageProps {
  onNavigate: (page: string) => void;
}

interface StickerProduct {
  id: string;
  brand: string;
  type: string;
  price_per_sheet: number;
  vat_rate: number;
  moq: number;
  stock_quantity: number;
}

export default function StickerOrderPage({ onNavigate }: StickerOrderPageProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<StickerProduct[]>([]);
  const [eurRate, setEurRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<StickerProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!user) {
      onNavigate('customer-login');
      return;
    }
    fetchData();
  }, [user, onNavigate]);

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('sticker_products')
        .select('*')
        .eq('is_active', true)
        .order('brand');

      if (productsError) throw productsError;

      // Fetch EUR rate
      const { data: rateData, error: rateError } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('currency', 'EUR')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rateError) throw rateError;

      setProducts(productsData || []);
      setEurRate(rateData?.rate || 35);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!selectedProduct) return { subtotal: 0, vat: 0, total: 0 };

    const subtotalEur = selectedProduct.price_per_sheet * quantity;
    const subtotalTry = subtotalEur * eurRate;
    const vatAmount = (subtotalTry * selectedProduct.vat_rate) / 100;
    const total = subtotalTry + vatAmount;

    return {
      subtotal: subtotalTry,
      vat: vatAmount,
      total: total
    };
  };

  const handleOrder = () => {
    if (!selectedProduct) {
      alert('Lütfen bir ürün seçin');
      return;
    }

    if (quantity < selectedProduct.moq) {
      alert(`Minimum ${selectedProduct.moq} tabaka sipariş verebilirsiniz`);
      return;
    }

    if (quantity > selectedProduct.stock_quantity) {
      alert(`Stokta sadece ${selectedProduct.stock_quantity} tabaka mevcut`);
      return;
    }

    const price = calculatePrice();

    // Store order data in localStorage
    localStorage.setItem('pendingOrder', JSON.stringify({
      orderType: 'sticker',
      productId: selectedProduct.id,
      productDetails: {
        brand: selectedProduct.brand,
        type: selectedProduct.type,
        pricePerSheet: selectedProduct.price_per_sheet
      },
      quantity: quantity,
      vatRate: selectedProduct.vat_rate,
      eurRate: eurRate,
      pricing: price
    }));

    onNavigate('order-confirmation');
  };

  // Seçilen ürün değiştiğinde minimum miktarı ayarla
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(selectedProduct.moq);
    }
  }, [selectedProduct]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const price = calculatePrice();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center text-pink-600 hover:text-pink-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sticker Siparişi</h1>
          <p className="text-gray-600">Tabaka bazında satış yapılmaktadır</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Ürün Seçimi</h2>
              
              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Henüz ürün bulunmamaktadır</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProduct?.id === product.id
                          ? 'border-pink-600 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {product.brand} - {product.type}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            KDV: %{product.vat_rate}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <p className="text-sm text-gray-500">
                              Min. Sipariş: {product.moq} tabaka
                            </p>
                            <p className="text-sm text-gray-500">
                              Stok: {product.stock_quantity} tabaka
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-pink-600">
                            €{product.price_per_sheet.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            ≈ ₺{(product.price_per_sheet * eurRate).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">tabaka başına</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Sipariş Özeti</h2>
              
              {selectedProduct ? (
                <>
                  <div className="mb-6 p-4 bg-pink-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {selectedProduct.brand}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedProduct.type}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miktar (Tabaka)
                    </label>
                    <input
                      type="number"
                      min={selectedProduct.moq}
                      max={selectedProduct.stock_quantity}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || selectedProduct.moq;
                        setQuantity(Math.max(selectedProduct.moq, val));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum: {selectedProduct.moq} tabaka | Maksimum: {selectedProduct.stock_quantity} tabaka
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Ara Toplam (KDV Hariç)</span>
                      <span className="font-semibold">₺{price.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>KDV (%{selectedProduct.vat_rate})</span>
                      <span className="font-semibold">₺{price.vat.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                      <span>Toplam</span>
                      <span className="text-pink-600">₺{price.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleOrder}
                    className="w-full mt-6 bg-pink-600 text-white py-4 rounded-lg font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Siparişi Onayla
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Döviz Kuru: €1 = ₺{eurRate.toFixed(4)}
                  </p>
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
    </div>
  );
}
