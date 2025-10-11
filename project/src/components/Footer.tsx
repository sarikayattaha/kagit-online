import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContactInfo {
  phone: string;
  mobile: string;
  email: string;
  address: string;
}

export default function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

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

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Kağıt Online</h3>
            <p className="text-gray-400 text-sm">
              Matbaalara özel yüksek kaliteli kağıt ve karton çözümleri sunuyoruz.
              Standart ebatlar ve özel kesim seçenekleriyle hizmetinizdeyiz.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>{contactInfo?.phone || 'Yükleniyor...'}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <Smartphone className="h-5 w-5 flex-shrink-0" />
                <span>{contactInfo?.mobile || 'Yükleniyor...'}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <span>{contactInfo?.email || 'Yükleniyor...'}</span>
              </div>
              <div className="flex items-start space-x-3 text-gray-400 text-sm">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{contactInfo?.address || 'Yükleniyor...'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Çalışma Saatleri</h3>
            <div className="text-gray-400 text-sm space-y-2">
              <p>Pazartesi - Cuma: 09:00 - 18:00</p>
              <p>Cumartesi: 09:00 - 14:00</p>
              <p>Pazar: Kapalı</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2025 Kağıt Online. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
