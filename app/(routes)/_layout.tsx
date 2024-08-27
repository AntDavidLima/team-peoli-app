import tailwindColors from "tailwindcss/colors";
import { Stack } from "expo-router";

export default function RoutesLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="login"
				options={{
					headerShown: false,
					contentStyle: { backgroundColor: tailwindColors.black },
					statusBarTranslucent: true,
				}}
			/>
			<Stack.Screen
				name="change-password"
				options={{
					headerShown: false,
					statusBarTranslucent: true,
				}}
			/>
			<Stack.Screen
				name="(authenticated)"
				options={{
					headerShown: false,
					contentStyle: { paddingTop: 8 },
				}}
			/>
		</Stack>
	);
}
