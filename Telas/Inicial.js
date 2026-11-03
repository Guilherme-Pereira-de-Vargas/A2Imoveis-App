import Toque from '../Componentes/Toque';
import React, { useContext, useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { Botao, cores, Icone, Mensagem } from '../Componentes/UI';

export default function Inicial({ navigation }) {
  const { continueAsGuest } = useContext(AuthContext);
  const compacto = useWindowDimensions().height < 800;
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('');
  return <ImageBackground source={require('../Imagens/fundo1.png')} resizeMode="cover" style={e.fundo}>
    <View style={e.sombra} /><SafeAreaView style={{ flex: 1 }}><ScrollView contentContainerStyle={[e.conteudo, compacto && { paddingTop: 8, paddingBottom: 12 }]} showsVerticalScrollIndicator={false}>
      <View style={[e.marca, compacto && { paddingVertical: 8 }]}><Image source={require('../Imagens/logo-oficial-a2.png')} style={[e.logo, compacto && { width: 100, height: 76 }]} resizeMode="contain" /><View style={[e.linha, compacto && { marginTop: 10 }]} /><Text style={e.assinatura}>REALIZANDO SONHOS</Text></View>
      <View style={[e.apresentacao, compacto && { paddingTop: 14, paddingBottom: 18 }]}><View style={[e.servicos, compacto && { marginBottom: 18 }]}><View style={e.servico}><Icone nome="home-outline" tamanho={18} /><Text style={e.servicoTexto}>Comprar</Text></View><View style={e.servico}><Icone nome="key-outline" tamanho={18} /><Text style={e.servicoTexto}>Alugar</Text></View><View style={e.servico}><Icone nome="construct-outline" tamanho={18} /><Text style={e.servicoTexto}>Construir</Text></View></View><View style={e.legenda}><View style={e.ponto} /><Text style={e.legendaTexto}>BEM-VINDO À A2 IMÓVEIS</Text></View>
        <Text style={[e.titulo, compacto && { fontSize: 30, lineHeight: 37 }]}>Encontre seu{ '\n' }<Text style={{ color: cores.claro }}>próximo imóvel.</Text></Text><Text style={[e.descricao, compacto && { marginTop: 10, lineHeight: 20 }]}>Compra, venda e locação, com a atenção que você procura.</Text>
      </View>
      <View style={e.acoes}><Botao texto="Entrar na minha conta" icone="arrow-forward" onPress={() => navigation.navigate('Login')} desativado={ocupado} />
        <Toque accessibilityLabel="Explorar imóveis como visitante, sem criar conta" accessibilityRole="button" disabled={ocupado} style={[e.visitante, ocupado && { opacity: 0.5 }]} onPress={async () => {
          if (ocupado) return; setOcupado(true); setErro('');
          try { await continueAsGuest(); navigation.navigate('Imoveis'); } catch { setErro('Não foi possível iniciar o acesso de visitante.'); } finally { setOcupado(false); }
        }}><View style={e.visitanteIcone}><Icone nome="compass-outline" tamanho={23} cor={cores.claro} /></View><View style={{ flex: 1 }}><Text style={e.visitanteTexto}>Explorar como visitante</Text><Text style={e.visitanteDescricao}>Veja os imóveis sem criar uma conta</Text></View><Icone nome="chevron-forward" tamanho={18} cor={cores.claro} /></Toque>
        <Botao secundario texto="Criar minha conta" icone="person-add-outline" onPress={() => navigation.navigate('Cadastro')} desativado={ocupado} />
        <Mensagem erro texto={erro} />
      </View>
    </ScrollView></SafeAreaView>
  </ImageBackground>;
}
const e = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: '#10110F' }, sombra: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,10,5,0.55)' }, conteudo: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 25, paddingBottom: 18, width: '100%', maxWidth: 560, alignSelf: 'center' },
  marca: { alignItems: 'center', paddingVertical: 15 }, logo: { width: 148, height: 118 }, linha: { width: 30, height: 1, backgroundColor: 'rgba(201,168,106,0.5)', marginTop: 19 }, assinatura: { color: '#C1A872', fontSize: 8, letterSpacing: 3, fontWeight: '600', marginTop: 12 },
  apresentacao: { flex: 1, justifyContent: 'center', paddingTop: 28, paddingBottom: 26 }, servicos: { flexDirection: 'row', gap: 9, marginBottom: 29 }, servico: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 13, backgroundColor: 'rgba(18,23,13,0.6)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(201,168,106,0.17)' }, servicoTexto: { fontSize: 9, fontWeight: '600', color: '#C8C9BC' }, legenda: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 17 }, ponto: { width: 5, height: 5, borderRadius: 3, backgroundColor: cores.ouro }, legendaTexto: { color: '#B7AD93', fontSize: 8, fontWeight: '700', letterSpacing: 1.7 }, titulo: { color: '#fff', fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -1.1 }, descricao: { color: '#BEC1B4', fontSize: 13, lineHeight: 22, marginTop: 15, maxWidth: 290 },
  acoes: { padding: 14, marginHorizontal: -8, borderRadius: 24, backgroundColor: 'rgba(12,16,9,0.94)', borderWidth: 1, borderColor: 'rgba(201,168,106,0.22)' },
  visitante: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginVertical: 8, borderRadius: 16, backgroundColor: '#283021', borderWidth: 1, borderColor: '#8C805F', overflow: 'hidden' },
  visitanteIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(201,168,106,0.12)', alignItems: 'center', justifyContent: 'center' }, visitanteTexto: { color: '#FFF9EC', fontSize: 13, fontWeight: '700' }, visitanteDescricao: { color: '#D0D6C6', fontSize: 10, lineHeight: 16, marginTop: 4 },
});
