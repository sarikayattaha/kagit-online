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
    if (user) {
      fetchCustomerData();
      if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [user, activeTab]);

  // URL'den tab parametresini oku
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('tab=orders')) {
      setActiveTab('orders');
    }
  }, []);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setCustomerData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user?.email || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
          tax_number: data.tax_number || '',
          tax_office: data.tax_office || '',
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .neq('status', 'cancelled') // İptal edilenleri gösterme
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
    const confirmed = window.confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?');
    
    if (!confirmed) return;

    try {
      setCancellingOrder(orderId);

      // Sipariş bilgilerini al
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Müşteri bilgilerini al
      const { data: customerData } = await supabase
        .from('customers')
        .select('first_name, last_name, company_name, phone, email')
        .eq('id', user?.id)
        .single();

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

    // Validasyon
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('Yeni şifre en az 6 karakter olmalıdır');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('Yeni şifreler eşleşmiyor');
      setPasswordLoading(false);
      return;
    }

    try {
      // Önce mevcut şifre ile tekrar giriş yaparak doğrula
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error('Mevcut şifreniz yanlış');
      }

      // Yeni şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordMessage('✅ Şifreniz başarıyla güncellendi!');
      
      // Formu temizle
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => setPasswordMessage(''), 5000);
    } catch (error: any) {
      setPasswordMessage(error.message || 'Şifre güncellenirken hata oluştu');
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Hesabım</h1>
            <p className="text-blue-100">Profil bilgilerinizi ve siparişlerinizi yönetin</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  window.history.replaceState({}, '', '#profile');
                }}
                className={`px-8 py-4 font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profil Bilgilerim</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  window.history.replaceState({}, '', '#profile?tab=orders');
                }}
                className={`px-8 py-4 font-semibold transition-colors ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Siparişlerim</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('başarıyla') || message.includes('güncellendi')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* Profil Tab */}
            {activeTab === 'profile' && (
              <>
                {/* Mevcut Bilgiler - Kartlar */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <User className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-semibold text-gray-900">Kişisel Bilgiler</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">Ad</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.first_name}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">Soyad</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.last_name}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">E-posta</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.email}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">Telefon</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.phone}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">Şirket Adı</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.company_name}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">Vergi Numarası</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.tax_number}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-600">Vergi Dairesi</label>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{customerData.tax_office}</p>
                    </div>
                  </div>
                </div>

                {/* Düzenleme Formu */}
                <div className="border-t pt-8 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bilgileri Düzenle</h2>

                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Ad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerData.first_name}
                          onChange={(e) => setCustomerData({ ...customerData, first_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Soyad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerData.last_name}
                          onChange={(e) => setCustomerData({ ...customerData, last_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        E-posta <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          disabled={loading}
                        />
                      </div>
                      {customerData.email !== user?.email && (
                        <p className="text-sm text-amber-600 mt-2 flex items-start space-x-1">
                          <span>⚠️</span>
                          <span>E-posta değişikliği için yeni e-posta adresinize onay linki gönderilecektir.</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Şirket Adı <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerData.company_name}
                          onChange={(e) => setCustomerData({ ...customerData, company_name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Telefon <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            value={customerData.phone}
                            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Vergi Numarası <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={customerData.tax_number}
                            onChange={(e) => setCustomerData({ ...customerData, tax_number: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Vergi Dairesi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerData.tax_office}
                          onChange={(e) => setCustomerData({ ...customerData, tax_office: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="Örn: Kadıköy Vergi Dairesi"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <Save className="h-5 w-5" />
                      <span>{loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                    </button>
                  </form>
                </div>

                {/* Şifre Değiştirme Bölümü */}
                <div className="border-t pt-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <Lock className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-semibold text-gray-900">Şifre Değiştir</h2>
                  </div>

                  {passwordMessage && (
                    <div className={`mb-6 p-4 rounded-lg ${
                      passwordMessage.includes('✅') || passwordMessage.includes('başarıyla')
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {passwordMessage}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Mevcut Şifre <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          disabled={passwordLoading}
                          placeholder="Mevcut şifrenizi girin"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Yeni Şifre <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          minLength={6}
                          disabled={passwordLoading}
                          placeholder="En az 6 karakter"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Minimum 6 karakter olmalıdır</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Yeni Şifre Tekrar <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          required
                          minLength={6}
                          disabled={passwordLoading}
                          placeholder="Yeni şifrenizi tekrar girin"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <Lock className="h-5 w-5" />
                      <span>{passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Siparişler Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-semibold text-gray-900">Siparişlerim</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{orders.length} sipariş</span>
                    <button
                      onClick={fetchOrders}
                      disabled={ordersLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                    >
                      <RefreshCw className={`h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                      <span>Yenile</span>
                    </button>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Siparişler yükleniyor...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Henüz siparişiniz bulunmuyor</p>
                    <p className="text-gray-500 text-sm mt-2">Fiyat hesaplama sayfasından sipariş oluşturabilirsiniz</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusInfo = getStatusInfo(order.status);
                      const StatusIcon = statusInfo.icon;
                      const canCancel = order.status === 'pending';
                      
                      return (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-lg font-bold text-gray-900">#{order.order_number}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.color}`}>
                                <StatusIcon className="h-4 w-4" />
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ürün</p>
                              <p className="text-sm font-semibold text-gray-900">{order.product_type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ebat</p>
                              <p className="text-sm font-semibold text-gray-900">{order.dimensions} cm</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Gramaj</p>
                              <p className="text-sm font-semibold text-gray-900">{order.weight} gr/m²</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Miktar</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.quantity} {order.size_type === 'standard' ? 'paket' : 'tabaka'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Ara Toplam (KDV Hariç)</span>
                                <span className="font-semibold text-gray-900">
                                  {calculatePrices(order.total_price, order.vat_rate || 20).priceWithoutVat.toFixed(2)} ₺
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">KDV (%{order.vat_rate || 20})</span>
                                <span className="font-semibold text-gray-900">
                                  {calculatePrices(order.total_price, order.vat_rate || 20).vatAmount.toFixed(2)} ₺
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <span className="text-sm font-semibold text-gray-900">Toplam Tutar (KDV Dahil)</span>
                              <div className="text-right flex items-center space-x-3">
                                <span className="text-2xl font-bold text-green-600">{order.total_price.toFixed(2)} ₺</span>
                                {canCancel && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id, order.order_number)}
                                    disabled={cancellingOrder === order.id}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors flex items-center space-x-1"
                                  >
                                    {cancellingOrder === order.id ? (
                                      <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>İptal Ediliyor...</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4" />
                                        <span>İptal Et</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
