"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
  Grid,
  Card,
  CardBody,
  useColorModeValue,
  Flex,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FaRocket, FaCog, FaUsers, FaServer, FaSignOutAlt } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';

export default function Home() {
  const { isAuthenticated, logout } = useAuthStore();
  const [isLogin, setIsLogin] = useState(false);
  const router = useRouter();
  const { token } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isAuthenticated) {
        setIsLogin(false);
      } else {
        setIsLogin(true);
      }
    }
  }, [router, token]);

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.400, purple.500, pink.400)',
    'linear(to-br, blue.600, purple.700, pink.600)'
  );

  const cardBg = useColorModeValue('white', 'gray.800');

  const handleLogout = async () => {
    if (!isAuthenticated) return;
    logout();
  };

  if (!isLogin) {
    return (
      <Box
        minH="calc(100vh - 64px)"
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Card maxW="md" bg={cardBg} shadow="2xl" borderRadius="xl">
          <CardBody textAlign="center" p={10}>
            <Icon as={FaServer} boxSize={16} color="red.500" mb={6} />
            <Heading size="lg" mb={4} color="red.500">
              🚫 Access Denied
            </Heading>
            <Text mb={6} color="gray.600">
              You need to be logged in to access this page.
            </Text>
            <Button
              colorScheme="purple"
              onClick={() => router.push("/login")}
              size="lg"
            >
              Go to Login
            </Button>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box minH="calc(100vh - 64px)" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Logout Button */}
      <Button
        position="fixed"
        top="80px"
        right="20px"
        zIndex="50"
        leftIcon={<Icon as={FaSignOutAlt} />}
        colorScheme="red"
        variant="solid"
        onClick={handleLogout}
        size="sm"
      >
        Logout
      </Button>

      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} textAlign="center">
          {/* Hero Section */}
          <Box>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, purple.400, pink.400)"
              bgClip="text"
              mb={4}
            >
              Welcome to CMD Server
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Your centralized command and deployment management platform. 
              Monitor, deploy, and manage your infrastructure with ease.
            </Text>
          </Box>

          {/* Feature Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} w="full">
            <Card bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody textAlign="center">
                <Icon as={FaRocket} boxSize={8} color="blue.500" mb={4} />
                <Heading size="md" mb={2}>Deploy</Heading>
                <Text color="gray.600">
                  Quick and reliable deployment management
                </Text>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody textAlign="center">
                <Icon as={FaServer} boxSize={8} color="green.500" mb={4} />
                <Heading size="md" mb={2}>Monitor</Heading>
                <Text color="gray.600">
                  Real-time server monitoring and alerts
                </Text>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody textAlign="center">
                <Icon as={FaCog} boxSize={8} color="orange.500" mb={4} />
                <Heading size="md" mb={2}>Configure</Heading>
                <Text color="gray.600">
                  Easy configuration management
                </Text>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody textAlign="center">
                <Icon as={FaUsers} boxSize={8} color="purple.500" mb={4} />
                <Heading size="md" mb={2}>Collaborate</Heading>
                <Text color="gray.600">
                  Team collaboration and access control
                </Text>
              </CardBody>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Box w="full">
            <Heading size="lg" mb={6} textAlign="center">
              Quick Actions
            </Heading>
            <Flex justify="center" gap={4} wrap="wrap">
              <Button
                leftIcon={<Icon as={FaServer} />}
                colorScheme="blue"
                size="lg"
                onClick={() => router.push("/targets")}
              >
                View Targets
              </Button>
              <Button
                leftIcon={<Icon as={FaRocket} />}
                colorScheme="green"
                variant="outline"
                size="lg"
                onClick={() => router.push("/preload")}
              >
                Deploy Now
              </Button>
              <Button
                leftIcon={<Icon as={FaCog} />}
                colorScheme="orange"
                variant="outline"
                size="lg"
              >
                Settings
              </Button>
            </Flex>
          </Box>

          {/* Status Badge */}
          <Badge colorScheme="green" fontSize="md" px={4} py={2} borderRadius="full">
            🟢 System Online
          </Badge>
        </VStack>
      </Container>
    </Box>
  );
}
