import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

export const storage = {
  async getItem(key: string) {
    return isWeb ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    return isWeb ? await AsyncStorage.setItem(key, value) : await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    return isWeb ? await AsyncStorage.removeItem(key) : await SecureStore.deleteItemAsync(key);
  },
};