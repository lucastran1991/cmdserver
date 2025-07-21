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

const Links = [
  { name: 'Home', href: '/home' },
  { name: 'Targets', href: '/targets' },
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
  const { isAuthenticated } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push('/login');
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
              <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('purple.600', 'purple.300')}>
                🔐 CMD Server
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
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  <Avatar
                    size={'sm'}
                    src={'https://avatars.dicebear.com/api/male/username.svg'}
                    name="User Avatar"
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => router.push('/targets')}>
                    📊 Targets
                  </MenuItem>
                  <MenuItem onClick={() => router.push('/home')}>
                    🏠 Home
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout}>
                    🚪 Logout
                  </MenuItem>
                </MenuList>
              </Menu>
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
