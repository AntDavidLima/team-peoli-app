import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Image } from "react-native";
import { ImageBackground } from "react-native";

interface LoginForm {
  email: string;
  password: string;
}

interface CurrentUser {
  authToken: string;
  id: number;
  name: string;
  lastPasswordChange: null | Date;
  email: string;
  phone: string;
  profilePhotoUrl: string;
}

interface APIAuthenticateResponse {
  auth_token: string;
}

interface AuthenticationContext {
  login: (loginForm: LoginForm) => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  currentUser: null | CurrentUser;
  changedOriginalPassword: boolean;
  updateMe: (currentUser: Pick<CurrentUser, "authToken">) => Promise<void>;
	isLoggingIn: boolean;
}

const AuthenticationContext = createContext<AuthenticationContext>({
  login: async () => {},
  isAuthenticated: true,
  logout: async () => {},
  currentUser: null,
  changedOriginalPassword: false,
  updateMe: async () => {},
	isLoggingIn: false,
});

export function useAuthentication() {
  return useContext(AuthenticationContext);
}

export function AuthenticationProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [gettingTokenFromStorage, setGettingTokenFromStorage] = useState(true);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAuthenticated = !!currentUser;

  useEffect(() => {
    (async () => {
      const authToken = await storage.getItem("auth_token");

      if (authToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

        updateMe({ authToken });
      }

      setGettingTokenFromStorage(false);
    })();
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{
        login,
        isAuthenticated,
        logout,
        currentUser,
        changedOriginalPassword: Boolean(currentUser?.lastPasswordChange),
        updateMe,
				isLoggingIn,
      }}
    >
      {gettingTokenFromStorage ? (
        <ImageBackground
          source={require("@/assets/images/login-background.jpg")}
          className="absolute left-0 right-0 h-screen flex items-center justify-center"
          blurRadius={6}
        >
          <Image source={require("@/assets/images/logo.png")} />
        </ImageBackground>
      ) : (
        children
      )}
    </AuthenticationContext.Provider>
  );

  async function login({ email, password }: LoginForm) {
		setIsLoggingIn(true);

    const { data } = await api.post<APIAuthenticateResponse>(
      "/authentication",
      {
        email,
        password,
      }
    );

    await storage.setItem("auth_token", data.auth_token);

    api.defaults.headers.common["Authorization"] = `Bearer ${data.auth_token}`;

    await updateMe({ authToken: data.auth_token });

		setIsLoggingIn(false);
  }

  async function updateMe({ authToken }: Pick<CurrentUser, "authToken">) {
    const me = await fetchMe();

    setCurrentUser({
      authToken,
      id: me.id,
      name: me.name,
      lastPasswordChange: me.lastPasswordChange,
      email: me.email,
      phone: me.phone,
      profilePhotoUrl: me.profilePhotoUrl,
    });
  }

  async function logout() {
    await storage.deleteItem("auth_token");

    setCurrentUser(null);
  }

  async function fetchMe() {
    const { data } = await api.get<Omit<CurrentUser, "authToken">>("/me");

    return data;
  }
}
