# 🍞 react-native-bread

Drop-in toast notifications for React Native. Clean Sonner like API, buttery 60fps animations, swipe-to-dismiss, and fully customizable.

```tsx
toast.success('Saved!');  // That's it. No hooks, no context.
```



https://github.com/user-attachments/assets/8a862dba-422c-4573-9f12-0a36cf6efe49



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

Add `<BreadLoaf />` to your root layout and you're good to go:

```tsx
import { BreadLoaf } from 'react-native-bread';

export default function App() {
  return (
    <>
      <YourApp />
      <BreadLoaf />
    </>
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

Instead of a description string, you can pass an options object as the second argument:

```tsx
toast.success('Saved!', {
  description: 'Your changes have been saved',
  duration: 5000,
  icon: <CustomIcon />,
});
```

| Option | Type | Description |
|--------|------|-------------|
| `description` | `string` | Toast description text |
| `duration` | `number` | Display time in ms |
| `icon` | `ReactNode \| (props) => ReactNode` | Custom icon component |
| `style` | `ViewStyle` | Toast container style overrides |
| `titleStyle` | `TextStyle` | Title text style overrides |
| `descriptionStyle` | `TextStyle` | Description text style overrides |
| `dismissible` | `boolean` | Enable/disable swipe to dismiss |
| `showCloseButton` | `boolean` | Show/hide the X button |

### BreadLoaf Config

Customize all toasts globally via the `config` prop:

```tsx
<BreadLoaf config={{ position: 'bottom', stacking: false }} />
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `'top' \| 'bottom'` | `'top'` | Where toasts appear |
| `offset` | `number` | `0` | Extra spacing from screen edge (px) |
| `stacking` | `boolean` | `true` | Show multiple toasts stacked |
| `maxStack` | `number` | `3` | Max visible toasts when stacking |
| `dismissible` | `boolean` | `true` | Allow swipe to dismiss |
| `showCloseButton` | `boolean` | `true` | Show X button (except loading toasts) |
| `defaultDuration` | `number` | `4000` | Default display time (ms) |
| `colors` | `object` | — | Colors per toast type (see below) |
| `icons` | `object` | — | Custom icons per toast type |
| `toastStyle` | `ViewStyle` | — | Global toast container styles |
| `titleStyle` | `TextStyle` | — | Global title text styles |
| `descriptionStyle` | `TextStyle` | — | Global description text styles |

#### Colors

Each toast type (`success`, `error`, `info`, `loading`) accepts:

| Property | Description |
|----------|-------------|
| `accent` | Icon and title color |
| `background` | Toast background color |

```tsx
colors: {
  success: { accent: '#22c55e', background: '#f0fdf4' },
  error: { accent: '#ef4444', background: '#fef2f2' },
}
```

## Known Limitations

### Toasts Behind Modals

When you trigger a toast while opening a native modal (or transparent modal), the toast may appear **behind** the modal. This happens because React Native modals are mounted natively on top of everything.

**Workaround**: Use a "contained" modal approach — render your modal content inside your regular component tree with absolute positioning, rather than using React Native's `<Modal>` component. This way toasts will appear on top as expected.
