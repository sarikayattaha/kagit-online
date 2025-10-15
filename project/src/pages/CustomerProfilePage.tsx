import { useState, useEffect } from 'react';
import { User, Save, AlertCircle, CheckCircle, Package, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    taxNumber: ''
  });

  const [originalData, setOriginalData] = useState({ ...formData });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const profileInfo = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || user?.email || '',
          companyName: data.company_name || '',
          phone: data.phone || '',
          taxNumber: data.tax_number || ''
        };
        setFormData(profileInfo);
        setOriginalData(profileInfo);
      }
    } catch (error: any) {
      console.error('Profil yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Profil bilgileri yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setMessage(null);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setMessage({ type: 'error', text: 'Ad alanı zorunludur' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Soyad alanı zorunludur' });
      return false;
    }
    if (!formData.companyName.trim()) {
      setMessage({ type: 'error', text: 'Şirket adı zorunludur' });
      return false;
    }
    if (!formData.phone.trim()) {
      setMessage({ type: 'error', text: 'Telefon numarası zorunludur' });
      return false;
    }
    if (!formData.taxNumber.trim()) {
      setMessage({ type: 'error', text: 'Vergi numarası zorunludur' });
      return false;
    }
    if (formData.taxNumber.length !== 10) {
      setMessage({ type: 'error', text: 'Vergi numarası 10 haneli olmalıdır' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('customers')
        .upsert({
          id: user?.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName,
          phone: formData.phone,
          tax_number: formData.taxNumber,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setOriginalData(formData);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Değişiklikler başarıyla kaydedildi!' });

      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      setMessage({ type: 'error', text: 'Kaydetme sırasında hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  if (loading && !formData.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Hesabım</h1>
              <p className="text-gray-600">Profil bilgilerinizi ve siparişlerinizi yönetin</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5" />
                Profil Bilgilerim
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5" />
                Siparişlerim
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </span>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Kişisel Bilgiler</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Düzenle
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        !isEditing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        !isEditing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2.5 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">E-posta adresi değiştirilemez</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şirket Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        !isEditing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        !isEditing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'
                      }`}
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vergi Numarası <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleInputChange('taxNumber', value);
                      }}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        !isEditing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'
                      }`}
                      placeholder="10 haneli vergi numarası"
                      maxLength={10}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      İptal
                    </button>
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-500">
                  <span className="text-red-500">*</span> İşaretli alanlar zorunludur
                </p>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="text-center py-16">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Sipariş Yok</h3>
                <p className="text-gray-600 mb-6">Sipariş modülü yakında aktif olacak</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
