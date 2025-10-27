import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Package, MapPin, Phone, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';

interface OrderConfirmationPageProps {
  onNavigate: (page: string) => void;
}

interface PendingOrder {
  orderType?: 'standard' | 'a4' | 'sticker';
  productId?: string;
  productDetails?: any;
  quantity?: number;
  vatRate?: number;
  eurRate?: number;
  pricing?: {
    subtotal: number;
    vat: number;
    total: number;
  };
  // Standard order fields
  productType?: string;
  width?: number;
  length?: number;
  weight?: number;
  quantity_value?: number;
  total_price?: number;
  vat_amount?: number;
  total_with_vat?: number;
}

export default function OrderConfirmationPage({ onNavigate }: OrderConfirmationPageProps) {
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) {
      onNavigate('customer-login');
      return;
    }

    // Load pending order from localStorage
    const pendingOrderJson = localStorage.getItem('pendingOrder');
    if (!pendingOrderJson) {
      alert('Sipariş bilgisi bulunamadı');
      onNavigate('home');
      return;
    }

    try {
      const data = JSON.parse(pendingOrderJson);
      setOrderData(data);
      
      // Load saved contact info if available
      const savedPhone = localStorage.getItem('userPhone');
      const savedAddress = localStorage.getItem('userAddress');
      const savedDistrict = localStorage.getItem('userDistrict');
      const savedProvince = localStorage.getItem('userProvince');
      
      if (savedPhone) setPhone(savedPhone);
      if (savedAddress) setAddress(savedAddress);
      if (savedDistrict) setDistrict(savedDistrict);
      if (savedProvince) setProvince(savedProvince);
    } catch (error) {
      console.error('Error parsing order data:', error);
      alert('Sipariş bilgisi okunamadı');
      onNavigate('home');
    }
  }, [user, onNavigate]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderData || !user) {
      alert('Sipariş bilgisi eksik');
      return;
    }

    if (!phone || !address || !district || !province) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setLoading(true);

    try {
      // Save contact info for future use
      localStorage.setItem('userPhone', phone);
      localStorage.setItem('userAddress', address);
      localStorage.setItem('userDistrict', district);
      localStorage.setItem('userProvince', province);

      let orderInsertData: any = {
        user_id: user.id,
        phone,
        delivery_address: address,
        district,
        province,
        notes: notes || null,
        status: 'pending'
      };

      // Handle different order types
      if (orderData.orderType === 'a4') {
        // A4 Order
        orderInsertData = {
          ...orderInsertData,
          order_type: 'a4',
          a4_product_id: orderData.productId,
          quantity: orderData.quantity,
          vat_rate: orderData.vatRate,
          eur_rate: orderData.eurRate,
          total_price: orderData.pricing?.subtotal || 0,
          vat_amount: orderData.pricing?.vat || 0,
          total_with_vat: orderData.pricing?.total || 0
        };
      } else if (orderData.orderType === 'sticker') {
        // Sticker Order
        orderInsertData = {
          ...orderInsertData,
          order_type: 'sticker',
          sticker_product_id: orderData.productId,
          quantity: orderData.quantity,
          vat_rate: orderData.vatRate,
          eur_rate: orderData.eurRate,
          total_price: orderData.pricing?.subtotal || 0,
          vat_amount: orderData.pricing?.vat || 0,
          total_with_vat: orderData.pricing?.total || 0
        };
      } else {
        // Standard/Calculator Order
        orderInsertData = {
          ...orderInsertData,
          order_type: 'standard',
          product_type: orderData.productType,
          width: orderData.width,
          length: orderData.length,
          weight: orderData.weight,
          quantity: orderData.quantity_value,
          total_price: orderData.total_price,
          vat_amount: orderData.vat_amount,
          total_with_vat: orderData.total_with_vat
        };
      }

      const { error } = await supabase
        .from('orders')
        .insert([orderInsertData]);

      if (error) throw error;

      // Clear the pending order
      localStorage.removeItem('pendingOrder');
      setOrderPlaced(true);

      // Redirect to profile/orders after 3 seconds
      setTimeout(() => {
        onNavigate('orders');
      }, 3000);

    } catch (error: any) {
      console.error('Error placing order:', error);
      alert('Sipariş oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const renderOrderDetails = () => {
    if (!orderData) return null;

    if (orderData.orderType === 'a4') {
      // A4 Order Details
      const { productDetails, quantity, pricing } = orderData;
      return (
        <>
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-1">Ürün Türü</h3>
            <p className="text-lg font-semibold text-gray-900">
              {productDetails.brand} - {productDetails.size}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Ebat</h3>
              <p className="text-base font-medium">{productDetails.size}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Gramaj</h3>
              <p className="text-base font-medium">{productDetails.weight} gr/m²</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-1">Paket Adedi</h3>
            <p className="text-base font-medium">
              {quantity} koli
              <span className="text-sm text-gray-500 ml-2">
                ({quantity} pakette {quantity * 5} tabaka var)
              </span>
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Ürün Tutarı (KDV Hariç)</span>
              <span className="font-semibold">₺{pricing?.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>KDV (%{orderData.vatRate})</span>
              <span className="font-semibold">₺{pricing?.vat.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t bg-green-50 -mx-6 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
              <span className="text-2xl font-bold text-green-600">
                ₺{pricing?.total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">+KDV Dahil</p>
          </div>
        </>
      );
    } else if (orderData.orderType === 'sticker') {
      // Sticker Order Details
      const { productDetails, quantity, pricing } = orderData;
      return (
        <>
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-1">Ürün Türü</h3>
            <p className="text-lg font-semibold text-gray-900">
              {productDetails.brand} - {productDetails.type}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-1">Miktar (Tabaka)</h3>
            <p className="text-base font-medium">{quantity} tabaka</p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Ara Toplam (KDV Hariç)</span>
              <span className="font-semibold">₺{pricing?.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>KDV (%{orderData.vatRate})</span>
              <span className="font-semibold">₺{pricing?.vat.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t bg-green-50 -mx-6 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
              <span className="text-2xl font-bold text-green-600">
                ₺{pricing?.total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">+KDV Dahil</p>
          </div>
        </>
      );
    } else {
      // Standard/Calculator Order Details
      return (
        <>
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-1">Ürün Türü</h3>
            <p className="text-lg font-semibold text-gray-900">
              {orderData.productType === '1. Hamur (80-120gr)' ? '1. Hamur (80-120gr)' : '2. Hamur (50-70gr)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Ebat</h3>
              <p className="text-base font-medium">{orderData.width}x{orderData.length} cm</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Gramaj</h3>
              <p className="text-base font-medium">{orderData.weight} gr/m²</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-1">Paket Adedi</h3>
            <p className="text-base font-medium">
              {orderData.quantity_value} paket
              <span className="text-sm text-gray-500 ml-2">
                ({orderData.quantity_value} pakette {orderData.quantity_value * 500} tabaka var)
              </span>
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Ürün Tutarı (KDV Hariç)</span>
              <span className="font-semibold">₺{(orderData.total_price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>KDV (%20)</span>
              <span className="font-semibold">₺{(orderData.vat_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t bg-green-50 -mx-6 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
              <span className="text-2xl font-bold text-green-600">
                ₺{(orderData.total_with_vat || 0).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">+KDV Dahil</p>
          </div>
        </>
      );
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Siparişiniz Alındı!
          </h2>
          <p className="text-gray-600 mb-6">
            Siparişiniz başarıyla oluşturuldu. En kısa sürede size dönüş yapacağız.
          </p>
          <p className="text-sm text-gray-500">
            Siparişlerim sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sipariş Onayı</h1>
        <p className="text-gray-600 mb-8">
          Sipariş bilgilerinizi kontrol edin ve teslimat adresinizi girin
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Sipariş Özeti</h2>
            </div>

            {renderOrderDetails()}
          </div>

          {/* Delivery Information Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Teslimat Bilgileri</h2>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="05000000001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teslimat Adresi *
                </label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cadde, sokak, bina no, daire no"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İlçe *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İl *
                  </label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Sipariş Notları (Opsiyonel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Siparişiniz hakkında özel notlarınız varsa buraya yazabilirsiniz"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
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
