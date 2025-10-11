import { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ExchangeRate {
  currency: string;
  rate: number;
}

export default function AdminExchangeRatePage() {
  const [rates, setRates] = useState<{ USD: string; EUR: string }>({ USD: '', EUR: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency, rate');

      if (error) {
        console.error('Error fetching exchange rates:', error);
        setMessage('Kur bilgisi yüklenirken hata oluştu');
        return;
      }

      if (data) {
        const ratesObj: { USD: string; EUR: string } = { USD: '', EUR: '' };
        data.forEach((rate: ExchangeRate) => {
          ratesObj[rate.currency as 'USD' | 'EUR'] = rate.rate.toString();
        });
        setRates(ratesObj);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setMessage('Kur bilgisi yüklenirken hata oluştu');
    }
  };

  const handleSave = async () => {
    if (!rates.USD || !rates.EUR) {
      setMessage('Lütfen tüm kur değerlerini girin');
      return;
    }

    const usdRate = parseFloat(rates.USD);
    const eurRate = parseFloat(rates.EUR);

    if (isNaN(usdRate) || usdRate <= 0 || isNaN(eurRate) || eurRate <= 0) {
      setMessage('Lütfen geçerli kur değerleri girin');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const updates = [
        supabase
          .from('exchange_rates')
          .upsert(
            { currency: 'USD', rate: usdRate, updated_at: new Date().toISOString() },
            { onConflict: 'currency' }
          ),
        supabase
          .from('exchange_rates')
          .upsert(
            { currency: 'EUR', rate: eurRate, updated_at: new Date().toISOString() },
            { onConflict: 'currency' }
          ),
      ];

      const results = await Promise.all(updates);

      const hasError = results.some(result => result.error);
      if (hasError) {
        const errors = results.filter(r => r.error).map(r => r.error?.message).join(', ');
        console.error('Error updating exchange rates:', errors);
        setMessage('Kurlar güncellenirken hata oluştu: ' + errors);
        return;
      }

      setMessage('Kurlar başarıyla güncellendi');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setMessage('Kurlar güncellenirken hata oluştu: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <DollarSign className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Döviz Kuru Yönetimi</h1>
          <p className="text-xl text-gray-600">
            USD ve EUR döviz kurlarını güncelleyin
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                USD/TRY Kuru <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={rates.USD}
                    onChange={(e) => setRates({ ...rates, USD: e.target.value })}
                    placeholder="Örnek: 34.50"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                USD bazlı ürünlerin fiyatı bu kura göre hesaplanır
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                EUR/TRY Kuru <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={rates.EUR}
                    onChange={(e) => setRates({ ...rates, EUR: e.target.value })}
                    placeholder="Örnek: 37.80"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={fetchExchangeRates}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                  title="Yenile"
                >
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                EUR bazlı ürünlerin fiyatı bu kura göre hesaplanır
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes('başarıyla')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Bilgi</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Kur değişiklikleri anında tüm hesaplamalara yansır</li>
              <li>Ürün eklerken hangi kurla satılacağını seçebilirsiniz</li>
              <li>Ondalık ayırıcı olarak nokta (.) kullanın</li>
              <li>En fazla 4 ondalık basamak girilebilir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
