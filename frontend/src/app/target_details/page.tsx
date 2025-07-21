"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  IconButton
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
  MdLogout
} from 'react-icons/md';

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
  const [target, setTarget] = useState<Target | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isInit, setIsInit] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [error, setError] = useState('');
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
    if (!targetId) {
      setError('No target ID provided');
      setIsLoading(false);
      return;
    }

    fetchTargetDetails();
  }, [targetId]);

  const fetchTargetDetails = async () => {
    try {
      setIsLoading(true);
      if (isLogin) {
          try {
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.TARGETS);
            const data = await response.json();
            // setTargetList(data);
            setIsInit(true);
          } catch (error) {
            console.error(error);
            toast({
              title: 'Error loading targets',
              description: 'Failed to fetch target list. Please try again.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            setIsInit(true);
          }
        }

      // Mock data for demonstration
      const mockTarget: Target = {
        id: targetId || 'unknown',
        name: `Production Server ${targetId || 'unknown'}`,
        server_status: Math.random() > 0.5,
        description: 'Main production server handling user authentication and API services',
        server_tag: 'prod-api',
        server_alias: `api-server-${targetId}`,
        server_path: '/opt/applications/api-server',
        server_port: 8000 + parseInt(targetId as string),
        server_role: 'API Server',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-12-20T14:45:00Z',
        cpu_usage: Math.floor(Math.random() * 100),
        memory_usage: Math.floor(Math.random() * 100),
        disk_usage: Math.floor(Math.random() * 100),
        uptime: '15 days, 4 hours, 23 minutes',
        last_deployment: '2024-12-19T09:15:00Z',
        environment: 'production',
        version: 'v2.4.1',
        dependencies: ['Node.js v18.17.0', 'MongoDB v6.0', 'Redis v7.0', 'Nginx v1.22'],
        logs: [
          '[2024-12-20 14:45:12] INFO: Server started successfully',
          '[2024-12-20 14:44:58] INFO: Database connection established',
          '[2024-12-20 14:44:45] WARN: High memory usage detected',
          '[2024-12-20 14:43:30] INFO: API endpoint /health responded with 200',
          '[2024-12-20 14:42:15] ERROR: Failed to connect to external service'
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTarget(mockTarget);
    } catch (error) {
      console.error('Error fetching target details:', error);
      setError('Failed to fetch target details. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to fetch target details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTargetDetails();
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
        case 'deploy_be':
          endpoint = `/api/deployment/pull-be-source?target_id=${target.id}&execute=${isDebug}`;
          successMessage = `Deployment latest BE for ${target.name}`;
          break;
        case 'deploy_ui':
          endpoint = `/api/deployment/pull-ui-source?target_id=${target.id}&execute=${isDebug}`;
          successMessage = `Deployment latest UI for ${target.name}`;
          break;
        case 'start':
          endpoint = `/api/deployment/restart-server?target_id=${target.id}&execute=${isDebug}`;
          successMessage = `Server ${target.name} restart initiated`;
          break;
        case 'stop':
          endpoint = `/api/deployment/kill-engines?target_id=${target.id}&execute=${isDebug}`;
          successMessage = `Server ${target.name} stopped`;
          break;
        default:
          return;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: successMessage,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh target details after action
        handleRefresh();
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
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/auth/jwt/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      localStorage.removeItem("access_token");
      setIsLogin(false);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getStatusColor = (status?: boolean) => {
    return status ? 'green' : 'red';
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'green';
    if (usage < 80) return 'yellow';
    return 'red';
  };

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

  if (error || !target) {
    return (
      <Box
        minH="100vh"
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Container maxW="md" centerContent>
          <Card
            bg={cardBg}
            backdropFilter="blur(20px)"
            borderRadius="2xl"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            p={8}
            w="full"
          >
            <CardBody>
              <VStack spacing={6} align="center">
                <Icon as={MdInfo} boxSize={16} color="red.400" />
                <VStack spacing={2} textAlign="center">
                  <Heading size="lg" color={textColor}>
                    Target Not Found
                  </Heading>
                  <Text color="gray.500">
                    {error || 'The requested target could not be found.'}
                  </Text>
                </VStack>
                <Button
                  leftIcon={<MdArrowBack />}
                  colorScheme="blue"
                  onClick={() => router.push('/targets')}
                >
                  Back to Targets
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
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
        <VStack spacing={6} mb={8}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
            w="full"
            gap={4}
          >
            <HStack spacing={4}>
              <IconButton
                aria-label="Back to targets"
                icon={<MdArrowBack />}
                colorScheme="whiteAlpha"
                variant="solid"
                size="lg"
                onClick={() => router.push('/targets')}
                _hover={{
                  transform: 'translateX(-2px)',
                }}
                transition="all 0.2s"
              />
              <VStack align="start" spacing={1}>
                <Heading
                  size="xl"
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
                borderRadius="full"
                px={4}
                py={2}
                fontSize="md"
                fontWeight="bold"
              >
                {target.server_status ? "🟢 Online" : "🔴 Offline"}
              </Badge>
              <IconButton
                aria-label="Refresh"
                icon={<MdRefresh />}
                colorScheme="whiteAlpha"
                variant="solid"
                isLoading={isRefreshing}
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
                    onClick={() => handleAction('deploy_be')}
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
                    onClick={() => handleAction('deploy_ui')}
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
                    onClick={() => handleAction('start')}
                    fontWeight="semibold"
                  >
                    Start
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
                    onClick={() => handleAction('stop')}
                    fontWeight="semibold"
                  >
                    Stop
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
            leftIcon={<MdLogout />}
            bgGradient="linear(135deg, red.400, pink.500, purple.600)"
            color="white"
            size="lg"
            borderRadius="xl"
            boxShadow="0 10px 25px rgba(0, 0, 0, 0.2)"
            _hover={{
              bgGradient: "linear(135deg, purple.700, blue.600, red.500)",
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
                isChecked={isDebug}
                onChange={() => setIsDebug(!isDebug)}
              />
            </Box>
          </HStack>
        </Flex>

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
