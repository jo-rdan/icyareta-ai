import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    // 1. Move colors and fonts into "tokens"
    tokens: {
      fonts: {
        heading: { value: `'Syne', sans-serif` },
        body: { value: `'DM Sans', sans-serif` },
      },
      colors: {
        brand: {
          50: { value: "#e8f5ee" },
          100: { value: "#c5e8d3" },
          200: { value: "#9dd9b6" },
          300: { value: "#72ca97" },
          400: { value: "#4ebe7e" },
          500: { value: "#2d9e5f" },
          600: { value: "#1a6b3c" },
          700: { value: "#145530" },
          800: { value: "#0e3f23" },
          900: { value: "#072a16" },
        },
        paper: { value: "#f5f3ee" },
        ink: { value: "#0a0a0f" },
      },
    },
    // 2. Component styles are now "recipes"
    recipes: {
      button: {
        base: {
          fontFamily: "heading", // References the token defined above
          fontWeight: "700",
          borderRadius: "16px",
          letterSpacing: "-0.3px",
          transition: "all 0.2s",
        },
        variants: {
          variant: {
            solid: {
              bg: "brand.600",
              color: "white",
              _hover: {
                bg: "brand.700",
                transform: "translateY(-1px)",
                boxShadow: "0 8px 24px rgba(26,107,60,0.3)",
              },
              _active: { bg: "brand.800", transform: "translateY(0)" },
            },
            outline: {
              border: "1px solid",
              borderColor: "brand.600",
              color: "brand.600",
              _hover: { bg: "brand.50" },
            },
            ghost: {
              color: "brand.600",
              _hover: { bg: "brand.50" },
            },
          },
        },
      },
    },
  },
  // 3. Global styles moved to "globalCss"
  globalCss: {
    "html, body": {
      bg: "paper",
      color: "ink",
      fontFamily: "body",
    },
  },
});

// Create the system by merging your config with the default
export const system = createSystem(defaultConfig, config);
export default system;
