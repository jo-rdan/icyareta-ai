import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useQuiz } from "../context/useQuiz";
import { SUBJECTS, MOCK_RESULTS } from "../data/mock";
import { ArrowLeft } from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  "1": "#1a3f6b",
  "2": "#6b3a1a",
  "3": "#1a6b3c",
  "4": "#6b1a4a",
};

export default function SubjectSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startQuiz } = useQuiz();

  const hasPaid = user?.accessStatus === "active";
  const trialUsed = user?.hasUsedFreeTrial;
  const isLocked = !hasPaid && !!trialUsed;

  const lastResult = (subjectName: string) =>
    MOCK_RESULTS.find((r) => r.subjectName === subjectName);

  const handleSelect = (subjectId: string, subjectName: string) => {
    if (isLocked) {
      navigate("/pricing");
      return;
    }
    startQuiz(subjectId, subjectName, "diagnostic", !hasPaid);
    navigate("/quiz");
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
        position="sticky"
        top="0"
        zIndex="10"
      >
        <Container maxW="container.md">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap="3">
              <IconButton
                aria-label="Back"
                variant="ghost"
                size="sm"
                borderRadius="10px"
                onClick={() => navigate("/")}
              >
                <ArrowLeft size={16} />
              </IconButton>
              <Text
                fontFamily="heading"
                fontWeight="800"
                fontSize="16px"
                letterSpacing="-0.3px"
              >
                Icyareta
              </Text>
            </Flex>
            {!hasPaid && (
              <Badge
                bg="brand.50"
                color="brand.600"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="11px"
                fontWeight="600"
                cursor="pointer"
                onClick={() => navigate("/pricing")}
              >
                {trialUsed ? "Subscribe" : "Free Trial"}
              </Badge>
            )}
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.md" py="8" px="6">
        <VStack align="flex-start" gap="1" mb="8">
          <Text
            fontFamily="heading"
            fontWeight="700"
            fontSize="11px"
            letterSpacing="1.5px"
            textTransform="uppercase"
            color="gray.400"
          >
            {hasPaid ? "Your subjects" : "Choose a subject to try"}
          </Text>
          <Heading
            fontFamily="heading"
            fontSize={{ base: "28px", md: "34px" }}
            fontWeight="800"
            letterSpacing="-1px"
          >
            {hasPaid ? "Practice today 👋" : "Start your free trial"}
          </Heading>
          <Text color="gray.500" fontSize="14px">
            {hasPaid
              ? "Which subject will you practice today?"
              : isLocked
                ? "Subscribe to keep practicing all subjects."
                : "Pick any subject — 5 questions, no payment needed."}
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          {SUBJECTS.map((subject) => {
            const result = lastResult(subject.name);
            const color = SUBJECT_COLORS[subject.id];

            return (
              <Box
                key={subject.id}
                bg="white"
                border="1.5px solid"
                borderColor="gray.100"
                borderRadius="20px"
                p="5"
                cursor={isLocked ? "default" : "pointer"}
                opacity={isLocked ? 0.6 : 1}
                onClick={() => handleSelect(subject.id, subject.name)}
                _hover={
                  !isLocked
                    ? {
                        borderColor: color,
                        boxShadow: `0 8px 32px ${color}20`,
                        transform: "translateY(-2px)",
                      }
                    : {}
                }
                transition="all 0.2s"
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  w="4px"
                  h="full"
                  style={{ background: color }}
                  borderRadius="4px 0 0 4px"
                />

                <Flex pl="3" justify="space-between" align="flex-start">
                  <VStack align="flex-start" gap="2" flex={1}>
                    <Text fontSize="28px">{subject.icon}</Text>
                    <Text
                      fontFamily="heading"
                      fontWeight="700"
                      fontSize="15px"
                      letterSpacing="-0.3px"
                    >
                      {subject.name}
                    </Text>
                    <Text fontSize="12px" color="gray.400" fontWeight="500">
                      {subject.questionCount} questions
                    </Text>

                    {result && hasPaid && (
                      <VStack align="flex-start" gap="1" w="full" mt="1">
                        <Flex justify="space-between" w="full">
                          <Text fontSize="11px" color="gray.400">
                            Last score
                          </Text>
                          <Text
                            fontSize="11px"
                            fontWeight="600"
                            color={
                              result.score / result.total >= 0.6
                                ? "brand.600"
                                : "red.400"
                            }
                          >
                            {result.score}/{result.total}
                          </Text>
                        </Flex>
                        <Box w="full" h="4px" bg="gray.100" borderRadius="full">
                          <Box
                            h="full"
                            w={`${(result.score / result.total) * 100}%`}
                            bg={
                              result.score / result.total >= 0.6
                                ? "brand.500"
                                : "red.400"
                            }
                            borderRadius="full"
                          />
                        </Box>
                      </VStack>
                    )}
                  </VStack>

                  {isLocked && (
                    <Box bg="gray.100" p="2" borderRadius="10px">
                      <Text fontSize="16px">🔒</Text>
                    </Box>
                  )}
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>

        {!hasPaid && !trialUsed && (
          <Box
            mt="6"
            bg="brand.50"
            border="1px solid"
            borderColor="brand.100"
            borderRadius="16px"
            p="4"
            textAlign="center"
          >
            <Text fontSize="13px" color="brand.700" fontWeight="500">
              After your free trial, subscribe for full access —{" "}
              <Box as="span" fontWeight="700">
                5,000 RWF/month
              </Box>
            </Text>
          </Box>
        )}
      </Container>
    </Box>
  );
}
