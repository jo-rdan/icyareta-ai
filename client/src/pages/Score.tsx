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
import { useQuiz } from "@/context/useQuiz";
import { useTranslation } from "react-i18next";
import { capitalize } from "@/lib/capitalize";
import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";
import { useRef } from "react";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function Score() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRedirecting = useRef(false);
  const { session, resetQuiz } = useQuiz();

  // Snapshot everything we need before any reset can null the session.
  // This is the fix for the bug where clicking "Get Day Pass" would call
  // resetQuiz(), null the session, trigger the guard below, and send the
  // user to /subjects instead of /pricing.
  const score = session?.score ?? null;
  const subjectName = session?.subjectName ?? "";
  const isTrial = session?.isTrial ?? false;
  const answers = session?.answers ?? [];

  if (!score) {
    const checkAndNavigate = () => {
      if (!isRedirecting.current) {
        navigate("/app/subjects");
      }
    };

    // We execute the check. Since this block returns null (unmounts),
    // the "render" of UI is finished, and we are just handling the exit.
    // eslint-disable-next-line react-hooks/refs
    checkAndNavigate();
    return null;
  }

  const handleNavigation = (path: string) => {
    // We update the ref IMMEDIATELY before the Service call
    isRedirecting.current = true;

    // Service: Clear the Model
    resetQuiz();

    // Controller: Move to new Route
    navigate(path);
  };

  const pct = score.percentage;
  const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "🎯" : "💪";
  const message =
    pct >= 80
      ? t("score.excellentWork")
      : pct >= 60
        ? t("score.goodEffort")
        : t("score.keepPractice");
  const headerBg =
    pct >= 60
      ? "linear-gradient(160deg, #072a16, #1a6b3c)"
      : "linear-gradient(160deg, #3d1a1a, #b83030)";

  const wrongAnswers = answers.filter((a) => !a.isCorrect);

  // Always navigate FIRST, then reset.
  // If we reset first, session becomes null, the guard fires, and the user
  // gets redirected to /subjects regardless of which button they pressed.

  return (
    <Box minH="100vh" bg="paper">
      {/* Score header */}
      <Box style={{ background: headerBg }} pt="12" pb="10" px="6">
        <Box>
          <LanguageSelection />
        </Box>
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
              {subjectName} •{" "}
              {isTrial ? t("common.freeTrial") : t("common.practice")}
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
              {message} — {pct}% {t("common.correct")}
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
              {t("score.scoreBreakdown")}
            </Text>
            <Flex justify="space-around">
              {[
                {
                  num: score.correct,
                  label: capitalize(t("common.correct")),
                  color: "#1a6b3c",
                },
                {
                  num: score.total - score.correct,
                  label: capitalize(t("common.wrong")),
                  color: "#f87171",
                },
                {
                  num: `${pct}%`,
                  label: capitalize(t("score.score")),
                  color: "#374151",
                },
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
                {wrongAnswers.length} {t("common.answer")}
                {wrongAnswers.length !== 1 ? "s" : ""} {t("score.toReview")}
              </Text>
              <VStack gap="2" align="stretch">
                {wrongAnswers.map((a, i) => (
                  <Box key={i} bg="red.50" borderRadius="10px" p="3">
                    <Flex gap="2" align="center" mb="1">
                      <Box bg="red.100" px="2" borderRadius="6px">
                        <Text fontSize="11px" fontWeight="700" color="red.600">
                          {t("common.you")}: {a.selectedOption}
                        </Text>
                      </Box>
                      <Box bg="green.100" px="2" borderRadius="6px">
                        <Text
                          fontSize="11px"
                          fontWeight="700"
                          color="green.700"
                        >
                          {capitalize(t("common.correct"))}: {a.correctOption}
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
                  {t("score.unlockExplanation")}
                </Text>
                <Text fontSize="12px" color="gray.500">
                  {t("score.seeWhyAnswer")}
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
                onClick={() => handleNavigation("/app/pricing")}
              >
                {t("common.fullAccess")}
              </Button>
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="15px"
                variant="outline"
                borderColor="gray.200"
                color="gray.600"
                onClick={() => handleNavigation("/app/subjects")}
              >
                {t("score.backSubjects")}
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
                onClick={() => handleNavigation("/app/subjects")}
              >
                {t("score.practiceSubject")}
              </Button>
              <Button
                w="full"
                size="lg"
                h="56px"
                fontSize="14px"
                variant="ghost"
                color="gray.500"
                onClick={() => handleNavigation("/app/dashboard")}
              >
                {t("score.viewProgress")}
              </Button>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
