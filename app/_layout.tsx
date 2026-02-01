import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* screenOptions={{ headerShown: false }} ensures that
         screens don't flash a default header before loading.
      */}
      
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      
      {/* Modal for adding items (Keep header visible for the title/close button) */}
      <Stack.Screen 
        name="add" 
        options={{ 
            presentation: 'modal', 
            headerShown: true, 
            title: 'Add New Item' 
        }} 
      />
      
      {/* Item Details (Keep header visible for "Back" button) */}
      <Stack.Screen 
        name="item/[id]" 
        options={{ 
            headerShown: true, 
            title: 'Item Details' 
        }} 
      />
    </Stack>
  );
}