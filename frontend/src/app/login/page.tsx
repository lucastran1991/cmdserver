"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Heading,
  Text,
  VStack,
  Container,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useColorModeValue,
  Icon,
  Link,
  Divider,
  Flex,
  useToast
} from '@chakra-ui/react';
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock } from 'react-icons/md';
import { useAuthStore } from '@/store/authStore';

const Login = () => {
  const { setToken } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.400, purple.500, pink.400)',
    'linear(to-br, blue.600, purple.700, pink.600)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const registeredUser = sessionStorage.getItem('registeredUser');
      if (registeredUser) {
        try {
          const userData = JSON.parse(registeredUser);
          if (userData.username) setUsername(userData.username);
          if (userData.password) setPassword(userData.password);
          sessionStorage.removeItem('registeredUser');

          toast({
            title: "Welcome back!",
            description: "Login details auto-filled from registration.",
            status: "info",
            duration: 2000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error parsing registered user data:', error);
        }
      }
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();
      if (response.ok && data.access_token) {
        const token = data.access_token;
        console.log('Login successful:', data);
        setToken(data.access_token);
        // Save the token

        // Save user data if available in the response      
        toast({
          title: "Login successful!",
          description: "Welcome back to CMD Server.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        const getUser = await fetch(API_ENDPOINTS.USERINFO, {
          method: 'GET',
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${token}`,
          },
        });

        try {
          const userData = await getUser.json();
          if (getUser.ok) {
            console.log('User data:', userData);
            // Update auth store with user data
            useAuthStore.setState(state => ({ ...state, user: userData }));
            // Store in localStorage for persistence across sessions
            localStorage.setItem('userData', JSON.stringify(userData));
          } else {
            console.error('Failed to fetch user data:', userData);
            toast({
              title: "Warning",
              description: "Login successful, but couldn't load your profile data.",
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }

        setTimeout(() => router.push('/preload'), 200);
      } else {
        setLoginError(data.detail || 'Login failed');
        toast({
          title: "Login failed",
          description: data.detail || 'Please check your credentials.',
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Login failed. Please try again.');
      toast({
        title: "Connection error",
        description: "Unable to connect to server. Please try again.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Container maxW="md">
        <Card
          bg={cardBg}
          shadow="2xl"
          borderRadius="2xl"
          overflow="hidden"
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <Box textAlign="center">
                <Box
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  w="80px"
                  h="80px"
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  boxShadow="0 10px 25px rgba(102, 126, 234, 0.6)"
                  borderRadius="full"
                  mb="20px"
                  animation="pulse 2s infinite"
                >
                  <Icon as={MdLock} w={8} h={8} color="white" />
                </Box>
                <Heading
                  size="xl"
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  bgClip="text"
                  mb={2}
                >
                  Welcome Back
                </Heading>
                <Text color={textColor} fontSize="lg">
                  Sign in to access CMD Server
                </Text>
              </Box>

              <Divider />

              {/* Login Form */}
              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel color={textColor}>Email Address</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={MdEmail} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        size="lg"
                        borderRadius="lg"
                        focusBorderColor="blue.500"
                        _hover={{ borderColor: 'blue.300' }}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor}>Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={MdLock} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="lg"
                        borderRadius="lg"
                        focusBorderColor="blue.500"
                        _hover={{ borderColor: 'blue.300' }}
                      />
                      <InputRightElement>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <Icon as={showPassword ? MdVisibilityOff : MdVisibility} />
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  {loginError && (
                    <Alert status="error" borderRadius="lg">
                      <AlertIcon />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    spinner={<Spinner size="sm" />}
                    bgGradient="linear(to-r, blue.500, purple.500)"
                    _hover={{
                      bgGradient: "linear(to-r, blue.600, purple.600)",
                      transform: "translateY(-2px)",
                      shadow: "lg"
                    }}
                    _active={{
                      transform: "translateY(0)",
                    }}
                    transition="all 0.2s"
                    borderRadius="lg"
                  >
                    Sign In
                  </Button>
                </VStack>
              </Box>

              <Divider />

              {/* Footer */}
              <Flex justify="center" align="center">
                <Text color={textColor} fontSize="sm">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    color="blue.500"
                    fontWeight="semibold"
                    _hover={{
                      color: "blue.600",
                      textDecoration: "underline"
                    }}
                  >
                    Sign up here
                  </Link>
                </Text>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;