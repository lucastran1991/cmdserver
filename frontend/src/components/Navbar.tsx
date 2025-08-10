"use client";

import {
  Box,
  Flex,
  Avatar,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Text,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MdLogout, MdPermDataSetting, MdStorage } from 'react-icons/md';

const Links = [
  { name: 'Targets', href: '/targets' },
  { name: 'Check List', href: '/checklist' },
  { name: 'Profile', href: '/profile' },
];

const NavLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
  const router = useRouter();

  return (
    <Link
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      onClick={() => router.push(href)}
      cursor="pointer"
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const router = useRouter();

  const handleLogout = async () => {
    if (isAuthenticated) { logout(); }
    setTimeout(() => router.replace("/login"), 500);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('purple.600', 'purple.300')}>
                Lucas's Playground
              </Text>
            </Box>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
              {isAuthenticated && Links.map((link) => (
                <NavLink key={link.name} href={link.href}>
                  {link.name}
                </NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Button onClick={toggleColorMode} mr={3}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
            {isAuthenticated ? (
              <HStack spacing={3} alignItems="center">
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    <Avatar
                      size={'sm'}
                      src={user?.avatar || '/avatar/avatar (33).jpeg'}
                      borderRadius="full"
                      boxShadow={`0 0 0 2px ${useColorModeValue('purple.100', 'purple.400')}`}
                    />
                  </MenuButton>
                  <MenuList
                    bg={useColorModeValue(
                      'linear-gradient(to bottom, white, var(--chakra-colors-purple-50))',
                      'linear-gradient(to bottom, var(--chakra-colors-gray-800), var(--chakra-colors-gray-900))'
                    )}
                    borderColor={useColorModeValue('purple.200', 'purple.700')}
                    boxShadow="lg"
                    borderWidth={2}
                    borderRadius="md"
                    p={3}
                  >
                    <Box
                      p={3}
                      borderBottom="1px"
                      borderColor={useColorModeValue('gray.100', 'gray.700')}
                      mb={2}
                    >
                      <Flex direction="column" alignItems="center" width="100%" pb={2}>
                        <Avatar
                          size={'2xl'}
                          src={user?.avatar || '/avatar/avatar (33).jpeg'}
                          mb={3}
                          borderWidth={2}
                          borderColor={useColorModeValue('purple.300', 'purple.500')}
                        />
                        <Text fontWeight="bold" fontSize="md" textAlign="center">
                          {typeof user?.email === 'string' ? user?.email : 'Unknown'}
                        </Text>
                        <Text
                          fontSize="sm"
                          color={useColorModeValue('blue.600', 'blue.300')}
                          textAlign="center"
                        >
                          {user?.role || 'User Role'}
                        </Text>
                      </Flex>
                    </Box>

                    <MenuItem
                      icon={<MdStorage size={20} />}
                      _hover={{ bg: useColorModeValue('purple.50', 'gray.500') }}
                      onClick={() => router.push('/targets')}
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      Server List
                    </MenuItem>

                    <MenuItem
                      icon={<MdPermDataSetting size={20} />}
                      _hover={{ bg: useColorModeValue('purple.50', 'gray.500') }}
                      onClick={() => router.push('/preload')}
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      Reload SSH Config
                    </MenuItem>

                    <MenuDivider my={2} />

                    <MenuItem
                      icon={<MdLogout size={20} />}
                      _hover={{ bg: useColorModeValue('red.50', 'red.600') }}
                      color={useColorModeValue('red.500', 'red.300')}
                      onClick={handleLogout}
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      Ra về
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            ) : (
              <Button
                variant={'solid'}
                colorScheme={'purple'}
                size={'sm'}
                mr={4}
                onClick={handleLogin}
              >
                Login
              </Button>
            )}
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              {isAuthenticated && Links.map((link) => (
                <NavLink key={link.name} href={link.href}>
                  {link.name}
                </NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </>
  );
}
