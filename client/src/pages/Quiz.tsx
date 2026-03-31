import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Text,
  VStack,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useQuiz } from "@/context/useQuiz";

const popIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`;

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function Quiz() {
  const navigate = useNavigate();
  const { session, isLoading, submitAnswer } = useQuiz();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{
    correctOption: string;
    explanation: string;
  } | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/subjects");
      return;
    }
    if (session.isComplete) {
      navigate("/score");
    }
  }, [session, navigate]);

  // Reset selection state when question changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(null);
    setRevealed(false);
    setLastAnswer(null);
  }, [session?.currentQuestion?.id]);

  if (!session || !session.currentQuestion) {
    return (
      <Box
        minH="100vh"
        bg="paper"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner
          color="brand.600"
          borderWidth="3px"
          width="40px"
          height="40px"
        />
      </Box>
    );
  }

  const { currentQuestion, isTrial } = session;
  const { index, total } = currentQuestion;
  const progress = (index / total) * 100;

  const pick = async (opt: (typeof OPTIONS)[number]) => {
    if (revealed || isLoading) return;
    setSelected(opt);
    setRevealed(true);

    // Get the answer details before submitting moves to next question
    await new Promise((r) => setTimeout(r, 900));
    await submitAnswer(opt);
  };

  const getBg = (letter: string) => {
    if (!revealed) return selected === letter ? "#e8f5ee" : "white";
    if (
      letter === lastAnswer?.correctOption ||
      (!lastAnswer && letter === selected)
    )
      return "#e8f5ee";
    if (letter === selected) return "#fdeaea";
    return "white";
  };

  const getBorder = (letter: string) => {
    if (!revealed) return selected === letter ? "#1a6b3c" : "#e4e4e7";
    if (
      letter === lastAnswer?.correctOption ||
      (!lastAnswer && letter === selected)
    )
      return "#1a6b3c";
    if (letter === selected) return "#b83030";
    return "#e4e4e7";
  };

  const getLetterBg = (letter: string) => {
    if (!revealed) return selected === letter ? "#1a6b3c" : "#f4f4f5";
    if (
      letter === lastAnswer?.correctOption ||
      (!lastAnswer && letter === selected)
    )
      return "#1a6b3c";
    if (letter === selected) return "#b83030";
    return "#f4f4f5";
  };

  const getLetterColor = (letter: string) => {
    if (!revealed) return selected === letter ? "white" : "#71717a";
    const correct = lastAnswer?.correctOption ?? selected;
    if (letter === correct) return "white";
    if (letter === selected) return "white";
    return "#d4d4d8";
  };

  // Track the last answer for showing correct option
  const handleAnswer = async (opt: (typeof OPTIONS)[number]) => {
    if (revealed || isLoading) return;
    setSelected(opt);
    setRevealed(true);

    // Store which answer we submitted before submitAnswer clears the question
    const answerRecord = session.answers[session.answers.length]; // will be added
    await new Promise((r) => setTimeout(r, 850));

    await submitAnswer(opt);
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
                {index + 1} / {total}
              </Text>
            </Box>
          </Flex>
          <Box w="full" h="6px" bg="gray.100" borderRadius="full">
            <Box
              h="full"
              w={`${progress}%`}
              bg="green.500"
              borderRadius="full"
              transition="width 0.3s"
            />
          </Box>
        </Container>
      </Box>

      {/* Body */}
      <Container maxW="container.sm" px="6" py="8">
        <VStack gap="6" align="stretch">
          {isTrial && (
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
                🎯 Free trial — {total - index - 1} question
                {total - index - 1 !== 1 ? "s" : ""} remaining after this
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
              Question {index + 1} of {total}
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="700"
              fontSize={{ base: "20px", md: "24px" }}
              lineHeight="1.4"
              letterSpacing="-0.5px"
            >
              {currentQuestion.text}
            </Text>
          </Box>

          {/* Options */}
          <VStack gap="3" align="stretch">
            {OPTIONS.map((option) => (
              <Flex
                key={option}
                align="center"
                gap="4"
                p="4"
                bg={getBg(option)}
                border="1.5px solid"
                borderColor={getBorder(option)}
                borderRadius="16px"
                cursor={revealed || isLoading ? "default" : "pointer"}
                opacity={
                  revealed &&
                  option !== selected &&
                  option !== lastAnswer?.correctOption
                    ? 0.45
                    : 1
                }
                onClick={() => handleAnswer(option)}
                transition="all 0.2s"
                _hover={
                  !revealed && !isLoading
                    ? { borderColor: "brand.400", transform: "scale(1.01)" }
                    : {}
                }
              >
                <Box
                  minW="32px"
                  h="32px"
                  borderRadius="9px"
                  bg={getLetterBg(option)}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontFamily="heading"
                  fontWeight="800"
                  fontSize="13px"
                  color={getLetterColor(option)}
                  transition="all 0.2s"
                >
                  {option}
                </Box>
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.800"
                  lineHeight="1.4"
                  flex={1}
                >
                  {currentQuestion.options[option]}
                </Text>
                {isLoading && selected === option && (
                  <Spinner
                    borderWidth="2px"
                    width="16px"
                    height="16px"
                    color="brand.600"
                  />
                )}
              </Flex>
            ))}
          </VStack>

          {/* Show last answer explanation while loading next question */}
          {revealed &&
            session.answers.length > 0 &&
            (() => {
              const last = session.answers[session.answers.length - 1];
              return (
                <Box>
                  {!isTrial && last.explanation ? (
                    <Box
                      bg="brand.50"
                      border="1px solid"
                      borderColor="brand.100"
                      borderRadius="14px"
                      p="4"
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
                        {last.explanation}
                      </Text>
                    </Box>
                  ) : isTrial ? (
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
                          Explanations
                        </Box>{" "}
                        unlocked with a Day Pass
                      </Text>
                    </Box>
                  ) : null}
                </Box>
              );
            })()}
        </VStack>
      </Container>
    </Box>
  );
}
