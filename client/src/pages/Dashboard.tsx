import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Button,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../lib/axios";

interface Result {
  id: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  packType: string;
  takenAt: string;
}

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "🔢",
  "English Language": "📖",
  "Science & Elementary Technology": "🔬",
  "Social & Religious Studies": "🌍",
};

const getDaysUntilExam = () => {
  const EXAM_DATE = new Date("2026-07-05");
  const diffInMs = EXAM_DATE.getTime() - Date.now();

  // Single-purpose logic: converts ms to days and rounds up
  return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/user/results")
      .then((res) => setResults(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  const daysUntilExam = useMemo(() => getDaysUntilExam(), []);

  const avgScore = results.length
    ? Math.round(
        results.reduce((sum, r) => sum + r.percentage, 0) / results.length,
      )
    : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-RW", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  // Build subject summary from results
  const subjectSummary = Array.from(
    results
      .reduce((map, r) => {
        if (!map.has(r.subjectName)) map.set(r.subjectName, r);
        return map;
      }, new Map<string, Result>())
      .values(),
  );

  return (
    <Box minH="100vh" bg="paper">
      {/* Header */}
      <Box
        style={{ background: "linear-gradient(160deg, #072a16, #1a6b3c)" }}
        pt="10"
        pb="8"
        px="6"
      >
        <Container maxW="container.md">
          <Flex justify="space-between" align="flex-start" mb="6">
            <VStack align="flex-start" gap="0">
              <Text
                fontSize="12px"
                fontWeight="600"
                letterSpacing="1px"
                textTransform="uppercase"
                color="rgba(255,255,255,0.5)"
              >
                Welcome back
              </Text>
              <Heading
                fontFamily="heading"
                fontSize="24px"
                fontWeight="800"
                color="white"
                letterSpacing="-1px"
              >
                {user?.email ?? user?.phoneNumber ?? "Student"}
              </Heading>
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              color="rgba(255,255,255,0.6)"
              _hover={{ color: "white" }}
              onClick={logout}
            >
              Sign out
            </Button>
          </Flex>

          <SimpleGrid columns={3} gap="3">
            {[
              { num: `${daysUntilExam}`, label: "Days to exam" },
              { num: `${results.length}`, label: "Sessions done" },
              {
                num: results.length ? `${avgScore}%` : "—",
                label: "Avg score",
              },
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
                  color="rgba(255,255,255,0.55)"
                  mt="2px"
                  fontWeight="500"
                >
                  {s.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="container.md" px="6" py="8">
        <VStack gap="8" align="stretch">
          {/* Practice now */}
          <Box>
            <Text
              fontFamily="heading"
              fontWeight="700"
              fontSize="11px"
              letterSpacing="1.5px"
              textTransform="uppercase"
              color="gray.400"
              mb="4"
            >
              Practice now
            </Text>
            <Button
              w="full"
              size="lg"
              h="56px"
              fontSize="15px"
              colorPalette="brand"
              onClick={() => navigate("/subjects")}
            >
              Start a new session
            </Button>
          </Box>

          {/* Recent results */}
          {isLoading ? (
            <Flex justify="center" py="8">
              <Spinner
                color="brand.600"
                borderWidth="3px"
                width="32px"
                height="32px"
              />
            </Flex>
          ) : results.length > 0 ? (
            <Box>
              <Text
                fontFamily="heading"
                fontWeight="700"
                fontSize="11px"
                letterSpacing="1.5px"
                textTransform="uppercase"
                color="gray.400"
                mb="4"
              >
                Recent sessions
              </Text>
              <VStack gap="3" align="stretch">
                {results.slice(0, 5).map((result) => (
                  <Box
                    key={result.id}
                    bg="white"
                    borderRadius="16px"
                    p="4"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Flex justify="space-between" align="flex-start" mb="3">
                      <VStack align="flex-start" gap="0">
                        <Text
                          fontFamily="heading"
                          fontWeight="700"
                          fontSize="14px"
                        >
                          {result.subjectName}
                        </Text>
                        <Text fontSize="11px" color="gray.400">
                          {formatDate(result.takenAt)}
                        </Text>
                      </VStack>
                      <Badge
                        bg={result.percentage >= 60 ? "brand.50" : "red.50"}
                        color={
                          result.percentage >= 60 ? "brand.600" : "red.500"
                        }
                        px="3"
                        py="1"
                        borderRadius="full"
                        fontSize="12px"
                        fontWeight="700"
                      >
                        {result.score}/{result.totalQuestions}
                      </Badge>
                    </Flex>
                    <Box w="full" h="4px" bg="gray.100" borderRadius="full">
                      <Box
                        h="full"
                        w={`${result.percentage}%`}
                        bg={result.percentage >= 60 ? "#1a6b3c" : "#f87171"}
                        borderRadius="full"
                      />
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Box>
          ) : (
            <Box
              bg="white"
              borderRadius="16px"
              p="6"
              border="1px solid"
              borderColor="gray.100"
              textAlign="center"
            >
              <Text fontSize="32px" mb="2">
                📚
              </Text>
              <Text
                fontFamily="heading"
                fontWeight="700"
                fontSize="15px"
                mb="1"
              >
                No sessions yet
              </Text>
              <Text fontSize="13px" color="gray.400">
                Start practicing to see your results here.
              </Text>
            </Box>
          )}

          {/* Subject overview */}
          {subjectSummary.length > 0 && (
            <Box>
              <Text
                fontFamily="heading"
                fontWeight="700"
                fontSize="11px"
                letterSpacing="1.5px"
                textTransform="uppercase"
                color="gray.400"
                mb="4"
              >
                Subject overview
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
                {subjectSummary.map((r) => (
                  <Box
                    key={r.id}
                    bg="white"
                    borderRadius="16px"
                    p="4"
                    border="1px solid"
                    borderColor="gray.100"
                    cursor="pointer"
                    textAlign="center"
                    onClick={() => navigate("/subjects")}
                    _hover={{
                      borderColor: "brand.200",
                      transform: "translateY(-2px)",
                    }}
                    transition="all 0.2s"
                  >
                    <Text fontSize="24px" mb="2">
                      {SUBJECT_ICONS[r.subjectName] ?? "📚"}
                    </Text>
                    <Text
                      fontWeight="600"
                      fontSize="12px"
                      color="gray.600"
                      mb="1"
                    >
                      {r.subjectName.split(" ")[0]}
                    </Text>
                    <Text
                      fontFamily="heading"
                      fontWeight="800"
                      fontSize="16px"
                      color={r.percentage >= 60 ? "brand.600" : "red.400"}
                    >
                      {r.percentage}%
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Exam countdown */}
          <Box bg="brand.600" borderRadius="20px" p="5" textAlign="center">
            <Text
              fontSize="12px"
              fontWeight="600"
              letterSpacing="1px"
              textTransform="uppercase"
              color="rgba(255,255,255,0.6)"
              mb="1"
            >
              P6 National Exam
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="800"
              fontSize="36px"
              color="white"
              letterSpacing="-1px"
            >
              {daysUntilExam} days left
            </Text>
            <Text fontSize="13px" color="rgba(255,255,255,0.65)" mt="1">
              July 5, 2026
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
