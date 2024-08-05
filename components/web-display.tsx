import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";

export function WebDisplay({
  html,
  textColor,
}: {
  html: string;
  textColor: string;
}) {
  const { width: contentWidth } = useWindowDimensions();

  const baseStyle = useMemo(
    () => ({
      color: textColor,
    }),
    [textColor],
  );
  return (
    <RenderHTML
      contentWidth={contentWidth}
      source={{ html }}
      baseStyle={baseStyle}
    />
  );
}
