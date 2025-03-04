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

const Login = () => {
  const [username, setUsername] = useState('admin@mail.com');
  const [password, setPassword] = useState('admin');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      console.error('Username and password are required');
      setLoginError('Username and password are required');
      return;
    }
    console.log('Logging in...');
    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password
      });
      if (result?.error) {
        console.error(result.error);
      } else {
        console.log('Login successful');
        setLoginError('');
      }
    } catch (error) {
      console.error('There was an error logging in:', error);
      setLoginError('There was an error logging in');
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
            {loginError && <Label className="flex items-center justify-center text-red-500">{loginError}</Label>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;