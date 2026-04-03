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
import { useAuth } from "@/context/useAuth";
import { useQuiz } from "@/context/useQuiz";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function Score() {
  const navigate = useNavigate();
  const { session, resetQuiz } = useQuiz();
  const { user } = useAuth();

  // Snapshot everything we need before any reset can null the session.
  // This is the fix for the bug where clicking "Get Day Pass" would call
  // resetQuiz(), null the session, trigger the guard below, and send the
  // user to /subjects instead of /pricing.
  const score = session?.score ?? null;
  const subjectName = session?.subjectName ?? "";
  const isTrial = session?.isTrial ?? false;
  const answers = session?.answers ?? [];

  if (!score) {
    navigate("/subjects");
    return null;
  }

  const pct = score.percentage;
  const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "🎯" : "💪";
  const message =
    pct >= 80
      ? "Excellent work!"
      : pct >= 60
        ? "Good effort!"
        : "Keep practicing!";
  const headerBg =
    pct >= 60
      ? "linear-gradient(160deg, #072a16, #1a6b3c)"
      : "linear-gradient(160deg, #3d1a1a, #b83030)";

  const wrongAnswers = answers.filter((a) => !a.isCorrect);

  // Always navigate FIRST, then reset.
  // If we reset first, session becomes null, the guard fires, and the user
  // gets redirected to /subjects regardless of which button they pressed.
  const goBack = () => {
    navigate("/subjects");
    resetQuiz();
  };

  const goSubscribe = () => {
    navigate("/pricing");
    resetQuiz();
  };

  const goDashboard = () => {
    navigate("/dashboard");
    resetQuiz();
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
              {subjectName} • {isTrial ? "Free Trial" : "Practice"}
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

          {/* Wrong answers review */}
          {wrongAnswers.length > 0 && (
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
                {wrongAnswers.length} answer
                {wrongAnswers.length !== 1 ? "s" : ""} to review
              </Text>
              <VStack gap="2" align="stretch">
                {wrongAnswers.map((a, i) => (
                  <Box key={i} bg="red.50" borderRadius="10px" p="3">
                    <Flex gap="2" align="center" mb="1">
                      <Box bg="red.100" px="2" borderRadius="6px">
                        <Text fontSize="11px" fontWeight="700" color="red.600">
                          You: {a.selectedOption}
                        </Text>
                      </Box>
                      <Box bg="green.100" px="2" borderRadius="6px">
                        <Text
                          fontSize="11px"
                          fontWeight="700"
                          color="green.700"
                        >
                          Correct: {a.correctOption}
                        </Text>
                      </Box>
                    </Flex>
                    {!isTrial && a.explanation && (
                      <Text fontSize="12px" color="gray.600" lineHeight="1.5">
                        {a.explanation}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Locked explanations for trial users */}
          {isTrial && wrongAnswers.length > 0 && (
            <Box
              bg="white"
              borderRadius="20px"
              p="5"
              border="1.5px dashed"
              borderColor="gray.200"
              position="relative"
              overflow="hidden"
            >
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
                bg="rgba(255,255,255,0.88)"
                style={{ backdropFilter: "blur(2px)" }}
                gap="1"
              >
                <Text fontSize="22px">🔒</Text>
                <Text fontWeight="700" fontSize="14px" color="gray.800">
                  Unlock full explanations
                </Text>
                <Text fontSize="12px" color="gray.500">
                  See exactly why each answer is correct
                </Text>
              </Box>
            </Box>
          )}

          <Separator borderColor="gray.100" />

          {/* CTAs */}
          {isTrial ? (
            <VStack gap="3">
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="15px"
                colorPalette="brand"
                onClick={goSubscribe}
              >
                Unlock Full Access — from 800 RWF
              </Button>
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="15px"
                variant="outline"
                borderColor="gray.200"
                color="gray.600"
                onClick={goBack}
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
                onClick={goDashboard}
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
