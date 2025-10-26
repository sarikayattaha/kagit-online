import { useState, useEffect } from 'react';
import { CheckCircle, MapPin, Phone, ArrowLeft, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OrderConfirmationPageProps {
  onNavigate: (page: string) => void;
}

interface OrderData {
  product_type: string;
  weight: number;
  dimensions: string;
  size_type: 'standard' | 'custom';
  roll_width: number | null;
  custom_height: number | null;
  quantity: number;
  sheets_per_package: number;
  unit_price: number;
  total_price: number;
  currency: string;
  vat_rate?: number;
}

export default function OrderConfirmationPage({ onNavigate }: OrderConfirmationPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const [addressData, setAddressData] = useState({
    delivery_address: '',
    delivery_city: '',
    delivery_district: '',
    delivery_phone: '',
    order_notes: '',
  });

  const calculatePrices = (totalPrice: number, vatRate: number) => {
    // Güvenli sayıya dönüştür
    const safeTotalPrice = parseFloat(String(totalPrice)) || 0;
    const safeVatRate = parseFloat(String(vatRate)) || 20;
    
    // total_price KDV dahil olarak kabul ediyoruz
    const priceWithVat = safeTotalPrice;
    const priceWithoutVat = priceWithVat / (1 + safeVatRate / 100);
    const vatAmount = priceWithVat - priceWithoutVat;

    return {
      priceWithoutVat,
      vatAmount,
      priceWithVat
    };
  };

  useEffect(() => {
    // LocalStorage'dan sipariş bilgilerini oku
    const savedOrderData = localStorage.getItem('pendingOrder');
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData));
    } else {
      // Eğer sipariş bilgisi yoksa hesaplama sayfasına yönlendir
      onNavigate('calculator');
    }

    // Müşteri bilgilerini yükle
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('phone')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setAddressData(prev => ({
          ...prev,
          delivery_phone: data.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderData || !user) {
      setMessage({ type: 'error', text: 'Sipariş bilgileri eksik!' });
      return;
    }

    setLoading(true);

    try {
      // Siparişi oluştur
      const completeOrderData = {
        customer_id: user.id,
        ...orderData,
        ...addressData,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([completeOrderData])
        .select()
        .single();

      if (error) throw error;

      // Müşteri bilgilerini al
      const { data: customerData } = await supabase
        .from('customers')
        .select('first_name, last_name, company_name, phone, email')
        .eq('id', user.id)
        .single();

      // Email gönder
      try {
        await supabase.functions.invoke('send-order-email', {
          body: {
            order: {
              order_number: data.order_number,
              customer_name: customerData 
                ? `${customerData.first_name} ${customerData.last_name}` 
                : 'Müşteri',
              company_name: customerData?.company_name || '-',
              product_type: orderData.product_type,
              dimensions: orderData.dimensions,
              weight: orderData.weight,
              quantity: orderData.quantity,
              size_type: orderData.size_type,
              total_price: orderData.total_price.toFixed(2),
              phone: customerData?.phone || '-',
              email: customerData?.email || user.email,
              // Adres bilgileri
              delivery_address: addressData.delivery_address,
              delivery_city: addressData.delivery_city,
              delivery_district: addressData.delivery_district,
              delivery_phone: addressData.delivery_phone,
              order_notes: addressData.order_notes,
            }
          }
        });
      } catch (emailError) {
        console.error('Email gönderme hatası:', emailError);
      }

      // LocalStorage'ı temizle
      localStorage.removeItem('pendingOrder');

      setMessage({ 
        type: 'success', 
        text: `Sipariş başarıyla oluşturuldu! Sipariş No: ${data.order_number}` 
      });

      // 3 saniye sonra siparişler sayfasına yönlendir
      setTimeout(() => {
        onNavigate('orders');
      }, 3000);

    } catch (error: any) {
      console.error('Order creation error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Sipariş oluşturulurken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const prices = calculatePrices(orderData.total_price, orderData.vat_rate || 20);
  
  // Debug için
  console.log('OrderData:', orderData);
  console.log('Total Price:', orderData.total_price, typeof orderData.total_price);
  console.log('VAT Rate:', orderData.vat_rate, typeof orderData.vat_rate);
  console.log('Calculated Prices:', prices);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('calculator')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Geri Dön</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Sipariş Onayı</h1>
          <p className="text-gray-600 mt-2">Sipariş bilgilerinizi kontrol edin ve teslimat adresinizi girin</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Package className="h-5 w-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sipariş Özeti */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Package className="h-6 w-6 text-blue-600" />
              <span>Sipariş Özeti</span>
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Ürün Türü</p>
                <p className="font-bold text-lg text-gray-900">{orderData.product_type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Ebat</p>
                  <p className="font-semibold text-gray-900">{orderData.dimensions} cm</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Gramaj</p>
                  <p className="font-semibold text-gray-900">{orderData.weight} gr/m²</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  {orderData.size_type === 'custom' ? 'Tabaka Sayısı' : 'Paket Adedi'}
                </p>
                <p className="font-semibold text-gray-900">
                  {orderData.quantity} {orderData.size_type === 'standard' ? 'paket' : 'tabaka'}
                </p>
                {orderData.size_type === 'standard' && (
                  <p className="text-xs text-gray-500 mt-1">
                    (1 pakette {orderData.sheets_per_package} tabaka)
                  </p>
                )}
              </div>

              {/* Fiyat Detayları */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Ara Toplam (KDV Hariç)</span>
                  <span className="font-semibold text-gray-900">
                    {prices.priceWithoutVat.toFixed(2)} ₺
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">KDV (%{orderData.vat_rate || 20})</span>
                  <span className="font-semibold text-gray-900">
                    {prices.vatAmount.toFixed(2)} ₺
                  </span>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 mt-4">
                  <p className="text-sm opacity-90 mb-1">Toplam Tutar</p>
                  <p className="text-3xl font-bold">{orderData.total_price.toFixed(2)} ₺</p>
                  <p className="text-xs opacity-75 mt-1">+KDV Dahil</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teslimat Adresi Formu */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <span>Teslimat Bilgileri</span>
            </h2>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={addressData.delivery_phone}
                    onChange={(e) => setAddressData({ ...addressData, delivery_phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Teslimat Adresi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={addressData.delivery_address}
                  onChange={(e) => setAddressData({ ...addressData, delivery_address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={3}
                  required
                  placeholder="Cadde, sokak, bina no, daire no"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    İlçe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressData.delivery_district}
                    onChange={(e) => setAddressData({ ...addressData, delivery_district: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    İl <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressData.delivery_city}
                    onChange={(e) => setAddressData({ ...addressData, delivery_city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Sipariş Notları (Opsiyonel)
                </label>
                <textarea
                  value={addressData.order_notes}
                  onChange={(e) => setAddressData({ ...addressData, order_notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={3}
                  placeholder="Siparişiniz hakkında özel notlarınız varsa buraya yazabilirsiniz"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sipariş Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Siparişi Onayla</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
