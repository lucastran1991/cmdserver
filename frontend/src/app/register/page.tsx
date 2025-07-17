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
import { API_ENDPOINTS } from "../../lib/api";

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BE'); // Default role
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRegisterError('');
    console.log('Submitting registration form', username, password);

    try {
      const result = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { "Content-Type": "application/json" }, // Changed to JSON format
        body: JSON.stringify({
          email: username, // Changed to email as the API likely expects this field name
          password: password
        }),
      });

      const user = await result.json();
      if (!result.ok) {
        console.error('Registration error:', user.detail || user.error);
        setRegisterError(user.detail || user.error || 'Registration failed');
        return;
      }

      console.log('Registration successful', user);
      // Store the credentials temporarily
      sessionStorage.setItem('registeredUser', JSON.stringify({
        username,
        password
      }));
      router.push('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      setRegisterError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Rest of the component remains the same */}
      <Card className="w-full max-w-md shadow-2xl rounded-xl border-0 bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-3xl font-bold text-purple-700 drop-shadow">
            <span className="mr-2">🔐</span> Register
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
            <div className="mb-6">
              <Label htmlFor="role" className="mb-2 text-lg text-gray-700">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg px-4 py-2 transition-all duration-200"
              >
                <option value="" disabled>Select your role</option>
                <option value="BE">BE</option>
                <option value="UI">UI</option>
                <option value="QA">QA</option>
                <option value="Người qua đường">Người qua đường</option>
                <option value="Đi trễ">Đi trễ</option>
                <option value="Về sớm">Về sớm</option>
                <option value="Người ăn kem mãi không trúng thưởng">Người ăn kem mãi không trúng thưởng</option>
              </select>
            </div>
            {registerError && (
              <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow">
                {registerError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 rounded-lg shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Registering...
                </span>
              ) : 'Register'}
            </Button>
          </form>
          <div className="mt-6 text-center text-gray-500 text-sm">
            <span>Already have an account?</span>
            <a href="/login" className="ml-2 text-purple-600 hover:underline font-medium">Log in</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
