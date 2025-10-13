import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package, Scissors, Calculator as CalcIcon, Truck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  order_index: number;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Auto-slide her 5 saniyede
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const features = [
    {
      icon: Package,
      title: 'Geniş Ürün Yelpazesi',
      description: 'Kuşe kağıt, bristol karton, 1. hamur kağıt ve sticker çeşitleri',
    },
    {
      icon: Scissors,
      title: 'Özel Kesim',
      description: 'Bobinden istediğiniz ölçüde özel kesim hizmeti',
    },
    {
      icon: CalcIcon,
      title: 'Hızlı Fiyat Hesaplama',
      description: 'Online fiyat hesaplayıcımızla anlık teklif alın',
    },
    {
      icon: Truck,
      title: 'Hızlı Teslimat',
      description: 'Sipariş takip sistemi ile güvenli ve hızlı teslimat',
    },
  ];

  const standardSizes = [
    { size: '57x82 cm', description: 'Standart küçük ebat' },
    { size: '64x90 cm', description: 'Standart orta ebat' },
    { size: '70x100 cm', description: 'Standart büyük ebat' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Slider Section */}
      <section className="relative h-[400px] md:h-[600px] bg-gray-900 overflow-hidden">
        {banners.length > 0 ? (
          <>
            {/* Slides */}
            <div className="relative h-full">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/1920x600/0066CC/FFFFFF?text=Banner';
                    }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  
                  {/* Title overlay if exists */}
                  {banner.title && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h2 className="text-4xl md:text-6xl font-bold text-white text-center px-4 drop-shadow-lg">
                        {banner.title}
                      </h2>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-900" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
                >
                  <ChevronRight className="h-6 w-6 text-gray-900" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* CTA Button */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => onNavigate('calculator')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Fiyat Hesaplama</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          // Fallback when no banners
          <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">Matbaalara Özel Kağıt Çözümleri</h1>
              <p className="text-xl md:text-2xl mb-8">
                Yüksek kaliteli kuşe kağıt, bristol karton ve özel kesim hizmetleriyle işlerinizi bir üst seviyeye taşıyın
              </p>
              <button
                onClick={() => onNavigate('calculator')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl flex items-center space-x-2 mx-auto"
              >
                <span>Fiyat Hesaplama</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Hemen Teklif Alın</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Online fiyat hesaplayıcımız ile anlık olarak ürünlerinizin fiyatını öğrenin
          </p>
          <button
            onClick={() => onNavigate('calculator')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center space-x-2"
          >
            <span>Fiyat Hesapla</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Neden Bizi Tercih Etmelisiniz?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standard Sizes Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Standart Ebatlarımız
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Tüm ürünlerimiz aşağıdaki standart ebatlarda mevcuttur.
            Farklı ölçülerde ihtiyacınız varsa özel kesim hizmetimizden faydalanabilirsiniz.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {standardSizes.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-blue-600 mb-2">{item.size}</div>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
