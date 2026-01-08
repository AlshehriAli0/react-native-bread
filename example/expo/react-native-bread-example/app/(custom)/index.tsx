import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";

export default function CustomScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Per-Toast Options</Text>
        <Text style={styles.subtitle}>Customize individual toast appearance</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customizations</Text>
        <View style={styles.buttons}>
          <Pressable
            style={styles.button}
            onPress={() =>
              toast.success("Custom Icon", {
                description: "With an emoji icon",
                icon: <Text style={{ fontSize: 24 }}>🎉</Text>,
              })
            }
          >
            <Text style={styles.buttonText}>Custom Icon</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() =>
              toast.info("Pill Shape", {
                style: { borderRadius: 50 },
              })
            }
          >
            <Text style={styles.buttonText}>Custom Style</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() =>
              toast.error("Stuck!", {
                description: "Wait 3s or tap X",
                dismissible: false,
                duration: 3000,
              })
            }
          >
            <Text style={styles.buttonText}>Non-dismissible</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() =>
              toast.success("No X button", {
                showCloseButton: false,
              })
            }
          >
            <Text style={styles.buttonText}>No Close Button</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.navButtons}>
        <Pressable style={styles.navButton} onPress={() => router.back()} hitSlop={20}>
          <Text style={styles.navText}>← Back to Default</Text>
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
    backgroundColor: "#3b82f6",
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
