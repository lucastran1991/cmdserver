"use client";
import { useState } from "react";
import {
  Box,
  Container,
  VStack,
  Heading,
  Select,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import Navbar from "@/components/Navbar";

// Dummy data for demonstration
const organizations = ["Org A", "Org B", "Org C"];

const enterprises: { [key: string]: string[] } = {
  "Org A": ["Ent A1", "Ent A2"],
  "Org B": ["Ent B1", "Ent B2"],
  "Org C": ["Ent C1", "Ent C2"],
};

const plants: { [key: string]: string[] } = {
  "Ent A1": ["Plant A1-1", "Plant A1-2"],
  "Ent B1": ["Plant B1-1", "Plant B1-2"],
  "Ent C1": ["Plant C1-1", "Plant C1-2"],
  // ... add more as needed
};

// Dummy checklist items
const checklistItems = [
  { id: 1, title: "Check Pump", status: "Done", description: "Pump is operational." },
  { id: 2, title: "Inspect Valve", status: "Pending", description: "Valve needs inspection." },
  { id: 3, title: "Review Logs", status: "Done", description: "Logs reviewed." },
  { id: 4, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 5, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 6, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 7, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 8, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 9, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 10, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 11, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 12, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 13, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 14, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 15, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 16, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 17, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 18, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 19, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 20, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 21, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 22, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 23, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 24, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 25, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 26, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 27, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 28, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 29, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 30, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 31, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 32, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." },
  { id: 33, title: "Test Sensor", status: "Pending", description: "Sensor test scheduled." }
];

export default function ChecklistPage() {
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedEnt, setSelectedEnt] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");

  const bgGradient = useColorModeValue(
    "linear(135deg, blue.400 0%, purple.500 50%, pink.400 100%)",
    "linear(135deg, blue.600 0%, purple.700 50%, pink.600 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(26,32,44,0.95)");
  const textColor = useColorModeValue("gray.800", "white");

  // Filter checklist items based on selections (replace with real API logic)
  const filteredItems =
    selectedOrg && selectedEnt && selectedPlant ? checklistItems : [];

  return (
    <>
      <Navbar />
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

        <Container maxW="container.xl" zIndex={1} position="relative">
          <VStack spacing={8} align="stretch">
            <Heading
              size="xl"
              bgGradient="linear(135deg, blue.400, purple.500, pink.400)"
              bgClip="text"
              fontWeight="bold"
              textAlign="center"
            >
              Checklist
            </Heading>
            <Flex
              gap={4}
              direction={{ base: "column", md: "row" }}              
              justify="center"
            >
              <Select
                placeholder="Select Organization"
                value={selectedOrg}
                onChange={(e) => {
                  setSelectedOrg(e.target.value);
                  setSelectedEnt("");
                  setSelectedPlant("");
                }}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
              >
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="Select Enterprise"
                value={selectedEnt}
                onChange={(e) => {
                  setSelectedEnt(e.target.value);
                  setSelectedPlant("");
                }}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
                isDisabled={!selectedOrg}
              >
                {selectedOrg &&
                  enterprises[selectedOrg]?.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
              </Select>
              <Select
                placeholder="Select Plant"
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
                isDisabled={!selectedEnt}
              >
                {selectedEnt &&
                  plants[selectedEnt]?.map((plant) => (
                    <option key={plant} value={plant}>
                      {plant}
                    </option>
                  ))}
              </Select>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6} mt={6}>
              {filteredItems.length === 0 ? (
              <Text color={textColor} fontSize="lg" textAlign="center" gridColumn="1/-1">
                Please select Organization, Enterprise, and Plant to view checklist.
              </Text>
              ) : (
              filteredItems.map((item) => (
                <Card
                key={item.id}
                bg={cardBg}
                borderRadius="2xl"
                boxShadow="0 10px 25px rgba(0,0,0,0.15)"
                border="1px solid rgba(255,255,255,0.2)"
                p={6}
                >
                <CardBody>
                  <VStack align="start" spacing={3}>
                  <Heading size="md" color={textColor}>
                    {item.title}
                  </Heading>
                  <Badge
                    colorScheme={item.status === "Done" ? "green" : "yellow"}
                    borderRadius="full"
                    px={4}
                    py={1}
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    {item.status}
                  </Badge>
                  <Text color="gray.500" fontSize="sm">
                    {item.description}
                  </Text>
                  </VStack>
                </CardBody>
                </Card>
              ))
              )}
            </SimpleGrid>
          </VStack>
        </Container>
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </Box>
    </>
  );
}