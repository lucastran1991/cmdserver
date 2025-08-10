"use client";
import { useState, useEffect } from 'react';
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
import { log } from 'console';

const server_ports = ["8686", "8091", "8090"];
type OrgType = { id: string; name: string; type: string };
type EntType = { id: string; name: string; type: string };
type PlantType = { id: string; name: string; type: string };
type TopologyType = { id: string; name: string; type: string };
type ComponentType = { id: string; name: string; type: string };

export default function ChecklistPage() {
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedEnt, setSelectedEnt] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedTopology, setSelectedTopology] = useState("");

  const [serverOrgs, setServerOrgs] = useState<OrgType[]>([]);
  const [serverEnts, setServerEnts] = useState<EntType[]>([]);
  const [serverPlants, setServerPlants] = useState<PlantType[]>([]);
  const [serverTopologies, setServerTopologies] = useState<TopologyType[]>([]);
  const [serverComponents, setServerComponents] = useState<ComponentType[]>([]);

  const bgGradient = useColorModeValue(
    "linear(135deg, blue.400 0%, purple.500 50%, pink.400 100%)",
    "linear(135deg, blue.600 0%, purple.700 50%, pink.600 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(26,32,44,0.95)");
  const textColor = useColorModeValue("gray.800", "white");

  // Filter checklist items based on selections (replace with real API logic)
  type ChecklistItem = { id: string; name: string, type: string };
  const checklistItems: ChecklistItem[] = [
    { id: "1", name: "Check Pump", type: "Topology" },
    { id: "2", name: "Inspect Valve", type: "Topology" },
    { id: "3", name: "Review Logs", type: "Topology" },
    { id: "4", name: "Test Sensor", type: "Topology" }
  ];

  const filteredItems: ChecklistItem[] =
    serverTopologies.length > 0
      ? serverTopologies as any
      : serverPlants.length > 0
      ? serverPlants as any
      : serverEnts.length > 0
      ? serverEnts as any
      : serverOrgs.length > 0
      ? serverOrgs as any
      : [];

  useEffect(() => {
    if (selectedPort) {
      fetchOrganizationList(selectedPort);
    }
  }, [selectedPort]);

  const handlePortChange = (port: string) => {
    console.log("Selected Port:", port);
    setSelectedPort(port);
    setSelectedOrg("");
    setSelectedEnt("");
    setSelectedPlant("");
    setSelectedTopology("");
    setServerOrgs([]);
    setServerEnts([]);
    setServerPlants([]);
    setServerTopologies([]);
    fetchOrganizationList(port);
  };

  const handleOrgsChange = (org: OrgType) => {
    console.log("Selected Organization:", org);
    setSelectedOrg(org.id);
    setSelectedEnt("");
    setSelectedPlant("");
    setSelectedTopology("");
    setServerEnts([]);
    setServerPlants([]);
    setServerTopologies([]);
    fetchEnterpriseList(org.id);
  };

  const handleEntsChange = (ent: EntType) => {
    console.log("Selected Enterprise:", ent);
    setSelectedEnt(ent.id);
    setSelectedPlant("");
    setServerPlants([]);
    setSelectedTopology("");
    setServerTopologies([]);
    fetchPlantList(selectedOrg);
  };

  const handlePlantsChange = (plant: PlantType) => {
    console.log("Selected Plant:", plant);
    setSelectedPlant(plant.id);
    setSelectedTopology("");
    setServerTopologies([]);
    fetchTopologies(selectedOrg);
  };

  const handleTopologiesChange = (topology: TopologyType) => {
    console.log("Selected Topology:", topology);
    setSelectedTopology(topology.id);
  };

  const fetchOrganizationList = async (port: string) => {
    if (!port) return;
    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_HOST || "http://localhost") + ":" + port;
      const response = await fetch(`${API_BASE_URL}/fid-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: `
    #
  scope(fid: DBU-LOCAL):
    find:
      only: id,name
      orderBy: name asc
      Organization:
        id:
          ne: ''
    `
      });

      const data = await response.json();
      if (
        data &&
        data.find &&
        data.find.Status === "Success" &&
        Array.isArray(data.find.Result)
      ) {
        const orgs: OrgType[] = [];
        data.find.Result.forEach((item: any) => {
          if (item.Organization?.id && item.Organization?.name) {
            orgs.push({
              id: item.Organization.id,
              name: item.Organization.name,
              type: "Organization",
            });
          }
        });
        setServerOrgs(orgs);
        console.log("Fetched Organizations:", orgs);
      }
    } catch (error) {
      console.error('Get Organization failed:', error);
    }
  };

  const fetchEnterpriseList = async (orgId: string) => {
    if (!orgId || !selectedPort) return;
    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_HOST || "http://localhost") + ":" + selectedPort;
      const response = await fetch(`${API_BASE_URL}/fid-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: `
    #
  scope(fid: ${orgId}):
    find:
      only: id,enterpriseName
      orderBy: enterpriseName asc
      Enterprise:
        id:
          ne: ''
    `
      });

      const data = await response.json();
      if (
        data &&
        data.find &&
        data.find.Status === "Success" &&
        data.find.Result
      ) {
        const ents: EntType[] = [];
        if (Array.isArray(data.find.Result)) {
          data.find.Result.forEach((item: any) => {
            if (item.Enterprise?.id && item.Enterprise?.enterpriseName) {
              ents.push({
                id: item.Enterprise.id,
                name: item.Enterprise.enterpriseName,
                type: "Enterprise",
              });
            }
          });
        } else if (data.find.Result.Enterprise?.id && data.find.Result.Enterprise?.enterpriseName) {
          ents.push({
            id: data.find.Result.Enterprise.id,
            name: data.find.Result.Enterprise.enterpriseName,
            type: "Enterprise",
          });
        }
        setServerEnts(ents);
        console.log("Fetched Enterprises:", ents);
      }
    } catch (error) {
      console.error('Get Enterprise failed:', error);
    }
  };

  const fetchPlantList = async (orgId: string) => {
    if (!orgId || !selectedPort) return;
    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_HOST || "http://localhost") + ":" + selectedPort;
      const response = await fetch(`${API_BASE_URL}/fid-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: `
    #
  scope(fid: ${orgId}):
    find:
      only: id,plantName
      orderBy: plantName asc
      Plant:
        id:
          ne: ''
    `
      });

      const data = await response.json();
      if (
        data &&
        data.find &&
        data.find.Status === "Success" &&
        Array.isArray(data.find.Result)
      ) {
        const plants: PlantType[] = [];
        data.find.Result.forEach((item: any) => {
          if (item.Plant?.id && item.Plant?.plantName) {
            plants.push({
              id: item.Plant.id,
              name: item.Plant.plantName,
              type: "Plant",
            });
          }
        });
        setServerPlants(plants);
        console.log("Fetched Plants:", plants);
      }
    } catch (error) {
      console.error('Get Plant failed:', error);
    }
  };

  const fetchTopologies = async (orgId: string) => {
    if (!orgId || !selectedPort) return;
    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_HOST || "http://localhost") + ":" + selectedPort;
      const response = await fetch(`${API_BASE_URL}/fid-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: `
    #
  scope(fid: ${orgId}):
    find:
      only: id,plantTopologyName
      orderBy: plantTopologyName asc
      PlantTopology:
        id:
          ne: ''
    `
      });

      const data = await response.json();
      if (
        data &&
        data.find &&
        data.find.Status === "Success" &&
        Array.isArray(data.find.Result)
      ) {
        const topologies: TopologyType[] = [];
        if (Array.isArray(data.find.Result)) {
          data.find.Result.forEach((item: any) => {
            if (item.PlantTopology?.id && item.PlantTopology?.plantTopologyName) {
              topologies.push({
                id: item.PlantTopology.id,
                name: item.PlantTopology.plantTopologyName,
                type: "Topology",
              });
            }
          });
        } else if (data.find.Result.PlantTopology?.id && data.find.Result.PlantTopology?.plantTopologyName) {
          topologies.push({
            id: data.find.Result.PlantTopology.id,
            name: data.find.Result.PlantTopology.plantTopologyName,
            type: "Topology",
          });
        }
        setServerTopologies(topologies);
        console.log("Fetched Topologies:", topologies);
      }
    } catch (error) {
      console.error('Get Topology failed:', error);
    }
  };

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
              textColor={'white'}
              fontWeight="extrabold"
              textAlign="center"
              letterSpacing="wide"
              textShadow="0 2px 8px rgba(0,0,0,0.25)"
            >
              Search for server Entities
            </Heading>
            <Flex
              gap={4}
              direction={{ base: "column", md: "row" }}
              justify="center"
            >
              <Select
                placeholder="Select Server Port"
                value={selectedPort}
                onChange={(e) => {
                  handlePortChange(e.target.value)
                }}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
              >
                {server_ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Select Organization"
                value={selectedOrg}
                onChange={(e) => {
                  const selected = serverOrgs.find(
                    (org) => org.id === e.target.value
                  );
                  if (selected) handleOrgsChange(selected);
                }}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
                isDisabled={!selectedPort}
              >
                {serverOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="Select Enterprise"
                value={selectedEnt}
                onChange={(e) => {
                  const selected = serverEnts.find(
                    (ent) => ent.id === e.target.value
                  );
                  if (selected) handleEntsChange(selected);
                }}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
                isDisabled={!selectedOrg}
              >
                {selectedOrg &&
                  serverEnts.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.name}
                    </option>
                  ))}
              </Select>
              <Select
                placeholder="Select Plant"
                value={selectedPlant}
                onChange={(e) => {
                  const selected = serverPlants.find(
                    (plant) => plant.id === e.target.value
                  );
                  if (selected) handlePlantsChange(selected);
                }}
                bg={cardBg}
                color={textColor}
                fontWeight="bold"
                isDisabled={!selectedEnt}
              >
                {selectedEnt &&
                  serverPlants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
              </Select>
            </Flex>
            {/* Checklist items rendered below the dropdowns */}
            <Box mt={8}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    bg={cardBg}
                    borderRadius="xl"
                    boxShadow="0 12px 32px rgba(80,0,120,0.18)"
                    border="2px solid"
                    borderColor="purple.300"
                    p={2}
                    transition="transform 0.2s"
                    _hover={{
                      transform: "scale(1.04)",
                      boxShadow: "0 16px 40px rgba(120,0,180,0.22)",
                      borderColor: "pink.400",
                    }}
                  >
                    <CardBody>
                      <VStack align="center" spacing={2}>
                        <Heading size="md" color="red.600" letterSpacing="wide">
                          {item.type.toUpperCase()}
                        </Heading>
                        <Heading size="md" color="blue.600" letterSpacing="wide">
                          {item.name}
                        </Heading>                        
                        <Flex w="100%" justify="center">
                          <Badge
                          colorScheme="green"
                          borderRadius="full"
                          px={4}
                          py={2}
                          fontWeight="bold"
                          fontSize="sm"
                          boxShadow="0 2px 8px rgba(120,0,180,0.12)"
                          >
                          {item.id}
                          </Badge>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
        </VStack>
      </Container>
      <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
    </Box >
    </>
  );
}