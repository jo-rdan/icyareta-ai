import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Button,
  Separator,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../context/useQuiz";
import { useAuth } from "../context/useAuth";
import { SUBJECT_WEAK_TOPICS } from "../data/mock";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function Score() {
  const navigate = useNavigate();
  const { session, score, resetQuiz } = useQuiz();
  const { user, updateUser } = useAuth();

  if (!session || !score) {
    navigate("/subjects");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasPaid = user?.accessStatus === "active";
  const pct = score.percentage;
  const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "🎯" : "💪";
  const message =
    pct >= 80
      ? "Excellent work!"
      : pct >= 60
        ? "Good effort!"
        : "Keep practicing!";
  const weakTopics = SUBJECT_WEAK_TOPICS[session.subjectId] ?? [];
  const headerBg =
    pct >= 60
      ? "linear-gradient(160deg, #072a16, #1a6b3c)"
      : "linear-gradient(160deg, #3d1a1a, #b83030)";

  if (session.isTrial && user && !user.hasUsedFreeTrial) {
    updateUser({ hasUsedFreeTrial: true, accessStatus: "trial_used" });
  }

  const goBack = () => {
    resetQuiz();
    navigate("/subjects");
  };
  const goSubscribe = () => {
    resetQuiz();
    navigate("/pricing");
  };

  return (
    <Box minH="100vh" bg="paper">
      {/* Score header */}
      <Box style={{ background: headerBg }} pt="12" pb="10" px="6">
        <Container maxW="container.sm">
          <VStack gap="3" style={{ animation: `${fadeUp} 0.5s ease forwards` }}>
            <Text fontSize="52px">{emoji}</Text>
            <Text
              fontSize="12px"
              fontWeight="600"
              letterSpacing="1.5px"
              textTransform="uppercase"
              color="rgba(255,255,255,0.6)"
            >
              {session.subjectName} •{" "}
              {session.isTrial ? "Free Trial" : "Practice"}
            </Text>
            <Heading
              fontFamily="heading"
              fontSize="72px"
              fontWeight="800"
              color="white"
              lineHeight="1"
              letterSpacing="-3px"
            >
              {score.correct}/{score.total}
            </Heading>
            <Text
              color="rgba(255,255,255,0.75)"
              fontSize="15px"
              fontWeight="500"
            >
              {message} — {pct}% correct
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxW="container.sm" px="6" py="8">
        <VStack
          gap="5"
          align="stretch"
          style={{ animation: `${fadeUp} 0.6s ease 0.1s both forwards` }}
        >
          {/* Breakdown */}
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
              Score breakdown
            </Text>
            <Flex justify="space-around">
              {[
                { num: score.correct, label: "Correct", color: "#1a6b3c" },
                {
                  num: score.total - score.correct,
                  label: "Wrong",
                  color: "#f87171",
                },
                { num: `${pct}%`, label: "Score", color: "#374151" },
              ].map((item, i) => (
                <VStack key={i} gap="0">
                  <Text
                    fontFamily="heading"
                    fontWeight="800"
                    fontSize="28px"
                    style={{ color: item.color }}
                  >
                    {item.num}
                  </Text>
                  <Text fontSize="12px" color="gray.400" fontWeight="500">
                    {item.label}
                  </Text>
                </VStack>
              ))}
            </Flex>
          </Box>

          {/* Weak topics */}
          {weakTopics.length > 0 && (
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
                Areas to improve
              </Text>
              <VStack gap="3" align="stretch">
                {weakTopics.slice(0, 3).map((topic, i) => (
                  <Flex
                    key={topic}
                    align="center"
                    justify="space-between"
                    gap="3"
                  >
                    <Text fontSize="13px" fontWeight="500" color="gray.700">
                      {topic}
                    </Text>
                    <Box
                      flex={1}
                      maxW="120px"
                      h="6px"
                      bg="gray.100"
                      borderRadius="full"
                    >
                      <Box
                        h="full"
                        w={`${[65, 40, 55][i]}%`}
                        bg="red.400"
                        borderRadius="full"
                      />
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}

          {/* Locked explanations */}
          {session.isTrial && (
            <Box
              bg="white"
              borderRadius="20px"
              p="5"
              border="1.5px dashed"
              borderColor="gray.200"
              position="relative"
              overflow="hidden"
            >
              <Text
                fontFamily="heading"
                fontWeight="700"
                fontSize="12px"
                letterSpacing="1px"
                textTransform="uppercase"
                color="gray.300"
                mb="3"
              >
                Detailed explanations
              </Text>
              <VStack
                gap="2"
                align="stretch"
                style={{ filter: "blur(3px)", pointerEvents: "none" }}
              >
                <Box bg="gray.50" borderRadius="10px" p="3" h="50px" />
                <Box bg="gray.50" borderRadius="10px" p="3" h="50px" />
              </VStack>
              <Box
                position="absolute"
                inset="0"
                display="flex"
                flexDir="column"
                alignItems="center"
                justifyContent="center"
                bg="rgba(255,255,255,0.85)"
                style={{ backdropFilter: "blur(2px)" }}
                gap="1"
              >
                <Text fontSize="22px">🔒</Text>
                <Text fontWeight="700" fontSize="14px" color="gray.800">
                  Unlock full explanations
                </Text>
                <Text fontSize="12px" color="gray.500">
                  Subscribe to see why each answer is correct
                </Text>
              </Box>
            </Box>
          )}

          <Separator borderColor="gray.100" />

          {/* CTAs */}
          {session.isTrial ? (
            <VStack gap="3">
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="15px"
                colorPalette="brand"
                onClick={goSubscribe}
              >
                Practice More — 5,000 RWF/mo
              </Button>
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="15px"
                variant="outline"
                onClick={goBack}
                borderColor="gray.200"
                color="gray.600"
              >
                Back to subjects
              </Button>
            </VStack>
          ) : (
            <VStack gap="3">
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="15px"
                colorPalette="brand"
                onClick={goBack}
              >
                Practice another subject
              </Button>
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="14px"
                variant="ghost"
                color="gray.500"
                onClick={() => navigate("/dashboard")}
              >
                View my progress
              </Button>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
