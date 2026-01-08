import { Pressable, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const handlePromiseToast = () => {
    const fakeApiCall = new Promise<{ message: string }>((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail for demo purposes
        if (Math.random() > 0.5) {
          resolve({ message: "Data loaded!" });
        } else {
          reject(new Error("Network error"));
        }
      }, 2000);
    });

    toast.promise(fakeApiCall, {
      loading: { title: "Loading...", description: "Fetching data from server" },
      success: { title: "Success!", description: "Data loaded successfully" },
      error: err => ({ title: "Error", description: err.message }),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>🍞 Toast Demo</Text>
      <Text style={styles.subtitle}>Tap a button to show a toast</Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={[styles.button, styles.successButton]}
          onPress={() => toast.success("Operation completed!", "Your changes have been saved")}
        >
          <Text style={styles.buttonText}>Success Toast</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.errorButton]}
          onPress={() => toast.error("Something went wrong!", "Please try again later")}
        >
          <Text style={styles.buttonText}>Error Toast</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.infoButton]}
          onPress={() => toast.info("Did you know?", "Swipe up to dismiss this toast")}
        >
          <Text style={styles.buttonText}>Info Toast</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.promiseButton]} onPress={handlePromiseToast}>
          <Text style={styles.buttonText}>Promise Toast (Loading → Result)</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.stackButton]}
          onPress={() => {
            toast.success("Toast 1", "First toast");
            setTimeout(() => toast.info("Toast 2", "Second toast"), 300);
            setTimeout(() => toast.error("Toast 3", "Third toast"), 600);
          }}
        >
          <Text style={styles.buttonText}>Stack 3 Toasts</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#6b7280",
  },
  buttonsContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successButton: {
    backgroundColor: "#10b981",
  },
  errorButton: {
    backgroundColor: "#ef4444",
  },
  infoButton: {
    backgroundColor: "#3b82f6",
  },
  promiseButton: {
    backgroundColor: "#8b5cf6",
  },
  stackButton: {
    backgroundColor: "#f59e0b",
  },
});
