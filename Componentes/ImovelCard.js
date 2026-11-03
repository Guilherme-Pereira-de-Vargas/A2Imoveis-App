import Toque from './Toque';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fotosImovel, moeda } from '../utils/domain';
import { Badge, cores, Icone } from './UI';

export function Caracteristicas({ imovel, grande = false }) {
  return <View style={[e.caracteristicas, grande && e.caracteristicasGrandes]}>
    {[['quartos', 'bed-outline', 'quartos'], ['banheiros', 'water-outline', 'banheiros'], ['vagas', 'car-outline', 'vagas'], ['area', 'resize-outline', 'm²']]
      .filter(([k]) => imovel[k] != null && imovel[k] !== '').map(([k, icone, label]) => <View key={k} style={[e.caracteristica, grande && e.caracteristicaGrande]}>
        <Icone nome={icone} tamanho={grande ? 22 : 15} cor={grande ? cores.ouro : '#8E9881'} />
        <Text style={[e.valorCaracteristica, grande && e.valorGrande]}>{imovel[k]}{!grande && ` ${label}`}</Text>
        {grande && <Text style={e.labelCaracteristica}>{label}</Text>}
      </View>)}
  </View>;
}
export default function ImovelCard({ imovel, onPress, gerenciar = false }) {
  const fotos = fotosImovel(imovel);
  return <Toque accessibilityRole="button" accessibilityLabel={`${gerenciar ? 'Editar' : 'Ver detalhes de'} ${imovel.titulo}`} activeOpacity={0.9} onPress={onPress} style={e.card}>
    <View style={e.imagemArea}>
      {fotos[0] ? <Image source={{ uri: fotos[0] }} style={e.imagem} resizeMode="cover" /> : <View style={[e.imagem, e.semFoto]}><Icone nome="home-outline" tamanho={44} cor="#69705E" /><Text style={e.semFotoTexto}>A2 IMÓVEIS</Text></View>}
      <View style={e.etiquetas}><View style={e.finalidade}><Text style={e.finalidadeTexto}>{imovel.finalidade}</Text></View>
        {fotos.length > 1 && <View style={e.numeroFotos}><Icone nome="images-outline" tamanho={12} cor="#fff" /><Text style={e.numeroFotosTexto}>{fotos.length}</Text></View>}
      </View>
    </View>
    <View style={e.conteudo}><Badge texto={imovel.tipo} icone="home-outline" /><Text style={e.titulo} numberOfLines={2}>{imovel.titulo}</Text>
      <View style={e.localizacao}><Icone nome="location-outline" tamanho={14} cor="#949D88" /><Text style={e.localizacaoTexto} numberOfLines={1}>{[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}</Text></View>
      <Caracteristicas imovel={imovel} />
      {gerenciar && <View style={{ marginTop: 14 }}><Badge status={imovel.situacao || 'disponivel'} texto={!imovel.publicado && (!imovel.situacao || imovel.situacao === 'disponivel') ? 'Fora do catálogo' : undefined} /></View>}
      <View style={e.rodape}><View style={{ flex: 1 }}><Text style={e.labelPreco}>{imovel.finalidade === 'Locação' ? 'VALOR MENSAL' : 'VALOR DO IMÓVEL'}</Text><Text style={e.preco}>{moeda(imovel.preco)}</Text></View>
        <View style={e.verDetalhes}><Icone nome="arrow-forward" tamanho={21} cor={cores.fundo} /></View>
      </View>
    </View>
  </Toque>;
}
const e = StyleSheet.create({
  card: { backgroundColor: '#181B15', borderRadius: 23, overflow: 'hidden', marginVertical: 10, borderWidth: 1, borderColor: cores.borda, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.17, shadowRadius: 15 },
  imagemArea: { height: 220, backgroundColor: '#24291D' }, imagem: { width: '100%', height: '100%' }, semFoto: { alignItems: 'center', justifyContent: 'center', gap: 10 }, semFotoTexto: { color: '#737D65', fontSize: 10, letterSpacing: 3 },
  etiquetas: { position: 'absolute', top: 15, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, finalidade: { backgroundColor: cores.ouro, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 7 }, finalidadeTexto: { color: cores.fundo, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  numeroFotos: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(10,13,8,0.7)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 }, numeroFotosTexto: { color: '#fff', fontSize: 10 },
  conteudo: { padding: 18 }, titulo: { color: cores.texto, fontSize: 19, fontWeight: '700', lineHeight: 26, marginTop: 10, letterSpacing: -0.3 }, localizacao: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }, localizacaoTexto: { color: '#A1A995', fontSize: 12, flex: 1 },
  caracteristicas: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2D3326' }, caracteristica: { flexDirection: 'row', alignItems: 'center', gap: 5 }, valorCaracteristica: { color: '#B3BBA8', fontSize: 10 },
  caracteristicasGrandes: { borderTopWidth: 0, marginTop: 0, paddingTop: 0, gap: 8 }, caracteristicaGrande: { flex: 1, flexDirection: 'column', minWidth: 48, backgroundColor: '#11140D', paddingVertical: 14, borderRadius: 14 }, valorGrande: { fontSize: 16, fontWeight: '700', color: cores.texto, marginTop: 5 }, labelCaracteristica: { color: '#8D9880', fontSize: 9 },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 10 }, labelPreco: { color: '#828C75', fontSize: 8, letterSpacing: 1.2, marginBottom: 5 }, preco: { color: cores.claro, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 }, verDetalhes: { width: 42, height: 42, borderRadius: 15, backgroundColor: cores.ouro, justifyContent: 'center', alignItems: 'center' },
});
