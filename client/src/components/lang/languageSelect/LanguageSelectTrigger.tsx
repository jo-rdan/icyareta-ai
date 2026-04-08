import { Icon, IconButton, Text, useSelectContext } from "@chakra-ui/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LuSpeech } from "react-icons/lu";

export const SelectTrigger = () => {
  const { i18n } = useTranslation();
  const { selectedItems, value, getTriggerProps } = useSelectContext();
  useEffect(() => {
    i18n.changeLanguage(value[0]);
    localStorage.setItem("lang", value[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <IconButton px="2" variant="ghost" size="sm" {...getTriggerProps()}>
      {selectedItems.length > 0 ? (
        <Text textStyle={"2xl"}>{selectedItems[0].icon}</Text>
      ) : (
        <Icon size={"lg"}>
          <LuSpeech />
        </Icon>
      )}
    </IconButton>
  );
};
