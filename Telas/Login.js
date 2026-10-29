import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';

import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { database } from '../firebaseConfig';


export default function Login({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const auth = getAuth();


  const mostrarErroAuth = (erro) => {

    const mensagens = {
      'auth/invalid-email':
        'O e-mail informado parece inválido.',

      'auth/user-not-found':
        'Nenhuma conta encontrada com esse e-mail.',

      'auth/wrong-password':
        'Senha incorreta. Verifique e tente novamente.',

      'auth/too-many-requests':
        'Muitas tentativas. Tente novamente em alguns instantes.',

      'auth/network-request-failed':
        'Falha de conexão. Verifique sua internet.',
    };

    Alert.alert(
      'Ops!',
      mensagens[erro?.code] ||
      'Não foi possível entrar agora. Tente novamente.'
    );
  };


  const esqueciSenha = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu e-mail para receber o link de redefinição.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Verifique seu e-mail', 'Enviamos um link para redefinir sua senha.');
    } catch (err) {
      console.log('ERRO AO ENVIAR RESET DE SENHA:', err);
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        Alert.alert('Usuário não encontrado', 'Não existe uma conta com esse e-mail.');
        return;
      }
      if (code === 'auth/invalid-email') {
        Alert.alert('E-mail inválido', 'Informe um e-mail válido.');
        return;
      }
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição.');
    }
  };


  const entrar = async () => {

    if (!email.trim() || !senha.trim()) {

      Alert.alert(
        'Atenção',
        'Preencha e-mail e senha.'
      );

      return;
    }

    try {

      const credenciais =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          senha
        );

      const usuario = credenciais.user;

      const snapUsuario = await getDoc(
        doc(database, 'usuarios', usuario.uid)
      );

      const dadosUsuario = snapUsuario.data();

signIn({
  ...dadosUsuario,
  uid: usuario.uid,
  email: usuario.email,
});

      if (dadosUsuario?.tipo === 'admin' || dadosUsuario?.tipo === 'dono') {

        navigation.navigate(
          'InicialAdm',
          {
            adminEmail: usuario.email
          }
        );
      } else if (dadosUsuario?.tipo === 'proprietario') {
        navigation.navigate('ImoveisProprietario');
      } else {

        navigation.navigate('Imoveis');

      }

    } catch (erro) {

      console.log(erro);

      mostrarErroAuth(erro);
    }
  };


  return (

    <ImageBackground
      source={require('../Imagens/fundo-cadastro.png')}
      style={estilos.fundo}
      imageStyle={estilos.imagem}
      resizeMode="cover"
    >

      <View style={estilos.sombra} />

      <View style={estilos.area}>

        {/* LOGO A2 */}

        <Text style={estilos.logo}>
          ⌂
        </Text>

        <Text style={estilos.titulo}>
          A2 <Text style={estilos.tituloClaro}>IMÓVEIS</Text>
        </Text>

        <Text style={estilos.subtitulo}>
          REALIZANDO SONHOS
        </Text>

        <Text style={estilos.entrarTitulo}>
          Acesse sua conta
        </Text>


        {/* FORMULÁRIO */}

        <View style={estilos.caixa}>

          {/* E-MAIL */}

          <Text style={estilos.rotulo}>
            E-MAIL
          </Text>

          <TextInput
            style={estilos.campo}
            placeholder="seu@email.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />


          {/* SENHA */}

          <Text style={estilos.rotulo}>
            SENHA
          </Text>

          <View style={estilos.linhaSenha}>

            <TextInput
              style={estilos.campoSenha}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
            />

            <TouchableOpacity
              style={estilos.botaoOlho}
              onPress={() =>
                setMostrarSenha(!mostrarSenha)
              }
            >

              <Text style={estilos.textoOlho}>
                {mostrarSenha ? '🙈' : '👁️'}
              </Text>

            </TouchableOpacity>

          </View>


          {/* BOTÃO ENTRAR */}

          <TouchableOpacity onPress={esqueciSenha} style={estilos.esqueciLink}>
            <Text style={{ color: '#C9A86A', fontWeight: '700' }}>Esqueci a senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.botaoEntrar}
            onPress={entrar}
          >

            <Text style={estilos.textoBotao}>
              ENTRAR
            </Text>

          </TouchableOpacity>

        </View>


        {/* CADASTRO */}

        <View style={estilos.rodape}>

          <Text style={estilos.textoRodape}>
            Ainda não tem uma conta?
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation?.navigate('Cadastro')
            }
          >

            <Text style={estilos.linkRodape}>
              {' '}Criar conta
            </Text>

          </TouchableOpacity>

        </View>


        {/* Acesso administrativo removido do app */}

      </View>

    </ImageBackground>
  );
}


const estilos = StyleSheet.create({

  fundo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },


  imagem: {
    width: '100%',
    height: '100%',
  },


  sombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },


  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },


  /* LOGO */

  logo: {
    color: '#C9A86A',
    fontSize: 65,
    fontWeight: 'bold',
    marginBottom: 8,
  },


  /* TÍTULO */

  titulo: {
    color: '#C9A86A',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 8,
  },


  tituloClaro: {
    color: '#fff',
  },


  /* SUBTÍTULO */

  subtitulo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 18,
  },


  entrarTitulo: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '500',
    marginBottom: 35,
  },


  /* CAIXA */

  caixa: {
    width: '100%',
    backgroundColor: 'rgba(20,20,20,0.88)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.2)',
    padding: 30,
  },


  /* LABELS */

  rotulo: {
    color: 'rgba(201,168,106,0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },


  /* INPUT E-MAIL */

  campo: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.25)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },


  /* SENHA */

  linhaSenha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },


  campoSenha: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.25)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 50,
  },


  /* OLHO */

  botaoOlho: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },


  textoOlho: {
    fontSize: 18,
  },


  /* BOTÃO */

  botaoEntrar: {
    backgroundColor: '#C9A86A',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 16,
  },


  textoBotao: {
    color: '#111',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },


  /* RODAPÉ */

  rodape: {
    flexDirection: 'row',
    marginTop: 32,
  },


  textoRodape: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },


  linkRodape: {
    color: '#C9A86A',
    fontSize: 14,
    fontWeight: '700',
  },

  esqueciLink: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingVertical: 0,
  },


  /* ADMIN */
  /* admin styles removed */

});