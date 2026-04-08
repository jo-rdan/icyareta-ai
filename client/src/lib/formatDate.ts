export const formatLocalizedDate = (
  date: Date | string,
  locale: "en" | "fr" | string,
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    options,
  ).format(dateObj);
};
