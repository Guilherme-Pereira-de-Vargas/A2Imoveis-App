import React from 'react';
import { Pressable } from 'react-native';

// Usa o clique nativo do Android, respeitando as preferências de som do celular.
export default function Toque({ children, style, activeOpacity = 0.84, disabled, accessibilityState, ...props }) {
  return <Pressable accessibilityRole="button" {...props} disabled={disabled}
    accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
    android_disableSound={false} android_ripple={{ color: 'rgba(201,168,106,0.16)', foreground: true }}
    style={(estado) => [typeof style === 'function' ? style(estado) : style,
      estado.pressed && !disabled && { opacity: activeOpacity }]}>
    {children}
  </Pressable>;
}
