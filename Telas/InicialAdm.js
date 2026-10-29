import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const OPCOES = [
  {
  tela: 'CadastroAdm',
  icone: '👥',
  titulo: 'Consultar usuários',
  descricao: 'Busque cadastros e gerencie os usuários do sistema.',
},
  {
    tela: 'SolicitacoesAnuncio',
    icone: '📢',
    titulo: 'Solicitações de anúncios',
    descricao: 'Confira os anúncios enviados para aprovação.',
  },
  {
    tela: 'TerrenoConstrucaoAdm',
    icone: '🏗️',
    titulo: 'Terreno + Construção',
    descricao: 'Acompanhe os pedidos de terrenos e construção.',
  },
  {
    tela: 'AvaliacaoImovelAdm',
    icone: '🏠',
    titulo: 'Avaliação de imóveis',
    descricao: 'Confira as solicitações de avaliação.',
  },
  {
    tela: 'AgendaVisitasAdm',
    icone: '📅',
    titulo: 'Agenda de visitas',
    descricao: 'Analise datas, horários e confirme as visitas.',
  },
  {
    tela: 'AtendimentoAdm',
    icone: '💬',
    titulo: 'Fale com um corretor',
    descricao: 'Responda às dúvidas e aos pedidos de contato.',
  },
  {
    tela: 'Perfil',
    icone: '👤',
    titulo: 'Perfil',
    descricao: 'Visualize e atualize os dados da sua conta.',
  },
];

export default function InicialAdm({ navigation }) {
  return (
    <ImageBackground
      source={require('../Imagens/InicialAdm.png')}
      style={estilos.fundo}
      resizeMode="cover"
    >
      <View style={estilos.sombra} />

      <SafeAreaView style={estilos.areaSegura}>
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.cabecalho}>
            <Text style={estilos.logo}>
              A2 <Text style={estilos.logoBranco}>IMÓVEIS</Text>
            </Text>

            <Text style={estilos.slogan}>
              REALIZANDO SONHOS
            </Text>

            <View style={estilos.linha} />

            <Text style={estilos.titulo}>
              ADMINISTRADOR
            </Text>
          </View>

          {OPCOES.map((opcao) => (
            <TouchableOpacity
              key={opcao.tela}
              style={estilos.botao}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={opcao.titulo}
              onPress={() => navigation.navigate(opcao.tela)}
            >
              <View style={estilos.iconeContainer}>
                <Text style={estilos.icone}>
                  {opcao.icone}
                </Text>
              </View>

              <View style={estilos.textoContainer}>
                <Text style={estilos.tituloBotao}>
                  {opcao.titulo}
                </Text>

                <Text style={estilos.descricao}>
                  {opcao.descricao}
                </Text>
              </View>

              <Text style={estilos.seta}>›</Text>
            </TouchableOpacity>
          ))}

          <View style={estilos.rodape}>
            <Text style={estilos.casaRodape}>⌂</Text>

            <View style={estilos.linhaRodape} />

            <Text style={estilos.textoRodape}>
              GESTÃO • ORGANIZAÇÃO • RESULTADOS
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: '#111',
  },
  areaSegura: {
    flex: 1,
  },
  sombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  conteudo: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 45,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    color: '#C9A86A',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoBranco: {
    color: '#fff',
    fontWeight: '500',
  },
  slogan: {
    color: '#C9A86A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 5,
  },
  linha: {
    width: 80,
    height: 2,
    backgroundColor: '#C9A86A',
    marginTop: 22,
    marginBottom: 16,
  },
  titulo: {
    color: '#C9A86A',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: 3,
  },
  botao: {
    minHeight: 110,
    backgroundColor: 'rgba(18,18,18,0.94)',
    borderWidth: 1,
    borderColor: '#C9A86A',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    elevation: 5,
    boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
  },
  iconeContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#C9A86A',
    backgroundColor: 'rgba(201,168,106,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icone: {
    fontSize: 28,
  },
  textoContainer: {
    flex: 1,
    marginLeft: 15,
    paddingRight: 8,
  },
  tituloBotao: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    marginBottom: 6,
  },
  descricao: {
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },
  seta: {
    color: '#C9A86A',
    fontSize: 38,
    fontWeight: '200',
    marginLeft: 5,
  },
  rodape: {
    alignItems: 'center',
    marginTop: 20,
  },
  casaRodape: {
    color: '#C9A86A',
    fontSize: 38,
  },
  linhaRodape: {
    width: 180,
    height: 1,
    backgroundColor: '#C9A86A',
    marginTop: 8,
    marginBottom: 13,
  },
  textoRodape: {
    color: '#C9A86A',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
  },
});