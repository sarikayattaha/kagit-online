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
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Apple Style */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => handleNavClick('home')}
          >
            <div className="bg-gray-900 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Kağıt Online</span>
          </div>

          {/* Desktop Navigation - Apple Style */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  item.id === 'calculator'
                    ? currentPage === item.id
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'bg-black text-white hover:bg-gray-800 shadow-md hover:scale-105'
                    : currentPage === item.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {user ? (
              <>
                {/* Siparişlerim */}
                <button
                  onClick={() => {
                    onNavigate('profile');
                    window.history.replaceState({}, '', '#profile?tab=orders');
                  }}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    currentPage === 'profile' && window.location.hash.includes('tab=orders')
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                  <span>Siparişlerim</span>
                </button>

                {/* Profilim */}
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    currentPage === 'profile' && !window.location.hash.includes('tab=orders')
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <User className="h-4 w-4" strokeWidth={2} />
                  <span>Profilim</span>
                </button>

                {/* Çıkış */}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('customer-login')}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  currentPage === 'customer-login'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <User className="h-4 w-4" strokeWidth={2} />
                <span>Giriş / Kayıt</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button - Apple Style */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 rounded-full text-gray-700 hover:bg-gray-100 transition-all duration-300"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" strokeWidth={2} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Apple Style */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
          <div className="px-6 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-base font-semibold transition-all duration-300 ${
                  item.id === 'calculator'
                    ? currentPage === item.id
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-black text-white hover:bg-gray-800 shadow-md'
                    : currentPage === item.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Divider */}
            <div className="h-px bg-gray-200 my-4"></div>

            {user ? (
              <>
                {/* Siparişlerim */}
                <button
                  onClick={() => {
                    onNavigate('profile');
                    window.history.replaceState({}, '', '#profile?tab=orders');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-base font-semibold flex items-center space-x-3 transition-all duration-300 ${
                    currentPage === 'profile' && window.location.hash.includes('tab=orders')
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                  <span>Siparişlerim</span>
                </button>

                {/* Profilim */}
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-base font-semibold flex items-center space-x-3 transition-all duration-300 ${
                    currentPage === 'profile' && !window.location.hash.includes('tab=orders')
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <User className="h-5 w-5" strokeWidth={2} />
                  <span>Profilim</span>
                </button>

                {/* Çıkış */}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-5 py-3.5 rounded-2xl text-base font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-3 transition-all duration-300"
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('customer-login')}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-base font-semibold flex items-center space-x-3 transition-all duration-300 ${
                  currentPage === 'customer-login'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <User className="h-5 w-5" strokeWidth={2} />
                <span>Giriş / Kayıt</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
