import { ArrowLeft } from 'lucide-react';

interface DigitalPrintPageProps {
  onNavigate: (page: string) => void;
}

export default function DigitalPrintPage({ onNavigate }: DigitalPrintPageProps) {
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
          <div className="inline-flex items-center justify-center bg-yellow-500 w-16 h-16 rounded-2xl mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Dijital Baskı Kağıtları
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kuşe, Bristol ve 1.Hamur kağıtlarda özel ve standart ebatlar
          </p>
        </div>

        {/* Boş İçerik - Yakında Gelecek */}
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Yakında Gelecek
            </h2>
            <p className="text-gray-600 mb-6">
              Dijital baskı kağıtları ürünlerimiz çok yakında bu sayfada olacak. 
              Şimdilik fiyat hesaplama aracını kullanabilirsiniz.
            </p>
            <button
              onClick={() => onNavigate('calculator')}
              className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-yellow-600 transition-colors duration-300"
            >
              Fiyat Hesaplama Aracı
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
