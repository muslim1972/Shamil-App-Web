import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const isButtonDisabled = !validateEmail(email) || password.length < 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      alert('الرجاء إدخال بريد إلكتروني صالح.');
      return;
    }
    if (password.length < 6) {
      alert('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-green-100 mb-6">
            <span className="text-3xl font-bold text-green-600">شامل</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">تطبيق شامل</h2>
          <p className="text-gray-600">تسجيل الدخول</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm text-right"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm text-right"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isButtonDisabled ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              تسجيل الدخول
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="font-medium text-green-600 hover:text-green-500"
              onClick={onSwitchToRegister}
            >
              ليس لدي حساب . أنشئ حساباً جديداً
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
