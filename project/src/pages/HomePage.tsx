import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package, Scissors, Calculator as CalcIcon, Truck, ArrowRight, FileText, Tag, Printer, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      {/* Hero Slider Section - Apple Style */}
      <section className="relative h-[600px] md:h-[750px] bg-black overflow-hidden">
        {banners.length > 0 ? (
          <>
            {/* Slides */}
            <div className="relative h-full">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/1920x750/000000/FFFFFF?text=Banner';
                    }}
                  />
                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                  
                  {/* Title overlay if exists */}
                  {banner.title && (
                    <div className="absolute top-1/3 left-0 right-0 flex items-center justify-center px-6">
                      <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center tracking-tight leading-tight">
                        {banner.title}
                      </h2>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Apple Style */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl hover:bg-white/20 p-3 md:p-4 rounded-full transition-all duration-300 z-10 border border-white/20"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl hover:bg-white/20 p-3 md:p-4 rounded-full transition-all duration-300 z-10 border border-white/20"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </button>

                {/* Dots - Apple Style */}
                <div className="absolute bottom-52 md:bottom-60 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-white w-8' 
                          : 'bg-white/40 w-2 hover:bg-white/60'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* CTA Overlay - Apple Style Centered on Banner */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pb-24 md:pb-32">
              <div className="max-w-4xl mx-auto text-center px-6">
                {/* Glassmorphism Card */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl py-8 md:py-12 px-6 md:px-12 border border-white/20 shadow-2xl">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-white tracking-tight">
                    Hemen Teklif Alın
                  </h2>
                  <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto font-normal leading-relaxed">
                    Online fiyat hesaplayıcımız ile anlık olarak ürünlerinizin fiyatını öğrenin
                  </p>
                  <button
                    onClick={() => onNavigate('calculator')}
                    className="bg-white text-gray-900 px-8 md:px-10 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-gray-100 transition-all duration-300 inline-flex items-center space-x-3 shadow-lg hover:shadow-xl hover:scale-105 transform"
                  >
                    <span>Fiyat Hesapla</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Fallback when no banners - Apple Style
          <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-black">
            <div className="text-center text-white px-6 max-w-4xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
                Matbaalara Özel<br />Kağıt Çözümleri
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-10 text-gray-300 font-light leading-relaxed max-w-3xl mx-auto">
                Yüksek kaliteli kuşe kağıt, bristol karton ve özel kesim hizmetleriyle işlerinizi bir üst seviyeye taşıyın
              </p>
              <button
                onClick={() => onNavigate('calculator')}
                className="bg-white text-black px-8 md:px-10 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-gray-100 transition-all duration-300 inline-flex items-center space-x-3 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <span>Fiyat Hesaplama</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* A4 ve Sticker Ürünleri Section - Apple Style */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
              Hazır Ürünlerimiz
            </h2>
            <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">
              İhtiyacınıza uygun ürünü seçin ve hemen sipariş verin
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {/* A4 Kağıt Kartı */}
            <div
              onClick={() => onNavigate('a4-products')}
              className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-cyan-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="bg-cyan-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                A4 Kağıt
              </h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Farklı marka ve gramajlarda A4/A3 kağıt seçenekleri
              </p>
              
              <div className="flex items-center text-cyan-600 text-sm font-medium">
                <span>Ürünleri İncele</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
              </div>
            </div>

            {/* Sticker Kartı */}
            <div
              onClick={() => onNavigate('sticker-products')}
              className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-fuchsia-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="bg-fuchsia-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Tag className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Sticker
              </h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Opak, Şeffaf, Kesimli, Düz ve 1.Hamur sticker çeşitleri
              </p>
              
              <div className="flex items-center text-fuchsia-600 text-sm font-medium">
                <span>Ürünleri İncele</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
              </div>
            </div>

            {/* Dijital Baskı Kağıtları Kartı */}
            <div
              onClick={() => onNavigate('calculator')}
              className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-yellow-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="bg-yellow-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Printer className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Dijital Baskı Kağıtları
              </h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Kuşe, Bristol ve 1.Hamur kağıtlarda özel ve standart ebatlar
              </p>
              
              <div className="flex items-center text-yellow-600 text-sm font-medium">
                <span>Ürünleri İncele</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
              </div>
            </div>

            {/* Fantazi Kağıt Kartı */}
            <div
              onClick={() => onNavigate('calculator')}
              className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="bg-gray-900 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Fantazi Kağıt
              </h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Özel doku ve desenli kağıtlar, davetiye ve özel projeler için
              </p>
              
              <div className="flex items-center text-gray-700 text-sm font-medium">
                <span>Ürünleri İncele</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
              </div>
            </div>
          </div>
      </section>

      {/* Features Section - Apple Style */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Neden Bizi Tercih Etmelisiniz?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Kalite ve müşteri memnuniyetini ön planda tutuyoruz
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6 group-hover:bg-gray-900 transition-all duration-300">
                  <feature.icon className="h-10 w-10 text-gray-900 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standard Sizes Section - Apple Style */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Standart Ebatlarımız
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tüm ürünlerimiz aşağıdaki standart ebatlarda mevcuttur.
              Farklı ölçülerde ihtiyacınız varsa özel kesim hizmetimizden faydalanabilirsiniz.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {standardSizes.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group"
              >
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 tracking-tight">
                  {item.size}
                </div>
                <p className="text-gray-600 text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
