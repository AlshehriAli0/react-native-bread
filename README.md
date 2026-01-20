# React Native Bread 🍞

An extremely lightweight, opinionated toast component for React Native.

![demo](https://github.com/user-attachments/assets/860d9d19-66f4-4fc6-a992-2d161e2e8bad)

## Features

- **Extremely lightweight** package, only 14KB packed size
- Clean, imperative API inspired by [Sonner](https://sonner.emilkowal.ski/)
- Zero setup - add one component, start toasting. No hooks, no providers
- Built for mobile with smooth 60fps animations powered by Reanimated
- Natural swipe gestures that feel native to the platform
- Multiple toast types: `success`, `error`, `info`, and `promise`
- Promise handling with automatic loading → success/error states
- Complex animations and gestures but with high performance
- Toast stacking with configurable limits
- Position toasts at top or bottom of screen
- **RTL built-in support** - perfect for Arabic and other RTL languages
- Completely customizable - colors, icons, styles, animations
- Full Expo compatibility
- Imperative API works anywhere - components, utilities, event handlers



## Installation

```sh
bun add react-native-bread
```

#### Peer Dependencies

This package requires the following peer dependencies:

| Package | Version |
|---------|---------|
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started) | >= 4.2.0 |
| [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/) | >= 2.25.0 |
| [react-native-safe-area-context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/) | >= 5.0.0 |
| [react-native-svg](https://github.com/software-mansion/react-native-svg) | >= 15.8.0 |
| [react-native-worklets](https://github.com/margelo/react-native-worklets-core) | >= 0.7.0 |

If you don't have these installed, you can install all peer dependencies at once:

```sh
bun add react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg react-native-worklets
```

Or with npm:

```sh
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg react-native-worklets
```

> **Note**: `react-native-reanimated` 4.2.x requires `react-native-worklets` 0.7.x. Using older versions of worklets with reanimated 4.2+ will cause compatibility issues.


## Usage

### In your App.tsx/entry point

```tsx
import { BreadLoaf } from 'react-native-bread';

function App() {
  return (
    <View>
      <NavigationContainer>...</NavigationContainer>
      <BreadLoaf />
    </View>
  );
}
```

### Expo Router

When using Expo Router, place the `BreadLoaf` component in your root layout file (`app/_layout.tsx`):

```tsx
import { BreadLoaf } from 'react-native-bread';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <BreadLoaf />
    </>
  );
}
```

This ensures the toasts will be displayed across all screens in your app.

### Show a toast

```tsx
import { toast } from 'react-native-bread';

// Basic usage
toast.success('Saved!');

// With description
toast.success('Saved!', 'Your changes have been saved');
toast.error('Error', 'Something went wrong');
toast.info('Tip', 'Swipe to dismiss');

// Promise toast - shows loading, then success/error
toast.promise(fetchData(), {
  loading: { title: 'Loading...', description: 'Please wait' },
  success: { title: 'Done!', description: 'Data loaded' },
  error: (err) => ({ title: 'Failed', description: err.message }),
});
```

## Customization

### Per-Toast Options

Pass an options object as the second argument to customize individual toasts:

```tsx
toast.success('Saved!', {
  description: 'Your changes have been saved',
  duration: 5000,
  icon: <CustomIcon />,
  style: { backgroundColor: '#fff' },
  dismissible: true,
  showCloseButton: true,
});
```

### Global Configuration

Customize all toasts globally via the `config` prop on `<BreadLoaf />`:

```tsx
<BreadLoaf
  config={{
    position: 'bottom',
    rtl: false, // Enable for RTL languages
    stacking: true,
    maxStack: 3,
    defaultDuration: 4000,
    colors: {
      success: { accent: '#22c55e', background: '#f0fdf4' },
      error: { accent: '#ef4444', background: '#fef2f2' },
    }
  }}
/>
```

Available options include:
- **position**: `'top' | 'bottom'` - Where toasts appear
- **offset**: Extra spacing from screen edge
- **stacking**: Show multiple toasts stacked
- **maxStack**: Max visible toasts when stacking
- **dismissible**: Allow swipe to dismiss
- **showCloseButton**: Show X button
- **defaultDuration**: Default display time in ms
- **colors**: Custom colors per toast type
- **icons**: Custom icons per toast type
- **toastStyle**, **titleStyle**, **descriptionStyle**: Global style overrides

## API Reference

| Method | Description |
|--------|-------------|
| `toast.success(title, description?)` | Show success toast |
| `toast.error(title, description?)` | Show error toast |
| `toast.info(title, description?)` | Show info toast |
| `toast.promise(promise, messages)` | Show loading → success/error toast |
| `toast.dismiss(id)` | Dismiss a specific toast |
| `toast.dismissAll()` | Dismiss all toasts |

## Known Issues

**Modal Pages**: Toasts may render behind React Native's `screenOptions={{ presentation: "modal" }}`  since they are mounted at the native layer above the whole app.

**Solution**: Use `screenOptions={{ presentation: "containedModal" }}`, or add another `<BreadLoaf>` inside the modal page.

