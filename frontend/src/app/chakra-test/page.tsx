"use client";

import { Box, Button, Heading, Text, Stack, useColorMode, IconButton } from '@chakra-ui/react';

export default function ChakraTest() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box p={8} maxW="800px" mx="auto">
      <Stack spacing={6}>
        <Heading color="blue.500">Chakra UI v2 Test Page</Heading>
        <Text fontSize="lg">
          This page tests if Chakra UI v2.10.9 is working correctly in your Next.js project.
        </Text>
        
        <Box p={4} bg="blue.50" borderRadius="md">
          <Text fontWeight="bold">Current Color Mode: {colorMode}</Text>
        </Box>

        <Stack direction="row" spacing={4}>
          <Button colorScheme="blue" onClick={toggleColorMode}>
            Toggle {colorMode === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
          <Button variant="outline" colorScheme="green">
            Outlined Button
          </Button>
          <Button size="sm" colorScheme="red">
            Small Button
          </Button>
        </Stack>

        <Box p={6} bg="gray.100" borderRadius="lg" _dark={{ bg: "gray.700" }}>
          <Heading size="md" mb={3}>Responsive Design Test</Heading>
          <Text>
            This box should have different background colors in light and dark mode.
          </Text>
        </Box>

        <Text color="green.500" fontSize="sm">
          ✅ If you can see styled components above, Chakra UI v2.10.9 is working correctly!
        </Text>
      </Stack>
    </Box>
  );
}
