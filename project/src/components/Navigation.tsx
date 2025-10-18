import { useState } from 'react';
import { Menu, X, FileText, User, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'home', label: 'Ana Sayfa' },
    { id: 'calculator', label: 'Fiyat Hesaplama' },
    { id: 'contact', label: 'İletişim' },
  ];

  const handleNavClick = (pageId: string) => {
    if (pageId === 'calculator' && !user) {
      onNavigate('customer-login');
      setMobileMenuOpen(false);
      return;
    }
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavClick('home')}>
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Kağıt Online</span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.id === 'calculator'
                    ? currentPage === item.id
                      ? 'bg-blue-800 text-white shadow-lg'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user ? (
              <>
                <button
                  onClick={() => handleNavClick('orders')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                    currentPage === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Siparişlerim</span>
                </button>
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                    currentPage === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profilim</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('customer-login')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  currentPage === 'customer-login'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Giriş / Kayıt</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  item.id === 'calculator'
                    ? currentPage === item.id
                      ? 'bg-blue-800 text-white shadow-lg'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user ? (
              <>
                <button
                  onClick={() => handleNavClick('orders')}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                    currentPage === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Siparişlerim</span>
                </button>
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                    currentPage === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Profilim</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('customer-login')}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                  currentPage === 'customer-login'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5" />
                <span>Giriş / Kayıt</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
