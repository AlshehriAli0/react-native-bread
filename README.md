# 🍞 react-native-bread

A toast library for React Native with smooth animations and gesture support.

Built with an **imperative API** — just call `toast.success()` from anywhere. No hooks, no context imports needed.

Under the hood it uses Reanimated worklets for buttery 60fps animations, and gesture handler for swipe-to-dismiss.

## Installation

```bash
bun add react-native-bread
# or any package manager
```

### Peer Dependencies

You'll need these installed and configured in your project:

```bash
bun add react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg react-native-worklets
```


## Quick Start

Wrap your app with `<BreadLoaf>` and you're good to go:

```tsx
import { BreadLoaf } from 'react-native-bread';

export default function App() {
  return (
    <BreadLoaf>
      <YourApp />
    </BreadLoaf>
  );
}
```

Then show toasts from anywhere:

```tsx
import { toast } from 'react-native-bread';

// Basic toasts
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

## API

### Toast Methods

| Method | Description |
|--------|-------------|
| `toast.success(title, description?)` | Green checkmark toast |
| `toast.error(title, description?)` | Red X toast |
| `toast.info(title, description?)` | Yellow info toast |
| `toast.promise(promise, messages)` | Loading → success/error toast |
| `toast.dismiss(id)` | Dismiss a specific toast |
| `toast.dismissAll()` | Dismiss all toasts |

### Per-Toast Options

Instead of a description string, you can pass an options object:

```tsx
toast.success('Saved!', {
  description: 'Your changes have been saved',
  duration: 5000,
  icon: <CustomIcon />,
  style: { borderRadius: 50 },
  dismissible: false,
  showCloseButton: false,
});
```

### BreadLoaf Config

Customize all toasts globally via the `config` prop:

```tsx
<BreadLoaf
  config={{
    position: 'bottom',        // 'top' | 'bottom'
    offset: 10,                // extra spacing from edge
    stacking: true,            // show multiple toasts
    maxStack: 3,               // max visible toasts
    dismissible: true,         // swipe to dismiss
    showCloseButton: true,     // show X button
    defaultDuration: 4000,     // display time in ms
    colors: {
      success: { accent: '#22c55e', background: '#f0fdf4' },
      error: { accent: '#ef4444', background: '#fef2f2' },
      info: { accent: '#eab308', background: '#fefce8' },
      loading: { accent: '#333', background: '#fff' },
    },
    toastStyle: { borderRadius: 12 },
    titleStyle: { fontSize: 15 },
    descriptionStyle: { fontSize: 13 },
  }}
>
  <App />
</BreadLoaf>
```

## Known Limitations

### Toasts Behind Modals

When you trigger a toast while opening a native modal (or transparent modal), the toast may appear **behind** the modal. This happens because React Native modals are mounted natively on top of everything.

**Workaround**: Use a "contained" modal approach — render your modal content inside your regular component tree with absolute positioning, rather than using React Native's `<Modal>` component. This way toasts will appear on top as expected.
