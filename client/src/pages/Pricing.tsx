import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  List,
  IconButton,
  Dialog,
  Portal,
  Spinner,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import { LuCheck, LuStar, LuZap } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import api from "@/lib/axios";
import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";
import { useTranslation } from "react-i18next";
import { capitalize } from "@/lib/capitalize";

type PlanKey = "day_pass" | "week_pass";

interface Plan {
  key: PlanKey;
  label: string;
  price: number;
  period: string;
  badge: string | null;
  badgeColor: string;
  subline: string;
  icon: React.ReactNode;
}

// Switch between "momo" and "dpo" by setting VITE_PAYMENT_PROVIDER in your .env
const PAYMENT_PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || "momo";
const IS_TEST_MODE = import.meta.env.VITE_MOMO_TEST_MODE === "true";

export default function Pricing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();

  const [selected, setSelected] = useState<PlanKey>("week_pass");
  const [phone, setPhone] = useState(
    user?.phoneNumber && user.phoneNumber !== user.email
      ? user.phoneNumber.replace("+250", "")
      : "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  // Handle DPO return redirect — user comes back from DPO payment page
  // URL will have ?payment=success&token=xxx or ?payment=failed
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const transToken = searchParams.get("token");

    if (paymentStatus === "success" && transToken) {
      setIsLoading(true);
      api
        .post("/payment/dpo/verify", { transToken, accessType: selected })
        .then(({ data }) => {
          if (data.status === "SUCCESSFUL") {
            updateUser({ accessStatus: "active" });
            navigate("/app/subjects");
          } else {
            setError("Payment could not be confirmed. Contact support.");
          }
        })
        .catch(() => setError("Payment verification failed. Contact support."))
        .finally(() => setIsLoading(false));
    } else if (paymentStatus === "failed") {
      setError("Payment was cancelled or failed. Please try again.");
    }
  }, [navigate, searchParams, selected, updateUser]);

  const PLANS: Plan[] = [
    {
      key: "day_pass",
      label: t("pricing.plans.day.label"),
      price: 800,
      period: t("pricing.plans.day.period"),
      badge: null,
      badgeColor: "",
      subline: t("pricing.plans.day.subline"),
      icon: <LuZap size={16} />,
    },
    {
      key: "week_pass",
      label: t("pricing.plans.week.label"),
      price: 3999,
      period: t("pricing.plans.week.period"),
      badge: t("pricing.plans.week.badge"),
      badgeColor: "#f59e0b",
      subline: t("pricing.plans.week.subline"),
      icon: <LuStar size={16} />,
    },
  ];

  const activePlan = PLANS.find((p) => p.key === selected)!;

  const FEATURES = [
    t("pricing.features.f1"),
    t("pricing.features.f2"),
    t("pricing.features.f3"),
    t("pricing.features.f4"),
    t("pricing.features.f5"),
    t("pricing.features.f6"),
    t("pricing.features.f7"),
  ];

  // ── MoMo payment flow ──────────────────────────────────────────────────────
  const handleMomoPay = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (!IS_TEST_MODE && digits.length < 9) {
      setError("Enter your 9-digit MTN number to receive the MoMo prompt");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (!IS_TEST_MODE) {
        const fullPhone = `+250${digits.slice(-9)}`;
        if (!user.phoneNumber || user.phoneNumber === user.email) {
          await api.patch("/user/phone", { phoneNumber: fullPhone });
        }
      }

      const { data } = await api.post("/payment/initiate", {
        accessType: selected,
      });
      setShowModal(true);
      await pollMomoStatus(data.referenceId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Payment initiation failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const pollMomoStatus = async (referenceId: string) => {
    const MAX = 12;
    let attempts = 0;

    const check = async (): Promise<void> => {
      attempts++;
      try {
        const { data } = await api.post("/payment/verify", {
          referenceId,
          accessType: selected,
        });
        if (data.status === "SUCCESSFUL") {
          setShowModal(false);
          setIsLoading(false);
          updateUser({ accessStatus: "active" });
          navigate("/app/subjects");
          return;
        }
        if (data.status === "FAILED") {
          setShowModal(false);
          setIsLoading(false);
          setError("Payment was declined. Please try again.");
          return;
        }
      } catch {
        // keep polling
      }
      if (attempts < MAX) {
        await new Promise((r) => setTimeout(r, 10000));
        return check();
      }
      setShowModal(false);
      setIsLoading(false);
      setError("Payment timed out. If MoMo was debited, contact support.");
    };

    await new Promise((r) => setTimeout(r, 5000));
    return check();
  };

  // ── DPO payment flow ───────────────────────────────────────────────────────
  const handleDpoPay = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/payment/dpo/initiate", {
        accessType: selected,
      });
      // Redirect user to DPO's hosted payment page
      window.location.href = data.paymentUrl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Payment initiation failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handlePay = PAYMENT_PROVIDER === "dpo" ? handleDpoPay : handleMomoPay;

  return (
    <Box minH="100vh" bg="paper" pb="20">
      {/* Header */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        px="6"
        py="4"
      >
        <Flex
          maxW="container.sm"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Flex align="center" gap="3">
            <IconButton
              aria-label="Back"
              variant="ghost"
              size="sm"
              borderRadius="10px"
              color="bg.panel"
              onClick={() => navigate(-1)}
            >
              <Text fontSize="18px">←</Text>
            </IconButton>
            <Text fontFamily="heading" fontWeight="800" fontSize="16px">
              {t("pricing.choosePlan")}
            </Text>
          </Flex>
          <LanguageSelection />
        </Flex>
      </Box>

      <Container maxW="container.sm" px="6" py="8">
        <VStack gap="7" align="stretch">
          {/* Hook */}
          <VStack align="flex-start" gap="1">
            <Heading
              fontFamily="heading"
              fontSize={{ base: "26px", md: "30px" }}
              fontWeight="800"
              letterSpacing="-1px"
            >
              {t("pricing.investInChild")}
            </Heading>
            <Text color="gray.500" fontSize="14px" lineHeight="1.6">
              {t("pricing.whyPay")}
            </Text>
          </VStack>

          {/* Plan selector */}
          <VStack gap="3" align="stretch">
            {PLANS.map((plan) => {
              const isActive = selected === plan.key;
              return (
                <Box
                  key={plan.key}
                  onClick={() => setSelected(plan.key)}
                  cursor="pointer"
                  bg={isActive ? "#e8f5ee" : "white"}
                  border="2px solid"
                  borderColor={isActive ? "#1a6b3c" : "gray.150"}
                  borderRadius="18px"
                  p="4"
                  position="relative"
                  transition="all 0.15s"
                  _hover={{ borderColor: isActive ? "#1a6b3c" : "gray.300" }}
                >
                  {plan.badge && (
                    <Box
                      position="absolute"
                      top="-11px"
                      right="16px"
                      bg={plan.badgeColor}
                      px="3"
                      py="1"
                      borderRadius="full"
                    >
                      <Text
                        fontSize="10px"
                        fontWeight="700"
                        color="white"
                        letterSpacing="0.5px"
                      >
                        {plan.badge.toUpperCase()}
                      </Text>
                    </Box>
                  )}

                  <Flex align="center" justify="space-between">
                    <VStack align="flex-start" gap="0">
                      <Text
                        fontFamily="heading"
                        fontWeight="800"
                        fontSize="15px"
                        color={isActive ? "#1a6b3c" : "gray.800"}
                      >
                        {plan.label}
                      </Text>
                      <Text fontSize="12px" color="gray.400" mt="1px">
                        {plan.subline}
                      </Text>
                    </VStack>
                    <VStack align="flex-end" gap="0" flexShrink={0} ml="4">
                      <Text
                        fontFamily="heading"
                        fontWeight="800"
                        fontSize="18px"
                        color={isActive ? "#1a6b3c" : "gray.800"}
                      >
                        {plan.price.toLocaleString()} RWF
                      </Text>
                      <Text fontSize="11px" color="gray.400">
                        {t("common.per")} {plan.period}
                      </Text>
                    </VStack>
                  </Flex>

                  {plan.key === "week_pass" && (
                    <Box
                      mt="3"
                      bg="amber.50"
                      borderRadius="8px"
                      px="3"
                      py="1.5"
                    >
                      <Text fontSize="11px" color="amber.700" fontWeight="600">
                        💰 {t("pricing.cheaperDayPass")}
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </VStack>

          {/* Features */}
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
              {t("pricing.plansInclude")}
            </Text>
            <List.Root as="ul" gap="3" listStyle="none">
              {FEATURES.map((f) => (
                <List.Item
                  key={f}
                  display="flex"
                  alignItems="flex-start"
                  gap="3"
                >
                  <Box
                    minW="20px"
                    h="20px"
                    mt="1px"
                    bg="#e8f5ee"
                    borderRadius="6px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <LuCheck size={10} color="#1a6b3c" />
                  </Box>
                  <Text
                    fontSize="13px"
                    color="gray.700"
                    fontWeight="500"
                    lineHeight="1.5"
                  >
                    {f}
                  </Text>
                </List.Item>
              ))}
            </List.Root>
          </Box>

          {/* Payment input — MoMo only, hidden for DPO and test mode */}
          {PAYMENT_PROVIDER === "momo" &&
            (IS_TEST_MODE ? (
              <Box
                bg="orange.50"
                border="1px solid"
                borderColor="orange.100"
                borderRadius="16px"
                px="4"
                py="3"
              >
                <Text fontSize="13px" color="orange.700" fontWeight="500">
                  🧪 Sandbox mode — payment will auto-approve in ~30 seconds. No
                  real money moved.
                </Text>
              </Box>
            ) : (
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
                  {t("pricing.yourMomoNumber")}
                </Text>
                <InputGroup
                  startAddon="🇷🇼 +250"
                  color={"gray.600"}
                  startAddonProps={{
                    bg: "gray.50",
                    px: 2,
                    borderColor: "gray.200",
                  }}
                >
                  <Input
                    px={2}
                    placeholder="7XX XXX XXX"
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    type="tel"
                    border="1.5px solid"
                    borderColor="gray.200"
                    bg="white"
                    _focus={{
                      borderColor: "#1a6b3c",
                      boxShadow: "none",
                      bg: "white",
                    }}
                  />
                </InputGroup>
                <Text fontSize="12px" color="gray.400" mt="2">
                  {t("pricing.momoPrompt")}
                </Text>
              </Box>
            ))}

          {PAYMENT_PROVIDER === "dpo" && (
            <Box
              bg="blue.50"
              border="1px solid"
              borderColor="blue.100"
              borderRadius="16px"
              px="4"
              py="3"
            >
              <Text fontSize="13px" color="blue.700" fontWeight="500">
                💳 {t("pricing.dpo.info")}.
              </Text>
            </Box>
          )}

          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="12px"
              px="4"
              py="3"
            >
              <Text fontSize="13px" color="red.600">
                {error}
              </Text>
            </Box>
          )}

          <Button
            size="lg"
            w="full"
            h="60px"
            fontSize="16px"
            bg="#1a6b3c"
            color="white"
            _hover={{ bg: "#145530" }}
            loading={isLoading}
            onClick={handlePay}
          >
            {capitalize(t("common.get"))} {activePlan.label} —{" "}
            {activePlan.price.toLocaleString()} RWF
          </Button>

          <Text textAlign="center" fontSize="12px" color="gray.400">
            {t("pricing.securePayment")}
          </Text>
        </VStack>
      </Container>

      {/* MoMo waiting modal */}
      {PAYMENT_PROVIDER === "momo" && (
        <Dialog.Root
          open={showModal}
          onOpenChange={() => {}}
          placement="center"
          closeOnInteractOutside={false}
        >
          <Portal>
            <Dialog.Backdrop backdropFilter="blur(4px)" />
            <Dialog.Positioner>
              <Dialog.Content borderRadius="24px" mx="6" p="2" bg={"white"}>
                <Dialog.Body py="8" px="6" textAlign="center">
                  <VStack gap="4">
                    <Spinner
                      borderWidth="3px"
                      animationDuration="0.8s"
                      color="brand.600"
                      width="48px"
                      height="48px"
                    />
                    <Heading
                      fontFamily="heading"
                      fontSize="20px"
                      fontWeight="800"
                      letterSpacing="-0.5px"
                    >
                      {t("pricing.approvePrompt")}
                    </Heading>
                    <Text fontSize="14px" color="gray.500" lineHeight="1.6">
                      {t("pricing.momoPaymentOf")}{" "}
                      <strong>{activePlan.price.toLocaleString()} RWF</strong>{" "}
                      {t("pricing.hasBeenSent")} {activePlan.label}{" "}
                      {t("common.instantly")}.
                    </Text>
                    <Box
                      bg="#e8f5ee"
                      borderRadius="12px"
                      px="4"
                      py="3"
                      w="full"
                    >
                      <Text fontSize="12px" color="#1a6b3c" fontWeight="600">
                        📱 {t("pricing.waitingConfirmation")}...
                      </Text>
                    </Box>
                  </VStack>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
}
