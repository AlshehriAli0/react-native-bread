import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";

export default function DefaultScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🍞 Default Toasts</Text>
        <Text style={styles.subtitle}>Basic toast types with default styling</Text>
      </View>

      <View style={styles.section}>
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
      </View>

      <View style={styles.navButtons}>
        <Pressable style={styles.navButton} onPress={() => router.push("/(custom)")} hitSlop={20}>
          <Text style={styles.navText}>Per-Toast Options →</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => router.push("/(global)")} hitSlop={20}>
          <Text style={styles.navText}>Global Config →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
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
  navButtons: {
    marginTop: 24,
    gap: 12,
  },
  navButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  navText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "500",
  },
});
