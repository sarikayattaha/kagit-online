import { Shield, DollarSign, FolderTree, Ruler, Phone, ShoppingCart, BoxesIcon, Image as ImageIcon, FileText, Tag, Scissors } from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const adminModules = [
    {
      id: 'admin-exchange',
      title: 'Exchange Rates',
      description: 'Update USD and EUR rates',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 'admin-price-calculation',
      title: 'Fiyat Hesaplama & Ürün Yönetimi',
      description: 'Ürün türleri yönetimi ve fiyat hesaplama',
      icon: BoxesIcon,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      id: 'admin-a4-products',
      title: 'A4 Kağıt Ürünleri',
      description: 'A4/A3 kağıt ürünlerini yönet',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'admin-sticker-products',
      title: 'Sticker Ürünleri',
      description: 'Sticker ürünlerini yönet',
      icon: Tag,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      id: 'admin-cutting-fee',
      title: 'Ebatlama Ücreti',
      description: 'Özel ebat kesim ücretini yönet',
      icon: Scissors,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      id: 'admin-orders-management',
      title: 'Orders Management',
      description: 'View and manage customer orders',
      icon: ShoppingCart,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      id: 'admin-roll-widths',
      title: 'Roll Widths',
      description: 'Manage available roll widths',
      icon: Ruler,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      id: 'admin-contact',
      title: 'Contact Info',
      description: 'Edit phone, email and address',
      icon: Phone,
      color: 'bg-teal-100 text-teal-600',
    },
    {
      id: 'admin-banners',
      title: 'Banner Yönetimi',
      description: 'Ana sayfa slider banner\'larını yönet',
      icon: ImageIcon,
      color: 'bg-cyan-100 text-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Panel</h1>
          <p className="text-xl text-gray-600">
            Select a module for management operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => onNavigate(module.id)}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all text-left group"
              >
                <div className={`inline-flex p-4 rounded-lg ${module.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600">
                  {module.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
