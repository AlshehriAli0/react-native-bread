import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type CustomContentProps, toast } from "react-native-bread";

const CustomToastContent = ({ dismiss }: CustomContentProps) => (
  <View style={customStyles.container}>
    <Image source={{ uri: "https://avatars.githubusercontent.com/u/62209850" }} style={customStyles.avatar} />
    <View style={customStyles.textContainer}>
      <Text style={customStyles.name}>Ali</Text>
      <Text style={customStyles.message}>Hey! Check out this custom toast</Text>
    </View>
    <TouchableOpacity style={customStyles.button} onPress={dismiss}>
      <Text style={customStyles.buttonText}>Reply</Text>
    </TouchableOpacity>
  </View>
);

const customStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  message: {
    fontSize: 13,
    color: "#6b7280",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

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
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              toast.success("Custom Icon", {
                description: "With an emoji icon",
                icon: <Text style={{ fontSize: 24 }}>🎉</Text>,
              })
            }
          >
            <Text style={styles.buttonText}>Custom Icon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              toast.info("Pill Shape", {
                style: { borderRadius: 50 },
              })
            }
          >
            <Text style={styles.buttonText}>Custom Style</Text>
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              toast.success("No X button", {
                showCloseButton: false,
              })
            }
          >
            <Text style={styles.buttonText}>No Close Button</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#8b5cf6" }]}
            onPress={() =>
              toast.custom(CustomToastContent, {
                duration: 5000,
              })
            }
          >
            <Text style={styles.buttonText}>Custom Content</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ec4899" }]}
            onPress={() =>
              toast.custom(
                ({ dismiss }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "#fce7f3",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>🎉</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>Achievement Unlocked!</Text>
                      <Text style={{ fontSize: 13, color: "#6b7280" }}>You created a custom toast</Text>
                    </View>
                    <TouchableOpacity
                      onPress={dismiss}
                      style={{
                        backgroundColor: "#ec4899",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Nice!</Text>
                    </TouchableOpacity>
                  </View>
                ),
                { style: { backgroundColor: "#fff" } }
              )
            }
          >
            <Text style={styles.buttonText}>Inline Custom</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()} hitSlop={20}>
          <Text style={styles.navText}>← Back to Default</Text>
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
