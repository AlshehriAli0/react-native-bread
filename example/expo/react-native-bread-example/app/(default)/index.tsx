import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";

export default function DefaultScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍞 react-native-bread</Text>
        <Text style={styles.subtitle}>Beautiful, customizable toast notifications for React Native</Text>
        <View style={styles.features}>
          <Text style={styles.feature}>✨ Smooth animations</Text>
          <Text style={styles.feature}>🎨 Fully customizable</Text>
          <Text style={styles.feature}>👆 Swipe to dismiss</Text>
          <Text style={styles.feature}>⏳ Promise support</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Try it out</Text>
      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, { backgroundColor: "#10b981" }]}
          onPress={() => toast.success("Success!", "Your changes have been saved")}
        >
          <Text style={styles.buttonText}>Success</Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: "#ef4444" }]}
          onPress={() => toast.error("Error!", "Something went wrong")}
        >
          <Text style={styles.buttonText}>Error</Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: "#3b82f6" }]}
          onPress={() => toast.info("Info", "Swipe up to dismiss")}
        >
          <Text style={styles.buttonText}>Info</Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: "#8b5cf6" }]}
          onPress={() => {
            const fakeApi = new Promise((resolve, reject) =>
              setTimeout(() => (Math.random() > 0.5 ? resolve("done") : reject(new Error("Failed"))), 2000)
            );
            toast.promise(fakeApi, {
              loading: { title: "Loading...", description: "Please wait while we save your data" },
              success: { title: "Done!", description: "Your data has been saved successfully" },
              error: e => ({ title: "Error!", description: e.message }),
            });
          }}
        >
          <Text style={styles.buttonText}>Promise</Text>
        </Pressable>
      </View>

      <Pressable style={styles.navButton} onPress={() => router.push("/(custom)")} hitSlop={20}>
        <Text style={styles.navText}>Per-Toast Options →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  feature: {
    fontSize: 13,
    color: "#374151",
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  navButton: {
    marginTop: 40,
    alignItems: "center",
  },
  navText: {
    color: "#6b7280",
    fontSize: 16,
  },
});
