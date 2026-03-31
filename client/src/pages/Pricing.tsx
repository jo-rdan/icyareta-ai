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
  Input,
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import api from "@/lib/axios";

const API = import.meta.env.VITE_API_URL || "";

const FEATURES = [
  "All 4 P6 subjects unlocked",
  "Bronze, Silver & Gold difficulty levels",
  "480+ curriculum-aligned questions",
  "Detailed explanations for every answer",
  "Progress tracking & weak topic analysis",
  "Works offline — no data needed",
  "Full day of unlimited practice",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [phone, setPhone] = useState(
    user?.phoneNumber && user.phoneNumber !== user.email
      ? user.phoneNumber
      : "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const sanitized = phone.replace(/\D/g, "");
    if (sanitized.length < 9) {
      setError("Enter your MTN number to receive the MoMo payment request");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Update phone number on the account if needed
      if (!user.phoneNumber || user.phoneNumber === user.email) {
        await api.put("/user/phone", {
          phoneNumber: `+250${sanitized.slice(-9)}`,
        });
      }

      // Initiate MoMo payment
      const res = await api.post("/payment/initiate", {
        accessType: "day_pass",
      });

      if (res.status !== 200) {
        const err = await res.data;
        setError(err.error || "Payment initiation failed");
        setIsLoading(false);
        return;
      }

      const data = await res.data;
      setReferenceId(data.referenceId);
      setShowModal(true);

      // Poll for payment confirmation
      pollPaymentStatus(data.referenceId);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (refId: string) => {
    const maxAttempts = 12; // 2 minutes total
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`${API}/api/v1/payment/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ referenceId: refId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "SUCCESSFUL") {
            setShowModal(false);
            setIsLoading(false);
            updateUser({ accessStatus: "active" });
            navigate("/subjects");
            return;
          }
          if (data.status === "FAILED") {
            setShowModal(false);
            setIsLoading(false);
            setError("Payment was declined. Please try again.");
            return;
          }
        }
      } catch {
        // continue polling
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 10000); // poll every 10 seconds
      } else {
        setShowModal(false);
        setIsLoading(false);
        setError(
          "Payment timed out. If your MoMo was debited, contact support.",
        );
      }
    };

    setTimeout(poll, 5000); // first check after 5 seconds
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
              Get a Day Pass
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
              <Box
                bg="rgba(126,232,162,0.2)"
                px="3"
                py="1"
                borderRadius="full"
                border="1px solid rgba(126,232,162,0.3)"
              >
                <Text
                  fontSize="11px"
                  fontWeight="600"
                  color="#7ee8a2"
                  letterSpacing="0.8px"
                >
                  FULL ACCESS · ALL SUBJECTS
                </Text>
              </Box>
              <Flex align="flex-end" gap="2" mt="1">
                <Heading
                  fontFamily="heading"
                  fontSize="56px"
                  fontWeight="800"
                  color="white"
                  lineHeight="1"
                  letterSpacing="-2px"
                >
                  800
                </Heading>
                <Text
                  color="rgba(255,255,255,0.7)"
                  fontSize="16px"
                  mb="2"
                  fontWeight="500"
                >
                  RWF / day
                </Text>
              </Flex>
              <Text
                color="rgba(255,255,255,0.65)"
                fontSize="13px"
                lineHeight="1.6"
              >
                One Day Pass. Unlimited practice across all P6 subjects and
                difficulty levels for 24 hours.
              </Text>
            </VStack>
          </Box>

          {/* What's included */}
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
              <strong>15,000–30,000 RWF per session.</strong> One Icyareta Day
              Pass is <strong>800 RWF</strong> — less than a cup of juice.
            </Text>
          </Box>

          {/* MoMo phone number */}
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
              mb="3"
            >
              Your MTN MoMo number
            </Text>
            <Flex gap="3" align="center">
              <Box
                bg="gray.50"
                border="1.5px solid"
                borderColor="gray.200"
                borderRadius="12px"
                px="3"
                h="48px"
                display="flex"
                alignItems="center"
                fontSize="14px"
                fontWeight="600"
                color="gray.600"
                flexShrink={0}
              >
                🇷🇼 +250
              </Box>
              <Input
                placeholder="7XX XXX XXX"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                type="tel"
                h="48px"
                border="1.5px solid"
                borderColor="gray.200"
                borderRadius="12px"
                bg="white"
                fontSize="15px"
                _focus={{
                  borderColor: "brand.600",
                  boxShadow: "none",
                  bg: "white",
                }}
              />
            </Flex>
            <Text fontSize="12px" color="gray.400" mt="2">
              You will receive a MoMo prompt on this number.
            </Text>
          </Box>

          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="12px"
              px="4"
              py="3"
            >
              <Text fontSize="13px" color="red.600">
                {error}
              </Text>
            </Box>
          )}

          <Button
            size="lg"
            w="full"
            h="56px"
            fontSize="16px"
            colorPalette="brand"
            loading={isLoading}
            onClick={handlePay}
          >
            Get Day Pass — 800 RWF
          </Button>

          <Text textAlign="center" fontSize="12px" color="gray.400">
            Secure payment via MTN Mobile Money. Valid for 24 hours from
            activation.
          </Text>
        </VStack>
      </Container>

      {/* MoMo waiting modal */}
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
                    Approve on your phone
                  </Heading>
                  <Text fontSize="14px" color="gray.500" lineHeight="1.6">
                    A MoMo payment request of <strong>800 RWF</strong> has been
                    sent to your phone. Approve it to activate your Day Pass
                    instantly.
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
