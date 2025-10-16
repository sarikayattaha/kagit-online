import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Building2, Phone, FileText, Mail, Save } from 'lucide-react';

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [customerData, setCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    phone: '',
    tax_number: '',
  });

  useEffect(() => {
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

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
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Önce customers tablosunu güncelle
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          company_name: customerData.company_name,
          phone: customerData.phone,
          tax_number: customerData.tax_number,
          email: customerData.email,
        })
        .eq('id', user?.id);

      if (customerError) throw customerError;

      // Eğer e-posta değiştiyse, auth.users tablosunu da güncelle
      if (customerData.email !== user?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: customerData.email,
        });

        if (authError) throw authError;

        setMessage('Bilgileriniz güncellendi! E-posta değişikliği için yeni e-posta adresinize gönderilen onay linkine tıklayın.');
      } else {
        setMessage('Bilgileriniz başarıyla güncellendi!');
      }

      // Sayfayı yenile
      await fetchCustomerData();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(error.message || 'Güncelleme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Hesabım</h1>
            <p className="text-blue-100">Profil bilgilerinizi görüntüleyin ve güncelleyin</p>
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

            {/* Mevcut Bilgiler - Kartlar */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Kişisel Bilgiler</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ad Kartı */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Ad</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{customerData.first_name}</p>
                </div>

                {/* Soyad Kartı */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Soyad</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{customerData.last_name}</p>
                </div>

                {/* E-posta Kartı */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">E-posta</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{customerData.email}</p>
                </div>

                {/* Telefon Kartı */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Telefon</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{customerData.phone}</p>
                </div>

                {/* Şirket Kartı */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Şirket Adı</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{customerData.company_name}</p>
                </div>

                {/* Vergi No Kartı */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Vergi Numarası</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{customerData.tax_number}</p>
                </div>
              </div>
            </div>

            {/* Düzenleme Formu */}
            <div className="border-t pt-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}
