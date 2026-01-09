import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { BreadLoaf, toast } from "react-native-bread";

type Position = "top" | "bottom";

export default function GlobalConfigScreen() {
  const router = useRouter();

  const [position, setPosition] = useState<Position>("top");
  const [stacking, setStacking] = useState(true);
  const [maxStack, setMaxStack] = useState(3);
  const [dismissible, setDismissible] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [customStyle, setCustomStyle] = useState(true);

  const showToast = () => {
    toast.success("Hello!", "This toast uses the global config");
  };

  const showMultiple = () => {
    toast.success("First toast", "This is toast #1");
    setTimeout(() => toast.info("Second toast", "This is toast #2"), 300);
    setTimeout(() => toast.error("Third toast", "This is toast #3"), 600);
  };

  return (
    <>
      <BreadLoaf
        config={{
          position,
          stacking,
          maxStack,
          dismissible,
          showCloseButton,
          offset: 8,
          defaultDuration: 4000,
          ...(customStyle && {
            toastStyle: {
              borderRadius: 30,
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderWidth: 2,
              borderColor: "#e5e7eb",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            },
            titleStyle: {
              fontSize: 15,
              fontWeight: "700",
              letterSpacing: 0.3,
            },
            descriptionStyle: {
              fontSize: 13,
              fontStyle: "italic",
            },
          }),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Global Config</Text>
          <Text style={styles.subtitle}>Configure BreadLoaf provider options</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position</Text>
          <View style={styles.segmented}>
            <Pressable
              style={[styles.segment, position === "top" && styles.segmentActive]}
              onPress={() => setPosition("top")}
            >
              <Text style={[styles.segmentText, position === "top" && styles.segmentTextActive]}>Top</Text>
            </Pressable>
            <Pressable
              style={[styles.segment, position === "bottom" && styles.segmentActive]}
              onPress={() => setPosition("bottom")}
            >
              <Text style={[styles.segmentText, position === "bottom" && styles.segmentTextActive]}>Bottom</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>

          <View style={styles.option}>
            <View>
              <Text style={styles.optionLabel}>Stacking</Text>
              <Text style={styles.optionDesc}>Show multiple toasts at once</Text>
            </View>
            <Switch value={stacking} onValueChange={setStacking} />
          </View>

          <View style={styles.option}>
            <View>
              <Text style={styles.optionLabel}>Max Stack</Text>
              <Text style={styles.optionDesc}>Maximum visible toasts</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepperButton, maxStack <= 1 && styles.stepperButtonDisabled]}
                onPress={() => setMaxStack(Math.max(1, maxStack - 1))}
                disabled={maxStack <= 1}
              >
                <Text style={[styles.stepperButtonText, maxStack <= 1 && styles.stepperButtonTextDisabled]}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{maxStack}</Text>
              <Pressable
                style={[styles.stepperButton, maxStack >= 10 && styles.stepperButtonDisabled]}
                onPress={() => setMaxStack(Math.min(10, maxStack + 1))}
                disabled={maxStack >= 10}
              >
                <Text style={[styles.stepperButtonText, maxStack >= 10 && styles.stepperButtonTextDisabled]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.option}>
            <View>
              <Text style={styles.optionLabel}>Dismissible</Text>
              <Text style={styles.optionDesc}>Swipe to dismiss toasts</Text>
            </View>
            <Switch value={dismissible} onValueChange={setDismissible} />
          </View>

          <View style={styles.option}>
            <View>
              <Text style={styles.optionLabel}>Show Close Button</Text>
              <Text style={styles.optionDesc}>Display X button on toasts</Text>
            </View>
            <Switch value={showCloseButton} onValueChange={setShowCloseButton} />
          </View>

          <View style={styles.option}>
            <View>
              <Text style={styles.optionLabel}>Custom Styling</Text>
              <Text style={styles.optionDesc}>Pill shape, shadow, custom fonts</Text>
            </View>
            <Switch value={customStyle} onValueChange={setCustomStyle} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test It</Text>
          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={showToast}>
              <Text style={styles.buttonText}>Show Toast</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonSecondary]} onPress={showMultiple}>
              <Text style={styles.buttonText}>Show 3 Toasts</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.navButtons}>
          <Pressable style={styles.navButton} onPress={() => router.back()} hitSlop={20}>
            <Text style={styles.navText}>← Back to Default</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
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
  segmented: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#fff",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  segmentTextActive: {
    color: "#111827",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  optionDesc: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  stepperButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  stepperButtonTextDisabled: {
    color: "#9ca3af",
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    minWidth: 24,
    textAlign: "center",
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
  buttonSecondary: {
    backgroundColor: "#8b5cf6",
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
