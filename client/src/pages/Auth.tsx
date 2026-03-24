import { useState } from "react";
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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/useAuth";

type Step = "email" | "otp";

export default function Auth() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      );
      if (!res.ok) throw new Error("Failed to send OTP");
      setStep("otp");
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 4) {
      setError("Enter the full 4-digit code");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), code);
      navigate("/subjects");
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 3) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKey = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <Box minH="100vh" bg="paper" display="flex" alignItems="center">
      <Container maxW="440px" px="6" py="12">
        <Flex mb="8" align="center" gap="3">
          <IconButton
            aria-label="Back"
            variant="ghost"
            size="sm"
            borderRadius="10px"
            onClick={() => (step === "otp" ? setStep("email") : navigate("/"))}
          >
            <ArrowLeft size={16} />
          </IconButton>
          <Text fontFamily="heading" fontWeight="700" fontSize="14px">
            {step === "email" ? "Sign in" : "Verify code"}
          </Text>
        </Flex>

        <Box mb="8">
          <Heading
            fontFamily="heading"
            fontWeight="800"
            fontSize="32px"
            letterSpacing="-1px"
            mb="2"
          >
            {step === "email" ? "Enter your email" : "Check your email"}
          </Heading>
          <Text color="gray.500" fontSize="14px" lineHeight="1.6">
            {step === "email"
              ? "We'll send a 4-digit code to verify your account."
              : `We sent a code to ${email}. It expires in 5 minutes.`}
          </Text>
        </Box>

        {error && (
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
              {error}
            </Text>
          </Box>
        )}

        {step === "email" ? (
          <VStack gap="4" align="stretch">
            <Input
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              fontSize="16px"
              h="52px"
              border="1.5px solid"
              borderColor="gray.200"
              borderRadius="14px"
              bg="white"
              _focus={{
                boxShadow: "none",
                borderColor: "brand.600",
                bg: "white",
              }}
            />
            <Button
              size="lg"
              w="full"
              h="56px"
              fontSize="16px"
              colorPalette="brand"
              loading={isLoading}
              disabled={!email.includes("@")}
              onClick={sendOtp}
            >
              Send Verification Code
            </Button>
          </VStack>
        ) : (
          <VStack gap="4" align="stretch">
            <Flex justify="center" gap="3">
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  id={`otp-${i}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  maxLength={1}
                  textAlign="center"
                  w="64px"
                  h="64px"
                  fontSize="24px"
                  fontFamily="heading"
                  fontWeight="800"
                  borderRadius="14px"
                  border="1.5px solid"
                  borderColor="gray.200"
                  bg="white"
                  _focus={{
                    borderColor: "brand.600",
                    boxShadow: "0 0 0 3px rgba(26,107,60,0.1)",
                    bg: "white",
                  }}
                />
              ))}
            </Flex>
            <Button
              size="lg"
              w="full"
              h="56px"
              fontSize="16px"
              colorPalette="brand"
              loading={isLoading}
              disabled={otp.join("").length < 4}
              onClick={verifyOtp}
            >
              Verify & Continue
            </Button>
            <Text textAlign="center" fontSize="13px" color="gray.400">
              Didn't receive it?{" "}
              <Box
                as="span"
                color="brand.600"
                fontWeight="600"
                cursor="pointer"
                onClick={() => {
                  setOtp(["", "", "", ""]);
                  sendOtp();
                }}
              >
                Resend code
              </Box>
            </Text>
          </VStack>
        )}
      </Container>
    </Box>
  );
}
