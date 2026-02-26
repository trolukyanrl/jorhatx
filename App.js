import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const root = document.getElementById('root');
    const previous = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlOverscroll: document.documentElement.style.overscrollBehavior,
      htmlHeight: document.documentElement.style.height,
      bodyOverflow: document.body.style.overflow,
      bodyOverscroll: document.body.style.overscrollBehavior,
      bodyHeight: document.body.style.height,
      bodyMinHeight: document.body.style.minHeight,
      rootOverflow: root?.style.overflow,
      rootOverscroll: root?.style.overscrollBehavior,
      rootHeight: root?.style.height,
      rootMinHeight: root?.style.minHeight,
    };

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.height = '100%';
    document.body.style.minHeight = '100%';
    if (root) {
      root.style.overflow = 'hidden';
      root.style.overscrollBehavior = 'none';
      root.style.height = '100%';
      root.style.minHeight = '100%';
    }

    return () => {
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.documentElement.style.overscrollBehavior = previous.htmlOverscroll;
      document.documentElement.style.height = previous.htmlHeight;
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.overscrollBehavior = previous.bodyOverscroll;
      document.body.style.height = previous.bodyHeight;
      document.body.style.minHeight = previous.bodyMinHeight;
      if (root) {
        root.style.overflow = previous.rootOverflow || '';
        root.style.overscrollBehavior = previous.rootOverscroll || '';
        root.style.height = previous.rootHeight || '';
        root.style.minHeight = previous.rootMinHeight || '';
      }
    };
  }, []);

  return (
    <View style={styles.appRoot}>
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? {
          height: '100%',
          overflow: 'hidden',
        }
      : null),
  },
});
