import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";
import { useAuth } from "@/context/useAuth";
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
  Center,
  Image,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logos/logo_dark.svg";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const SUBJECTS = [
  { icon: "🔢", name: "Mathematics" },
  { icon: "📖", name: "English Language" },
  { icon: "🔬", name: "Science & Technology" },
  { icon: "🌍", name: "Social Studies" },
];

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleTrial = () => navigate(user ? "/app/subjects" : "/auth");

  const HOW = [
    {
      step: "01",
      title: t("landingPage.hows.free"),
      desc: t("landingPage.hows.freeDesc"),
    },
    {
      step: "02",
      title: t("landingPage.hows.seeResults"),
      desc: t("landingPage.hows.seeResultsDesc"),
    },
    {
      step: "03",
      title: t("landingPage.hows.subscribe"),
      desc: t("landingPage.hows.subscribeDesc"),
    },
  ];

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
          <Flex align="center" mb="10" columnGap={"50%"}>
            <Image src={logoIcon} w={100} />
            <LanguageSelection />
          </Flex>

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
              {t("landingPage.prepExamText")}
            </Badge>

            <Heading
              fontFamily="heading"
              fontSize={{ base: "42px", md: "58px" }}
              fontWeight="800"
              color="white"
              lineHeight="1.05"
              letterSpacing="-2px"
            >
              {t("landingPage.prepSmarterText")}
              <br />
              <Box as="span" color="#7ee8a2">
                {t("landingPage.scoreHigherText")}
              </Box>
            </Heading>

            <Text
              color="rgba(255,255,255,0.75)"
              fontSize={{ base: "15px", md: "17px" }}
              lineHeight="1.7"
              maxW="480px"
            >
              {t("landingPage.subHeroText")}
            </Text>

            <SimpleGrid columns={3} gap="3" w="full" maxW="400px" pt="2">
              {[
                { num: "480+", label: t("common.questions") },
                { num: "4", label: t("common.subjects") },
                { num: "P6", label: t("common.aligned") },
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

            <VStack gap="3" w="full" maxW="360px" pt="2">
              <Button
                w="full"
                size="lg"
                py="7"
                fontSize="16px"
                bg="white"
                color="black"
                _hover={{
                  bg: "bg.50",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                }}
                transition="all 0.2s"
                onClick={handleTrial}
              >
                {t("landingPage.tryFree")}
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
                {t("common.fullAccess")}
              </Button>
            </VStack>
          </VStack>
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
          {t("landingPage.subjectsCovered")}
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
        {/* <Container maxW="container.md" px="6"> */}
        <Flex justifyContent={"center"}>
          <Text
            fontFamily="heading"
            fontWeight="700"
            fontSize="11px"
            letterSpacing="1.5px"
            textTransform="uppercase"
            color="gray.400"
            mb="5"
          >
            {t("landingPage.howItWorks")}
          </Text>
        </Flex>
        <VStack gap="4" align="stretch">
          {HOW.map((item) => (
            <Center
              key={item.step}
              bg="paper"
              borderRadius="16px"
              p="5"
              gap="4"
            >
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
            </Center>
          ))}
        </VStack>
        {/* </Container> */}
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
          {t("landingPage.readyToStart")}
        </Heading>
        <Text color="gray.500" mb="6" fontSize="15px">
          {t("landingPage.joinParentsText")}
        </Text>
        <Button
          size="lg"
          px="10"
          py="7"
          fontSize="16px"
          colorPalette="brand"
          onClick={handleTrial}
        >
          {t("landingPage.startFreeTrial")}
        </Button>
      </Container>
    </Box>
  );
}
