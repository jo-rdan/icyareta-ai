"use client";

import {
  HStack,
  Portal,
  Select,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { SelectTrigger } from "./LanguageSelectTrigger";

export const LanguageSelection = () => {
  return (
    <Select.Root
      positioning={{ sameWidth: false }}
      collection={languages}
      size="sm"
      defaultValue={[localStorage.getItem("lang") ?? "en"]}
      maxW={"100px"}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <SelectTrigger />
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content minW="32">
            {languages.items.map((language) => (
              <Select.Item item={language} key={language.value}>
                <HStack gap={10}>
                  <Text color={"white"}>{language.icon}</Text>
                  <Text color={"white"}>{language.label}</Text>
                </HStack>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
};

const languages = createListCollection({
  items: [
    // { label: "RW", value: "rw", icon: "🇷🇼" },
    { label: "FR", value: "fr", icon: "🇫🇷" },
    { label: "EN", value: "en", icon: "🇺🇸" },
  ],
});
