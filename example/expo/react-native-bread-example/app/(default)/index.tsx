import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";

export default function DefaultScreen() {
  const handlePromiseToast = () => {
    const fakeApiCall = new Promise<{ message: string }>((resolve, reject) => {
      setTimeout(() => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Default Config</Text>
      <Text style={styles.subtitle}>Top position, stacking enabled, default colors</Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={[styles.button, styles.successButton]}
          onPress={() => toast.success("Success!", "Your changes have been saved")}
        >
          <Text style={styles.buttonText}>Success Toast</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.errorButton]}
          onPress={() => toast.error("Error!", "Something went wrong")}
        >
          <Text style={styles.buttonText}>Error Toast</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.infoButton]}
          onPress={() => toast.info("Info", "Swipe up to dismiss")}
        >
          <Text style={styles.buttonText}>Info Toast</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.promiseButton]} onPress={handlePromiseToast}>
          <Text style={styles.buttonText}>Promise Toast</Text>
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

      <Link href="/(custom)" asChild>
        <Pressable style={styles.navButton}>
          <Text style={styles.navButtonText}>View Custom Config →</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    color: "#6b7280",
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
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
  navButton: {
    marginTop: 30,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    alignItems: "center",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
