import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { toast } from "react-native-bread";

export default function CustomScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Per-Toast Options</Text>

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

      <Pressable style={styles.navButton} onPress={() => router.back()} hitSlop={20}>
        <Text style={styles.navText}>← Back</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
    color: "#111827",
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
  navButton: {
    marginTop: 40,
    alignItems: "center",
  },
  navText: {
    color: "#6b7280",
    fontSize: 16,
  },
});
