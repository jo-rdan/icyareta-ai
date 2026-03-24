import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  List,
  IconButton,
  Dialog,
  Portal,
  Spinner,
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const FEATURES = [
  "All 4 P6 subjects unlocked",
  "Bronze, Silver & Gold difficulty levels",
  "480+ curriculum-aligned questions",
  "Detailed explanations for every answer",
  "Progress tracking & weak topic analysis",
  "Works offline — no data needed",
  "Full access until July 2026 exam",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsLoading(true);
    setShowModal(true);
    // MOCK — replace with POST /api/payment/initiate
    await new Promise((r) => setTimeout(r, 3000));
    setShowModal(false);
    setIsLoading(false);
    updateUser({
      accessStatus: "active",
      accessExpiresAt: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
    navigate("/subjects");
  };

  return (
    <Box minH="100vh" bg="paper">
      {/* Header */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        px="6"
        py="4"
      >
        <Container maxW="container.sm">
          <Flex align="center" gap="3">
            <IconButton
              aria-label="Back"
              variant="ghost"
              size="sm"
              borderRadius="10px"
              onClick={() => navigate(-1)}
            >
              <Text fontSize="18px">←</Text>
            </IconButton>
            <Text fontFamily="heading" fontWeight="800" fontSize="16px">
              Subscribe
            </Text>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.sm" px="6" py="8">
        <VStack gap="6" align="stretch">
          {/* Plan card */}
          <Box
            style={{ background: "linear-gradient(160deg, #072a16, #1a6b3c)" }}
            borderRadius="24px"
            p="6"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="-40px"
              right="-40px"
              w="160px"
              h="160px"
              borderRadius="full"
              bg="rgba(255,255,255,0.05)"
            />
            <VStack align="flex-start" gap="2">
              <Text
                fontSize="12px"
                fontWeight="600"
                letterSpacing="1px"
                textTransform="uppercase"
                color="rgba(255,255,255,0.6)"
              >
                Monthly Access
              </Text>
              <Flex align="flex-end" gap="2">
                <Heading
                  fontFamily="heading"
                  fontSize="52px"
                  fontWeight="800"
                  color="white"
                  lineHeight="1"
                  letterSpacing="-2px"
                >
                  5,000
                </Heading>
                <Text
                  color="rgba(255,255,255,0.7)"
                  fontSize="16px"
                  mb="2"
                  fontWeight="500"
                >
                  RWF/month
                </Text>
              </Flex>
              <Text color="rgba(255,255,255,0.65)" fontSize="13px">
                Full access to all subjects until the July 2026 P6 exam
              </Text>
            </VStack>
          </Box>

          {/* Features */}
          <Box
            bg="white"
            borderRadius="20px"
            p="5"
            border="1px solid"
            borderColor="gray.100"
          >
            <Text
              fontFamily="heading"
              fontWeight="700"
              fontSize="12px"
              letterSpacing="1px"
              textTransform="uppercase"
              color="gray.400"
              mb="4"
            >
              What's included
            </Text>
            <List.Root as="ul" gap="3" listStyle="none">
              {FEATURES.map((f) => (
                <List.Item key={f} display="flex" alignItems="center" gap="3">
                  <Box
                    minW="20px"
                    h="20px"
                    bg="brand.50"
                    borderRadius="6px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <LuCheck size={10} color="#1a6b3c" />
                  </Box>
                  <Text fontSize="13px" color="gray.700" fontWeight="500">
                    {f}
                  </Text>
                </List.Item>
              ))}
            </List.Root>
          </Box>

          {/* Value comparison */}
          <Box
            bg="orange.50"
            border="1px solid"
            borderColor="orange.100"
            borderRadius="16px"
            p="4"
          >
            <Text
              fontSize="13px"
              color="orange.700"
              lineHeight="1.6"
              fontWeight="500"
            >
              💡 A private tutor in Kigali costs{" "}
              <strong>15,000–30,000 RWF per session.</strong> Icyareta gives
              unlimited practice for just <strong>5,000 RWF/month.</strong>
            </Text>
          </Box>

          <Button
            size="lg"
            w="full"
            h="56px"
            fontSize="16px"
            colorPalette="brand"
            loading={isLoading}
            onClick={handleSubscribe}
          >
            Pay 5,000 RWF via MoMo
          </Button>

          <Text textAlign="center" fontSize="12px" color="gray.400">
            Secure payment via MTN Mobile Money.
          </Text>
        </VStack>
      </Container>

      {/* MoMo Dialog */}
      <Dialog.Root
        open={showModal}
        onOpenChange={() => {}}
        placement="center"
        closeOnInteractOutside={false}
      >
        <Portal>
          <Dialog.Backdrop backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="24px" mx="6" p="2">
              <Dialog.Body py="8" px="6" textAlign="center">
                <VStack gap="4">
                  <Spinner
                    borderWidth="3px"
                    animationDuration="0.8s"
                    color="brand.600"
                    width="48px"
                    height="48px"
                  />
                  <Heading
                    fontFamily="heading"
                    fontSize="20px"
                    fontWeight="800"
                    letterSpacing="-0.5px"
                  >
                    Check your phone
                  </Heading>
                  <Text fontSize="14px" color="gray.500" lineHeight="1.6">
                    A MoMo payment request of <strong>5,000 RWF</strong> has
                    been sent to your number. Approve it to activate your
                    access.
                  </Text>
                  <Box bg="brand.50" borderRadius="12px" px="4" py="3" w="full">
                    <Text fontSize="12px" color="brand.600" fontWeight="600">
                      📱 Waiting for MoMo confirmation...
                    </Text>
                  </Box>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
