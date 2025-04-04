
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if already logged in
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple authentication - in a real app, this would be handled by a server
    // For demo purposes, we use hardcoded credentials
    const correctUsername = 'admin';
    const correctPassword = 'admin123';

    setTimeout(() => {
      if (username === correctUsername && password === correctPassword) {
        localStorage.setItem('adminAuthenticated', 'true');
        toast.success('Успішний вхід');
        
        // Redirect to admin page or the page they tried to access before
        const from = location.state?.from?.pathname || "/admin";
        navigate(from, { replace: true });
      } else {
        toast.error('Неправильне ім\'я користувача або пароль');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-full bg-brand-blue/10 mb-4">
            <LockKeyhole className="h-6 w-6 text-brand-blue" />
          </div>
          <h1 className="text-2xl font-bold text-brand-blue">Вхід в адміністративну панель</h1>
          <p className="text-gray-500 text-sm mt-1">Введіть свої облікові дані для входу</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Ім'я користувача</Label>
            <Input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-brand-blue hover:bg-brand-dark-blue" 
            disabled={isLoading}
          >
            {isLoading ? 'Вхід...' : 'Увійти'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Для демо: ім'я користувача: <strong>admin</strong>, пароль: <strong>admin123</strong></p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
