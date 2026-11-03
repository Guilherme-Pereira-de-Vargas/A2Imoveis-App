import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Fundo institucional para as áreas de gestão, sem fotografia de imóvel.
export default function FundoMarca({ children, style }) {
  return <View style={[f.fundo, style]}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={f.faixa} /><View style={f.arcoExterno} /><View style={f.arcoInterno} />
      <Image source={require('../Imagens/logo-oficial-a2-rodape.png')} resizeMode="contain" style={f.marca} />
      <View style={f.base} />
    </View>{children}
  </View>;
}
const f = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: '#10110F' }, faixa: { position: 'absolute', top: 0, left: 24, height: 180, width: 1, backgroundColor: 'rgba(201,168,106,0.1)' },
  arcoExterno: { position: 'absolute', top: -180, right: -190, width: 440, height: 440, borderRadius: 220, borderWidth: 1, borderColor: 'rgba(201,168,106,0.075)' },
  arcoInterno: { position: 'absolute', top: -115, right: -125, width: 310, height: 310, borderRadius: 155, backgroundColor: 'rgba(201,168,106,0.022)' },
  marca: { position: 'absolute', right: -30, bottom: 85, width: 260, height: 215, opacity: 0.025 }, base: { position: 'absolute', bottom: 45, left: 24, right: 24, height: 1, backgroundColor: 'rgba(201,168,106,0.05)' },
});
