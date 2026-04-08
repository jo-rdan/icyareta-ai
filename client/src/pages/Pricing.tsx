import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  List,
  IconButton,
  Dialog,
  Portal,
  Spinner,
  Input,
} from "@chakra-ui/react";
import { LuCheck, LuStar, LuZap } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import api from "@/lib/axios";
import { LanguageSelection } from "@/components/lang/languageSelect/LanguageSelection";
import { useTranslation } from "react-i18next";
import { capitalize } from "@/lib/capitalize";

type PlanKey = "day_pass" | "week_pass" | "month_pass";

interface Plan {
  key: PlanKey;
  label: string;
  price: number;
  period: string;
  badge: string | null;
  badgeColor: string;
  headline: string;
  subline: string;
  icon: React.ReactNode;
  popular: boolean;
}

export default function Pricing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const PLANS: Plan[] = [
    {
      key: "day_pass",
      label: t("pricing.plans.day.label"),
      price: 800,
      period: t("pricing.plans.day.period"),
      badge: null,
      badgeColor: "",
      headline: t("pricing.plans.day.headline"),
      subline: t("pricing.plans.day.subline"),
      icon: <LuZap size={16} />,
      popular: false,
    },
    {
      key: "week_pass",
      label: t("pricing.plans.week.label"),
      price: 3999,
      period: t("pricing.plans.week.period"),
      badge: t("pricing.plans.week.badge"),
      badgeColor: "#f59e0b",
      headline: t("pricing.plans.week.headline"),
      subline: t("pricing.plans.week.subline"),
      icon: <LuStar size={16} />,
      popular: true,
    },
    // {
    //   key: "month_pass",
    //   label: "Month Pass",
    //   price: 9000,
    //   period: "month",
    //   badge: "Save 63%",
    //   badgeColor: "#1a6b3c",
    //   headline: "Full season coverage",
    //   subline:
    //     "30 days at just 300 RWF/day. The smartest investment before July.",
    //   icon: <LuStar size={16} />,
    //   popular: false,
    // },
  ];

  const activePlan = PLANS.find((p) => p.key === selected)!;

  const handlePay = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Enter your 9-digit MTN number to receive the MoMo prompt");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const fullPhone = `+250${digits.slice(-9)}`;

      if (!user.phoneNumber || user.phoneNumber === user.email) {
        await api.patch("/api/user/phone", { phoneNumber: fullPhone });
      }

      const { data } = await api.post("/api/payment/initiate", {
        accessType: selected,
      });

      setShowModal(true);
      await pollPaymentStatus(data.referenceId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Payment initiation failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (referenceId: string) => {
    const MAX = 12;
    let attempts = 0;

    const check = async (): Promise<void> => {
      attempts++;
      try {
        const { data } = await api.post("/api/payment/verify", {
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
        // Network blip — keep polling
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

  const FEATURES = [
    t("pricing.features.f1"),
    t("pricing.features.f2"),
    t("pricing.features.f3"),
    t("pricing.features.f4"),
    t("pricing.features.f5"),
    t("pricing.features.f6"),
    t("pricing.features.f7"),
  ];

  return (
    <Box minH="100vh" bg="paper">
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
          justifyContent={"space-between"}
          alignItems={"baseline"}
        >
          <Flex align="center" gap="3">
            <IconButton
              aria-label="Back"
              variant="ghost"
              size="sm"
              borderRadius="10px"
              onClick={() => navigate("/app/subjects")}
              color={"bg.panel"}
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
                  {/* Popular / Save badge */}
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
                      <HStack gap="2">
                        <Text
                          fontFamily="heading"
                          fontWeight="800"
                          fontSize="15px"
                          color={isActive ? "#1a6b3c" : "gray.800"}
                        >
                          {plan.label}
                        </Text>
                      </HStack>
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

                  {/* Per-day breakdown for multi-day plans */}
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
                  {/* {plan.key === "month_pass" && (
                    <Box mt="3" bg="#e8f5ee" borderRadius="8px" px="3" py="1.5">
                      <Text fontSize="11px" color="#1a6b3c" fontWeight="600">
                        🏆 Only 300 RWF/day — your best value before July exams
                      </Text>
                    </Box>
                  )} */}
                </Box>
              );
            })}
          </VStack>

          {/* What's included */}
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

          {/* Parent trust signal */}
          {/* <Box
            bg="white"
            border="1px solid"
            borderColor="gray.100"
            borderRadius="16px"
            p="4"
          >
            <Text
              fontSize="13px"
              color="gray.600"
              lineHeight="1.7"
              fontStyle="italic"
            >
              {t("pricing.testimony")}
            </Text>
            <Text fontSize="12px" color="gray.400" fontWeight="600" mt="2">
              — {t("pricing.witness")}
            </Text>
          </Box> */}

          {/* MoMo number input */}
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
            <Flex gap="3" align="center">
              <Box
                bg="gray.50"
                border="1.5px solid"
                borderColor="gray.200"
                borderRadius="12px"
                px="3"
                h="48px"
                display="flex"
                alignItems="center"
                fontSize="14px"
                fontWeight="600"
                color="gray.600"
                flexShrink={0}
              >
                🇷🇼 +250
              </Box>
              <Input
                placeholder="7XX XXX XXX"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                type="tel"
                h="48px"
                border="1.5px solid"
                borderColor="gray.200"
                borderRadius="12px"
                bg="white"
                fontSize="15px"
                _focus={{
                  borderColor: "#1a6b3c",
                  boxShadow: "none",
                  bg: "white",
                }}
              />
            </Flex>
            <Text fontSize="12px" color="gray.400" mt="2">
              {t("pricing.momoPrompt")}
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
            >
              <Text fontSize="13px" color="red.600">
                {error}
              </Text>
            </Box>
          )}

          {/* CTA */}
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
      <Dialog.Root
        open={showModal}
        onOpenChange={() => {}}
        placement="center"
        closeOnInteractOutside={false}
      >
        <Portal>
          <Dialog.Backdrop backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="24px" mx="6" p="2">
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
                  <Box bg="#e8f5ee" borderRadius="12px" px="4" py="3" w="full">
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
    </Box>
  );
}
