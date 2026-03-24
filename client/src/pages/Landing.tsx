import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Badge,
  Image,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import heroIllustration from "@/assets/Illustration.svg";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const SUBJECTS = [
  { icon: "🔢", name: "Mathematics" },
  { icon: "📖", name: "English Language" },
  { icon: "🔬", name: "Science & Technology" },
  { icon: "🌍", name: "Social Studies & Religious Studies" },
];

const HOW = [
  {
    step: "01",
    title: "Try for free",
    desc: "Answer 5 real P6 questions on any subject. No payment needed.",
  },
  {
    step: "02",
    title: "See your results",
    desc: "Get your score instantly. See exactly where your child needs to improve.",
  },
  {
    step: "03",
    title: "Subscribe & practice",
    desc: "Unlock all subjects with our Day Pass at RF 800",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleTrial = () => navigate(user ? "/subjects" : "/auth");

  return (
    <Box minH="100vh" bg="paper">
      {/* ── Hero ── */}
      <Box
        style={{
          background:
            "linear-gradient(160deg, #072a16 0%, #1a6b3c 55%, #2d9e5f 100%)",
        }}
        pt={{ base: "16", md: "24" }}
        pb={{ base: "20", md: "28" }}
        px="6"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-80px"
          right="-80px"
          w="320px"
          h="320px"
          borderRadius="full"
          bg="rgba(255,255,255,0.04)"
        />
        <Box
          position="absolute"
          bottom="-60px"
          left="-60px"
          w="240px"
          h="240px"
          borderRadius="full"
          bg="rgba(255,255,255,0.04)"
        />

        <Container maxW="container.md" position="relative">
          {/* Logo */}
          <Flex align="center" mb="10">
            <Box
              bg="rgba(255,255,255,0.15)"
              px="4"
              py="2"
              borderRadius="full"
              border="1px solid rgba(255,255,255,0.2)"
            >
              <Text
                fontFamily="heading"
                fontWeight="800"
                fontSize="18px"
                color="white"
                letterSpacing="-0.5px"
              >
                Icyareta
              </Text>
            </Box>
          </Flex>

          <Flex
            direction={"row"}
            justifyContent={"space-around"}
            wrap={"wrap-reverse"}
          >
            <VStack
              align="flex-start"
              gap="5"
              style={{ animation: `${fadeUp} 0.6s ease forwards` }}
            >
              <Badge
                bg="rgba(126,232,162,0.2)"
                color="#7ee8a2"
                outline="1px solid rgba(126,232,162,0.3)"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="11px"
                fontWeight="600"
                letterSpacing="0.8px"
              >
                P6 EXAM PREP • RWANDA 2026
              </Badge>

              <Heading
                fontFamily="heading"
                fontSize={{ base: "42px", md: "58px" }}
                fontWeight="800"
                color="white"
                lineHeight="1.05"
                letterSpacing="-2px"
              >
                Prep smarter.
                <br />
                <Box as="span" color="#7ee8a2">
                  Score higher.
                </Box>
              </Heading>

              <Text
                color="rgba(255,255,255,0.75)"
                fontSize={{ base: "15px", md: "17px" }}
                lineHeight="1.7"
                maxW="480px"
              >
                Rwanda's first mobile exam prep platform. Real P6 curriculum
                questions. Instant results. Works offline.
              </Text>

              <SimpleGrid columns={3} gap="3" w="full" maxW="400px" pt="2">
                {[
                  { num: "480+", label: "Questions" },
                  { num: "4", label: "Subjects" },
                  { num: "P6", label: "Aligned" },
                ].map((s) => (
                  <Box
                    key={s.label}
                    bg="rgba(255,255,255,0.1)"
                    outline="1px solid rgba(255,255,255,0.15)"
                    borderRadius="14px"
                    p="3"
                    textAlign="center"
                  >
                    <Text
                      fontFamily="heading"
                      fontWeight="800"
                      fontSize="22px"
                      color="white"
                    >
                      {s.num}
                    </Text>
                    <Text
                      fontSize="10px"
                      color="rgba(255,255,255,0.6)"
                      mt="2px"
                      fontWeight="500"
                    >
                      {s.label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <VStack gap="3" w="full" maxW="400px" pt="2">
                <Button
                  w="full"
                  size="lg"
                  py="7"
                  fontSize="16px"
                  bg="white"
                  color="brand.600"
                  _hover={{
                    bg: "brand.50",
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                  }}
                  transition="all 0.2s"
                  onClick={handleTrial}
                >
                  Try Free — 5 Questions
                </Button>
                <Button
                  w="full"
                  size="lg"
                  py="7"
                  fontSize="15px"
                  fontWeight="600"
                  bg="rgba(255,255,255,0.1)"
                  color="white"
                  outline="1px solid rgba(255,255,255,0.25)"
                  _hover={{ bg: "rgba(255,255,255,0.18)" }}
                  onClick={() => navigate("/pricing")}
                >
                  Day Pass — 800 RWF
                </Button>
              </VStack>
            </VStack>
            <Image src={heroIllustration} maxWidth={500} />
          </Flex>
        </Container>
      </Box>

      {/* ── Subjects ── */}
      <Container maxW="container.md" py="12" px="6">
        <Text
          fontFamily="heading"
          fontWeight="700"
          fontSize="11px"
          letterSpacing="1.5px"
          textTransform="uppercase"
          color="gray.400"
          mb="5"
        >
          Subjects covered
        </Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
          {SUBJECTS.map((s) => (
            <Box
              key={s.name}
              bg="white"
              outline="1px solid {colors.gray.100}"
              borderRadius="16px"
              p="5"
              textAlign="center"
              boxShadow="0 2px 8px rgba(0,0,0,0.04)"
              _hover={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                transform: "translateY(-2px)",
              }}
              transition="all 0.2s"
            >
              <Text fontSize="32px" mb="2">
                {s.icon}
              </Text>
              <Text fontWeight="600" fontSize="13px" color="gray.700">
                {s.name}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>

      {/* ── How it works ── */}
      <Box bg="white" py="12">
        <Container maxW="container.md" px="6">
          <Text
            fontFamily="heading"
            fontWeight="700"
            fontSize="11px"
            letterSpacing="1.5px"
            textTransform="uppercase"
            color="gray.400"
            mb="5"
          >
            How it works
          </Text>
          <VStack gap="4" align="stretch">
            {HOW.map((item) => (
              <Flex
                key={item.step}
                bg="paper"
                borderRadius="16px"
                p="5"
                gap="4"
                align="center"
              >
                <Box
                  minW="48px"
                  h="48px"
                  bg="brand.600"
                  borderRadius="14px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    fontFamily="heading"
                    fontWeight="800"
                    fontSize="16px"
                    color="white"
                  >
                    {item.step}
                  </Text>
                </Box>
                <Box>
                  <Text
                    fontFamily="heading"
                    fontWeight="700"
                    fontSize="15px"
                    mb="1"
                  >
                    {item.title}
                  </Text>
                  <Text fontSize="13px" color="gray.500" lineHeight="1.5">
                    {item.desc}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </Container>
      </Box>

      {/* ── Bottom CTA ── */}
      <Container maxW="container.md" py="12" px="6" textAlign="center">
        <Heading
          fontFamily="heading"
          fontSize={{ base: "28px", md: "36px" }}
          fontWeight="800"
          letterSpacing="-1px"
          mb="3"
        >
          Ready to start practicing?
        </Heading>
        <Text color="gray.500" mb="6" fontSize="15px">
          Join parents across Kigali preparing their P6 children.
        </Text>
        <Button
          size="lg"
          px="10"
          py="7"
          fontSize="16px"
          colorPalette="brand"
          onClick={handleTrial}
        >
          Start Free Trial
        </Button>
      </Container>
    </Box>
  );
}
