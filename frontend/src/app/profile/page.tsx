'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api';
import {
  Box,
  Button,
  Container,
  Avatar,
  Text,
  Heading,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Spinner,
  Flex,
  GridItem,
  Grid,
  FormErrorMessage,
  Badge,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';

interface UserData {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
  avatar?: string;
  bio?: string;
  role?: string;
}

export default function ProfilePage() {
  const { isAuthenticated, token, user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      fullName: user?.full_name?.toString() || '',
      email: user?.email?.toString() || '',
      avatarUrl: user?.avatar?.toString() || '',
      username: user?.username?.toString() || '',
      bio: user?.bio?.toString() || '',
    }
  });

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.USERINFO, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = await response.json();

        if (response.ok) {
          useAuthStore.setState(state => ({ ...state, user: userData }));
          reset({
            fullName: userData.full_name || '',
            email: userData.email || '',
            avatarUrl: userData.avatar || '',
            username: userData.username || '',
            bio: userData.bio || '',
          });
          toast({
            title: "Success",
            description: "Profile data loaded successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load profile data",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, token, reset, router, toast]);

  const onSubmit = async (data: {
    fullName: string;
    email: string;
    avatarUrl: string;
    username: string;
    bio: string;
  }) => {
    setUpdating(true);
    try {
      const response = await fetch(API_ENDPOINTS.USERINFO, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          avatar: data.avatarUrl,
          username: data.username,
          bio: data.bio
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        useAuthStore.setState(state => ({ ...state, user: updatedUser }));
        reset({
          fullName: updatedUser.full_name || '',
          email: updatedUser.email || '',
          avatarUrl: updatedUser.avatar || '',
          username: updatedUser.username || '',
          bio: updatedUser.bio || '',
        });
        toast({
          title: "Success",
          description: "Profile updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const bgGradient = useColorModeValue(
    'linear(135deg, blue.400 0%, purple.500 50%, pink.400 100%)',
    'linear(135deg, blue.600 0%, purple.700 50%, pink.600 100%)'
  );
  const cardBg = useColorModeValue('rgba(255,255,255,0.85)', 'rgba(26,32,44,0.85)');
  const textColor = useColorModeValue('gray.800', 'white');

  if (loading) {
    return (
      <Flex height="100vh" align="center" justify="center" bgGradient={bgGradient}>
        <Spinner size="xl" color="white" thickness="4px" speed="0.65s" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient} py={12} px={2} position="relative">
      {/* Animated background elements */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w="300px"
        h="300px"
        bg="rgba(255,255,255,0.1)"
        borderRadius="50%"
        animation="float 6s ease-in-out infinite"
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="10%"
        right="10%"
        w="200px"
        h="200px"
        bg="rgba(255,255,255,0.05)"
        borderRadius="50%"
        animation="float 8s ease-in-out infinite reverse"
        zIndex={0}
      />

      <Container maxW="container.md" zIndex={1} position="relative">
        <Card
          variant="elevated"
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgba(0,0,0,0.25)"
          border="1px solid rgba(255,255,255,0.2)"
          p={8}
        >
          <CardBody>
            <VStack spacing={6} align="center">
              <Box position="relative">
                <Avatar
                  src={user?.avatar?.toString() || '/default-avatar.png'}
                  name={user?.username?.toString() || 'User'}
                  size="2xl"
                  mb={2}
                  boxShadow="0 8px 20px rgba(102,126,234,0.4)"
                  border="4px solid"
                  borderColor={useColorModeValue('purple.400', 'purple.600')}
                  animation="pulse 2s infinite"
                />
                <Badge
                  position="absolute"
                  bottom={2}
                  right={-2}
                  colorScheme={user?.is_active ? "green" : "red"}
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                  boxShadow="md"
                >
                  {user?.is_active ? "Active" : "Inactive"}
                </Badge>
              </Box>
              <Heading size="lg" color={textColor}>
                {(user?.full_name?.toString() || user?.username?.toString() || 'User')}
              </Heading>
              <Text color="gray.500" fontSize="md">
                {user?.email}
              </Text>
              <HStack spacing={4}>
                {user?.role && (
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1} borderRadius="full">
                    {user.role}
                  </Badge>
                )}
                {Boolean(user?.is_superuser) && (
                  <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="full">
                    Admin
                  </Badge>
                )}
                {Boolean(user?.is_verified) && (
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                    Verified
                  </Badge>
                )}
              </HStack>
              <Divider my={4} />
              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                  <GridItem colSpan={12}>
                    <Controller
                      name="fullName"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl isInvalid={!!fieldState.error}>
                          <FormLabel>Full Name</FormLabel>
                          <Input {...field} placeholder="Enter your full name" />
                          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem colSpan={12}>
                    <Controller
                      name="username"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl isInvalid={!!fieldState.error}>
                          <FormLabel>Username</FormLabel>
                          <Input {...field} placeholder="Enter username" />
                          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem colSpan={12}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl isInvalid={!!fieldState.error}>
                          <FormLabel>Email</FormLabel>
                          <Input {...field} type="email" placeholder="Enter email" />
                          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem colSpan={12}>
                    <Controller
                      name="bio"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl isInvalid={!!fieldState.error}>
                          <FormLabel>Bio</FormLabel>
                          <Textarea {...field} placeholder="Enter a short bio" rows={4} />
                          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem colSpan={12}>
                    <Controller
                      name="avatarUrl"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl isInvalid={!!fieldState.error}>
                          <FormLabel>Avatar URL</FormLabel>
                          <Input {...field} placeholder="Enter URL to your profile image" />
                          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem colSpan={12}>
                    <Flex justify="center" mt={4}>
                      <Button
                        type="submit"
                        isLoading={updating}
                        loadingText="Updating"
                        px={8}
                        colorScheme="purple"
                        borderRadius="xl"
                        boxShadow="0 8px 20px rgba(102,126,234,0.2)"
                        _hover={{
                          bgGradient: "linear(135deg, purple.500, pink.500)",
                          transform: 'scale(1.05)',
                        }}
                        transition="all 0.2s"
                      >
                        Update Profile
                      </Button>
                    </Flex>
                  </GridItem>
                </Grid>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </Box>
  );
}