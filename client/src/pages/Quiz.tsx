import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Text,
  VStack,
  IconButton,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useQuiz } from "@/context/useQuiz";
import { useTranslation } from "react-i18next";
import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";

const popIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`;

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function Quiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, isLoading, submitAnswer } = useQuiz();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/app/subjects");
      return;
    }
    if (session.isComplete) {
      navigate("/app/score");
    }
  }, [session, navigate]);

  // Reset per-question UI state when the question changes
  useEffect(() => {
    setSelected(null);
    setRevealed(false);
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

  const { currentQuestion, isTrial, answers } = session;
  const { index, total } = currentQuestion;
  const progress = (index / total) * 100;

  // The last answer in the list — used to show correct/wrong colours and explanation
  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

  const handleAnswer = async (opt: (typeof OPTIONS)[number]) => {
    if (revealed || isLoading) return;
    setSelected(opt);
    setRevealed(true);
    // Brief pause so the user can see their selection highlighted before we advance
    await new Promise((r) => setTimeout(r, 850));
    await submitAnswer(opt);
  };

  const getBg = (letter: string) => {
    if (!revealed) return selected === letter ? "#e8f5ee" : "white";
    if (letter === selected && selected === currentQuestion?.correctOption)
      return "#e8f5ee";
    if (letter === selected && selected !== currentQuestion?.correctOption)
      return "#fdeaea";
    if (letter === currentQuestion?.correctOption) return "#e8f5ee";
    return "white";
  };

  const getBorder = (letter: string) => {
    if (!revealed) return selected === letter ? "#1a6b3c" : "#e4e4e7";
    if (letter === selected && selected === currentQuestion?.correctOption)
      return "#1a6b3c";
    if (letter === selected && selected !== currentQuestion?.correctOption)
      return "#b83030";
    if (letter === currentQuestion?.correctOption) return "#1a6b3c";
    return "#e4e4e7";
  };

  const getLetterBg = (letter: string) => {
    if (!revealed) return selected === letter ? "#1a6b3c" : "#f4f4f5";
    if (letter === selected && selected === currentQuestion?.correctOption)
      return "#1a6b3c";
    if (letter === selected && selected !== currentQuestion?.correctOption)
      return "#b83030";
    if (letter === currentQuestion?.correctOption) return "#1a6b3c";
    return "#f4f4f5";
  };

  const getLetterColor = (letter: string) => {
    if (!revealed) return selected === letter ? "white" : "#71717a";
    if (letter === selected) return "white";
    if (letter === currentQuestion?.correctOption) return "white";
    return "#d4d4d8";
  };

  return (
    <Box minH="100vh" bg="paper">
      {/* Header */}
      <HStack
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
              onClick={() => navigate("/app/subjects")}
              color={"bg.panel"}
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
              bg="#1a6b3c"
              borderRadius="full"
              transition="width 0.3s"
            />
          </Box>
        </Container>
        <LanguageSelection />
      </HStack>

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
                🎯 {t("common.freeTrial")} — {total - index - 1}{" "}
                {t("common.question")}
                {total - index - 1 !== 1 ? "s" : ""}
                {t("quiz.remaining")}
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

          {/* Explanation — shown after answering while loading next question */}
          {revealed &&
            lastAnswer &&
            (!isTrial && lastAnswer.explanation ? (
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
                  {t("quiz.explanation")}
                </Text>
                <Text fontSize="13px" color="gray.700" lineHeight="1.6">
                  {lastAnswer.explanation}
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
                    {t("quiz.explanation")}s
                  </Box>{" "}
                  {t("quiz.unlocked")}
                </Text>
              </Box>
            ) : null)}

          <Box bg="gray.50" borderRadius="10px" px="3" py="2">
            <Text fontSize="10px" color="gray.400" textAlign="center">
              Inspired by the NESA P6 {session.subjectName} past papers ·
              Practice simulation — not an official exam
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
