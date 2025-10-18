import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CalculatorPage from './pages/CalculatorPage';
import OrdersPage from './pages/OrdersPage';
import ContactPage from './pages/ContactPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminExchangeRatePage from './pages/AdminExchangeRatePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminRollWidthsPage from './pages/AdminRollWidthsPage';
import AdminProductCategoriesPage from './pages/AdminProductCategoriesPage';
import AdminContactInfoPage from './pages/AdminContactInfoPage';
import AdminProductsManagementPage from './pages/AdminProductsManagementPage';
import AdminPriceCalculationPage from './pages/AdminPriceCalculationPage';
import AdminOrdersManagementPage from './pages/AdminOrdersManagementPage';
import AdminFormulaManagementPage from './pages/AdminFormulaManagementPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { LogOut } from 'lucide-react';
import AdminBannerManagementPage from './pages/AdminBannerManagementPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageHistory, setPageHistory] = useState<string[]>(['home']);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.startsWith('admin.')) {
      setIsAdminMode(true);
      setCurrentPage('admin-login');
      setPageHistory(['admin-login']);
    }
  }, []);

  // Şifre sıfırlama linki kontrolü
  useEffect(() => {
    const checkPasswordReset = () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const type = params.get('type');
        const accessToken = params.get('access_token');
        
        // Eğer type=recovery ve access_token varsa, reset-password sayfasına yönlendir
        if (type === 'recovery' && accessToken) {
          setCurrentPage('reset-password');
          setPageHistory(['reset-password']);
        }
      }
    };

    checkPasswordReset();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (pageHistory.length > 1) {
        const newHistory = [...pageHistory];
        newHistory.pop();
        const previousPage = newHistory[newHistory.length - 1] || 'home';
        setPageHistory(newHistory);
        setCurrentPage(previousPage);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pageHistory]);

  const handleNavigate = (page: string) => {
    if (page !== currentPage) {
      setPageHistory([...pageHistory, page]);
      setCurrentPage(page);
      window.history.pushState({ page }, '', `#${page}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentPage('admin-login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'products':
        return <ProductsPage />;
      case 'customer-login':
        return <CustomerLoginPage onNavigate={handleNavigate} onLoginSuccess={() => setCurrentPage('home')} />;
      case 'profile':
        return user ? <CustomerProfilePage /> : <CustomerLoginPage onNavigate={handleNavigate} onLoginSuccess={() => setCurrentPage('profile')} />;
      case 'calculator':
        return user ? <CalculatorPage onNavigate={handleNavigate} /> : <CustomerLoginPage onNavigate={handleNavigate} onLoginSuccess={() => setCurrentPage('calculator')} />;
      case 'orders':
        // Siparişlerim butonu profile sayfasının orders tab'ına yönlendiriyor
        if (user) {
          // URL'de tab=orders parametresini ayarla
          if (!window.location.hash.includes('tab=orders')) {
            window.history.replaceState({}, '', '#profile?tab=orders');
          }
          return <CustomerProfilePage />;
        } else {
          return <CustomerLoginPage onNavigate={handleNavigate} onLoginSuccess={() => {
            setCurrentPage('profile');
            window.history.replaceState({}, '', '#profile?tab=orders');
          }} />;
        }
      case 'contact':
        return <ContactPage />;
      case 'reset-password':
        return <ResetPasswordPage onNavigate={handleNavigate} />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} />;
      case 'admin-dashboard':
      case 'admin':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminDashboardPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'admin-exchange':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminExchangeRatePage />
          </ProtectedRoute>
        );
      case 'admin-roll-widths':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminRollWidthsPage />
          </ProtectedRoute>
        );
      case 'admin-products':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminProductsManagementPage />
          </ProtectedRoute>
        );
      case 'admin-categories':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminProductCategoriesPage />
          </ProtectedRoute>
        );
      case 'admin-contact':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminContactInfoPage />
          </ProtectedRoute>
        );
      case 'admin-products-management':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminProductsManagementPage />
          </ProtectedRoute>
        );
      case 'admin-orders-management':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminOrdersManagementPage />
          </ProtectedRoute>
        );
      case 'admin-formulas':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminFormulaManagementPage />
          </ProtectedRoute>
        );
      case 'admin-price-calculation':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminPriceCalculationPage />
          </ProtectedRoute>
        );
      case 'admin-banners':
        return (
          <ProtectedRoute onNavigate={handleNavigate}>
            <AdminBannerManagementPage />
          </ProtectedRoute>
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => handleNavigate(user ? 'admin-dashboard' : 'admin-login')}
                className="text-xl font-bold text-gray-900"
              >
                Admin Panel
              </button>
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    <span className="text-sm text-gray-600">
                      {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Çıkış</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsAdminMode(false);
                    setCurrentPage('home');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Ana Siteye Dön
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {renderPage()}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
