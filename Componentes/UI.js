import Toque from './Toque';
import React, { useContext, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { NotificacoesContext } from '../contexts/NotificacoesContext';
import { normalizar, profissional, STATUS } from '../utils/domain';
import FundoMarca from './FundoMarca';

export const cores = { ouro: '#C9A86A', claro: '#E4D1AA', fundo: '#10110F', card: '#181916', texto: '#F7F5EF', suave: '#A6A79E', borda: 'rgba(201,168,106,0.18)' };
export const Icone = ({ nome, tamanho = 21, cor = cores.ouro, ...props }) => <Ionicons name={nome} size={tamanho} color={cor} accessible={false} style={{ lineHeight: tamanho + 3, includeFontPadding: false }} {...props} />;
export function BotaoIcone({ icone, label, onPress, desativado, destaque = false }) {
  return <Toque accessibilityRole="button" accessibilityLabel={label} disabled={desativado} onPress={onPress} activeOpacity={0.75}
    style={[s.voltar, destaque && s.iconeDestaque, desativado && s.desativado]}><Icone nome={icone} tamanho={22} cor={destaque ? cores.fundo : cores.ouro} /></Toque>;
}
export function Voltar({ navigation }) {
  return <BotaoIcone icone="chevron-back" label="Voltar" onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Inicial')} />;
}
export function Marca() {
  return <View style={s.marca}><Image source={require('../Imagens/logo-oficial-a2.png')} style={s.logoOficial} resizeMode="contain" accessibilityLabel="A2 Imobiliária" /></View>;
}
export function Cabecalho({ navigation, inicio = false, mostrarPerfil = true, mostrarSino = true }) {
  const { user } = useContext(AuthContext);
  const { naoLidas = 0 } = useContext(NotificacoesContext);
  return <View style={s.topo}>
    {inicio ? <Marca /> : <><Voltar navigation={navigation} /><Marca /></>}
    <View style={s.acoesTopo}>{user && mostrarSino && <View><BotaoIcone icone="notifications-outline" label={`Notificações${naoLidas ? `, ${naoLidas} não lidas` : ''}`} onPress={() => navigation.navigate('Notificacoes')} />
      {!!naoLidas && <View pointerEvents="none" style={s.contadorSino}><Text style={s.contadorSinoTexto}>{naoLidas > 99 ? '99+' : naoLidas}</Text></View>}</View>}
      {mostrarPerfil ? <BotaoIcone icone="person-outline" label={user ? 'Meu perfil' : 'Entrar na conta'} onPress={() => navigation.navigate(user ? 'Perfil' : 'Login')} /> : (!user || !mostrarSino) && <View style={{ width: 46 }} />}
    </View>
  </View>;
}
export function Rodape() {
  return <View style={s.rodape}><View style={s.divisorRodape} /><Image source={require('../Imagens/logo-oficial-a2-rodape.png')} resizeMode="contain" style={{ width: 56, height: 46, opacity: 0.7 }} /><Text style={s.textoRodape}>Compra · Venda · Locação · Construção</Text></View>;
}
export function Pagina({ navigation, titulo, descricao, children, inicio, mostrarPerfil = true, mostrarSino = true, fundo, sobretitulo, rodape = true }) {
  const { user } = useContext(AuthContext);
  const institucional = profissional(user?.tipo);
  const Fundo = institucional ? FundoMarca : ImageBackground;
  return <Fundo {...(!institucional ? { source: fundo || require('../Imagens/fundo-imoveis.png'), resizeMode: 'cover' } : {})} style={s.fundo}>
    {!institucional && <View style={s.sombra} />}<View style={s.luzFundo} pointerEvents="none" />
    <SafeAreaView style={s.area} edges={['top', 'left', 'right']}>
      <Cabecalho navigation={navigation} inicio={inicio} mostrarPerfil={mostrarPerfil} mostrarSino={mostrarSino} />
      <KeyboardAvoidingView style={s.area} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={s.conteudo}>
          {(titulo || descricao) && <View style={s.abertura}>{!!sobretitulo && <Text style={s.sobretitulo}>{sobretitulo}</Text>}{!!titulo && <Text style={s.titulo}>{titulo}</Text>}{!!descricao && <Text style={s.descricaoPagina}>{descricao}</Text>}</View>}
          {children}{rodape && <Rodape />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Fundo>;
}
function iconeBotao(texto = '') {
  const t = normalizar(texto);
  if (/whatsapp/.test(t)) return 'logo-whatsapp';
  if (/sair/.test(t)) return 'log-out-outline';
  if (/excluir|remover/.test(t)) return 'trash-outline';
  if (/cancelar|recusar/.test(t)) return 'close-circle-outline';
  if (/foto|imagem|comprovante/.test(t)) return 'image-outline';
  if (/salvar|confirmar|aprovar|aceitar|concluir/.test(t)) return 'checkmark-circle-outline';
  if (/enviar/.test(t)) return 'paper-plane-outline';
  if (/cadastrar|cadastro|novo|nova|criar/.test(t)) return 'add-circle-outline';
  if (/editar|corrigir/.test(t)) return 'create-outline';
  if (/senha/.test(t)) return 'lock-closed-outline';
  if (/entrar/.test(t)) return 'log-in-outline';
  if (/visita/.test(t)) return 'calendar-outline';
  if (/atendimento/.test(t)) return 'chatbubble-ellipses-outline';
  return 'arrow-forward';
}
export function Botao({ texto, onPress, secundario, desativado, carregando, icone, perigo = false }) {
  const cor = perigo ? '#E9A19B' : secundario ? cores.ouro : cores.fundo;
  return <Toque accessibilityRole="button" accessibilityState={{ disabled: !!(desativado || carregando) }} disabled={desativado || carregando} onPress={onPress} activeOpacity={0.78}
    style={[s.botao, secundario && s.secundario, perigo && s.botaoPerigo, (desativado || carregando) && s.desativado]}>
    {carregando ? <ActivityIndicator color={cor} /> : <><Icone nome={icone || iconeBotao(texto)} tamanho={19} cor={cor} /><Text style={[s.botaoTexto, { color: cor }]}>{texto}</Text></>}
  </Toque>;
}
export function ItemMenu({ titulo, descricao, icone, onPress, destaque = false }) {
  return <Toque accessibilityRole="button" accessibilityLabel={titulo} activeOpacity={0.78} onPress={onPress} style={[s.itemMenu, destaque && s.itemMenuDestaque]}>
    <View style={[s.tileIcone, destaque && s.tileDestaque]}><Icone nome={icone} tamanho={23} cor={destaque ? cores.fundo : cores.ouro} /></View>
    <View style={s.menuTexto}><Text style={s.menuTitulo}>{titulo}</Text>{!!descricao && <Text style={s.menuDescricao}>{descricao}</Text>}</View><Icone nome="chevron-forward" tamanho={17} cor="#7D806F" />
  </Toque>;
}
export function Atalho({ titulo, icone, onPress }) {
  return <Toque accessibilityRole="button" accessibilityLabel={titulo} activeOpacity={0.78} style={s.atalho} onPress={onPress}>
    <View style={s.atalhoIcone}><Icone nome={icone} tamanho={22} /></View><Text style={s.atalhoTitulo}>{titulo}</Text><Icone nome="chevron-forward" tamanho={14} cor="#828576" />
  </Toque>;
}
export function Avatar({ tamanho = 94 }) {
  return <View style={[s.avatarHalo, { width: tamanho + 18, height: tamanho + 18, borderRadius: (tamanho + 18) / 2 }]}>
    <View style={[s.avatar, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}><Icone nome="person-outline" tamanho={tamanho * 0.43} cor={cores.claro} /></View>
    <View style={s.avatarSelo}><Icone nome="checkmark" tamanho={13} cor={cores.fundo} /></View>
  </View>;
}
export function Badge({ texto, status, icone }) {
  const sucesso = ['aprovado', 'confirmado', 'concluido', 'aceita', 'concluida', 'disponivel'].includes(status);
  const encerrado = ['recusado', 'recusada', 'cancelado', 'cancelada', 'suspenso'].includes(status);
  const cor = sucesso ? '#A8CCB1' : encerrado ? '#D3A8A2' : cores.claro;
  return <View style={[s.badge, sucesso && { backgroundColor: 'rgba(94,151,111,0.12)', borderColor: 'rgba(145,197,158,0.2)' }, encerrado && { backgroundColor: 'rgba(178,97,85,0.09)', borderColor: 'rgba(178,97,85,0.18)' }]}>
    {!!icone && <Icone nome={icone} tamanho={12} cor={cor} />}<Text style={[s.badgeTexto, { color: cor }]}>{texto || STATUS[status] || status}</Text>
  </View>;
}
export function TituloSecao({ titulo, descricao, quantidade, icone }) {
  return <View style={s.secao}><View style={s.secaoLinha}>{!!icone && <Icone nome={icone} tamanho={19} />}<Text style={s.secaoTitulo}>{titulo}</Text>{quantidade != null && <View style={s.contagem}><Text style={s.contagemTexto}>{quantidade}</Text></View>}</View>{!!descricao && <Text style={s.menuDescricao}>{descricao}</Text>}</View>;
}
function iconeCampo(label = '', numero) {
  if (numero) return 'calculator-outline';
  const t = normalizar(label);
  if (/senha/.test(t)) return 'lock-closed-outline';
  if (/e-mail/.test(t)) return 'mail-outline';
  if (/telefone/.test(t)) return 'call-outline';
  if (/nome/.test(t)) return 'person-outline';
  if (/buscar/.test(t)) return 'search-outline';
  if (/cidade|bairro|endereco|local/.test(t)) return 'location-outline';
  if (/data/.test(t)) return 'calendar-outline';
  return null;
}
export function Campo({ label, valor, alterar, opcoes, opcional, longo, numero, icone, ...props }) {
  const [foco, setFoco] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const simbolo = icone || (!longo && iconeCampo(label, numero));
  return <View style={s.grupo}><Text style={s.label}>{label}{opcional && <Text style={s.opcional}> · opcional</Text>}</Text>
    {opcoes ? <View style={s.linha}>{opcoes.map((item) => {
      const value = typeof item === 'string' ? item : item.valor;
      const text = typeof item === 'string' ? (STATUS[item] || item) : item.texto;
      return <Toque key={value} disabled={props.editable === false} accessibilityRole="button" accessibilityState={{ selected: valor === value, disabled: props.editable === false }} onPress={() => alterar(value)} style={[s.opcao, valor === value && s.ativa, props.editable === false && s.desativado]}>
        {valor === value && <Icone nome="checkmark" tamanho={13} cor={cores.fundo} />}<Text style={[s.opcaoTexto, valor === value && { color: cores.fundo }]}>{text}</Text></Toque>;
    })}</View> : <View style={[s.inputLinha, foco && s.inputFoco, props.editable === false && { opacity: 0.6 }, longo && { alignItems: 'flex-start' }]}>
      {!!simbolo && <Icone nome={simbolo} tamanho={18} cor={foco ? cores.ouro : '#787B6F'} />}
      <TextInput accessibilityLabel={label} value={String(valor ?? '')} onChangeText={alterar} placeholder={label} placeholderTextColor="#686C61" maxLength={longo ? 1500 : 160}
        multiline={!!longo} keyboardType={numero ? 'decimal-pad' : 'default'} selectionColor={cores.ouro} keyboardAppearance="dark" onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
        style={[s.input, longo && { minHeight: 110, textAlignVertical: 'top', paddingTop: 14 }]} {...props} secureTextEntry={props.secureTextEntry && !visivel} />
      {props.secureTextEntry && <Toque accessibilityRole="button" accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVisivel(!visivel)} style={s.olho}><Icone nome={visivel ? 'eye-off-outline' : 'eye-outline'} tamanho={19} cor="#9A9D90" /></Toque>}
    </View>}
  </View>;
}
export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
export const Mensagem = ({ texto, erro }) => texto ? <View accessibilityRole="alert" style={[s.mensagem, erro && s.mensagemErro]}><Icone nome={erro ? 'alert-circle-outline' : 'checkmark-circle-outline'} tamanho={19} cor={erro ? '#E2AAA3' : '#A8CCB1'} /><Text style={[s.mensagemTexto, erro && { color: '#E2AAA3' }]}>{texto}</Text></View> : null;
export function Estado({ carregando, erro, vazio, recarregar }) {
  return <>{carregando && <View style={s.estado}><ActivityIndicator color={cores.ouro} /><Text style={s.menuDescricao}>Carregando…</Text></View>}
    {!!erro && <><Mensagem erro texto={erro} />{!!recarregar && <Botao secundario texto="Tentar novamente" icone="refresh-outline" onPress={recarregar} />}</>}
    {!carregando && !erro && vazio && <View style={s.estado}><View style={s.tileIcone}><Icone nome="search-outline" tamanho={25} /></View><Text style={s.menuTitulo}>Nenhum registro encontrado</Text><Text style={s.menuDescricao}>Os resultados aparecerão aqui.</Text></View>}</>;
}
export const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cores.fundo }, area: { flex: 1 }, sombra: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,10,7,0.77)' },
  luzFundo: { position: 'absolute', top: -160, right: -150, width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(201,168,106,0.045)' },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20, width: '100%', maxWidth: 680, alignSelf: 'center' },
  marca: { alignItems: 'center' }, logoOficial: { width: 72, height: 58 }, acoesTopo: { flexDirection: 'row', alignItems: 'center', gap: 9 }, contadorSino: { position: 'absolute', top: -3, right: -3, borderRadius: 10, minWidth: 18, height: 18, backgroundColor: cores.ouro, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: cores.fundo }, contadorSinoTexto: { color: cores.fundo, fontSize: 8, fontWeight: '800' }, voltar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(22,24,19,0.94)', borderWidth: 1, borderColor: 'rgba(201,168,106,0.3)', alignItems: 'center', justifyContent: 'center' },
  iconeDestaque: { backgroundColor: cores.ouro, borderColor: cores.ouro }, logo: { color: cores.ouro, fontSize: 22, fontWeight: '900', letterSpacing: 2.5 }, logoClaro: { color: cores.texto },
  slogan: { color: '#9D8A62', fontSize: 7, fontWeight: '600', letterSpacing: 2.2, marginTop: 4 }, conteudo: { paddingHorizontal: 22, paddingBottom: 36, width: '100%', maxWidth: 680, alignSelf: 'center' },
  abertura: { marginBottom: 20, paddingTop: 8 }, sobretitulo: { color: cores.ouro, fontSize: 10, letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  titulo: { color: cores.texto, fontSize: 29, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 }, descricaoPagina: { color: cores.suave, fontSize: 13, lineHeight: 21, marginTop: 9 },
  subtitulo: { color: cores.claro, fontSize: 18, fontWeight: '700', marginTop: 10, marginBottom: 8, letterSpacing: -0.2 }, texto: { color: cores.texto, fontSize: 14, lineHeight: 23 }, muted: { color: cores.suave, fontSize: 12, lineHeight: 20, marginVertical: 6 },
  card: { backgroundColor: 'rgba(23,25,20,0.97)', borderWidth: 1, borderColor: cores.borda, borderRadius: 22, padding: 20, marginVertical: 9, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 3 },
  grupo: { marginVertical: 10 }, label: { color: '#CEBB94', fontSize: 10, fontWeight: '700', letterSpacing: 0.7, marginBottom: 9 }, opcional: { color: '#7C8072', fontWeight: '400', letterSpacing: 0 },
  inputLinha: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#11130F', borderWidth: 1, borderColor: '#303528', borderRadius: 14, paddingHorizontal: 14 },
  inputFoco: { borderColor: cores.ouro, backgroundColor: '#181B13' }, input: { minHeight: 52, flex: 1, color: cores.texto, fontSize: 14, paddingVertical: 12 }, olho: { padding: 6 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, opcao: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1B1E17', borderWidth: 1, borderColor: '#32382A', borderRadius: 24, paddingHorizontal: 15, paddingVertical: 11 },
  ativa: { backgroundColor: cores.ouro, borderColor: cores.ouro }, opcaoTexto: { color: '#AAAD9D', fontSize: 12, fontWeight: '600' },
  botao: { minHeight: 54, flexDirection: 'row', gap: 10, backgroundColor: cores.ouro, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secundario: { backgroundColor: '#1A1D16', borderWidth: 1, borderColor: 'rgba(201,168,106,0.23)' }, botaoTexto: { color: cores.fundo, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'center', flexShrink: 1 },
  botaoPerigo: { backgroundColor: 'rgba(180,70,60,0.09)', borderWidth: 1, borderColor: 'rgba(210,120,105,0.23)' }, desativado: { opacity: 0.5 },
  itemMenu: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(23,25,20,0.96)', borderWidth: 1, borderColor: cores.borda, borderRadius: 18, padding: 16, marginVertical: 6, minHeight: 84 },
  itemMenuDestaque: { borderColor: 'rgba(201,168,106,0.4)' }, tileIcone: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(201,168,106,0.09)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,168,106,0.12)' },
  tileDestaque: { backgroundColor: cores.ouro }, menuTexto: { flex: 1 }, menuTitulo: { color: cores.texto, fontSize: 14, lineHeight: 20, fontWeight: '600' }, menuDescricao: { color: '#909787', fontSize: 11, lineHeight: 17, marginTop: 4 },
  atalho: { flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, backgroundColor: 'rgba(24,27,21,0.95)', borderWidth: 1, borderColor: cores.borda, paddingVertical: 14, paddingHorizontal: 11 },
  atalhoIcone: { alignItems: 'center', justifyContent: 'center', width: 30 }, atalhoTitulo: { color: '#D3D5CA', fontSize: 11, fontWeight: '600', flex: 1 },
  avatarHalo: { backgroundColor: 'rgba(201,168,106,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,168,106,0.1)' },
  avatar: { backgroundColor: '#1A1D16', borderWidth: 1.5, borderColor: cores.ouro, alignItems: 'center', justifyContent: 'center' }, avatarSelo: { position: 'absolute', bottom: 5, right: 7, width: 23, height: 23, borderRadius: 12, backgroundColor: cores.ouro, borderWidth: 3, borderColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(201,168,106,0.09)', borderWidth: 1, borderColor: cores.borda },
  badgeTexto: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  secao: { marginTop: 29, marginBottom: 10 }, secaoLinha: { flexDirection: 'row', alignItems: 'center', gap: 9 }, secaoTitulo: { color: cores.texto, fontSize: 18, fontWeight: '700', flex: 1, letterSpacing: -0.3 }, contagem: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(201,168,106,0.12)', borderRadius: 10 }, contagemTexto: { color: cores.ouro, fontSize: 12, fontWeight: '700' },
  foto: { width: '100%', height: 220, borderRadius: 15, backgroundColor: '#24291D' },
  mensagem: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 13, padding: 12, marginVertical: 10, backgroundColor: 'rgba(100,157,110,0.08)' }, mensagemErro: { backgroundColor: 'rgba(180,84,73,0.08)' }, mensagemTexto: { flex: 1, fontSize: 12, lineHeight: 19, color: '#A8CCB1' },
  estado: { alignItems: 'center', gap: 12, paddingVertical: 34 }, rodape: { alignItems: 'center', marginTop: 34, paddingBottom: 24, gap: 8 }, divisorRodape: { width: 38, height: 1, backgroundColor: 'rgba(201,168,106,0.3)', marginBottom: 10 }, marcaRodape: { color: cores.ouro, fontSize: 10, fontWeight: '800', letterSpacing: 2.5 }, textoRodape: { color: '#707767', fontSize: 9, letterSpacing: 0.3 },
});
