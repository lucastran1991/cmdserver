"use client";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Container,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  HStack,
  Text,
  Heading,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardBody,
  Link,
  IconButton,
  Divider,
  useColorModeValue,
  Select,
} from '@chakra-ui/react';
import { MdAppRegistration, MdEmail, MdLock, MdOutlineExpand, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(135deg, blue.400 0%, purple.500 50%, pink.400 100%)',
    'linear(135deg, blue.600 0%, purple.700 50%, pink.600 100%)'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');
  const inputBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    if (!formData.email || !formData.password || !formData.fullName || !formData.role) {
      setError('Please fill in all required fields');
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: formData.role
        }),
      });

      if (response.ok) {
        // Store user data for auto-fill on login
        sessionStorage.setItem('registeredUser', JSON.stringify({
          username: formData.email,
          password: formData.password
        }));

        toast({
          title: 'Account Created! 🎉',
          description: 'Welcome! You can now sign in with your new account.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });

        router.push('/login');
      } else {
        const data = await response.json();
        const errorMessage = data.detail || 'Registration failed';
        setError(errorMessage);
        toast({
          title: 'Registration Failed',
          description: errorMessage,
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Network Error',
        description: errorMessage,
        status: 'error',
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
      position="relative"
      overflow="hidden"
    >
      {/* Animated background elements */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w="300px"
        h="300px"
        bg="rgba(255, 255, 255, 0.1)"
        borderRadius="50%"
        animation="float 6s ease-in-out infinite"
      />
      <Box
        position="absolute"
        bottom="10%"
        right="10%"
        w="200px"
        h="200px"
        bg="rgba(255, 255, 255, 0.05)"
        borderRadius="50%"
        animation="float 8s ease-in-out infinite reverse"
      />

      <Container maxW="xl" centerContent>
        <Card
          bg={cardBg}
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          p={8}
          w="full"
          position="relative"
          overflow="hidden"
        >
          <CardBody>
            {/* Header */}
            <VStack spacing={6} align="center" mb={8}>
              <Box
                w="80px"
                h="80px"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                borderRadius="50%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 10px 25px rgba(102, 126, 234, 0.4)"
                animation="pulse 2s infinite"
              >
                <MdAppRegistration size={32} color="white" />
              </Box>
              <VStack spacing={2}>
                <Heading
                  size="xl"
                  bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
                  bgClip="text"
                  textAlign="center"
                  fontWeight="bold"
                >
                  Register Account
                </Heading>
                <Text
                  fontSize="md"
                  color="gray.500"
                  textAlign="center"
                >
                  Join us today and start your journey
                </Text>
                <Text
                  fontSize="md"
                  color="blue.500"
                  textAlign="center"
                  fontWeight="bold"
                >
                  Việc nhẹ, volt cao, guộc lai ba lăng
                </Text>
              </VStack>
            </VStack>

            <form onSubmit={handleSubmit}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">
                    Name
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <MdPerson color="gray" />
                    </InputLeftElement>
                    <Input
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      bg={inputBg}
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize="md"
                      _hover={{
                        borderColor: 'blue.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">
                    Email
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <MdEmail color="gray" />
                    </InputLeftElement>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      bg={inputBg}
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize="md"
                      _hover={{
                        borderColor: 'blue.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">
                    Who are you
                  </FormLabel>
                  <InputGroup>
                    <Select
                      name="role"
                      placeholder="Select your role"
                      value={formData.role}
                      onChange={handleChange}
                      bg={inputBg}
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      fontSize="md"
                      _hover={{
                        borderColor: 'blue.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    >                      
                      <option value="BE">BE</option>
                      <option value="UI">UI</option>
                      <option value="QA">QA</option>
                      <option value="PM">PM</option>
                      <option value="Người qua đường">Người qua đường</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Đi trễ">Đi trễ</option>
                      <option value="Về sớm">Về sớm</option>
                      <option value="Người chọc chó">Người chọc chó</option>
                      <option value="Người bị chó cắn">Người bị chó cắn</option>
                      <option value="gâu gâu">gâu gâu</option>
                      <option value="Người ăn kem mãi không trúng thưởng">Người ăn kem mãi không trúng thưởng</option>
                      <option value="Nô lệ deploy">Nô lệ deploy</option>
                    </Select>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">
                    Password
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <MdLock color="gray" />
                    </InputLeftElement>
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      bg={inputBg}
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize="md"
                      _hover={{
                        borderColor: 'blue.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                        color="gray.500"
                        _hover={{ color: 'blue.500' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor} fontWeight="semibold">
                    Confirm Password
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <MdLock color="gray" />
                    </InputLeftElement>
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      bg={inputBg}
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize="md"
                      _hover={{
                        borderColor: 'blue.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        variant="ghost"
                        size="sm"
                        color="gray.500"
                        _hover={{ color: 'blue.500' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                {error && (
                  <Alert status="error" borderRadius="xl" bg="red.50" border="1px solid" borderColor="red.200">
                    <AlertIcon color="red.500" />
                    <Text color="red.700" fontSize="sm">
                      {error}
                    </Text>
                  </Alert>
                )}

                <Button
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Creating Account..."
                  w="full"
                  size="lg"
                  bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
                  color="white"
                  borderRadius="xl"
                  py={6}
                  fontSize="md"
                  fontWeight="semibold"
                  _hover={{
                    bgGradient: "linear(135deg, blue.500, purple.600, pink.500)",
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    _before: {
                      left: '100%',
                    },
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s',
                  }}
                >
                  Create Account 🚀
                </Button>

                <HStack w="full" my={4}>
                  <Divider />
                  <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                    Already have an account?
                  </Text>
                  <Divider />
                </HStack>

                <Link
                  href="/login"
                  w="full"
                  textAlign="center"
                  py={3}
                  px={6}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor="gray.200"
                  bg={inputBg}
                  color={textColor}
                  fontSize="md"
                  fontWeight="semibold"
                  textDecoration="none"
                  _hover={{
                    borderColor: 'blue.300',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textDecoration: 'none',
                  }}
                  transition="all 0.2s"
                >
                  Sign In to Your Account
                </Link>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </Container>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </Box>
  );
};

export default Register;