import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = ({ style, children }) => (
  <View style={[styles.mapFallback, style]}>
    <Text style={styles.label}>Map is unavailable on web.</Text>
    {children}
  </View>
);

export const Marker = () => null;
export default MapView;

const styles = StyleSheet.create({
  mapFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
    borderWidth: 1,
    borderColor: '#d8e0ea',
  },
  label: {
    color: '#4a5b6d',
    fontSize: 13,
  },
});
