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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      const response = await axios.post("http://localhost:8000/auth/jwt/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }
      const data = response.data;
      console.log('Data:', data);
      const { access_token, token_type } = data;
      console.log('Access token:', access_token, 'Token type:', token_type);
      const result = await signIn('credentials', {
        redirect: false,
        access_token,
      });
      if (result?.error) {
        console.error(result.error);
      } else {
        console.log('Login successful');
      }
    } catch (error) {
      console.error('There was an error logging in:', error);
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
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;