import { useState, useEffect } from 'react';
import { Scissors, Save, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CuttingFee {
  id: string;
  fee_per_package: number;
  currency: string;
  is_active: boolean;
  updated_at: string;
}

export default function AdminCuttingFeePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cuttingFee, setCuttingFee] = useState<CuttingFee | null>(null);
  const [feeAmount, setFeeAmount] = useState('100');

  useEffect(() => {
    fetchCuttingFee();
  }, []);

  const fetchCuttingFee = async () => {
    try {
      const { data, error } = await supabase
        .from('cutting_fees')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      if (data) {
        setCuttingFee(data);
        setFeeAmount(data.fee_per_package.toString());
      }
    } catch (error) {
      console.error('Error fetching cutting fee:', error);
    }
  };

  const handleUpdate = async () => {
    if (!feeAmount || parseFloat(feeAmount) < 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir ücret giriniz!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (cuttingFee) {
        // Mevcut kaydı güncelle
        const { error } = await supabase
          .from('cutting_fees')
          .update({
            fee_per_package: parseFloat(feeAmount),
          })
          .eq('id', cuttingFee.id);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase
          .from('cutting_fees')
          .insert({
            fee_per_package: parseFloat(feeAmount),
            currency: 'TRY',
            is_active: true,
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Kesim ücreti başarıyla güncellendi!' });
      await fetchCuttingFee();
    } catch (error: any) {
      console.error('Error updating cutting fee:', error);
      setMessage({ type: 'error', text: error.message || 'Bir hata oluştu!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-blue-500 p-3 rounded-2xl mr-4">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ebatlama Yönetimi</h1>
              <p className="text-gray-600 mt-1">Özel ebat kesim ücretlerini yönetin</p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Kesim Ücreti Kartı */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="flex items-center mb-6">
            <DollarSign className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Kesim Ücreti Ayarları</h2>
          </div>

          <div className="space-y-6">
            {/* Bilgi Kutusu */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Kesim Ücreti Nedir?</p>
                  <p>
                    Müşteriler "Dijital Baskı Kağıtları" sayfasından özel ebat siparişi verdiğinde, 
                    her paket için belirttiğiniz kesim ücreti otomatik olarak fiyata eklenecektir.
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold">Örnek:</span> Müşteri 5 paket özel ebat sipariş verirse ve 
                    kesim ücreti 100 TL ise, toplam 500 TL kesim ücreti ara toplama eklenecektir.
                  </p>
                </div>
              </div>
            </div>

            {/* Ücret Girişi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paket Başına Kesim Ücreti (TRY)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  ₺
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Her paket için uygulanacak kesim ücreti tutarı
              </p>
            </div>

            {/* Önizleme Örnekleri */}
            {feeAmount && parseFloat(feeAmount) > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Örnek Hesaplamalar:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">1 paket sipariş:</span>
                    <span className="font-semibold text-gray-900">
                      {parseFloat(feeAmount).toFixed(2)} TL kesim ücreti
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">5 paket sipariş:</span>
                    <span className="font-semibold text-gray-900">
                      {(parseFloat(feeAmount) * 5).toFixed(2)} TL kesim ücreti
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">10 paket sipariş:</span>
                    <span className="font-semibold text-gray-900">
                      {(parseFloat(feeAmount) * 10).toFixed(2)} TL kesim ücreti
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Son Güncelleme Bilgisi */}
            {cuttingFee && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Son güncelleme: {new Date(cuttingFee.updated_at).toLocaleString('tr-TR')}
                </p>
              </div>
            )}

            {/* Kaydet Butonu */}
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Kesim Ücretini Güncelle
                </>
              )}
            </button>
          </div>
        </div>

        {/* Kullanım Alanları */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bu Ücret Nerede Kullanılır?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Dijital Baskı Kağıtları Sayfası</p>
                <p className="text-sm text-gray-600">
                  Müşteriler özel ebat (örn: 33x48.7 cm) sipariş verdiğinde otomatik eklenir
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Sipariş Onay Sayfası</p>
                <p className="text-sm text-gray-600">
                  Kesim ücreti detayı müşteriye gösterilir
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Sipariş E-postası</p>
                <p className="text-sm text-gray-600">
                  Size gelen sipariş e-postasında kesim ücreti ayrı satırda gösterilir
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
