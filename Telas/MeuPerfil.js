import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Avatar, Badge, Botao, Campo, Card, cores, Icone, Mensagem, Pagina, s } from '../Componentes/UI';
import { erroAmigavel, telefoneValido } from '../utils/domain';

export default function MeuPerfil({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [nome, setNome] = useState(user.nome || ''), [telefone, setTelefone] = useState(user.telefone || '');
  const [senha, setSenha] = useState(''), [nova, setNova] = useState(''), [confirmar, setConfirmar] = useState('');
  const [alterar, setAlterar] = useState(false), [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(''), [aviso, setAviso] = useState('');
  useEffect(() => { setNome(user.nome || ''); setTelefone(user.telefone || ''); }, [user.nome, user.telefone]);
  async function executar(acao, mensagem) {
    if (ocupado) return;
    setOcupado(true); setErro(''); setAviso('');
    try { await acao(); setAviso(mensagem); } catch (e) { setErro(erroAmigavel(e)); } finally { setOcupado(false); }
  }
  return <Pagina navigation={navigation} titulo="Meu perfil" descricao="Suas informações, sempre atualizadas." mostrarPerfil={false} fundo={require('../Imagens/fundo-cadastro.png')}>
    <View style={p.identidade}><Avatar /><Text style={p.nome}>{user.nome}</Text><Text style={p.email}>{user.email}</Text><Badge texto={{ cliente: 'Cliente', proprietario: 'Proprietário', corretor: 'Corretor', admin: 'Administrador', dono: 'Dono' }[user.tipo] || user.tipo} />
      {!!user.creci && <Text style={s.muted}>CRECI {user.creci}</Text>}
    </View>
    <Card><View style={p.cabecalho}><View style={s.tileIcone}><Icone nome="person-outline" /></View><View style={{ flex: 1 }}><Text style={s.menuTitulo}>Dados pessoais</Text><Text style={s.menuDescricao}>Mantenha seus dados de contato em dia.</Text></View></View>
    <Campo label="Nome" valor={nome} alterar={setNome} maxLength={100} editable={!ocupado} /><Campo label="Telefone com DDD" valor={telefone} alterar={setTelefone} keyboardType="phone-pad" maxLength={20} editable={!ocupado} />
    <Botao texto="Salvar dados" desativado={ocupado} onPress={() => {
      if (nome.trim().length < 2 || !telefoneValido(telefone)) { setErro('Informe nome e telefone válidos.'); return; }
      executar(() => updateDoc(doc(database, 'usuarios', user.uid), { nome: nome.trim(), telefone: telefone.trim() }), 'Dados atualizados.');
    }} />
    </Card>
    <Card><View style={p.cabecalho}><View style={s.tileIcone}><Icone nome="shield-checkmark-outline" /></View><View style={{ flex: 1 }}><Text style={s.menuTitulo}>Segurança da conta</Text><Text style={s.menuDescricao}>Gerencie sua senha de acesso.</Text></View></View>
    <Botao secundario texto={alterar ? 'Fechar alteração de senha' : 'Alterar senha'} icone="lock-closed-outline" desativado={ocupado} onPress={() => { setAlterar(!alterar); setSenha(''); setNova(''); setConfirmar(''); }} />
    {alterar && <><Campo label="Senha atual" valor={senha} alterar={setSenha} secureTextEntry editable={!ocupado} /><Campo label="Nova senha" valor={nova} alterar={setNova} secureTextEntry editable={!ocupado} /><Campo label="Confirmar nova senha" valor={confirmar} alterar={setConfirmar} secureTextEntry editable={!ocupado} />
      <Botao texto="Confirmar nova senha" desativado={ocupado} onPress={() => {
        if (!senha || nova.length < 6 || nova !== confirmar) { setErro('Confirme a nova senha com pelo menos 6 caracteres.'); return; }
        executar(async () => { await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, senha)); await updatePassword(auth.currentUser, nova); setAlterar(false); setSenha(''); setNova(''); setConfirmar(''); }, 'Senha alterada.');
      }} /></>}
    <Mensagem erro texto={erro} /><Mensagem texto={aviso} />
  </Card><Botao perigo texto="Sair da conta" desativado={ocupado} onPress={() => executar(async () => { await signOut(); navigation.reset({ index: 0, routes: [{ name: 'Inicial' }] }); }, '')} /></Pagina>;
}
const p = StyleSheet.create({
  identidade: { alignItems: 'center', marginTop: 4, marginBottom: 22, gap: 10 }, nome: { color: cores.texto, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 6 }, email: { color: '#929A85', fontSize: 12, marginBottom: 3 }, cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
});
