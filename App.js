import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
import { Botao, Pagina, s } from './Componentes/UI';
import { equipe, profissional } from './utils/domain';
import Inicial from './Telas/Inicial';
import { Login, Cadastro, CompletarCadastro, destinoConta } from './Telas/Conta';
import Imoveis from './Telas/Imoveis';
import DetalhesImovel from './Telas/DetalhesImovel';
import CadastroAdm from './Telas/CadastroAdm';
import InicialAdm from './Telas/InicialAdm';
import Perfil from './Telas/Perfil';
import { Usuario } from './Telas/Usuarios';
import { FormularioImovel, GestaoImoveis, MeusAnuncios, SolicitacoesAnuncios } from './Telas/GestaoImoveis';
import { TerrenoConstrucao, AvaliacaoImovel, AgendarVisita, Atendimento, SolicitacoesServicos } from './Telas/Servicos';
import { NovaProposta, Propostas, Negociacao } from './Telas/Propostas';
import Notificacoes from './Telas/Notificacoes';

const Stack = createStackNavigator();
function proteger(Componente, permitir = () => true) {
  return function TelaProtegida(props) {
    const { user } = useContext(AuthContext);
    if (!user || user.perfilPendente || !permitir(user.tipo)) return <Pagina navigation={props.navigation} titulo="Acesso restrito">
      <Text style={s.muted}>{user ? 'Sua conta não tem acesso a esta área.' : 'Entre na sua conta para continuar.'}</Text>
      <Botao texto={user?.perfilPendente ? 'Completar cadastro' : user ? 'Ir ao início' : 'Entrar'} onPress={() => props.navigation.navigate(user?.perfilPendente ? 'CompletarCadastro' : user ? destinoConta(user.tipo) : 'Login')} />
    </Pagina>;
    return <Componente {...props} />;
  };
}
const telas = [
  ['Inicial', Inicial], ['Cadastro', Cadastro], ['Login', Login], ['CompletarCadastro', CompletarCadastro],
  ['Imoveis', Imoveis], ['ImoveisProprietario', proteger(Imoveis)], ['DetalhesImovel', DetalhesImovel],
  ['CadastroAdm', proteger(CadastroAdm, equipe)], ['NovoUsuario', proteger(Usuario, equipe)], ['DetalhesUsuario', proteger(Usuario, equipe)],
  ['InicialAdm', proteger(InicialAdm, profissional)], ['Perfil', proteger(Perfil)],
  ['SolicitarAnuncio', proteger(FormularioImovel, (tipo) => tipo === 'proprietario')], ['MeusAnuncios', proteger(MeusAnuncios, (tipo) => tipo === 'proprietario')],
  ['GestaoImoveis', proteger(GestaoImoveis, equipe)], ['EditarImovel', proteger(FormularioImovel, equipe)], ['SolicitacoesAnuncio', proteger(SolicitacoesAnuncios, equipe)],
  ['TerrenoConstrucao', proteger(TerrenoConstrucao)], ['AvaliacaoImovel', proteger(AvaliacaoImovel)], ['AgendarVisita', proteger(AgendarVisita)], ['Atendimento', proteger(Atendimento)],
  ['NovaProposta', proteger(NovaProposta)], ['Propostas', proteger(Propostas)], ['Negociacao', proteger(Negociacao)],
  ['Notificacoes', proteger(Notificacoes)],
];
const ServicosEquipe = proteger(SolicitacoesServicos, profissional);
function Navegador() {
  const { user, carregando, erro, signOut } = useContext(AuthContext);
  if (carregando || erro || user?.ativo === false) return <View style={[s.fundo, { backgroundColor: '#111', justifyContent: 'center', padding: 30 }]}>
    {carregando ? <ActivityIndicator size="large" color="#C9A86A" /> : <><Text style={s.texto}>{erro || 'Seu acesso está suspenso. Entre em contato com a imobiliária.'}</Text><Botao texto="Sair da conta" onPress={signOut} /></>}
  </View>;
  const inicio = user?.perfilPendente ? 'CompletarCadastro' : user ? destinoConta(user.tipo) : 'Inicial';
  return <NavigationContainer key={user?.perfilPendente ? 'cadastro-pendente' : user?.uid || 'publico'}>
    <Stack.Navigator initialRouteName={inicio} screenOptions={{ headerShown: false }}>
      {telas.map(([name, component]) => <Stack.Screen key={name} name={name} component={component} />)}
      {[['TerrenoConstrucaoAdm', 'terreno'], ['AvaliacaoImovelAdm', 'avaliacao'], ['AgendaVisitasAdm', 'visita'], ['AtendimentoAdm', 'atendimento']].map(([name, tipo]) => <Stack.Screen key={name} name={name} component={ServicosEquipe} initialParams={{ tipo }} />)}
    </Stack.Navigator>
  </NavigationContainer>;
}
export default function App() {
  const [fontesCarregadas, erroFontes] = useFonts(Ionicons.font);
  if (!fontesCarregadas && !erroFontes) return <View style={{ flex: 1, backgroundColor: '#10110F', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#C9A86A" /></View>;
  return <SafeAreaProvider><StatusBar style="light" /><AuthProvider><NotificacoesProvider><Navegador /></NotificacoesProvider></AuthProvider></SafeAreaProvider>;
}
