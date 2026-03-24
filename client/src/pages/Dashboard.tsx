import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Progress,
  Button,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { MOCK_RESULTS, SUBJECTS } from "../data/mock";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const daysUntilExam = () => {
    const exam = new Date("2026-07-05");
    const today = new Date();
    return Math.max(
      0,
      Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    );
  };

  const avgScore = MOCK_RESULTS.length
    ? Math.round(
        MOCK_RESULTS.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) /
          MOCK_RESULTS.length,
      )
    : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-RW", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <Box minH="100vh" bg="paper">
      {/* ── Header ── */}
      <Box bgGradient="linear(160deg, #072a16, #1a6b3c)" pt={10} pb={8} px={6}>
        <Container maxW="container.md">
          <Flex justify="space-between" align="flex-start" mb={6}>
            <VStack align="flex-start" gap={0}>
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
                fontFamily="Syne, sans-serif"
                fontSize="26px"
                fontWeight="800"
                color="white"
                letterSpacing="-1px"
              >
                {user?.phoneNumber ?? "Student"}
              </Heading>
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              color="rgba(255,255,255,0.6)"
              _hover={{ color: "white", bg: "rgba(255,255,255,0.1)" }}
              borderRadius="10px"
              onClick={logout}
            >
              Sign out
            </Button>
          </Flex>

          {/* Stats */}
          <SimpleGrid columns={3} gap={3}>
            {[
              { num: `${daysUntilExam()}`, label: "Days to exam" },
              { num: `${MOCK_RESULTS.length}`, label: "Sessions done" },
              { num: `${avgScore}%`, label: "Avg score" },
            ].map((s) => (
              <Box
                key={s.label}
                bg="rgba(255,255,255,0.1)"
                border="1px solid rgba(255,255,255,0.15)"
                borderRadius="14px"
                p={3}
                textAlign="center"
              >
                <Text
                  fontFamily="Syne, sans-serif"
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

      <Container maxW="container.md" px={6} py={8}>
        <VStack gap={8} align="stretch">
          {/* ── Quick practice ── */}
          <Box>
            <Text
              fontFamily="Syne, sans-serif"
              fontWeight="700"
              fontSize="11px"
              letterSpacing="1.5px"
              textTransform="uppercase"
              color="gray.400"
              mb={4}
            >
              Practice now
            </Text>
            <Button
              w="full"
              size="lg"
              py={7}
              fontSize="15px"
              onClick={() => navigate("/subjects")}
            >
              Start a new session
            </Button>
          </Box>

          {/* ── Recent results ── */}
          {MOCK_RESULTS.length > 0 && (
            <Box>
              <Text
                fontFamily="Syne, sans-serif"
                fontWeight="700"
                fontSize="11px"
                letterSpacing="1.5px"
                textTransform="uppercase"
                color="gray.400"
                mb={4}
              >
                Recent sessions
              </Text>
              <VStack gap={3} align="stretch">
                {MOCK_RESULTS.map((result) => (
                  <Box
                    key={result.id}
                    bg="white"
                    borderRadius="16px"
                    p={4}
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Flex justify="space-between" align="flex-start" mb={3}>
                      <VStack align="flex-start" gap={0}>
                        <Text
                          fontFamily="Syne, sans-serif"
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
                        bg={
                          result.score / result.total >= 0.6
                            ? "brand.50"
                            : "red.50"
                        }
                        color={
                          result.score / result.total >= 0.6
                            ? "brand.600"
                            : "red.500"
                        }
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="12px"
                        fontWeight="700"
                      >
                        {result.score}/{result.total}
                      </Badge>
                    </Flex>

                    <Progress.Root
                      value={(result.score / result.total) * 100}
                      size="xs"
                      shape="rounded"
                      colorPalette={
                        result.score / result.total >= 0.6 ? "green" : "red"
                      }
                      mb={result.weakTopics.length > 0 ? 3 : 0}
                    >
                      <Progress.Track bg="gray.100">
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>

                    {result.weakTopics.length > 0 && (
                      <HStack gap={2} flexWrap="wrap">
                        <Text fontSize="11px" color="gray.400">
                          Weak:
                        </Text>
                        {result.weakTopics.map((t) => (
                          <Badge
                            key={t}
                            bg="red.50"
                            color="red.400"
                            px={2}
                            py="2px"
                            borderRadius="full"
                            fontSize="10px"
                          >
                            {t}
                          </Badge>
                        ))}
                      </HStack>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* ── Subject overview ── */}
          <Box>
            <Text
              fontFamily="Syne, sans-serif"
              fontWeight="700"
              fontSize="11px"
              letterSpacing="1.5px"
              textTransform="uppercase"
              color="gray.400"
              mb={4}
            >
              Subject overview
            </Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
              {SUBJECTS.map((s) => {
                const result = MOCK_RESULTS.find(
                  (r) => r.subjectName === s.name,
                );
                return (
                  <Box
                    key={s.id}
                    bg="white"
                    borderRadius="16px"
                    p={4}
                    border="1px solid"
                    borderColor="gray.100"
                    cursor="pointer"
                    onClick={() => navigate("/subjects")}
                    _hover={{
                      borderColor: "brand.200",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    }}
                    transition="all 0.2s"
                    textAlign="center"
                  >
                    <Text fontSize="24px" mb={2}>
                      {s.icon}
                    </Text>
                    <Text
                      fontWeight="600"
                      fontSize="12px"
                      color="gray.600"
                      mb={2}
                    >
                      {s.name.split(" ")[0]}
                    </Text>
                    {result ? (
                      <Text
                        fontFamily="Syne, sans-serif"
                        fontWeight="800"
                        fontSize="16px"
                        color={
                          result.score / result.total >= 0.6
                            ? "brand.600"
                            : "red.400"
                        }
                      >
                        {Math.round((result.score / result.total) * 100)}%
                      </Text>
                    ) : (
                      <Text fontSize="11px" color="gray.300" fontWeight="500">
                        Not started
                      </Text>
                    )}
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>

          {/* ── Exam countdown ── */}
          <Box bg="brand.600" borderRadius="20px" p={5} textAlign="center">
            <Text
              fontSize="12px"
              fontWeight="600"
              letterSpacing="1px"
              textTransform="uppercase"
              color="rgba(255,255,255,0.6)"
              mb={1}
            >
              P6 National Exam
            </Text>
            <Text
              fontFamily="Syne, sans-serif"
              fontWeight="800"
              fontSize="36px"
              color="white"
              letterSpacing="-1px"
            >
              {daysUntilExam()} days left
            </Text>
            <Text fontSize="13px" color="rgba(255,255,255,0.65)" mt={1}>
              Estimated exam date: July 5, 2026
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
