import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Text,
  VStack,
  IconButton,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../context/useQuiz";
import { X } from "lucide-react";

const popIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`;

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function Quiz() {
  const navigate = useNavigate();
  const { session, currentQuestion, submitAnswer } = useQuiz();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [prevIndex, setPrevIndex] = useState(session?.currentIndex);

  if (session?.currentIndex !== prevIndex) {
    setPrevIndex(session?.currentIndex);
    setSelected(null);
    setRevealed(false);
  }

  useEffect(() => {
    if (!session) {
      navigate("/subjects");
      return;
    }
    if (session.isComplete) {
      navigate("/score");
    }
  }, [session, navigate]);

  if (!session || !currentQuestion) return null;

  const total = session.questions.length;
  const current = session.currentIndex + 1;
  const progress = ((current - 1) / total) * 100;

  const pick = (opt: (typeof OPTIONS)[number]) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    setTimeout(() => submitAnswer(opt), 850);
  };

  const getOptionBg = (letter: string) => {
    if (!revealed) return selected === letter ? "#e8f5ee" : "white";
    if (letter === currentQuestion.correctOption) return "#e8f5ee";
    if (letter === selected) return "#fdeaea";
    return "white";
  };

  const getOptionBorder = (letter: string) => {
    if (!revealed) return selected === letter ? "#1a6b3c" : "#e4e4e7";
    if (letter === currentQuestion.correctOption) return "#1a6b3c";
    if (letter === selected) return "#b83030";
    return "#e4e4e7";
  };

  const getLetterBg = (letter: string) => {
    if (!revealed) return selected === letter ? "#1a6b3c" : "#f4f4f5";
    if (letter === currentQuestion.correctOption) return "#1a6b3c";
    if (letter === selected) return "#b83030";
    return "#f4f4f5";
  };

  const getLetterColor = (letter: string) => {
    if (!revealed) return selected === letter ? "white" : "#71717a";
    if (letter === currentQuestion.correctOption) return "white";
    if (letter === selected) return "white";
    return "#d4d4d8";
  };

  return (
    <Box minH="100vh" bg="paper">
      {/* Header */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        position="sticky"
        top="0"
        zIndex="10"
      >
        <Container maxW="container.sm" px="6" py="4">
          <Flex align="center" justify="space-between" mb="3">
            <IconButton
              aria-label="Exit"
              variant="ghost"
              size="sm"
              borderRadius="10px"
              onClick={() => navigate("/subjects")}
            >
              <X size={16} />
            </IconButton>
            <Text
              fontFamily="heading"
              fontWeight="700"
              fontSize="14px"
              color="gray.700"
            >
              {session.subjectName}
            </Text>
            <Box bg="brand.50" px="3" py="1" borderRadius="full">
              <Text fontSize="12px" fontWeight="600" color="brand.600">
                {current} / {total}
              </Text>
            </Box>
          </Flex>
          {/* Progress bar */}
          <Box w="full" h="6px" bg="gray.100" borderRadius="full">
            <Box
              h="full"
              w={`${progress}%`}
              bg="brand.500"
              borderRadius="full"
              transition="width 0.3s"
            />
          </Box>
        </Container>
      </Box>

      {/* Body */}
      <Container maxW="container.sm" px="6" py="8">
        <VStack gap="6" align="stretch">
          {session.isTrial && (
            <Box
              bg="orange.50"
              border="1px solid"
              borderColor="orange.100"
              borderRadius="12px"
              px="4"
              py="2"
            >
              <Text
                fontSize="12px"
                color="orange.600"
                fontWeight="500"
                textAlign="center"
              >
                🎯 Free trial — {total - current + 1} question
                {total - current + 1 !== 1 ? "s" : ""} remaining
              </Text>
            </Box>
          )}

          {/* Question */}
          <Box style={{ animation: `${popIn} 0.35s ease forwards` }}>
            <Text
              fontSize="12px"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.8px"
              color="gray.400"
              mb="3"
            >
              Question {current} of {total}
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="700"
              fontSize={{ base: "20px", md: "24px" }}
              lineHeight="1.4"
              letterSpacing="-0.5px"
              color="gray.900"
            >
              {currentQuestion.questionText}
            </Text>
          </Box>

          {/* Options */}
          <VStack gap="3" align="stretch">
            {OPTIONS.map((letter) => (
              <Flex
                key={letter}
                align="center"
                gap="4"
                p="4"
                bg={getOptionBg(letter)}
                border="1.5px solid"
                borderColor={getOptionBorder(letter)}
                borderRadius="16px"
                cursor={revealed ? "default" : "pointer"}
                opacity={
                  revealed &&
                  letter !== currentQuestion.correctOption &&
                  letter !== selected
                    ? 0.45
                    : 1
                }
                onClick={() => pick(letter)}
                transition="all 0.2s"
                _hover={
                  !revealed
                    ? { borderColor: "brand.400", transform: "scale(1.01)" }
                    : {}
                }
              >
                <Box
                  minW="32px"
                  h="32px"
                  borderRadius="9px"
                  bg={getLetterBg(letter)}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontFamily="heading"
                  fontWeight="800"
                  fontSize="13px"
                  color={getLetterColor(letter)}
                  transition="all 0.2s"
                >
                  {letter}
                </Box>
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.800"
                  lineHeight="1.4"
                  flex={1}
                >
                  {currentQuestion.options[letter]}
                </Text>
                {revealed && letter === currentQuestion.correctOption && (
                  <Text fontSize="18px">✅</Text>
                )}
                {revealed &&
                  letter === selected &&
                  letter !== currentQuestion.correctOption && (
                    <Text fontSize="18px">❌</Text>
                  )}
              </Flex>
            ))}
          </VStack>

          {/* Explanation */}
          {revealed && !session.isTrial && (
            <Box
              bg="brand.50"
              border="1px solid"
              borderColor="brand.100"
              borderRadius="14px"
              p="4"
              style={{ animation: `${popIn} 0.3s ease forwards` }}
            >
              <Text
                fontSize="11px"
                fontWeight="600"
                color="brand.600"
                mb="1"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Explanation
              </Text>
              <Text fontSize="13px" color="gray.700" lineHeight="1.6">
                {currentQuestion.explanation}
              </Text>
            </Box>
          )}

          {revealed && session.isTrial && (
            <Box
              bg="gray.50"
              border="1.5px dashed"
              borderColor="gray.200"
              borderRadius="14px"
              p="4"
              textAlign="center"
            >
              <Text fontSize="13px" color="gray.500">
                🔒{" "}
                <Box as="span" fontWeight="600">
                  Explanations unlocked
                </Box>{" "}
                with full access
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
