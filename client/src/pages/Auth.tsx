/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Input,
  IconButton,
  HStack,
  Separator,
  Field,
  PinInput,
  Link,
  Dialog,
  Portal,
  Center,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { LEGAL_TEXT } from "@/legat";
import { parseMarkdown } from "@/lib/parser";
import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";

type Step = "email" | "otp" | "childName";

export default function Auth() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [childName, setChildName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalEssentials, setModalEssentials] = useState({
    open: false,
    title: "",
    content: "",
  });
  const { login, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.childName) {
      navigate("/app/subjects");
    }
  }, [user?.childName, navigate]);
  const sendOtp = async () => {
    if (!email.includes("@")) {
      setError(t("errors.auth.enterValidEmail"));
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/request-otp", {
        email: email.trim().toLowerCase(),
      });
      setStep("otp");
    } catch {
      setError(t("errors.auth.couldNotSendCode"));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 4) {
      setError(t("errors.auth.enterValidCode"));
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      // Try to log in without child name first to check if they're a new user
      await login(email.trim().toLowerCase(), code);
      // If childName is not set, ask for it
      if (!user?.childName) {
        setStep("childName");
        setIsLoading(false);
        return;
      }
    } catch {
      setError(t("errors.auth.invalidExpiredCode"));
    } finally {
      setIsLoading(false);
    }
  };

  const saveChildName = async () => {
    if (!childName.trim()) {
      setError(t("errors.auth.enterChildName"));
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await api.put("/user/child-name", { childName: childName.trim() });
      // Update local user state
      navigate("/subjects");
    } catch {
      setError(t("errors.auth.couldNotSaveName"));
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === "email") {
      navigate(-1);
    } else {
      setStep("email");
      setOtp(["", "", "", ""]);
    }
  };

  const handleGoogleSignin = () => {
    try {
      googleLogin();
      // If childName is not set, ask for it
      if (!user?.childName) {
        setStep("childName");
        setIsLoading(false);
        return;
      }
      // navigate("/subjects");
    } catch {
      setError(t("errors.auth.errorGoogleLogin"));
    }
  };

  const handleLegalModal = (title: "PRIVACY_POLICY" | "TERMS_CONDITIONS") => {
    setModalEssentials((prev) => ({
      ...prev,
      open: true,
      title,
      content: LEGAL_TEXT[title],
    }));
  };

  return (
    <Center minH="100vh" bg="paper" display="flex" alignItems="center">
      <Container maxW="440px" px="6" py="12">
        <Flex mb="8" align="center" justify="space-between">
          <HStack>
            <IconButton
              aria-label="Back"
              variant="ghost"
              size="sm"
              borderRadius="10px"
              onClick={goBack}
              color={"bg.panel"}
            >
              <ArrowLeft size={16} />
            </IconButton>
            <Text fontFamily="heading" fontWeight="700" fontSize="14px">
              {step === "email"
                ? t("auth.signin")
                : step === "otp"
                  ? t("auth.verifyCode")
                  : t("auth.childName")}
            </Text>
          </HStack>
          <Box>
            <LanguageSelection />
          </Box>
        </Flex>

        {/* ── Email step ── */}
        {step === "email" && (
          <>
            <Box mb="8">
              <Heading
                fontFamily="heading"
                fontWeight="800"
                fontSize="32px"
                letterSpacing="-1px"
                mb="2"
              >
                {t("auth.enterEmail")}
              </Heading>
              <Text color="gray.500" fontSize="14px" lineHeight="1.6">
                {t("auth.sendCodeText")}
              </Text>
            </Box>
            {error && <ErrorBox message={error} />}
            <VStack gap="4" align="stretch">
              <Field.Root required colorPalette={"green"}>
                <Field.Label>
                  Email <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  placeholder="Enter your email"
                  variant="outline"
                  borderColor={"fg.muted"}
                  px={5}
                  onChange={(e) => setEmail(e.target.value)}
                  bg={"white"}
                  type="email"
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                />
                <Field.HelperText>{t("auth.neverShareEmail")}</Field.HelperText>
              </Field.Root>
              <Button
                size="lg"
                w="full"
                h="56px"
                fontSize="16px"
                bg="#1a6b3c"
                color="white"
                _hover={{ bg: "#145530" }}
                loading={isLoading}
                disabled={!email.includes("@")}
                onClick={sendOtp}
              >
                {t("auth.sendVerificationCode")}
              </Button>
              <HStack>
                <Separator flex="1" size={"xs"} />
                <Text flexShrink="0">{t("common.or")}</Text>
                <Separator flex="1" size={"xs"} />
              </HStack>
              <Button onClick={handleGoogleSignin}>
                <FcGoogle />
                {t("auth.signinWithGoogle")}
              </Button>
              <Text textStyle={"xs"} color={"fg.subtle"}>
                {t("legal.byContinuing")}{" "}
                <Link
                  variant="plain"
                  color="#1a6b3c"
                  fontWeight={"bold"}
                  onClick={() => handleLegalModal("TERMS_CONDITIONS")}
                >
                  {t("legal.terms")}
                </Link>{" "}
                {t("common.and")}{" "}
                <Link
                  variant="plain"
                  color="#1a6b3c"
                  fontWeight={"bold"}
                  onClick={() => handleLegalModal("PRIVACY_POLICY")}
                >
                  {t("legal.privacy")}
                </Link>{" "}
              </Text>
            </VStack>
          </>
        )}

        {/* ── OTP step ── */}
        {step === "otp" && (
          <>
            <Box mb="8">
              <Heading
                fontFamily="heading"
                fontWeight="800"
                fontSize="32px"
                letterSpacing="-1px"
                mb="2"
              >
                {t("auth.checkEmail")}
              </Heading>
              <Text color="gray.500" fontSize="14px" lineHeight="1.6">
                {t("auth.sentCodeToEmail", { email })}
              </Text>
            </Box>
            {error && <ErrorBox message={error} />}
            <VStack gap="4" align="stretch">
              <Flex justify="center" gap="3">
                <PinInput.Root
                  size={"lg"}
                  colorPalette={"green"}
                  onValueComplete={(details) => setOtp(details.value)}
                  autoFocus
                  mask
                >
                  <PinInput.HiddenInput />
                  <PinInput.Control>
                    {otp.map((_digit, index) => (
                      <PinInput.Input
                        index={index}
                        bg={"white"}
                        borderColor={"fg.muted"}
                        key={index}
                      />
                    ))}
                  </PinInput.Control>
                </PinInput.Root>
              </Flex>
              <Button
                size="lg"
                w="full"
                h="56px"
                fontSize="16px"
                bg="#1a6b3c"
                color="white"
                _hover={{ bg: "#145530" }}
                loading={isLoading}
                disabled={otp.join("").length < 4}
                onClick={verifyOtp}
              >
                {t("auth.verifyOtp.verifyContinue")}
              </Button>
              <Text textAlign="center" fontSize="13px" color="gray.400">
                {t("auth.verifyOtp.didNotReceive")}{" "}
                <Box
                  as="span"
                  color="#1a6b3c"
                  fontWeight="600"
                  cursor="pointer"
                  onClick={() => {
                    setOtp(["", "", "", ""]);
                    sendOtp();
                  }}
                >
                  {t("auth.verifyOtp.resendCode")}
                </Box>
              </Text>
            </VStack>
          </>
        )}

        {/* ── Child name step (first signup only) ── */}
        {step === "childName" && (
          <>
            <Box mb="8">
              <Text fontSize="40px" mb="3">
                👧
              </Text>
              <Heading
                fontFamily="heading"
                fontWeight="800"
                fontSize="30px"
                letterSpacing="-1px"
                mb="2"
              >
                {t("auth.child.who")}
              </Heading>
              <Text color="gray.500" fontSize="14px" lineHeight="1.6">
                {t("auth.child.enterChildNameText")}
              </Text>
            </Box>
            {error && <ErrorBox message={error} />}
            <VStack gap="4" align="stretch">
              <Input
                placeholder="e.g. Amara, David, Nadia..."
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                fontSize="16px"
                h="52px"
                border="1.5px solid"
                borderColor="gray.200"
                borderRadius="14px"
                bg="white"
                _focus={{
                  boxShadow: "none",
                  borderColor: "#1a6b3c",
                  bg: "white",
                }}
                onKeyDown={(e) => e.key === "Enter" && saveChildName()}
              />
              <Button
                size="lg"
                w="full"
                h="56px"
                fontSize="16px"
                bg="#1a6b3c"
                color="white"
                _hover={{ bg: "#145530" }}
                loading={isLoading}
                disabled={!childName.trim()}
                onClick={saveChildName}
              >
                {t("common.continue")} →
              </Button>
            </VStack>
          </>
        )}
      </Container>
      <LegalModal
        {...modalEssentials}
        onOpenChange={() =>
          setModalEssentials((prev) => ({ ...prev, open: false }))
        }
      />
    </Center>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
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
        {message}
      </Text>
    </Box>
  );
}

const LegalModal = ({
  title,
  content,
  open,
  onOpenChange,
}: {
  title: string;
  content: string;
  open: boolean;
  onOpenChange: () => void;
}) => {
  const htmlContent = parseMarkdown(content);
  return (
    <Dialog.Root
      size="xs"
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="white" p={5} borderRadius="xl">
            <Dialog.Header borderBottomWidth="1px" pb={3}>
              <Dialog.Title fontSize="2xl" fontWeight="bold" color="green.800">
                {title.replace("_", " ")}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body mt={4}>
              <Box
                maxH="60vh"
                overflowY="auto"
                px={2}
                fontSize="md"
                color="gray.700"
                lineHeight="1.6"
                // CUSTOM CSS TO STYLE THE TAGS CREATED BY OUR REGEX
                css={{
                  "& h1": {
                    fontSize: "2xl",
                    fontWeight: "bold",
                    mb: 4,
                    color: "green.700",
                  },
                  "& h3": {
                    fontSize: "lg",
                    fontWeight: "bold",
                    mt: 6,
                    mb: 2,
                    color: "gray.800",
                  },
                  "& b": { fontWeight: "bold", color: "black" },
                  "& blockquote": {
                    borderLeft: "4px solid #2F855A",
                    pl: 4,
                    my: 4,
                    fontStyle: "italic",
                    bg: "gray.50",
                    py: 2,
                  },
                  "& hr": { my: 6, borderColor: "gray.200" },
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </Dialog.Body>

            <Dialog.Footer borderTopWidth="1px" pt={4}>
              <Button width="full" colorPalette="green" onClick={onOpenChange}>
                I Understand & Accept
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
