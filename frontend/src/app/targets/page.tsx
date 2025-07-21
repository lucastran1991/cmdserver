"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, makeAuthenticatedRequest } from "@/lib/api";
import {
  Box,
  Button,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  Badge,
  Grid,
  GridItem,
  useToast,
  Spinner,
  Center,
  useColorModeValue,
  Icon,
  Flex,
  Divider,
  Switch
} from '@chakra-ui/react';
import { MdStorage, MdLogout, MdPlayArrow, MdStop, MdCloudUpload } from 'react-icons/md';
import { useAuthStore } from '@/store/authStore';

interface Target {
  id?: string | number;
  name?: string;
  server_status?: boolean;
  description?: string;
  server_tag?: string;
  server_alias?: string;
  server_path?: string;
  server_port?: string | number;
  server_role?: string;
}

export default function TargetsPage() {
  const { isAuthenticated, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [isInit, setIsInit] = useState(false);
  const [targetList, setTargetList] = useState<Target[]>([]);
  const router = useRouter();
  const toast = useToast();

  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(135deg, blue.400 0%, purple.500 50%, pink.400 100%)',
    'linear(135deg, blue.600 0%, purple.700 50%, pink.600 100%)'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isAuthenticated) {
        setIsLogin(false);
      } else {
        setIsLogin(true);
      }
    }
  }, [router]);

  useEffect(() => {
    if (isLogin) {
      if (!isInit) {
        setIsLoading(true);
        fetchTargets();
      }
    }
  }, [isLogin, toast]);

  const fetchTargets = async () => {
    try {
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.TARGETS);
      const data = await response.json();
      console.log("Fetched targets:", data);
      setTargetList(data);
      for (const target of data) {
        target.server_status = await checkServerStatus(target);
      }
      setIsInit(true);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading targets',
        description: 'Failed to fetch target list. Please try again.',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      setIsInit(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkServerStatus = async (target: Target): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_HOST || "http://localhost") + ":" + target.server_port;
      const auth_key = process.env.NEXTAUTH_SECRET || "HWF-SVPO37JI67N3X3WAHP42ZXURCRQA6S5TT";
      console.log("Checking server status for:", target.name, "at", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/fid-auth`, {
        method: "GET",
        headers: {
          'x-hwf-server-key': auth_key,
        }
      });
      console.log("Server status response:", response);
      return response.ok;
    } catch (error) {
      console.error('Server check failed:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    if (isAuthenticated) { logout(); }
    router.replace("/login");

    // try {
    //   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    //   const response = await fetch(`${API_BASE_URL}/auth/jwt/logout`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ token }),
    //   });
    //   toast({
    //     title: 'Logged Out',
    //     description: 'You have been successfully logged out',
    //     status: 'info',
    //     duration: 2000,
    //     isClosable: true,
    //   });
    // } catch (error) {
    //   console.error("Logout error:", error);
    // } finally {
    //   // setIsLogin(false);
    //   logout();
    //   router.replace("/login");
    // }
  };

  // Card display for targets
  const renderTargetCards = () => (
    <VStack spacing={6} w="full">
      {targetList.map((target, idx) => (
        <Card
          key={target.id || idx}
          bg={cardBg}
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          p={6}
          w="full"
          position="relative"
          overflow="hidden"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
          }}
          transition="all 0.3s ease"
          onClick={() => {
            setTimeout(() => router.push(`/target_details?id=${target.id}`), 200);
          }}
        >
          <CardBody p={0}>
            {/* Header */}
            <Flex align="center" justify="space-between" mb={2}>
              <HStack spacing={3}>
                <Box
                  w="50px"
                  h="50px"
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                >
                  <Icon as={MdStorage} color="white" boxSize={6} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading
                    size="lg"
                    bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
                    bgClip="text"
                    fontWeight="bold"
                  >
                    {target.name || "Unnamed Target"}
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    {target.description || "No description"}
                  </Text>
                </VStack>
              </HStack>
              <Badge
                position="absolute"
                top={4}
                right={5}
                colorScheme={target.server_status ? "green" : "gray"}
                variant="solid"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="sm"
                fontWeight="bold"
                zIndex="1"
              >
                {target.server_status ? "Online" : "Offline"}
              </Badge>
            </Flex>

            {/* Server Details Grid */}
            <Grid templateColumns="repeat(2, 1fr)" gap={2} mb={2}>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    TAG
                  </Text>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {target.server_tag || "N/A"}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    ALIAS
                  </Text>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {target.server_alias || "N/A"}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    PATH
                  </Text>
                  <Text fontSize="sm" color={textColor} fontFamily="mono" fontWeight="medium">
                    {target.server_path || "N/A"}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    PORT
                  </Text>
                  <Text fontSize="sm" color={textColor} fontFamily="mono" fontWeight="bold">
                    {target.server_port || "N/A"}
                  </Text>
                </VStack>
              </GridItem>
            </Grid>

            {/* Role Badge */}
            <Box mb={2}>
              <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2}>
                SERVER ROLE
              </Text>
              <Badge
                bgGradient="linear(135deg, purple.400, pink.400)"
                color="white"
                borderRadius="lg"
                px={3}
                py={1}
                fontSize="sm"
                fontWeight="semibold"
              >
                {target.server_role || "Unknown"}
              </Badge>
            </Box>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <VStack spacing={4}>
          <Spinner
            size="xl"
            color="white"
            thickness="4px"
            speed="0.65s"
          />
          <Text color="white" fontSize="lg">
            Loading target details...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      {!isLogin ? (
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

          <Container maxW="md" centerContent>
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
                <VStack spacing={6} align="center">
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
                    <Text fontSize="2xl" color="white">
                      🔒
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
              <VStack spacing={4} textAlign="center">
                <Heading
                  size="xl"
                  bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
                  bgClip="text"
                  textAlign="center"
                  fontWeight="bold"
                >
                  Invalid Access
                </Heading>
                <Text
                  fontSize="md"
                  color="gray.500"
                  textAlign="center"
                  mb={4}
                >
                  Bạn đã quay vào ô mất lượt. Session của bạn đã hết hạn.
                </Text>
                <Button
                  bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
                  color="white"
                  size="lg"
                  borderRadius="xl"
                  _hover={{
                    bgGradient: "linear(135deg, blue.500, purple.600, pink.500)",
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                  onClick={handleLogout}
                >
                  Mời về cho
                </Button>
              </VStack>
            </Card>
          </Container>

          {/* CSS Animations */}
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
      ) : (
        <Box
          minH="100vh"
          bgGradient={bgGradient}
          position="relative"
          overflow="hidden"
        >
          {/* Animated background elements */}
          <Box
            position="absolute"
            top="5%"
            left="5%"
            w="400px"
            h="400px"
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="50%"
            animation="float 8s ease-in-out infinite"
            zIndex={0}
          />
          <Box
            position="absolute"
            bottom="5%"
            right="5%"
            w="300px"
            h="300px"
            bg="rgba(255, 255, 255, 0.03)"
            borderRadius="50%"
            animation="float 10s ease-in-out infinite reverse"
            zIndex={0}
          />

          {!isInit ? (
            <VStack spacing={4}>
              <Spinner
                size="xl"
                color="purple.500"
                thickness="4px"
                speed="0.65s"
              />
              <Text color="gray.500" fontSize="lg">
                Loading...
              </Text>
            </VStack>
          ) : (
            <Container maxW="6xl" p={6} position="relative" zIndex={1}>
              {/* Header */}
              <VStack spacing={8} mb={10}>
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  align="center"
                  // justify="space-between"
                  w="full"
                  gap={4}
                >
                  <Heading
                    size="2xl"
                    bgGradient="linear(135deg, blue.200, yellow.500, red.400)"
                    bgClip="text"
                    fontWeight="bold"
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    A-Stack Instances
                  </Heading>
                  {targetList.length > 0 ? (
                    <Badge
                      bgGradient="linear(135deg, blue.200, purple.200, pink.200)"
                      color="purple.900"
                      borderRadius="full"
                      px={6}
                      py={2}
                      fontSize="md"
                      fontWeight="bold"
                      textAlign="center"
                      animation="bounce 2s infinite"
                    >
                      {targetList.filter(target => target.server_status === true).length} Active
                    </Badge>) : <></>}
                </Flex>
              </VStack>
              <Box position="fixed" top={6} right={6} zIndex={50}>
                <Button
                  leftIcon={<MdLogout size={20} />}
                  bgGradient="linear(135deg, purple.600, pink.600, red.600)"
                  color="white"
                  size="lg"
                  borderRadius="xl"
                  boxShadow="0 10px 25px rgba(0, 0, 0, 0.2)"
                  _hover={{
                    bgGradient: "linear(135deg, red.500, pink.500, purple.500)",
                    transform: 'scale(1.05)',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
                  }}
                  _active={{
                    transform: 'scale(0.95)',
                  }}
                  transition="all 0.2s"
                  onClick={handleLogout}
                  fontWeight="bold"
                  animation="pulse 2s infinite"
                >
                  Mời về cho
                </Button>
              </Box>

              {targetList.length > 0 ? (
                <Box w="full">
                  {renderTargetCards()}
                </Box>
              ) : (
                <Center minH="50vh">
                  <VStack spacing={6}>
                    <Box
                      w="120px"
                      h="120px"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      borderRadius="50%"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 15px 35px rgba(102, 126, 234, 0.4)"
                      animation="float 3s ease-in-out infinite"
                    >
                      <Text fontSize="4xl" color="white">
                        📦
                      </Text>
                    </Box>
                    <VStack spacing={2} textAlign="center">
                      <Heading
                        size="xl"
                        color="white"
                        fontWeight="bold"
                      >
                        No targets found
                      </Heading>
                      <Text
                        fontSize="lg"
                        color="whiteAlpha.700"
                      >
                        Try adding a new target or check your connection.
                      </Text>
                    </VStack>
                  </VStack>
                </Center>
              )}
            </Container>
          )}
        </Box>
      )}
    </>
  );
}
