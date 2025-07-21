"use client";
import { Box, Text, Stack, Icon, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdCheckCircleOutline } from "react-icons/md";
import { useColorModeValue } from "@chakra-ui/react";

const MotionText = motion(Text);
const MotionBox = motion(Box);

const messages = [
  "Loading user info",
  "Looking for EC2 sessions",
  "Prepare the user's base input",
  "Update SSH settings",
  "Complete!",
];

export default function LoadingScreen() {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const router = useRouter();

  // Same color mode values as login/register
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.400, purple.500, pink.400)',
    'linear(to-br, blue.600, purple.700, pink.600)'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');
  const textColor = useColorModeValue('blue.400', 'white');

  useEffect(() => {
    if (visibleIndex < messages.length) {
      const random = Math.random() * (800 - 200) + 200;
      const timer = setTimeout(() => {
        setVisibleIndex((prev) => prev + 1);
      }, random);
      return () => clearTimeout(timer);
    } else {
      // Redirect after final message
      const randomTotal = Math.random() * (1200 - 600) + 600;
      setTimeout(() => router.push("/targets"), randomTotal);
    }
  }, [visibleIndex, router]);

  return (
    <Box 
      minH="100vh" 
      bgGradient={bgGradient}
      display="flex" 
      justifyContent="center" 
      alignItems="center"
      position="relative"
      overflow="hidden"
      p={4}
    >
      {/* Animated background elements - same as register page */}
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

      {/* Main content card */}
      <MotionBox
        bg={cardBg}
        backdropFilter="blur(20px)"
        borderRadius="2xl"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        border="1px solid rgba(255, 255, 255, 0.2)"
        p={12}
        maxW="md"
        w="full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Loading title */}
        <Text
          fontSize="2xl"
          fontWeight="bold"
          textAlign="center"
          mb={8}
          bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
          bgClip="text"
        >
          🚀 Initializing Dashboard
        </Text>

        {/* Progress messages */}
        <Stack spacing={6}>
          {messages.slice(0, visibleIndex).map((msg, idx) => (
            <MotionText
              as={HStack}
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              fontSize="xl"
              fontWeight="bold"
              color={textColor}
              spacing={3}
            >
              <Icon 
                as={MdCheckCircleOutline} 
                color="blue.400" 
                boxSize={6}
                fontSize="xl"
                fontWeight="bold"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <Text>{msg}</Text>
            </MotionText>
          ))}
          
          {/* Loading indicator for current step */}
          {visibleIndex < messages.length && (
            <HStack spacing={3} opacity={0.6}>
              <Box
                w={6}
                h={6}
                border="2px solid"
                borderColor="blue.400"
                borderTopColor="transparent"
                borderRadius="50%"
                animation="spin 1s linear infinite"
              />
              <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                {messages[visibleIndex]}
              </Text>
            </HStack>
          )}
        </Stack>

        {/* Progress bar */}
        <Box mt={8}>
          <Box
            w="full"
            h="2"
            bg="gray.200"
            borderRadius="full"
            overflow="hidden"
          >
            <MotionBox
              h="full"
              bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
              borderRadius="full"
              initial={{ width: "0%" }}
              animate={{ width: `${(visibleIndex / messages.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </Box>
          <Text
            textAlign="center"
            mt={2}
            fontSize="sm"
            color={useColorModeValue('gray.600', 'gray.400')}
          >
            {Math.round((visibleIndex / messages.length) * 100)}% Complete
          </Text>
        </Box>
      </MotionBox>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}