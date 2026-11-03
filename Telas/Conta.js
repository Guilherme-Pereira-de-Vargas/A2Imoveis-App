import React, { useContext, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { createUserWithEmailAndPassword, deleteUser, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Botao, Campo, Card, Icone, ItemMenu, Mensagem, Pagina, s } from '../Componentes/UI';
import { equipe, erroAmigavel, telefoneValido } from '../utils/domain';

export const destinoConta = (tipo) => equipe(tipo) || tipo === 'corretor' ? 'InicialAdm' : tipo === 'proprietario' ? 'ImoveisProprietario' : 'Imoveis';
export function Login({ navigation }) {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState(''), [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(''), [aviso, setAviso] = useState('');
  const trava = useRef(false);
  useEffect(() => {
    if (user && !user.perfilPendente) navigation.reset({ index: 0, routes: [{ name: destinoConta(user.tipo) }] });
  }, [user, navigation]);
  async function executar(reset = false) {
    if (trava.current) return;
    if (!email.trim() || (!reset && !senha)) { setErro('Preencha e-mail e senha.'); return; }
    trava.current = true; setOcupado(true); setErro(''); setAviso('');
    try {
      if (reset) { await sendPasswordResetEmail(auth, email.trim()); setAviso('Se houver uma conta para este e-mail, você receberá as instruções de recuperação.'); }
      else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
        const perfil = await getDoc(doc(database, 'usuarios', cred.user.uid));
        if (!perfil.exists()) navigation.navigate('CompletarCadastro');
      }
    } catch (e) { setErro(erroAmigavel(e)); }
    finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina navigation={navigation} titulo="Que bom ter você aqui." descricao="Entre na sua conta para continuar." sobretitulo="BEM-VINDO DE VOLTA" mostrarPerfil={false} fundo={require('../Imagens/fundo-cadastro.png')}><Card>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }}><View style={s.tileIcone}><Icone nome="log-in-outline" /></View><View><Text style={s.menuTitulo}>Acesse sua conta</Text><Text style={s.menuDescricao}>Seus imóveis e atendimentos por perto.</Text></View></View>
    <Campo label="E-mail" valor={email} alterar={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!ocupado} />
    <Campo label="Senha" valor={senha} alterar={setSenha} secureTextEntry editable={!ocupado} />
    <Mensagem erro texto={erro} /><Mensagem texto={aviso} />
    <Botao texto="Entrar" onPress={() => executar()} carregando={ocupado} />
    <Botao secundario texto="Esqueci minha senha" onPress={() => executar(true)} desativado={ocupado} />
    <Botao secundario texto="Criar conta" onPress={() => navigation.navigate('Cadastro')} desativado={ocupado} />
  </Card><ItemMenu titulo="Conheça os imóveis da A2" descricao="Explore o catálogo enquanto procura seu novo endereço." icone="compass-outline" onPress={() => navigation.navigate('Imoveis')} /></Pagina>;
}
export function Cadastro({ navigation, completar = false }) {
  const { user } = useContext(AuthContext);
  const [d, setD] = useState({ nome: '', telefone: '', email: '', senha: '', confirmar: '', tipo: 'cliente' });
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('');
  const trava = useRef(false);
  const campo = (id) => (v) => setD((atual) => ({ ...atual, [id]: v }));
  async function salvar() {
    if (trava.current) return;
    if (d.nome.trim().length < 2 || !telefoneValido(d.telefone)) { setErro('Informe seu nome e um telefone válido com DDD.'); return; }
    if (!completar && (!d.email.trim() || d.senha.length < 6 || d.senha !== d.confirmar)) { setErro('Informe o e-mail e confirme uma senha de pelo menos 6 caracteres.'); return; }
    trava.current = true; setOcupado(true); setErro(''); let novaConta;
    try {
      const conta = completar ? auth.currentUser : (await createUserWithEmailAndPassword(auth, d.email.trim(), d.senha)).user;
      if (!conta) throw new Error('Entre novamente na conta.');
      if (!completar) novaConta = conta;
      await setDoc(doc(database, 'usuarios', conta.uid), { uid: conta.uid, nome: d.nome.trim(), telefone: d.telefone.trim(), email: conta.email, tipo: d.tipo, creci: '' });
      navigation.reset({ index: 0, routes: [{ name: destinoConta(d.tipo) }] });
    } catch (e) {
      if (novaConta) { try { await deleteUser(novaConta); } catch { /* O perfil poderá ser completado no próximo login. */ } }
      setErro(erroAmigavel(e));
    } finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina navigation={navigation} titulo={completar ? 'Complete seu cadastro' : 'Seu próximo imóvel\ncomeça aqui.'} descricao="Preencha seus dados e fique mais perto do seu novo endereço." sobretitulo="CRIE SUA CONTA" mostrarPerfil={false} fundo={require('../Imagens/fundo-cadastro.png')}>
    <Card><Campo label="Nome completo" valor={d.nome} alterar={campo('nome')} maxLength={100} editable={!ocupado} />
      <Campo label="Telefone com DDD" valor={d.telefone} alterar={campo('telefone')} keyboardType="phone-pad" maxLength={20} editable={!ocupado} />
      <Campo label="Tipo de conta" valor={d.tipo} alterar={campo('tipo')} opcoes={[{ valor: 'cliente', texto: 'Cliente' }, { valor: 'proprietario', texto: 'Proprietário' }]} editable={!ocupado} />
      {!completar && <><Campo label="E-mail" valor={d.email} alterar={campo('email')} keyboardType="email-address" autoCapitalize="none" editable={!ocupado} />
        <Campo label="Senha" valor={d.senha} alterar={campo('senha')} secureTextEntry editable={!ocupado} />
        <Campo label="Confirmar senha" valor={d.confirmar} alterar={campo('confirmar')} secureTextEntry editable={!ocupado} /></>}
      {completar && <Text style={s.muted}>{user?.email || auth.currentUser?.email}</Text>}
      <Mensagem erro texto={erro} /><Botao texto="Salvar cadastro" onPress={salvar} carregando={ocupado} />
      {completar && <Botao secundario texto="Sair" desativado={ocupado} onPress={() => signOut(auth)} />}
    </Card>
  </Pagina>;
}
export const CompletarCadastro = (props) => <Cadastro {...props} completar />;
