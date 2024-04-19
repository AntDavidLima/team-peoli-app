import { api } from "@/lib/api";
import { getItemAsync, setItemAsync, deleteItemAsync } from "expo-secure-store";
import {
	PropsWithChildren,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

interface LoginForm {
	email: string;
	password: string;
}

interface CurrentUser {
	authToken: string;
}

interface APIAuthenticateResponse {
	auth_token: string;
}

interface AuthenticationContext {
	login: (loginForm: LoginForm) => Promise<void>;
	isAuthenticated: boolean;
	logout: () => Promise<void>;
}

const AuthenticationContext = createContext<AuthenticationContext>({
	login: async () => { },
	isAuthenticated: false,
	logout: async () => { },
});

export function useAuthentication() {
	return useContext(AuthenticationContext);
}

export function AuthenticationProvider({ children }: PropsWithChildren) {
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

	const isAuthenticated = !!currentUser;

	useEffect(() => {
		(async () => {
			const authToken = await getItemAsync("auth_token");

			if (authToken) {
				setCurrentUser({ authToken });

				api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
			}
		})();
	}, []);

	return (
		<AuthenticationContext.Provider
			value={{
				login,
				isAuthenticated,
				logout,
			}}
		>
			{children}
		</AuthenticationContext.Provider>
	);

	async function login({ email, password }: LoginForm) {
		const { data } = await api.post<APIAuthenticateResponse>(
			"/authentication",
			{
				email,
				password,
			},
		);

		await setItemAsync("auth_token", data.auth_token);

		setCurrentUser({ authToken: data.auth_token });
	}

	async function logout() {
		await deleteItemAsync("auth_token");

		setCurrentUser(null);
	}
}
