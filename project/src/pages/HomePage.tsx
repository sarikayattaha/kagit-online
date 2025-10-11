import { Package, Scissors, Calculator, Truck } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
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
      icon: Calculator,
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
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Matbaalara Özel Kağıt Çözümleri
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Yüksek kaliteli kuşe kağıt, bristol karton ve özel kesim hizmetleriyle
              işlerinizi bir üst seviyeye taşıyın
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('products')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Ürünleri İncele
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors border border-blue-500"
              >
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Hemen Teklif Alın</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Online fiyat hesaplayıcımız ile anlık olarak ürünlerinizin fiyatını öğrenin
          </p>
          <button
            onClick={() => onNavigate('calculator')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Fiyat Hesapla
          </button>
        </div>
      </section>

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
          <div className="text-center mt-8">
            <button
              onClick={() => onNavigate('custom-cut')}
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              Özel kesim seçeneklerini keşfedin →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
