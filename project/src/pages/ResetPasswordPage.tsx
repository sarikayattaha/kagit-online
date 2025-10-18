import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Lock } from 'lucide-react';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export default function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // URL'den token'ı kontrol et
    const checkToken = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');

      // Hata kontrolü
      if (errorCode === 'otp_expired') {
        setError('⚠️ Şifre sıfırlama linki süresi dolmuş! Lütfen yeni bir link talep edin. (Linkler 1 saat geçerlidir)');
        setValidToken(false);
        return;
      }

      if (errorDescription) {
        setError(`⚠️ Hata: ${decodeURIComponent(errorDescription)}`);
        setValidToken(false);
        return;
      }

      // Token kontrolü
      if (type === 'recovery' && accessToken) {
        setValidToken(true);
      } else {
        setError('⚠️ Geçersiz şifre sıfırlama linki. Lütfen emailinizdeki linke tıkladığınızdan emin olun.');
        setValidToken(false);
      }
    };

    checkToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        onNavigate('customer-login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Şifre güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Token geçersizse veya süre dolmuşsa
  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Link Geçersiz veya Süresi Dolmuş
            </h2>
          </div>

          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-800">{error}</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">💡 Ne Yapmalısınız?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Giriş sayfasına gidin</li>
              <li>"Şifremi Unuttum" butonuna tıklayın</li>
              <li>Yeni bir şifre sıfırlama linki alın</li>
              <li>Emailinizi 2-5 dakika içinde kontrol edin</li>
              <li>Yeni linke 1 saat içinde tıklayın</li>
            </ol>
          </div>

          <button
            onClick={() => onNavigate('customer-login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Giriş Sayfasına Git
          </button>
        </div>
      </div>
    );
  }

  // Başarılı şifre değişimi
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Şifreniz Başarıyla Güncellendi!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Yeni şifrenizle giriş yapabilirsiniz. 3 saniye içinde yönlendirileceksiniz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Token yüklenirken
  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Şifre sıfırlama formu
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Yeni Şifre Belirle
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hesabınız için yeni bir şifre oluşturun
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                Yeni Şifre <span className="text-red-500">*</span>
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="En az 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 6 karakter</p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Şifre Tekrar <span className="text-red-500">*</span>
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => onNavigate('customer-login')}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              Giriş sayfasına dön
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
