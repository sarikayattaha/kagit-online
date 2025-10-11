import { useState } from 'react';
import { Package, CheckCircle, ChevronRight } from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';

interface Product {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  image: string;
  standard_sizes: string[];
  gramaj_range: string;
  features: string[];
  applications: string[];
  available: boolean;
}

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const products: Product[] = [
    {
      id: '1',
      name: 'Kuşe Kağıt',
      description: 'Yüksek parlaklıkta yüzeye sahip, ofset baskıya uygun kağıt türü.',
      fullDescription: 'Kuşe kağıt, yüzeyine özel bir kaplama uygulanarak parlaklık ve düzgünlük kazandırılmış yüksek kaliteli bir kağıt türüdür. Özellikle katalog, broşür, dergi ve reklam materyallerinin baskısında tercih edilir. Mat ve parlak olmak üzere iki farklı yüzey seçeneği sunar. Mükemmel renk tutarlılığı ve baskı kalitesi sağlar.',
      image: 'https://images.pexels.com/photos/3806753/pexels-photo-3806753.jpeg?auto=compress&cs=tinysrgb&w=800',
      standard_sizes: ['57x82', '64x90', '70x100'],
      gramaj_range: '90–350 gr/m²',
      features: [
        'Yüksek beyazlık değeri',
        'Parlak ve mat yüzey seçenekleri',
        'Mükemmel baskı kalitesi',
        'Renk tutarlılığı',
        'Düzgün ve pürüzsüz yüzey',
        'İki taraflı baskıya uygun'
      ],
      applications: [
        'Katalog ve broşür',
        'Dergi ve gazete ekleri',
        'Reklam afişleri',
        'Kartvizit ve davetiye',
        'Ambalaj ve etiket',
        'Kurumsal tanıtım materyalleri'
      ],
      available: true,
    },
    {
      id: '2',
      name: 'Bristol Karton',
      description: 'Dayanıklı kuşeli karton, kartpostal ve ambalaj için ideal.',
      fullDescription: 'Bristol karton, yüksek gramajlı ve dayanıklı yapısıyla öne çıkan kuşeli bir karton türüdür. Tek veya çift yüzlü olarak üretilir ve katlanabilir özellikleriyle kutular, ambalajlar ve dayanıklı baskı ürünleri için idealdir. Yüzeyindeki kuşe kaplama sayesinde mükemmel baskı kalitesi sunar.',
      image: 'https://images.pexels.com/photos/6373305/pexels-photo-6373305.jpeg?auto=compress&cs=tinysrgb&w=800',
      standard_sizes: ['57x82', '64x90', '70x100'],
      gramaj_range: '200–400 gr/m²',
      features: [
        'Yüksek dayanıklılık',
        'Kolay katlama ve kesim',
        'Kuşeli yüzey',
        'Profesyonel görünüm',
        'Nem direnci',
        'Uzun ömürlü'
      ],
      applications: [
        'Kartpostal ve davetiye',
        'Ambalaj kutuları',
        'Kartvizit',
        'Klasör ve dosya kapakları',
        'Sertifika ve diploma',
        'POS materyalleri'
      ],
      available: true,
    },
    {
      id: '3',
      name: 'Hamur Kağıt',
      description: 'Birinci hamur beyaz kağıt, ofset baskı için yüksek kalite.',
      fullDescription: 'Hamur kağıt, %100 selülozdan üretilen, uzun ömürlü ve çevre dostu bir kağıt türüdür. Sararmaya karşı dirençli yapısı sayesinde arşiv kalitesindedir. Ofset baskı, fotokopi ve lazer yazıcı kullanımına uygundur. Beyaz ve doğal olmak üzere farklı renk seçenekleri mevcuttur.',
      image: 'https://images.pexels.com/photos/1888015/pexels-photo-1888015.jpeg?auto=compress&cs=tinysrgb&w=800',
      standard_sizes: ['57x82', '64x90', '70x100'],
      gramaj_range: '70–120 gr/m²',
      features: [
        '%100 selüloz',
        'Uzun ömürlü',
        'Sararmaya karşı dirençli',
        'Ofset baskıya uygun',
        'Arşiv kalitesi',
        'Çevre dostu üretim'
      ],
      applications: [
        'Kitap ve dergi iç sayfaları',
        'Fotokopi kağıdı',
        'Ofis belgeleri',
        'Not defterleri',
        'Form ve fatura',
        'Yazışma kağıdı'
      ],
      available: true,
    },
    {
      id: '4',
      name: 'Sticker',
      description: 'Yapışkanlı etiket kağıdı, her türlü baskı için uygun.',
      fullDescription: 'Sticker kağıt, arka yüzünde güçlü yapışkan tabaka bulunan özel bir kağıt türüdür. Ürün etiketleri, ambalaj etiketleri, promosyon çıkartmaları ve dekoratif uygulamalar için idealdir. Parlak, mat ve şeffaf olmak üzere farklı yüzey seçenekleri sunar. Her türlü yüzeye kolayca yapışır ve ihtiyaç halinde temiz bir şekilde sökülür.',
      image: 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800',
      standard_sizes: ['57x82', '64x90', '70x100'],
      gramaj_range: '80–250 gr/m²',
      features: [
        'Güçlü yapışkanlı tabaka',
        'Her türlü yüzeye uygun',
        'Su ve yağ direnci',
        'Kolay sökülür',
        'Parlak, mat ve şeffaf seçenekleri',
        'UV dayanımlı'
      ],
      applications: [
        'Ürün etiketleri',
        'Ambalaj etiketleri',
        'Promosyon çıkartmaları',
        'Dekoratif uygulamalar',
        'Barkod etiketleri',
        'Güvenlik etiketleri'
      ],
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ürünlerimiz</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Matbaa işleriniz için özel olarak seçilmiş yüksek kaliteli kağıt ve karton çeşitlerimizi keşfedin.
            Her ürün hakkında detaylı bilgi almak için karta tıklayın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="relative h-64 bg-gray-200 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.available && (
                  <span className="absolute top-4 right-4 flex items-center space-x-1 bg-green-500 px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span>Stokta</span>
                  </span>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>

                <p className="text-gray-600 mb-6">{product.description}</p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Standart Ebatlar</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.standard_sizes.map((size, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium"
                        >
                          {size} cm
                        </span>
                      ))}
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">
                        + Özel Ebat
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <span>Listeyi Görüntüle</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Tüm Ürünlerimizde
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Kalite Garantisi</h3>
              <p className="text-gray-600 text-sm">
                Tüm ürünlerimiz uluslararası kalite standartlarına uygundur
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hızlı Teslimat</h3>
              <p className="text-gray-600 text-sm">
                Stokta bulunan ürünlerde 2-3 iş günü içinde teslimat
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChevronRight className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Özel Kesim</h3>
              <p className="text-gray-600 text-sm">
                İhtiyacınıza özel ebat ve kesim seçenekleri
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
