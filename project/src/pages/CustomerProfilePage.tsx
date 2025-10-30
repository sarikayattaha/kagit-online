import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Building2, Phone, FileText, Mail, Save, Package, Clock, CheckCircle, XCircle, Truck, RefreshCw, Lock, Key } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  product_type: string;
  weight: number;
  dimensions: string;
  size_type: string;
  quantity: number;
  total_price: number;
  vat_rate: number;
  status: string;
  created_at: string;
}

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  const [customerData, setCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    phone: '',
    tax_number: '',
    tax_office: '',
    company_address: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // KDV hesaplama fonksiyonu
  const calculatePrices = (totalPrice: number, vatRate: number) => {
    const safeTotalPrice = parseFloat(String(totalPrice)) || 0;
    const safeVatRate = parseFloat(String(vatRate)) || 20;
    
    const netPrice = safeTotalPrice / (1 + safeVatRate / 100);
    const vatAmount = safeTotalPrice - netPrice;
    
    return {
      netPrice: netPrice.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      totalPrice: safeTotalPrice.toFixed(2)
    };
  };

  useEffect(() => {
    // URL'den tab parametresini oku
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const tab = urlParams.get('tab');
    if (tab === 'orders') {
      setActiveTab('orders');
    }

    fetchCustomerData();
    fetchOrders();
  }, []);

  const fetchCustomerData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCustomerData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
          tax_number: data.tax_number || '',
          tax_office: data.tax_office || '',
          company_address: data.company_address || '',
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setCancellingOrder(orderId);

      // Sipariş bilgilerini al
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Siparişi iptal et
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // İptal email'i gönder
      try {
        await supabase.functions.invoke('send-cancel-order-email', {
          body: {
            order: {
              order_number: orderNumber,
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
              email: customerData?.email || user?.email || '-',
              cancelled_at: new Intl.DateTimeFormat('tr-TR', {
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
        console.error('Email gönderme hatası:', emailError);
      }

      setMessage('Sipariş başarıyla iptal edildi!');
      
      // Siparişleri yenile
      await fetchOrders();

      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Order cancellation error:', error);
      setMessage('Sipariş iptal edilirken hata oluştu: ' + error.message);
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          company_name: customerData.company_name,
          phone: customerData.phone,
          tax_number: customerData.tax_number,
          tax_office: customerData.tax_office,
          company_address: customerData.company_address,
          email: customerData.email,
        })
        .eq('id', user?.id);

      if (customerError) throw customerError;

      if (customerData.email !== user?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: customerData.email,
        });

        if (authError) throw authError;

        setMessage('Bilgileriniz güncellendi! E-posta değişikliği için yeni e-posta adresinize gönderilen onay linkine tıklayın.');
      } else {
        setMessage('Bilgileriniz başarıyla güncellendi!');
      }

      await fetchCustomerData();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(error.message || 'Güncelleme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');

    try {
      // Şifre doğrulama
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Yeni şifreler eşleşmiyor');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('Yeni şifre en az 6 karakter olmalıdır');
      }

      // Mevcut şifre ile yeniden giriş yap
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error('Mevcut şifre hatalı');
      }

      // Yeni şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordMessage('Şifreniz başarıyla güncellendi!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => setPasswordMessage(''), 5000);
    } catch (error: any) {
      setPasswordMessage(error.message || 'Şifre güncelleme sırasında hata oluştu');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      processing: { label: 'Hazırlanıyor', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
      shipped: { label: 'Kargoda', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
      delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header - Apple Style */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Hesabım
          </h1>
          <p className="text-base text-gray-600">
            Profil bilgilerinizi ve siparişlerinizi yönetin
          </p>
        </div>

        {/* Tabs - Apple Style */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => {
                setActiveTab('profile');
                window.history.replaceState({}, '', '#profile');
              }}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profil Bilgilerim</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('orders');
                window.history.replaceState({}, '', '#profile?tab=orders');
              }}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                activeTab === 'orders'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Siparişlerim</span>
              </div>
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            message.includes('başarıyla') || message.includes('güncellendi')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Profil Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Kişisel Bilgiler Kartı */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Kişisel Bilgiler
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Ad</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.first_name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Soyad</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.last_name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">E-posta</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.email || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Telefon</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.phone || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Şirket Adı</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.company_name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Vergi Numarası</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.tax_number || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Vergi Dairesi</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.tax_office || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Şirket Adresi</label>
                  <p className="text-base font-semibold text-gray-900">{customerData.company_address || '-'}</p>
                </div>
              </div>

              {/* Güncelleme Formu */}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                    <input
                      type="text"
                      value={customerData.first_name}
                      onChange={(e) => setCustomerData({ ...customerData, first_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                    <input
                      type="text"
                      value={customerData.last_name}
                      onChange={(e) => setCustomerData({ ...customerData, last_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Adı</label>
                    <input
                      type="text"
                      value={customerData.company_name}
                      onChange={(e) => setCustomerData({ ...customerData, company_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Numarası</label>
                    <input
                      type="text"
                      value={customerData.tax_number}
                      onChange={(e) => setCustomerData({ ...customerData, tax_number: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Dairesi</label>
                    <input
                      type="text"
                      value={customerData.tax_office}
                      onChange={(e) => setCustomerData({ ...customerData, tax_office: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Adresi</label>
                  <textarea
                    value={customerData.company_address}
                    onChange={(e) => setCustomerData({ ...customerData, company_address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Şirket adresinizi giriniz..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Bilgileri Güncelle
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Şifre Değiştirme Kartı */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-gray-600" />
                Şifre Değiştir
              </h2>

              {passwordMessage && (
                <div className={`mb-4 p-4 rounded-xl border ${
                  passwordMessage.includes('başarıyla')
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {passwordMessage}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Key className="h-5 w-5 mr-2" />
                      Şifreyi Değiştir
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Siparişler Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Siparişler yükleniyor...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz sipariş yok</h3>
                <p className="text-gray-600">İlk siparişinizi oluşturmak için fiyat hesaplama aracını kullanın.</p>
              </div>
            ) : (
              orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                const prices = calculatePrices(order.total_price, order.vat_rate);
                
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Sipariş #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className={`mt-3 md:mt-0 inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ürün Tipi</p>
                        <p className="text-sm font-medium text-gray-900">{order.product_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ebat</p>
                        <p className="text-sm font-medium text-gray-900">{order.dimensions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Gramaj</p>
                        <p className="text-sm font-medium text-gray-900">{order.weight}gr</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Adet</p>
                        <p className="text-sm font-medium text-gray-900">{order.quantity}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Net Fiyat</span>
                        <span className="text-sm font-medium text-gray-900">{prices.netPrice} TL</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">KDV (%{order.vat_rate})</span>
                        <span className="text-sm font-medium text-gray-900">{prices.vatAmount} TL</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Toplam</span>
                        <span className="text-base font-bold text-gray-900">{prices.totalPrice} TL</span>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.order_number)}
                        disabled={cancellingOrder === order.id}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-full font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {cancellingOrder === order.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
                            İptal Ediliyor...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 inline mr-2" />
                            Siparişi İptal Et
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
