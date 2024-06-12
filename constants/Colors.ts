import customColors from "@/tailwind.colors";
import tailwindColors from "tailwindcss/colors";

const tintColorLight = "#2f95dc";

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: tailwindColors.white,
    background: customColors.background,
    tint: tailwindColors.white,
    tabIconDefault: tailwindColors.white,
    tabIconSelected: tailwindColors.white,
  },
};
