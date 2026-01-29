import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toast } from "react-native-bread";

export default function ModalScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🪟 Modal Screen</Text>
        <Text style={styles.subtitle}>Testing toasts in a modal presentation</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>✅ Toast Above Modals</Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>iOS:</Text> Use <Text style={styles.code}>{"nativeModal: true"}</Text> in your
          BreadLoaf config.
          {"\n\n"}
          <Text style={styles.bold}>Android:</Text> Add <Text style={styles.code}>{"<ToastPortal />"}</Text> inside
          modal layouts.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Try it out</Text>
        <Text style={styles.description}>Toasts appear above this modal using the platform-specific solution.</Text>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#10b981" }]}
            onPress={() => toast.success("Success!", "Toast is visible in the modal")}
          >
            <Text style={styles.buttonText}>Success Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ef4444" }]}
            onPress={() => toast.error("Error!", "This appears above the modal")}
          >
            <Text style={styles.buttonText}>Error Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#3b82f6" }]}
            onPress={() => toast.info("Info", "Modal toasts work perfectly!")}
          >
            <Text style={styles.buttonText}>Info Toast</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} hitSlop={20}>
          <Text style={styles.closeText}>← Close Modal</Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  infoBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#78350f",
    lineHeight: 20,
  },
  code: {
    fontFamily: "Courier",
    backgroundColor: "#fde68a",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  bold: {
    fontWeight: "600",
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 20,
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
  },
  closeButton: {
    backgroundColor: "#374151",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
});
