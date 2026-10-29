import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './contexts/AuthContext';

import Inicial from './Telas/Inicial';
import Cadastro from './Telas/Cadastro';
import Login from './Telas/Login';
import Imoveis from './Telas/Imoveis';
import ImoveisProprietario from './Telas/ImoveisProprietario';
import SolicitarAnuncio from './Telas/SolicitarAnuncio';
import DetalhesImovel from './Telas/DetalhesImovel';
import SolicitacoesAnuncio from './Telas/SolicitacoesAnuncios';
import CadastroAdm from './Telas/CadastroAdm';
import InicialAdm from './Telas/InicialAdm';
import DetalhesUsuario from './Telas/DetalhesUsuario';
import Perfil from './Telas/Perfil';

import {
  TerrenoConstrucao,
  AvaliacaoImovel,
  AgendarVisita,
  Atendimento,
  SolicitacoesServicos,
} from './Telas/Servicos';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Inicial"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Inicial" component={Inicial} />
            <Stack.Screen name="Cadastro" component={Cadastro} />
            <Stack.Screen name="Login" component={Login} />

            <Stack.Screen
              name="Imoveis"
              component={Imoveis}
            />

            <Stack.Screen
              name="ImoveisProprietario"
              component={ImoveisProprietario}
            />

            <Stack.Screen
              name="SolicitarAnuncio"
              component={SolicitarAnuncio}
            />

            <Stack.Screen
              name="DetalhesImovel"
              component={DetalhesImovel}
            />

            <Stack.Screen
              name="CadastroAdm"
              component={CadastroAdm}
            />

            <Stack.Screen
              name="InicialAdm"
              component={InicialAdm}
            />

            <Stack.Screen
              name="DetalhesUsuario"
              component={DetalhesUsuario}
            />

            <Stack.Screen
              name="SolicitacoesAnuncio"
              component={SolicitacoesAnuncio}
            />

            <Stack.Screen name="Perfil" component={Perfil} />

            <Stack.Screen
              name="TerrenoConstrucao"
              component={TerrenoConstrucao}
            />

            <Stack.Screen
              name="AvaliacaoImovel"
              component={AvaliacaoImovel}
            />

            <Stack.Screen
              name="AgendarVisita"
              component={AgendarVisita}
            />

            <Stack.Screen
              name="Atendimento"
              component={Atendimento}
            />

            <Stack.Screen
              name="TerrenoConstrucaoAdm"
              component={SolicitacoesServicos}
              initialParams={{ tipo: 'terreno' }}
            />

            <Stack.Screen
              name="AvaliacaoImovelAdm"
              component={SolicitacoesServicos}
              initialParams={{ tipo: 'avaliacao' }}
            />

            <Stack.Screen
              name="AgendaVisitasAdm"
              component={SolicitacoesServicos}
              initialParams={{ tipo: 'visita' }}
            />

            <Stack.Screen
              name="AtendimentoAdm"
              component={SolicitacoesServicos}
              initialParams={{ tipo: 'atendimento' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}