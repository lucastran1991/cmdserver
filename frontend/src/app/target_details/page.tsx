"use client";
import { act, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";
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
  CardHeader,
  Badge,
  Grid,
  useToast,
  Spinner,
  useColorModeValue,
  Icon,
  Flex,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Switch,
  IconButton,
  Modal,
  Input,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  MdArrowBack,
  MdPlayArrow,
  MdStop,
  MdCloudUpload,
  MdRefresh,
  MdInfo,
  MdSettings,
  MdMonitor,
  MdCode,
  MdFolder,
  MdSchedule,
  MdLogout,
  MdOutlineSdStorage,
  MdTextFields
} from 'react-icons/md';
import {
  IoIosCheckmark,
  IoIosClose
} from 'react-icons/io';
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
  created_at?: string;
  updated_at?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  uptime?: string;
  last_deployment?: string;
  environment?: string;
  version?: string;
  dependencies?: string[];
  logs?: string[];
}

export default function TargetDetails() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [target, setTarget] = useState<Target | null>(null);
  const [action, setAction] = useState("stop");
  const [commitID, setCommitID] = useState<string | null>(null);
  const [isInit, setIsInit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebug, setIsDebug] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const targetId = searchParams?.get('id');

  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(135deg, blue.400 0%, purple.500 50%, pink.400 100%)',
    'linear(135deg, blue.600 0%, purple.700 50%, pink.600 100%)'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');
  const textColor = useColorModeValue('gray.800', 'white');
  const statBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    if (isAuthenticated && targetId && !isInit) {
      setIsLoading(true);
      fetchTargetDetails();
    }
  }, [isAuthenticated]);

  const fetchTargetDetails = async () => {
    try {
      const target_endpoint = API_ENDPOINTS.TARGETS + `/${targetId}`;
      const response = await fetch(target_endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTarget(data);
      data.server_status = await checkServerStatus(data);
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
      console.log("Target details fetched successfully");
      setIsLoading(false);
    }
  };

  const checkServerStatus = async (target: Target): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_HOST || "http://localhost") + ":" + target.server_port;
      // const auth_key = process.env.NEXTAUTH_SECRET || "HWF-TEST";
      console.log("Checking server status for:", target.name, "at", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/fid-auth`, {
        method: "GET"
      });
      console.log("Server status response:", response);
      return response.ok;
    } catch (error) {
      console.error('Server check failed:', error);
      return false;
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchTargetDetails();
  };

  const handleLogout = async () => {
    if (isAuthenticated) { logout(); }
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => router.replace("/login"), 500);
  };

  const handleAction = async (action: string) => {
    if (!target) {
      console.error('No target selected for action:', action);
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      let endpoint = '';
      let successMessage = '';

      switch (action) {
        case 'deploy_backend':
          endpoint = `/api/deployment/pull-be-source?target_id=${target.id}&execute=${!isDebug}&asynchronous=true`;
          if (commitID) {
            endpoint += `&commit_id=${commitID}`;
          }
          successMessage = `Deployment latest BE for ${target.name}`;
          break;
        case 'deploy_frontend':
          endpoint = `/api/deployment/pull-ui-source?target_id=${target.id}&execute=${!isDebug}`;
          if (commitID) {
            endpoint += `&commit_id=${commitID}`;
          }
          successMessage = `Deployment latest UI for ${target.name}`;
          break;
        case 'start':
          endpoint = `/api/deployment/restart-server?target_id=${target.id}&execute=${!isDebug}&asynchronous=true`;
          successMessage = `Server ${target.name} restart initiated`;
          break;
        case 'stop':
          endpoint = `/api/deployment/kill-engines?target_id=${target.id}&execute=${!isDebug}`;
          successMessage = `Server ${target.name} stopped`;
          break;
        default:
          return;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Action ${action} response:`, response);

      if (response.ok) {
        toast({
          title: 'Success',
          description: successMessage,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error(`Error ${action}ing server:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
        description: `Error ${action}ing server: ${errorMessage}`,
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status?: boolean) => {
    return status ? 'green' : 'gray';
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'green';
    if (usage < 80) return 'yellow';
    return 'red';
  };

  if (!target || !isAuthenticated) {
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
    );
  }

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

      <Container maxW="7xl" p={6} position="relative" zIndex={1}>
        {/* Header */}
        <IconButton
          aria-label="Back to targets"
          icon={<MdArrowBack size={24} />}
          colorScheme="whiteAlpha"
          variant="solid"
          fontWeight="bold"
          size="lg"
          onClick={() => {
            setTimeout(() => router.push('/targets'), 200);
          }}
          _hover={{
            transform: 'translateX(-5px)',
          }}
          transition="all 0.2s"
        />
        <VStack spacing={6} mb={8} mt={10} >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
            w="full"
            gap={4}
          >
            <HStack spacing={4}>
              <Icon as={MdOutlineSdStorage} color="white" boxSize={16} />
              <VStack align="start" spacing={1}>
                <Heading
                  size="2xl"
                  color="white"
                  fontWeight="bold"
                >
                  {target.name}
                </Heading>
                <Text color="whiteAlpha.700" fontSize="md">
                  Target ID: {target.id}
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={3}>
              <Badge
                colorScheme={getStatusColor(target.server_status)}
                variant="solid"
                borderRadius="md"
                px={4}
                py={2}
                fontSize="md"
                fontWeight="bold"
              >
                {target.server_status ? "Online" : "Offline"}
              </Badge>
              <IconButton
                aria-label="Refresh"
                icon={<MdRefresh size={22} color="white" />}
                colorScheme="whiteAlpha"
                variant="solid"
                bgGradient="linear(135deg, red.400, pink.500)"
                isLoading={isLoading}
                onClick={handleRefresh}
              />
            </HStack>
          </Flex>
        </VStack>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          {/* Main Content */}
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Card
              bg={cardBg}
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <CardHeader>
                <HStack>
                  <Icon as={MdInfo} color="blue.400" boxSize={6} />
                  <Heading size="md" color={textColor}>
                    Basic Information
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                        Description
                      </Text>
                      <Text color={textColor} fontSize="md">
                        {target.description || "No description available"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                        Server Tag
                      </Text>
                      <Badge colorScheme="blue" borderRadius="md">
                        {target.server_tag || "N/A"}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                        Server Alias
                      </Text>
                      <Text color={textColor} fontFamily="mono">
                        {target.server_alias || "N/A"}
                      </Text>
                    </Box>
                  </VStack>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                        Server Path
                      </Text>
                      <Text color={textColor} fontFamily="mono" fontSize="sm">
                        {target.server_path || "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                        Port
                      </Text>
                      <Badge colorScheme="purple" borderRadius="md">
                        {target.server_port || "N/A"}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                        Role
                      </Text>
                      <Badge colorScheme="green" borderRadius="md">
                        {target.server_role || "Unknown"}
                      </Badge>
                    </Box>
                  </VStack>
                </Grid>
              </CardBody>
            </Card>

            {/* System Metrics */}
            <Card
              bg={cardBg}
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <CardHeader>
                <HStack>
                  <Icon as={MdMonitor} color="green.400" boxSize={6} />
                  <Heading size="md" color={textColor}>
                    System Metrics
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                  <Stat bg={statBg} p={4} borderRadius="xl" textAlign="center">
                    <StatLabel color="gray.500">CPU Usage</StatLabel>
                    <StatNumber color={`${getUsageColor(target.cpu_usage || 0)}.500`}>
                      {target.cpu_usage || 0}%
                    </StatNumber>
                    <Progress
                      value={target.cpu_usage || 0}
                      colorScheme={getUsageColor(target.cpu_usage || 0)}
                      size="sm"
                      borderRadius="full"
                      mt={2}
                    />
                  </Stat>
                  <Stat bg={statBg} p={4} borderRadius="xl" textAlign="center">
                    <StatLabel color="gray.500">Memory Usage</StatLabel>
                    <StatNumber color={`${getUsageColor(target.memory_usage || 0)}.500`}>
                      {target.memory_usage || 0}%
                    </StatNumber>
                    <Progress
                      value={target.memory_usage || 0}
                      colorScheme={getUsageColor(target.memory_usage || 0)}
                      size="sm"
                      borderRadius="full"
                      mt={2}
                    />
                  </Stat>
                  <Stat bg={statBg} p={4} borderRadius="xl" textAlign="center">
                    <StatLabel color="gray.500">Disk Usage</StatLabel>
                    <StatNumber color={`${getUsageColor(target.disk_usage || 0)}.500`}>
                      {target.disk_usage || 0}%
                    </StatNumber>
                    <Progress
                      value={target.disk_usage || 0}
                      colorScheme={getUsageColor(target.disk_usage || 0)}
                      size="sm"
                      borderRadius="full"
                      mt={2}
                    />
                  </Stat>
                </Grid>
              </CardBody>
            </Card>

            {/* Dependencies */}
            <Card
              bg={cardBg}
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <CardHeader>
                <HStack>
                  <Icon as={MdCode} color="purple.400" boxSize={6} />
                  <Heading size="md" color={textColor}>
                    Dependencies
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  {target.dependencies?.map((dep, index) => (
                    <HStack key={index} p={3} bg={statBg} borderRadius="lg">
                      <Icon as={MdFolder} color="blue.400" />
                      <Text color={textColor} fontSize="sm" fontFamily="mono">
                        {dep}
                      </Text>
                    </HStack>
                  ))}
                </Grid>
              </CardBody>
            </Card>

            {/* Recent Logs */}
            <Card
              bg={cardBg}
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <CardHeader>
                <HStack>
                  <Icon as={MdMonitor} color="orange.400" boxSize={6} />
                  <Heading size="md" color={textColor}>
                    Recent Logs
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={2}>
                  {target.logs?.map((log, index) => (
                    <Box
                      key={index}
                      p={3}
                      bg={statBg}
                      borderRadius="lg"
                      borderLeft="4px solid"
                      borderLeftColor={
                        log.includes('ERROR') ? 'red.400' :
                          log.includes('WARN') ? 'yellow.400' : 'green.400'
                      }
                    >
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        color={textColor}
                        wordBreak="break-all"
                      >
                        {log}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Sidebar */}
          <VStack spacing={6} align="stretch">
            {/* Action Buttons */}
            <Card
              bg={cardBg}
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <CardHeader>
                <HStack>
                  <Icon as={MdSettings} color="gray.400" boxSize={6} />
                  <Heading size="md" color={textColor}>
                    Actions
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                {/* Action Buttons */}
                <VStack spacing={3} justify="flex-end">
                  <Button
                    leftIcon={<MdCloudUpload size={22} color="white" />}
                    bgGradient="linear(135deg, yellow.400, orange.500)"
                    color="white"
                    size="sm"
                    height={"45px"}
                    w="full"
                    fontSize={"md"}
                    borderRadius="xl"
                    _hover={{
                      bgGradient: "linear(135deg, yellow.500, orange.600)",
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                    onClick={() => {
                      setAction("deploy_backend");
                      onOpen();
                    }}
                    fontWeight="semibold"
                  >
                    Deploy BE
                  </Button>
                  <Button
                    leftIcon={<MdCloudUpload size={22} color="white" />}
                    bgGradient="linear(135deg, orange.400, blue.500)"
                    color="white"
                    size="sm"
                    w="full"
                    height={"45px"}
                    fontSize={"md"}
                    borderRadius="xl"
                    _hover={{
                      bgGradient: "linear(135deg, orange.500, blue.600)",
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                    onClick={() => {
                      setAction("deploy_frontend");
                      onOpen();
                    }}
                    fontWeight="semibold"
                  >
                    Deploy UI
                  </Button>
                  <Button
                    leftIcon={<MdPlayArrow size={22} color="white" />}
                    bgGradient="linear(135deg, blue.400, green.500)"
                    color="white"
                    size="sm"
                    height={"45px"}
                    w="full"
                    fontSize={"md"}
                    borderRadius="xl"
                    _hover={{
                      bgGradient: "linear(135deg, blue.500, green.600)",
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                    onClick={() => {
                      setAction("start");
                      onOpen();
                    }}
                    fontWeight="semibold"
                  >
                    Start Server
                  </Button>
                  <Button
                    leftIcon={<MdStop size={22} color="white" />}
                    bgGradient="linear(135deg, red.400, pink.500)"
                    color="white"
                    size="sm"
                    height={"45px"}
                    w="full"
                    fontSize={"md"}
                    borderRadius="xl"
                    _hover={{
                      bgGradient: "linear(135deg, red.500, pink.600)",
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                    onClick={() => {
                      setAction("stop");
                      onOpen();
                    }}
                    fontWeight="semibold"
                  >
                    Stop Server
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Server Stats */}
            <Card
              bg={cardBg}
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <CardHeader>
                <HStack>
                  <Icon as={MdSchedule} color="cyan.400" boxSize={6} />
                  <Heading size="md" color={textColor}>
                    Server Stats
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4}>
                  <Box w="full">
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                      Uptime
                    </Text>
                    <Text color={textColor} fontWeight="medium">
                      {target.uptime || "Unknown"}
                    </Text>
                  </Box>
                  <Divider />
                  <Box w="full">
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                      Environment
                    </Text>
                    <Badge
                      colorScheme={target.environment === 'production' ? 'red' : 'blue'}
                      borderRadius="md"
                    >
                      {target.environment || "Unknown"}
                    </Badge>
                  </Box>
                  <Divider />
                  <Box w="full">
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                      Version
                    </Text>
                    <Text color={textColor} fontFamily="mono">
                      {target.version || "Unknown"}
                    </Text>
                  </Box>
                  <Divider />
                  <Box w="full">
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                      Last Deployment
                    </Text>
                    <Text color={textColor} fontSize="sm">
                      {target.last_deployment ?
                        new Date(target.last_deployment).toLocaleString() :
                        "Never"
                      }
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Grid>
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

        <Flex justify="flex-end" mt={5}>
          <HStack spacing={3}>
            <Text fontSize="md" color="white" fontWeight="bold">
              Debug Mode
            </Text>
            <Box>
              <Switch
                colorScheme="purple"
                size="lg"
                isChecked={!isDebug}
                onChange={() => setIsDebug(!isDebug)}
              />
            </Box>
          </HStack>
        </Flex>

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader textAlign="center" fontWeight="bold" textColor="white" bgGradient="linear(135deg, purple.600, pink.600, red.600)">
              Execute Command
            </ModalHeader>
            <ModalHeader>
              <Text color="gray.600">Server Action: {action}</Text>
            </ModalHeader>
            <ModalCloseButton textColor="white" />
            {action === "deploy_backend" || action === "deploy_frontend" ? (
              <ModalBody>
                <Input
                  placeholder="Enter commit ID (optional)"
                  value={commitID || ""}
                  onChange={(e) => {
                    setCommitID(e.target.value)
                  }}
                />
              </ModalBody>
            ) : null}
            <ModalFooter>
              <HStack spacing={3} justify="center" w="full">
                <Button
                  leftIcon={<IoIosCheckmark size={24} color="white" />}
                  bgGradient="linear(135deg, blue.400, green.500)"
                  color="white"
                  size="sm"
                  height={"45px"}
                  w="full"
                  fontSize={"md"}
                  borderRadius="xl"
                  _hover={{
                    bgGradient: "linear(135deg, blue.500, green.600)",
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                  onClick={() => {
                    handleAction(action);
                    onClose();
                  }}
                  fontWeight="semibold"
                >
                  Quất
                </Button>
                <Button
                  leftIcon={<IoIosClose size={24} color="white" />}
                  bgGradient="linear(135deg, red.400, pink.500)"
                  color="white"
                  size="sm"
                  height={"45px"}
                  w="full"
                  fontSize={"md"}
                  borderRadius="xl"
                  _hover={{
                    bgGradient: "linear(135deg, red.500, pink.600)",
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                  onClick={() => {
                    setCommitID(null);
                    onClose();
                  }}
                  fontWeight="semibold"
                >
                  Thôi bỏ
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

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
      `}</style>
    </Box>
  );
}
