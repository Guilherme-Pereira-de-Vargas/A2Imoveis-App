import React, { useContext, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, inMemoryPersistence, initializeAuth, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { app, auth, database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Botao, Campo, Card, Estado, Mensagem, Pagina, s } from '../Componentes/UI';
import { erroAmigavel, telefoneValido } from '../utils/domain';

export function Usuario({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const id = route.params?.usuarioId;
  const novo = !id;
  const [d, setD] = useState({ nome: '', telefone: '', email: '', tipo: 'cliente', creci: '', ativo: true });
  const [senha, setSenha] = useState(''), [confirmar, setConfirmar] = useState(''), [senhaGestor, setSenhaGestor] = useState('');
  const [original, setOriginal] = useState(null), [carregando, setCarregando] = useState(!novo), [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('');
  const trava = useRef(false);
  const campo = (key) => (value) => setD((atual) => ({ ...atual, [key]: value }));
  useEffect(() => {
    if (novo) return;
    let ativo = true;
    getDoc(doc(database, 'usuarios', id)).then((snap) => {
      if (!ativo) return;
      if (!snap.exists()) throw new Error('Usuário não encontrado.');
      setD({ creci: '', ativo: true, ...snap.data() }); setOriginal(snap.data()); setCarregando(false);
    }).catch((e) => { if (ativo) { setErro(erroAmigavel(e)); setCarregando(false); } });
    return () => { ativo = false; };
  }, [id, novo]);
  const protegido = original && (original.tipo === 'dono' || (user.tipo === 'admin' && original.tipo === 'admin'));
  const papeis = protegido ? [original.tipo] : ['cliente', 'proprietario', 'corretor', ...(user.tipo === 'dono' ? ['admin'] : [])];
  async function salvar() {
    if (trava.current) return;
    if (protegido) { setErro('Esta conta deve ser gerenciada pelo próprio titular no perfil.'); return; }
    if (d.nome.trim().length < 2 || !telefoneValido(d.telefone)) { setErro('Informe nome e telefone válidos.'); return; }
    if (d.tipo === 'corretor' && !d.creci.trim()) { setErro('Informe o CRECI do corretor.'); return; }
    if (novo && (!d.email.trim() || senha.length < 6 || senha !== confirmar)) { setErro('Informe o e-mail e confirme uma senha temporária de pelo menos 6 caracteres.'); return; }
    if ((novo || d.tipo !== original?.tipo) && !senhaGestor) { setErro('Confirme sua senha para criar a conta ou alterar o acesso.'); return; }
    trava.current = true; setOcupado(true); setErro('');
    let secundaria, conta;
    try {
      if (novo || d.tipo !== original.tipo) await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, senhaGestor));
      const payload = { nome: d.nome.trim(), telefone: d.telefone.trim(), tipo: d.tipo, creci: d.tipo === 'corretor' ? d.creci.trim() : '', ativo: d.ativo, atualizadoEm: serverTimestamp(), ...(!novo ? { uid: id } : {}) };
      if (novo) {
        secundaria = initializeApp(app.options, `cadastro-${Date.now()}`);
        const authSecundaria = initializeAuth(secundaria, { persistence: inMemoryPersistence });
        conta = (await createUserWithEmailAndPassword(authSecundaria, d.email.trim(), senha)).user;
        await setDoc(doc(database, 'usuarios', conta.uid), { ...payload, uid: conta.uid, email: conta.email, criadoEm: serverTimestamp() });
        conta = null;
        await signOut(authSecundaria);
      } else await updateDoc(doc(database, 'usuarios', id), payload);
      navigation.goBack();
    } catch (e) {
      if (conta) { try { await deleteUser(conta); } catch { /* Conta incompleta pode finalizar o cadastro ao entrar. */ } }
      setErro(erroAmigavel(e));
    } finally { if (secundaria) await deleteApp(secundaria); trava.current = false; setOcupado(false); }
  }
  return <Pagina navigation={navigation} titulo={novo ? 'Cadastrar usuário' : 'Dados do usuário'}><Estado carregando={carregando} />
    {!carregando && <Card><Campo label="Nome" valor={d.nome} alterar={campo('nome')} editable={!ocupado && !protegido} maxLength={100} />
      <Campo label="E-mail" valor={d.email} alterar={campo('email')} editable={novo && !ocupado} autoCapitalize="none" keyboardType="email-address" />
      <Campo label="Telefone com DDD" valor={d.telefone} alterar={campo('telefone')} editable={!ocupado && !protegido} keyboardType="phone-pad" maxLength={20} />
      <Campo label="Tipo de conta" valor={d.tipo} alterar={campo('tipo')} opcoes={papeis.map((p) => ({ valor: p, texto: { cliente: 'Cliente', proprietario: 'Proprietário', corretor: 'Corretor', admin: 'Administrador', dono: 'Dono' }[p] }))} editable={!ocupado && !protegido} />
      {d.tipo === 'corretor' && <Campo label="CRECI" valor={d.creci} alterar={campo('creci')} editable={!ocupado && !protegido} maxLength={40} />}
      {!protegido && <Campo label="Acesso ao sistema" valor={d.ativo ? 'Ativo' : 'Suspenso'} alterar={(v) => campo('ativo')(v === 'Ativo')} opcoes={['Ativo', 'Suspenso']} editable={!ocupado} />}
      {novo && <><Campo label="Senha temporária" valor={senha} alterar={setSenha} secureTextEntry editable={!ocupado} /><Campo label="Confirmar senha temporária" valor={confirmar} alterar={setConfirmar} secureTextEntry editable={!ocupado} />
        <Text style={s.muted}>Informe ao titular os dados de acesso por um canal privado. A senha pode ser alterada no perfil ou recuperada por e-mail.</Text></>}
      {!protegido && (novo || d.tipo !== original?.tipo) && <Campo label="Sua senha para confirmar" valor={senhaGestor} alterar={setSenhaGestor} secureTextEntry editable={!ocupado} />}
      <Mensagem erro texto={erro} />{protegido ? <Text style={s.muted}>Conta protegida. O titular pode atualizar seus dados no próprio perfil.</Text> : <Botao texto="Salvar usuário" onPress={salvar} carregando={ocupado} />}
      {!novo && d.tipo === 'proprietario' && <Botao secundario texto="Consultar imóveis do proprietário" onPress={() => navigation.navigate('GestaoImoveis', { proprietarioId: id })} />}
    </Card>}
  </Pagina>;
}
