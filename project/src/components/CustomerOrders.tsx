import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Order {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  notes: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Siparişler yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('customer_id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Sipariş iptal edildi' });
      fetchOrders();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Sipariş iptal edilirken hata oluştu: ' + error.message });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'processing':
        return <Truck className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'processing':
        return 'İşleniyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Siparişler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Henüz siparişiniz bulunmamaktadır</p>
          <p className="text-sm text-gray-500">Fiyat hesaplama sayfasından sipariş verebilirsiniz</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.product_name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="text-sm font-semibold">{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sipariş Detayları</p>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-semibold">Miktar:</span> {order.quantity} adet</p>
                    <p className="text-sm"><span className="font-semibold">Birim Fiyat:</span> {order.unit_price.toFixed(2)} TL</p>
                    <p className="text-sm"><span className="font-semibold">Toplam:</span> {order.total_price.toFixed(2)} TL</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Teslimat Adresi</p>
                  <div className="space-y-1">
                    <p className="text-sm">{order.shipping_address}</p>
                    <p className="text-sm">{order.shipping_city} {order.shipping_postal_code}</p>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Notlar</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              {(order.status === 'pending' || order.status === 'processing') && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-50 flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>{cancellingOrderId === order.id ? 'İptal ediliyor...' : 'Siparişi İptal Et'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
