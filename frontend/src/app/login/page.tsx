"use client";
import axios from "axios";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
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

const Login = () => {
  const [username, setUsername] = useState('admin@mail.com');
  const [password, setPassword] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setLoginError(''); // Clear previous errors
  
    console.log('Submitting login form', username, password);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Don't redirect automatically
        email: username, // Use 'email' if your credentials provider expects it
        password
      });
      if (result?.error) {
        console.error('Login error:', result.error);
        setLoginError('Invalid credentials. Please try again.');
      } else if (result?.ok) {
        console.log('Login successful', result);
        router.push('/home'); // Redirect to home page on successful login
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="username" className='mb-2'>Username:</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="password" className='mb-2'>Password:</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {loginError}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;