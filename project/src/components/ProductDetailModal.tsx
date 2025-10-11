import { X, Package, Ruler } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
}

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  full_description: string;
  image_url: string;
  standard_sizes: string[];
  features: string[];
  applications: string[];
  available: boolean;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [productsList, setProductsList] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductsList(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Ürün listesi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-white rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shadow-md"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center space-x-4 text-white">
              <Package className="h-12 w-12" />
              <div>
                <h2 className="text-3xl font-bold">{product.name}</h2>
                <p className="text-blue-100 mt-1">Admin tarafından yüklenen ürün listeleri</p>
              </div>
            </div>
          </div>

          <div className="bg-white px-6 py-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Ürün listesi yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center">
                {error}
              </div>
            ) : productsList.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz Ürün Yüklenmedi</h3>
                <p className="text-gray-600">
                  Admin panelden ürün eklendiğinde burada görüntülenecektir.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Mevcut Ürünler ({productsList.length})
                </h3>

                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {productsList.map((prod) => (
                    <div
                      key={prod.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start space-x-4">
                        {prod.image_url && (
                          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {prod.name}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {prod.description}
                          </p>

                          {prod.standard_sizes && prod.standard_sizes.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <Ruler className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Standart Ebatlar:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {prod.standard_sizes.map((size, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                                  >
                                    {size}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {prod.features && prod.features.length > 0 && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700 mb-1 block">Özellikler:</span>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {prod.features.slice(0, 3).map((feature, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    {feature}
                                  </li>
                                ))}
                                {prod.features.length > 3 && (
                                  <li className="text-blue-600 text-xs">
                                    +{prod.features.length - 3} özellik daha
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {prod.applications && prod.applications.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700 mb-1 block">Kullanım Alanları:</span>
                              <div className="flex flex-wrap gap-2">
                                {prod.applications.slice(0, 3).map((app, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                  >
                                    {app}
                                  </span>
                                ))}
                                {prod.applications.length > 3 && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    +{prod.applications.length - 3} alan daha
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Özel ölçülerde kesim yapılabilir. Fiyat teklifi ve detaylı bilgi için lütfen bizimle iletişime geçin.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
