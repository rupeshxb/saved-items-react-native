import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* The Home Screen */}
      <Stack.Screen name="index" options={{ title: "Home" }} />
      
      {/* Auth Screens */}
      <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Register", headerShown: false }} />
      
      {/* Modal for adding items */}
      <Stack.Screen name="add" options={{ presentation: 'modal', title: 'Add Item' }} />
      
      {/* Dynamic Item Details */}
      <Stack.Screen name="item/[id]" options={{ title: "Item Details" }} />
    </Stack>
  );
}