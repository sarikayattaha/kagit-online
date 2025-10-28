import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Smartphone } from 'lucide-react';
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
    <div className="min-h-screen bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header Section - Apple Style */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            İletişim
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sorularınız, talepleriniz ve özel teklifler için bizimle iletişime geçin.
            Size en kısa sürede dönüş yapacağız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {/* Contact Form - Apple Style */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 tracking-tight">
                Mesaj Gönderin
              </h2>

              {submitted ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                  <div className="bg-gray-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                    Mesajınız Alındı
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    En kısa sürede sizinle iletişime geçeceğiz.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Adınız ve soyadınız"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 text-base"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ornek@email.com"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 text-base"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      Mesajınız <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Mesajınızı buraya yazın..."
                      rows={6}
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all duration-300 text-base"
                      required
                      disabled={loading}
                    ></textarea>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold text-base hover:bg-gray-800 transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transform"
                  >
                    <Send className="h-5 w-5" strokeWidth={2} />
                    <span>{loading ? 'Gönderiliyor...' : 'Gönder'}</span>
                  </button>

                  <p className="text-sm text-gray-500 text-center pt-2">
                    <span className="text-red-500">*</span> işaretli alanlar zorunludur
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar - Apple Style */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <div className="bg-gray-50 rounded-3xl shadow-sm p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
                İletişim Bilgileri
              </h3>
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-900 p-3 rounded-2xl flex-shrink-0">
                    <Phone className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Telefon</p>
                    <p className="font-semibold text-gray-900 mb-1">
                      {contactInfo?.phone || 'Yükleniyor...'}
                    </p>
                    <p className="text-sm text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-900 p-3 rounded-2xl flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cep Telefonu</p>
                    <p className="font-semibold text-gray-900 mb-1">
                      {contactInfo?.mobile || 'Yükleniyor...'}
                    </p>
                    <p className="text-sm text-gray-600">Whatsapp destekli</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-900 p-3 rounded-2xl flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">E-posta</p>
                    <p className="font-semibold text-gray-900 mb-1 break-all">
                      {contactInfo?.email || 'Yükleniyor...'}
                    </p>
                    <p className="text-sm text-gray-600">24 saat içinde yanıt</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-900 p-3 rounded-2xl flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Adres</p>
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {contactInfo?.address || 'Yükleniyor...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours Card - Apple Style */}
            <div className="bg-gray-900 rounded-3xl shadow-md p-8 text-white">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="h-6 w-6" strokeWidth={2} />
                <h3 className="text-xl font-bold tracking-tight">Çalışma Saatleri</h3>
              </div>
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between items-center py-2">
                  <span>Pazartesi - Cuma</span>
                  <span className="font-semibold text-white">09:00 - 18:00</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center py-2">
                  <span>Cumartesi</span>
                  <span className="font-semibold text-white">09:00 - 14:00</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center py-2">
                  <span>Pazar</span>
                  <span className="font-semibold text-white">Kapalı</span>
                </div>
              </div>
            </div>

            {/* FAQ Card - Apple Style */}
            <div className="bg-gray-50 rounded-3xl shadow-sm p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
                Sıkça Sorulan Sorular
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="font-semibold text-gray-900 mb-2 text-base">
                    Minimum sipariş miktarı var mı?
                  </p>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Ürünlere göre değişmektedir. Detaylı bilgi için iletişime geçin.
                  </p>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2 text-base">
                    Teslimat süresi ne kadar?
                  </p>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Stokta bulunan ürünler için 2-3 iş günü, özel kesim için 5-7 iş günüdür.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
