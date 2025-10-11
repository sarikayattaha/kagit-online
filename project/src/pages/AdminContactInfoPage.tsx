import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Save, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContactInfo {
  id: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
}

export default function AdminContactInfoPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    id: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContactInfo(data);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'İletişim bilgileri yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contactInfo.phone || !contactInfo.mobile || !contactInfo.email || !contactInfo.address) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir e-posta adresi girin' });
      return;
    }

    try {
      setSaving(true);

      if (contactInfo.id) {
        const { error } = await supabase
          .from('contact_info')
          .update({
            phone: contactInfo.phone.trim(),
            mobile: contactInfo.mobile.trim(),
            email: contactInfo.email.trim(),
            address: contactInfo.address.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', contactInfo.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('contact_info')
          .insert([{
            phone: contactInfo.phone.trim(),
            mobile: contactInfo.mobile.trim(),
            email: contactInfo.email.trim(),
            address: contactInfo.address.trim(),
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setContactInfo(data);
        }
      }

      setMessage({ type: 'success', text: 'İletişim bilgileri başarıyla güncellendi' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'İletişim bilgileri güncellenirken hata oluştu: ' + error.message });
    } finally {
      setSaving(false);
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">İletişim Bilgileri</h1>
          <p className="text-gray-600">Web sitesinde gösterilecek iletişim bilgilerini yönetin</p>
        </div>

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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                <Phone className="h-4 w-4 text-gray-600" />
                <span>Telefon <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="0212 612 31 94"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">Sabit hat telefon numarası</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                <Smartphone className="h-4 w-4 text-gray-600" />
                <span>Cep Telefonu <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={contactInfo.mobile}
                onChange={(e) => setContactInfo({ ...contactInfo, mobile: e.target.value })}
                placeholder="+90 554 163 00 31"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">Whatsapp destekli cep telefonu numarası</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <span>E-posta <span className="text-red-500">*</span></span>
              </label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="info@kagit.online"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">İletişim formundan gelen mesajlar bu adrese yönlendirilir</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span>Adres <span className="text-red-500">*</span></span>
              </label>
              <textarea
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                placeholder="Maltepe, Litros Yolu Sk 2. Matbaacılar Sitesi D:1BD2 Giriş Kat, 34010 Zeytinburnu/İstanbul"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">Tam adres bilgisi, harita konumunda da gösterilir</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <span className="text-red-500">*</span> işaretli alanlar zorunludur
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Bilgi</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Bu bilgiler web sitesinin İletişim sayfasında ve Footer bölümünde gösterilir</li>
            <li>Değişiklikler anında siteye yansır</li>
            <li>Telefon numaralarını uluslararası format ile girebilirsiniz</li>
            <li>E-posta adresi geçerli bir format olmalıdır</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
