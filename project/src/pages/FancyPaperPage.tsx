import { ArrowLeft, Sparkles } from 'lucide-react';

interface FancyPaperPageProps {
  onNavigate: (page: string) => void;
}

export default function FancyPaperPage({ onNavigate }: FancyPaperPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Geri Dön Butonu */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-300"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-medium">Geri Dön</span>
        </button>

        {/* Başlık */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-gray-900 w-16 h-16 rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Fantazi Kağıt
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Özel doku ve desenli kağıtlar, davetiye ve özel projeler için
          </p>
        </div>

        {/* Boş İçerik - Yakında Gelecek */}
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-gray-900" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Yakında Gelecek
            </h2>
            <p className="text-gray-600 mb-6">
              Premium fantazi kağıt koleksiyonumuz çok yakında bu sayfada olacak. 
              Özel projeleriniz için fiyat hesaplama aracımızı kullanabilirsiniz.
            </p>
            <button
              onClick={() => onNavigate('calculator')}
              className="bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-300"
            >
              Fiyat Hesaplama Aracı
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
