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
  id: number;
  name: string;
}

interface APIAuthenticateResponse {
  auth_token: string;
}

interface AuthenticationContext {
  login: (loginForm: LoginForm) => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  currentUser: null | CurrentUser;
}

const AuthenticationContext = createContext<AuthenticationContext>({
  login: async () => {},
  isAuthenticated: false,
  logout: async () => {},
  currentUser: null,
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
        api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

        const me = await fetchMe();

        setCurrentUser({ authToken, id: me.id, name: me.name });
      }
    })();
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{
        login,
        isAuthenticated,
        logout,
        currentUser,
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

    api.defaults.headers.common["Authorization"] = `Bearer ${data.auth_token}`;

    const me = await fetchMe();

    setCurrentUser({ authToken: data.auth_token, id: me.id, name: me.name });
  }

  async function logout() {
    await deleteItemAsync("auth_token");

    setCurrentUser(null);
  }

  async function fetchMe() {
    const { data } = await api.get<Omit<CurrentUser, "authToken">>("/me");

    return data;
  }
}
