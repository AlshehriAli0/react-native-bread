import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";

export default function CustomScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Custom Config</Text>
      <Text style={styles.subtitle}>Bottom position, no stacking, custom colors</Text>

      <View style={styles.configBox}>
        <Text style={styles.configTitle}>Config Applied:</Text>
        <Text style={styles.configText}>• position: "bottom"</Text>
        <Text style={styles.configText}>• stacking: false</Text>
        <Text style={styles.configText}>• offset: 10</Text>
        <Text style={styles.configText}>• defaultDuration: 3000</Text>
        <Text style={styles.configText}>• Custom accent & background colors</Text>
        <Text style={styles.configText}>• borderRadius: 12 with border</Text>
      </View>

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
          onPress={() => toast.info("Info", "Swipe down to dismiss")}
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
            setTimeout(() => toast.info("Toast 2", "Replaces previous!"), 300);
            setTimeout(() => toast.error("Toast 3", "Replaces again!"), 600);
          }}
        >
          <Text style={styles.buttonText}>Try Stacking (disabled)</Text>
        </Pressable>
      </View>

      <Link href="/(default)" asChild>
        <Pressable style={styles.navButton}>
          <Text style={styles.navButtonText}>← Back to Default</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 20,
    color: "#6b7280",
  },
  configBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  configTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  configText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
    fontFamily: "monospace",
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
    backgroundColor: "#059669",
  },
  errorButton: {
    backgroundColor: "#dc2626",
  },
  infoButton: {
    backgroundColor: "#2563eb",
  },
  promiseButton: {
    backgroundColor: "#7c3aed",
  },
  stackButton: {
    backgroundColor: "#d97706",
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
