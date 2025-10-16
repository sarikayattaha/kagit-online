import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Clock, CheckCircle, XCircle, Truck, DollarSign, Search, RefreshCw } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  product_type: string;
  weight: number;
  dimensions: string;
  size_type: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customers: {
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    phone: string;
  };
}

const statusOptions = [
  { value: 'pending', label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  { value: 'approved', label: 'Onaylandı', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  { value: 'processing', label: 'Hazırlanıyor', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
  { value: 'shipped', label: 'Kargoda', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  { value: 'cancelled', label: 'İptal Edildi', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
];

export default function AdminOrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage({ type: 'error', text: 'Siparişler yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(search) ||
        order.customers?.company_name?.toLowerCase().includes(search) ||
        order.customers?.first_name?.toLowerCase().includes(search) ||
        order.customers?.last_name?.toLowerCase().includes(search) ||
        order.product_type.toLowerCase().includes(search)
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string) => {
    const newStatus = tempStatus[orderId];
    if (!newStatus) return;

    try {
      setUpdatingOrderId(orderId);
      
      // Veritabanında güncelle
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // State'i hemen güncelle (UI anında güncellenir)
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Temp status'u temizle
      const newTempStatus = { ...tempStatus };
      delete newTempStatus[orderId];
      setTempStatus(newTempStatus);

      setMessage({ type: 'success', text: 'Sipariş durumu güncellendi!' });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Durum güncellenirken hata oluştu' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sipariş Yönetimi</h1>
          <p className="text-gray-600">Müşteri siparişlerini görüntüleyin ve yönetin</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Toplam</p>
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <p className="text-xs text-yellow-700 mb-1">Bekleyen</p>
            <p className="text-2xl font-bold text-yellow-800">{statusCounts.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <p className="text-xs text-green-700 mb-1">Onaylanan</p>
            <p className="text-2xl font-bold text-green-800">{statusCounts.approved}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Hazırlanan</p>
            <p className="text-2xl font-bold text-blue-800">{statusCounts.processing}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
            <p className="text-xs text-purple-700 mb-1">Kargoda</p>
            <p className="text-2xl font-bold text-purple-800">{statusCounts.shipped}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <p className="text-xs text-green-700 mb-1">Teslim</p>
            <p className="text-2xl font-bold text-green-800">{statusCounts.delivered}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-xs text-red-700 mb-1">İptal</p>
            <p className="text-2xl font-bold text-red-800">{statusCounts.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="order-search-input"
                  name="search"
                  type="text"
                  placeholder="Sipariş no, müşteri veya ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === status.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Siparişler yükleniyor...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm || statusFilter !== 'all' ? 'Filtrelerinize uygun sipariş bulunamadı' : 'Henüz sipariş yok'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sipariş No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ürün</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">#{order.order_number}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {order.customers?.first_name} {order.customers?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{order.customers?.company_name}</p>
                            <p className="text-xs text-gray-500">{order.customers?.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{order.product_type}</p>
                            <p className="text-sm text-gray-600">{order.dimensions} cm</p>
                            <p className="text-xs text-gray-500">
                              {order.weight} gr/m² • {order.quantity} {order.size_type === 'standard' ? 'paket' : 'tabaka'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{formatDate(order.created_at)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-green-600">{order.total_price.toFixed(2)} ₺</p>
                          <p className="text-xs text-gray-500">+KDV</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <select
                              id={`status-select-${order.id}`}
                              name={`status-${order.id}`}
                              value={tempStatus[order.id] || order.status}
                              onChange={(e) => setTempStatus({ ...tempStatus, [order.id]: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                            
                            {tempStatus[order.id] && tempStatus[order.id] !== order.status && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id)}
                                disabled={updatingOrderId === order.id}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors whitespace-nowrap"
                              >
                                {updatingOrderId === order.id ? 'Güncelleniyor...' : 'Güncelle'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-900 font-semibold">
                Toplam {filteredOrders.length} sipariş gösteriliyor
              </span>
              <span className="text-blue-900 font-bold text-lg">
                Toplam Tutar: {filteredOrders.reduce((sum, order) => sum + order.total_price, 0).toFixed(2)} ₺
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
