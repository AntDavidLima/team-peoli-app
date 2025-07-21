import { useAuthentication } from "@/contexts/AuthenticationContext";
import { Redirect, Stack } from "expo-router";

export default function AuthenticatedLayout() {
	const { isAuthenticated, currentUser, changedOriginalPassword } = useAuthentication();

	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	if (!currentUser?.isActive) {
		return <Redirect href="/disabled" />;
	}

	if (!changedOriginalPassword) {
		return <Redirect href="/change-password" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		/>
	);
}
