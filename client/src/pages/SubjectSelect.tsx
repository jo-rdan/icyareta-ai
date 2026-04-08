import { useEffect, useState } from "react";
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
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ArrowLeft } from "lucide-react";
import api from "../lib/axios";
import { useQuiz } from "@/context/useQuiz";
import { useTranslation } from "react-i18next";
import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";

interface Subject {
  id: string;
  name: string;
}
interface Result {
  subjectName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#1a3f6b",
  "English Language": "#6b3a1a",
  "Science & Elementary Technology": "#1a6b3c",
  "Social & Religious Studies": "#6b1a4a",
};

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "🔢",
  "English Language": "📖",
  "Science & Elementary Technology": "🔬",
  "Social & Religious Studies": "🌍",
};

export default function SubjectSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startQuiz, error: quizError } = useQuiz();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  const hasPaid = user?.accessStatus === "active";
  const trialUsed = user?.hasUsedFreeTrial;
  const isLocked = !hasPaid && !!trialUsed;

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, resRes] = await Promise.all([
          api.get("/subjects"),
          hasPaid ? api.get("/user/results") : Promise.resolve({ data: [] }),
        ]);
        setSubjects(subRes.data);
        setResults(resRes.data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [hasPaid]);

  const handleSelect = async (subjectId: string, subjectName: string) => {
    if (isLocked) {
      navigate("/pricing");
      return;
    }
    setStarting(subjectId);
    try {
      await startQuiz(subjectId, subjectName, "diagnostic", !hasPaid);
      navigate("/app/quiz");
    } finally {
      setStarting(null);
    }
  };

  const lastResult = (name: string) =>
    results.find((r) => r.subjectName === name);

  if (isLoading) {
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
                color={"bg.panel"}
              >
                <ArrowLeft size={16} />
              </IconButton>
              <Text fontFamily="heading" fontWeight="800" fontSize="16px">
                Xeta
              </Text>
            </Flex>
            <HStack>
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
                  {trialUsed ? t("subjects.getAccess") : t("common.freeTrial")}
                </Badge>
              )}
              <LanguageSelection />
            </HStack>
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
            {hasPaid ? t("subjects.yourSubjects") : t("subjects.chooseSubject")}
          </Text>
          <Heading
            fontFamily="heading"
            fontSize={{ base: "28px", md: "34px" }}
            fontWeight="800"
            letterSpacing="-1px"
          >
            {hasPaid
              ? t("subjects.practiceToday")
              : t("subjects.startYourTrial")}
          </Heading>
          <Text color="gray.500" fontSize="14px">
            {hasPaid
              ? t("subjects.whichSubject")
              : isLocked
                ? t("subjects.getAccessText")
                : t("subjects.pickAnySubject")}
          </Text>
        </VStack>

        {quizError && (
          <Box
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="12px"
            px="4"
            py="3"
            mb="4"
          >
            <Text fontSize="13px" color="red.600">
              {quizError}
            </Text>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          {subjects.map((subject) => {
            const result = lastResult(subject.name);
            const color = SUBJECT_COLORS[subject.name] ?? "#1a6b3c";
            const icon = SUBJECT_ICONS[subject.name] ?? "📚";
            const isStarting = starting === subject.id;

            return (
              <Box
                key={subject.id}
                bg="white"
                border="1.5px solid"
                borderColor="gray.100"
                borderRadius="20px"
                p="5"
                cursor={isLocked || isStarting ? "default" : "pointer"}
                opacity={isLocked ? 0.6 : 1}
                onClick={() =>
                  !isStarting && handleSelect(subject.id, subject.name)
                }
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
                    {isStarting ? (
                      <Spinner
                        color="brand.600"
                        borderWidth="2px"
                        width="28px"
                        height="28px"
                      />
                    ) : (
                      <Text fontSize="28px">{icon}</Text>
                    )}
                    <Text
                      fontFamily="heading"
                      fontWeight="700"
                      fontSize="15px"
                      letterSpacing="-0.3px"
                    >
                      {subject.name}
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
                              result.percentage >= 60 ? "brand.600" : "red.400"
                            }
                          >
                            {result.score}/{result.totalQuestions}
                          </Text>
                        </Flex>
                        <Box w="full" h="4px" bg="gray.100" borderRadius="full">
                          <Box
                            h="full"
                            w={`${result.percentage}%`}
                            bg={result.percentage >= 60 ? "#1a6b3c" : "#f87171"}
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
              {t("subjects.afterTrial")}{" "}
              <Box as="span" fontWeight="700">
                {t("common.fullAccess")}
              </Box>{" "}
              {t("subjects.toPractice")}
            </Text>
          </Box>
        )}
      </Container>
    </Box>
  );
}
