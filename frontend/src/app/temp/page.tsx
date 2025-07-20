// pages/test.tsx
import { Box, FormControl, FormLabel, Input, Button } from '@chakra-ui/react'

export default function Test() {
  return (
    <Box p={6}>
      <FormControl id="email">
        <FormLabel>Email</FormLabel>
        <Input type="email" />
      </FormControl>
      <Button mt={4} colorScheme="teal">Submit</Button>
    </Box>
  )
}
