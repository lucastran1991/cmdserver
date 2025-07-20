// pages/register.tsx
"use client";

import { Box, Button, FormControl, FormLabel, Input, Heading, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Call API register
    console.log({ name, email, password })
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Box className="w-full max-w-md bg-white p-8 rounded-xl shadow" borderWidth={1}>
        <Heading mb={6} size="lg" textAlign="center">
          Register
        </Heading>
        <form onSubmit={handleSubmit}>
          <FormControl mb={4} isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>

          <FormControl mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl mb={6} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <Button colorScheme="teal" type="submit" width="full">
            Register
          </Button>
        </form>

        <Text fontSize="sm" mt={4} textAlign="center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </Text>
      </Box>
    </Box>
  )
}
