import { useState } from 'react';
import { Search, Package, Truck, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  siparis_no: string;
  ad_soyad: string;
  email: string;
  telefon: string;
  sirket_adi?: string;
  urun_turu: string;
  ebat: string;
  gramaj: number;
  adet: number;
  toplam_fiyat: number;
  vat_rate: number;
  durum: 'Hazırlanıyor' | 'Kargoda' | 'Teslim Edildi';
  olusturma_tarihi: string;
  guncelleme_tarihi: string;
}

export default function OrdersPage() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hazırlanıyor':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Kargoda':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Hazırlanıyor':
        return <Package className="h-5 w-5" />;
      case 'Kargoda':
        return <Truck className="h-5 w-5" />;
      case 'Teslim Edildi':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const calculatePrices = (totalPrice: number, vatRate: number) => {
    // toplam_fiyat KDV dahil olarak kabul ediyoruz
    const priceWithVat = totalPrice;
    const priceWithoutVat = priceWithVat / (1 + vatRate / 100);
    const vatAmount = priceWithVat - priceWithoutVat;

    return {
      priceWithoutVat,
      vatAmount,
      priceWithVat
    };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);

    if (!orderId.trim()) {
      setError('Lütfen sipariş numarası girin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_ORDERS}/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sipariş bulunamadı');
        }
        throw new Error('Sipariş sorgulanırken bir hata oluştu');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Sipariş sorgulanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrderId('');
    setOrder(null);
    setError('');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sipariş Takip</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sipariş numaranız ile siparişinizin durumunu sorgulayabilirsiniz.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sipariş Numarası
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Sipariş numaranızı girin"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sorgulanıyor...' : 'Sipariş Sorgula'}
              </button>
              {order && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Yeni Sorgulama
                </button>
              )}
            </div>
          </form>
        </div>

        {order && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Sipariş Detayları</h2>
                  <p className="text-blue-100 mt-1">Sipariş No: {order.siparis_no}</p>
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(order.durum)}`}>
                  {getStatusIcon(order.durum)}
                  <span className="font-semibold">{order.durum}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bilgi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Müşteri Adı
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.ad_soyad}
                    </td>
                  </tr>

                  {order.sirket_adi && (
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Şirket Adı
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.sirket_adi}
                      </td>
                    </tr>
                  )}

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      E-posta
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.email}
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Telefon
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.telefon}
                    </td>
                  </tr>

                  <tr className="bg-blue-50 hover:bg-blue-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Ürün Türü
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {order.urun_turu}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Ebat
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.ebat} cm
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Gramaj
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.gramaj} gr/m²
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Adet
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.adet.toLocaleString('tr-TR')} paket
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Ara Toplam (KDV Hariç)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ₺{calculatePrices(order.toplam_fiyat, order.vat_rate).priceWithoutVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      KDV (%{order.vat_rate})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ₺{calculatePrices(order.toplam_fiyat, order.vat_rate).vatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Toplam Tutar (KDV Dahil)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-lg font-bold text-green-600">
                        ₺{order.toplam_fiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Sipariş Durumu
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(order.durum)}`}>
                        {getStatusIcon(order.durum)}
                        <span className="font-semibold">{order.durum}</span>
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Sipariş Tarihi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(order.olusturma_tarihi)}
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Son Güncelleme
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(order.guncelleme_tarihi)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    order.durum === 'Hazırlanıyor' || order.durum === 'Kargoda' || order.durum === 'Teslim Edildi'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Package className="h-5 w-5" />
                    <span className="font-medium">Hazırlanıyor</span>
                  </div>
                </div>

                <div className={`h-1 w-16 ${
                  order.durum === 'Kargoda' || order.durum === 'Teslim Edildi'
                    ? 'bg-orange-500'
                    : 'bg-gray-300'
                }`}></div>

                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    order.durum === 'Kargoda' || order.durum === 'Teslim Edildi'
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Truck className="h-5 w-5" />
                    <span className="font-medium">Kargoda</span>
                  </div>
                </div>

                <div className={`h-1 w-16 ${
                  order.durum === 'Teslim Edildi'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}></div>

                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    order.durum === 'Teslim Edildi'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Teslim Edildi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Bilgilendirme</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sipariş numaranızı sipariş onayı e-postasından öğrenebilirsiniz</li>
            <li>• Sipariş durumunuz değiştiğinde e-posta ile bilgilendirileceksiniz</li>
            <li>• Herhangi bir sorunuz için bizimle iletişime geçebilirsiniz</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
