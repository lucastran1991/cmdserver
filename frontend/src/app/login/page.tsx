"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/api";
import { useEffect } from 'react';

const Login = () => {
  const [username, setUsername] = useState('admin@mail.com');
  const [password, setPassword] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const registeredUser = sessionStorage.getItem('registeredUser');
      if (registeredUser) {
        try {
          const userData = JSON.parse(registeredUser);
          // Fill in the form fields with the registered user data
          if (userData.username) setUsername(userData.username);
          if (userData.password) setPassword(userData.password);

          // Remove the item from sessionStorage after using it
          sessionStorage.removeItem('registeredUser');
        } catch (error) {
          console.error('Error parsing registered user data:', error);
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setLoginError(''); // Clear previous errors
    console.log('Submitting login form', username, password);

    try {
      const result = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: username,
          password: password,
          is_superuser: "false",
          is_verified: "true",
          is_active: "true"
        }),
      });

      const user = await result.json();
      if (user?.error) {
        console.error('Login error:', user.error);
        setLoginError(user.error);
        return;
      } else if (result?.ok && user) {
        console.log('Login successful', result);
        useAuthStore.getState().setToken(user.access_token);
        router.push('/targets');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Card className="w-full max-w-md shadow-2xl rounded-xl border-0 bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-3xl font-bold text-purple-700 drop-shadow">
            <span className="mr-2">🔐</span> Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="username" className="mb-2 text-lg text-gray-700">Username</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg px-4 py-2 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="password" className="mb-2 text-lg text-gray-700">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg px-4 py-2 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>
            {loginError && (
              <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow">
                {loginError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 py-3 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 rounded-lg shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </Button>
          </form>
          <div className="mt-6 text-center text-gray-500 text-sm">
            <span>Don&apos;t have an account?</span>
            <a href="/register" className="ml-2 text-purple-600 hover:underline font-medium">Sign up</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;