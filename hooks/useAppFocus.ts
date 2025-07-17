import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export const useAppFocus = (onFocus: () => void) => {
	const appState = useRef(AppState.currentState);
	useEffect(() => {
		let subscription: { remove: () => void; };

		if (Platform.OS === 'web') {
			window.addEventListener('focus', onFocus);
		} else {
			subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === "active"
				) {
					onFocus();
				}
				appState.current = nextAppState;
			});
		}

		return () => {
			if (Platform.OS === 'web') {
				window.removeEventListener('focus', onFocus);
			} else {
				subscription?.remove();
			}
		};
	}, [onFocus]);
};