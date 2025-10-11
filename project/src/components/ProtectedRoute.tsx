import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  onNavigate?: (page: string) => void;
}

export default function ProtectedRoute({ children, onNavigate }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erişim Yetkisi Gerekli
            </h2>
            <p className="text-gray-600 mb-6">
              Bu sayfaya erişim için giriş yapmanız gerekmektedir.
            </p>
            <button
              onClick={() => onNavigate?.('admin-login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="h-5 w-5" />
              <span>Giriş Yap</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
