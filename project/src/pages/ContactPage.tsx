import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';
import { sanitizeString, validateEmail, validateRequired, validateLength } from '../utils/validation';
import { supabase } from '../lib/supabase';

interface ContactInfo {
  phone: string;
  mobile: string;
  email: string;
  address: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching contact info:', error);
        return;
      }

      if (data) {
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(formData.name) || !validateRequired(formData.email) || !validateRequired(formData.message)) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Lütfen geçerli bir e-posta adresi girin');
      return;
    }

    if (!validateLength(formData.name, 2, 100)) {
      setError('Ad soyad 2-100 karakter arasında olmalıdır');
      return;
    }

    if (!validateLength(formData.message, 10, 1000)) {
      setError('Mesaj 10-1000 karakter arasında olmalıdır');
      return;
    }

    setLoading(true);

    try {
      const sanitizedData = {
        name: sanitizeString(formData.name),
        email: sanitizeString(formData.email),
        message: sanitizeString(formData.message),
      };

      const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_CONTACT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        throw new Error('Mesaj gönderilirken bir hata oluştu');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">İletişim</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sorularınız, talepleriniz ve özel teklifler için bizimle iletişime geçin.
            Size en kısa sürede dönüş yapacağız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mesaj Gönderin</h2>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Mesajınız Alındı, Teşekkür Ederiz!
                  </h3>
                  <p className="text-green-700">
                    En kısa sürede sizinle iletişime geçeceğiz.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Adınız ve soyadınız"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ornek@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mesajınız <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Mesajınızı buraya yazın..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                      required
                      disabled={loading}
                    ></textarea>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                    <span>{loading ? 'Gönderiliyor...' : 'Gönder'}</span>
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    <span className="text-red-500">*</span> işaretli alanlar zorunludur
                  </p>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-semibold text-gray-900">
                      {contactInfo?.phone || 'Yükleniyor...'}
                    </p>
                    <p className="text-sm text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cep Telefonu</p>
                    <p className="font-semibold text-gray-900">
                      {contactInfo?.mobile || 'Yükleniyor...'}
                    </p>
                    <p className="text-sm text-gray-600">Whatsapp destekli</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="font-semibold text-gray-900">
                      {contactInfo?.email || 'Yükleniyor...'}
                    </p>
                    <p className="text-sm text-gray-600">24 saat içinde yanıt</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adres</p>
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {contactInfo?.address || 'Yükleniyor...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Çalışma Saatleri</h3>
              </div>
              <div className="space-y-2 text-blue-100">
                <div className="flex justify-between">
                  <span>Pazartesi - Cuma:</span>
                  <span className="font-semibold text-white">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Cumartesi:</span>
                  <span className="font-semibold text-white">09:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Pazar:</span>
                  <span className="font-semibold text-white">Kapalı</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sıkça Sorulan Sorular</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">
                    Minimum sipariş miktarı var mı?
                  </p>
                  <p className="text-gray-600">
                    Ürünlere göre değişmektedir. Detaylı bilgi için iletişime geçin.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">
                    Teslimat süresi ne kadar?
                  </p>
                  <p className="text-gray-600">
                    Stokta bulunan ürünler için 2-3 iş günü, özel kesim için 5-7 iş günüdür.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">
            Konumumuz
          </h3>
          <div className="relative w-full h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.0191960911156!2d28.915908975899345!3d41.024835971348246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caba434fe31451%3A0xad277b9f740d0620!2zS2HEn8SxdGhhbmUgxLDDpyB2ZSBExLHFnyBUaWNhcmV0!5e0!3m2!1str!2str!4v1760465357177!5m2!1str!2str"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Kağıt Online Konum"
            />
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-gray-600">
                {contactInfo?.address || 'Adres bilgisi yükleniyor...'}
              </p>
              
                href="https://www.google.com/maps/place/Kağıthane+İç+ve+Dış+Ticaret/@41.024836,28.915909,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap"
              >
                <span>Haritada Aç</span>
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
