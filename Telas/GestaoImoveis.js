import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { useColecao } from '../hooks/useColecao';
import { Badge, Botao, Campo, Card, Estado, Mensagem, Pagina, s } from '../Componentes/UI';
import ImovelCard from '../Componentes/ImovelCard';
import { dadosPublicos, decidirAnuncio, revisarCatalogo, salvarImovel } from '../services/imoveis';
import { uploadImagem } from '../services/cloudinary';
import { abrirComprovante, enviarComprovante } from '../services/comprovantes';
import { equipe, erroAmigavel, FINALIDADES, fotosImovel, moeda, normalizar, STATUS, TIPOS_IMOVEL, validarImovel } from '../utils/domain';

export function confirmar(titulo, texto, acao) {
  Alert.alert(titulo, texto, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: acao }]);
}
const vazio = { titulo: '', tipo: 'Casa', finalidade: 'Venda', cidade: '', bairro: '', endereco: '', preco: '', area: '', quartos: '', banheiros: '', vagas: '', descricao: '', telefone: '', fotos: [], situacao: 'disponivel', publicado: true, proprietarioId: '', corretorId: '', corretorNome: '' };
export function FormularioImovel({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const admin = equipe(user?.tipo), solicitacao = !admin || route.params?.solicitacao === true;
  const id = route.params?.id;
  const referencia = useRef(id || doc(collection(database, solicitacao ? 'solicitacoes_anuncios' : 'imoveis')).id);
  const [d, setD] = useState({ ...vazio, telefone: user?.telefone || '', proprietarioId: admin ? '' : user?.uid });
  const [carregando, setCarregando] = useState(!!id), [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false), [prova, setProva] = useState(null);
  const [buscaPessoa, setBuscaPessoa] = useState('');
  const trava = useRef(false);
  const pessoas = useColecao('usuarios', [], admin);
  const campo = (key) => (value) => setD((anterior) => ({ ...anterior, [key]: value }));
  useEffect(() => {
    let ativo = true;
    if (!id) return;
    getDoc(doc(database, solicitacao ? 'solicitacoes_anuncios' : 'imoveis', id)).then((snap) => {
      if (!ativo) return;
      if (!snap.exists()) throw new Error('Registro não encontrado.');
      const dados = snap.data();
      if (solicitacao && !['pendente', 'recusado'].includes(dados.status)) throw new Error('Este anúncio já foi analisado. Solicite a alteração à equipe.');
      setD({ ...vazio, ...dados, fotos: fotosImovel(dados) }); setCarregando(false);
    }).catch((e) => { if (ativo) { setErro(erroAmigavel(e)); setCarregando(false); } });
    return () => { ativo = false; };
  }, [id, solicitacao]);
  async function selecionar(comprovante = false) {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: !comprovante, selectionLimit: 12, quality: 0.8 });
      if (resultado.canceled) return;
      if (comprovante) setProva(resultado.assets[0]);
      else setD((atual) => ({ ...atual, fotos: [...atual.fotos, ...resultado.assets.map((asset) => ({ uri: asset.uri }))].slice(0, 12) }));
    } catch (e) { setErro(erroAmigavel(e)); }
  }
  async function salvar() {
    if (trava.current) return;
    const problema = validarImovel({ ...d, fotos: d.fotos.map((f) => typeof f === 'string' ? f : f.uri) });
    if (problema) { setErro(problema); return; }
    if (!d.proprietarioId) { setErro('Selecione o proprietário do imóvel.'); return; }
    if (solicitacao && !prova && !d.comprovanteResidencia) { setErro('Adicione um comprovante de residência de até 5 MB.'); return; }
    trava.current = true; setOcupado(true); setErro('');
    try {
      const fotos = [];
      for (const f of d.fotos) fotos.push(typeof f === 'string' ? f : await uploadImagem(f.uri));
      const base = { ...d, fotos };
      setD(base);
      if (solicitacao) {
        if (prova) {
          base.comprovanteResidencia = await enviarComprovante(prova);
          setD(base); setProva(null);
        }
        const publico = dadosPublicos(base);
        const payload = { ...publico, publicado: false, status: 'pendente', proprietarioId: base.proprietarioId,
          proprietarioNome: admin ? (pessoas.itens.find((p) => p.id === base.proprietarioId)?.nome || base.proprietarioNome || '') : user.nome,
          proprietarioEmail: admin ? (pessoas.itens.find((p) => p.id === base.proprietarioId)?.email || base.proprietarioEmail || '') : user.email,
          comprovanteResidencia: base.comprovanteResidencia || '', motivo: '', atualizadoEm: serverTimestamp() };
        delete payload.solicitacaoId;
        delete payload.catalogoSeguro;
        const ref = doc(database, 'solicitacoes_anuncios', referencia.current);
        if (id) await updateDoc(ref, payload);
        else await setDoc(ref, { ...payload, criadoEm: serverTimestamp() });
      } else await salvarImovel(id, base);
      navigation.goBack();
    } catch (e) { setErro(erroAmigavel(e)); }
    finally { trava.current = false; setOcupado(false); }
  }
  const proprietarios = pessoas.itens.filter((p) => p.tipo === 'proprietario' && normalizar(`${p.nome} ${p.email}`).includes(normalizar(buscaPessoa)));
  return <Pagina navigation={navigation} titulo={solicitacao ? (id ? 'Editar solicitação' : 'Anuncie seu imóvel') : (id ? 'Editar imóvel' : 'Cadastrar imóvel')}>
    <Estado carregando={carregando} />
    {!carregando && <Card>
      {admin && <><Estado {...pessoas} /><Campo label="Buscar proprietário" valor={buscaPessoa} alterar={setBuscaPessoa} />
        <Text style={s.muted}>Selecionado: {pessoas.itens.find((p) => p.id === d.proprietarioId)?.nome || d.proprietarioId || 'Nenhum'}</Text>
        <Campo label="Proprietário" valor={d.proprietarioId} alterar={campo('proprietarioId')} opcoes={proprietarios.slice(0, 15).map((p) => ({ valor: p.id, texto: `${p.nome} — ${p.email}` }))} editable={!ocupado} />
        <Campo label="Corretor responsável" valor={d.corretorId} alterar={(value) => setD((a) => ({ ...a, corretorId: value, corretorNome: pessoas.itens.find((p) => p.id === value)?.nome || '' }))}
          opcoes={[{ valor: '', texto: 'Sem corretor' }, ...pessoas.itens.filter((p) => p.tipo === 'corretor').map((p) => ({ valor: p.id, texto: p.nome }))]} editable={!ocupado} />
      </>}
      <Campo label="Título" valor={d.titulo} alterar={campo('titulo')} editable={!ocupado} />
      <Campo label="Categoria" valor={d.tipo} alterar={campo('tipo')} opcoes={TIPOS_IMOVEL} editable={!ocupado} />
      <Campo label="Finalidade" valor={d.finalidade} alterar={campo('finalidade')} opcoes={FINALIDADES} editable={!ocupado} />
      {[['cidade', 'Cidade'], ['bairro', 'Bairro'], ['endereco', 'Endereço'], ['codigo', 'Código do imóvel']].map(([k, label]) => <Campo key={k} label={label} valor={d[k]} alterar={campo(k)} opcional={k === 'codigo'} editable={!ocupado} />)}
      {[['preco', 'Preço (R$)'], ['area', 'Área (m²)'], ['quartos', 'Quartos'], ['banheiros', 'Banheiros'], ['vagas', 'Vagas']].map(([k, label]) => <Campo key={k} label={label} valor={d[k]} alterar={campo(k)} numero opcional={k !== 'preco'} editable={!ocupado} />)}
      <Campo label="Descrição" valor={d.descricao} alterar={campo('descricao')} longo editable={!ocupado} />
      <Campo label="Telefone de contato do anúncio" valor={d.telefone} alterar={campo('telefone')} keyboardType="phone-pad" maxLength={20} editable={!ocupado} />
      <Text style={s.muted}>Este telefone será exibido aos interessados no imóvel.</Text>
      <Text style={s.subtitulo}>Fotos ({d.fotos.length}/12)</Text>
      {d.fotos.map((f, index) => <View key={`${typeof f === 'string' ? f : f.uri}-${index}`} style={{ marginVertical: 8 }}><Image style={s.foto} source={{ uri: typeof f === 'string' ? f : f.uri }} /><Botao secundario texto="Remover foto" onPress={() => campo('fotos')(d.fotos.filter((_, i) => i !== index))} desativado={ocupado} /></View>)}
      <Botao secundario texto="Adicionar fotos" onPress={() => selecionar()} desativado={ocupado || d.fotos.length >= 12} />
      {solicitacao && <><Botao secundario texto={prova || d.comprovanteResidencia ? 'Substituir comprovante' : 'Adicionar comprovante'} onPress={() => selecionar(true)} desativado={ocupado} />
        {(prova || d.comprovanteResidencia) && <Text style={s.muted}>Comprovante selecionado para análise do anúncio.</Text>}</>}
      {!solicitacao && <><Campo label="Situação" valor={d.situacao} alterar={campo('situacao')} opcoes={['disponivel', 'vendido', 'alugado', 'suspenso']} editable={!ocupado} />
        <Campo label="Exibir no catálogo" valor={d.publicado ? 'Sim' : 'Não'} alterar={(v) => campo('publicado')(v === 'Sim')} opcoes={['Sim', 'Não']} editable={!ocupado} /></>}
      <Mensagem erro texto={erro} /><Botao texto={solicitacao ? 'Enviar para análise' : 'Salvar imóvel'} onPress={salvar} carregando={ocupado} />
    </Card>}
  </Pagina>;
}
export function MeusAnuncios({ navigation }) {
  const { user } = useContext(AuthContext);
  const lista = useColecao('solicitacoes_anuncios', [['proprietarioId', '==', user.uid]]);
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState('');
  async function excluir(i) {
    setOcupado(i.id); setErro('');
    try { await deleteDoc(doc(database, 'solicitacoes_anuncios', i.id)); } catch (e) { setErro(erroAmigavel(e)); }
    finally { setOcupado(''); }
  }
  return <Pagina navigation={navigation} titulo="Meus anúncios" descricao="Acompanhe suas solicitações e corrija os anúncios antes da publicação.">
    <Botao texto="Solicitar novo anúncio" onPress={() => navigation.navigate('SolicitarAnuncio')} /><Estado {...lista} vazio={!lista.itens.length} /><Mensagem erro texto={erro} />
    {[...lista.itens].sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0)).map((i) => <Card key={i.id}>
      {!!fotosImovel(i)[0] && <Image source={{ uri: fotosImovel(i)[0] }} style={[s.foto, { height: 175, marginBottom: 16 }]} />}
      <Badge status={i.status} /><Text style={s.subtitulo}>{i.titulo}</Text>{i.status === 'aprovado' && <Text style={s.muted}>{i.publicado ? 'Publicado' : 'Fora do catálogo'}</Text>}
      <Text style={s.muted}>{moeda(i.preco)}</Text>{!!i.motivo && <Mensagem erro texto={`Retorno da equipe: ${i.motivo}`} />}
      {['pendente', 'recusado'].includes(i.status) && <Botao secundario texto={i.status === 'recusado' ? 'Corrigir e reenviar' : 'Editar solicitação'} onPress={() => navigation.navigate('SolicitarAnuncio', { id: i.id })} />}
      {i.status === 'pendente' && <Botao secundario texto="Excluir solicitação" desativado={!!ocupado} onPress={() => confirmar('Excluir solicitação', 'O pedido será removido. Deseja continuar?', () => excluir(i))} />}
      {i.imovelId && i.publicado && <Botao secundario texto="Ver anúncio publicado" onPress={() => navigation.navigate('DetalhesImovel', { imovelId: i.imovelId })} />}
    </Card>)}
  </Pagina>;
}
export function GestaoImoveis({ navigation, route }) {
  const lista = useColecao('imoveis', route.params?.proprietarioId ? [['proprietarioId', '==', route.params.proprietarioId]] : []);
  const [busca, setBusca] = useState(''), [situacao, setSituacao] = useState('todos'), [revisando, setRevisando] = useState(false), [aviso, setAviso] = useState(''), [erro, setErro] = useState('');
  const itens = lista.itens.filter((i) => normalizar(`${i.titulo} ${i.codigo || i.id} ${i.cidade}`).includes(normalizar(busca)) && (situacao === 'todos' || (i.situacao || 'disponivel') === situacao));
  return <Pagina navigation={navigation} titulo="Gerenciar imóveis"><Botao texto="Cadastrar imóvel" onPress={() => navigation.navigate('EditarImovel')} />
    {lista.itens.some((i) => i.catalogoSeguro !== true || ['comprovanteResidencia', 'proprietarioEmail', 'proprietarioNome'].some((k) => k in i)) && <Card><Text style={s.subtitulo}>Privacidade dos anúncios antigos</Text>
      <Text style={s.muted}>Há dados pessoais ou comprovantes junto aos anúncios do catálogo. A revisão transfere esses dados para os pedidos privados.</Text>
      <Botao secundario texto="Revisar anúncios antigos" carregando={revisando} onPress={() => confirmar('Revisar privacidade', 'Os dados dos imóveis serão preservados e os comprovantes ficarão nos pedidos privados.', async () => {
        setRevisando(true); setErro(''); try { setAviso(`${await revisarCatalogo()} anúncio(s) revisado(s).`); } catch (e) { setErro(erroAmigavel(e)); } finally { setRevisando(false); }
      })} /></Card>}
    <Mensagem texto={aviso} /><Mensagem erro texto={erro} />
    <Campo label="Buscar imóvel" valor={busca} alterar={setBusca} /><Campo label="Situação" valor={situacao} alterar={setSituacao} opcoes={[{ valor: 'todos', texto: 'Todos' }, 'disponivel', 'vendido', 'alugado', 'suspenso']} />
    <Estado {...lista} vazio={!itens.length} />{itens.map((i) => <ImovelCard key={i.id} imovel={i} gerenciar onPress={() => navigation.navigate('EditarImovel', { id: i.id })} />)}
  </Pagina>;
}
export function SolicitacoesAnuncios({ navigation }) {
  const lista = useColecao('solicitacoes_anuncios');
  const [busca, setBusca] = useState(''), [filtro, setFiltro] = useState('pendente'), [ocupado, setOcupado] = useState(''), [erro, setErro] = useState(''), [motivos, setMotivos] = useState({});
  async function agir(i, status) {
    if (ocupado) return;
    if (status === 'recusado' && !motivos[i.id]?.trim()) { setErro('Informe o motivo da recusa para orientar o proprietário.'); return; }
    setOcupado(i.id); setErro('');
    try { await decidirAnuncio(i.id, status, motivos[i.id] || ''); } catch (e) { setErro(erroAmigavel(e)); } finally { setOcupado(''); }
  }
  const itens = lista.itens.filter((i) => (filtro === 'todos' || i.status === filtro) && normalizar(`${i.titulo} ${i.proprietarioNome || ''} ${i.proprietarioEmail || ''}`).includes(normalizar(busca)));
  return <Pagina navigation={navigation} titulo="Solicitações de anúncios"><Campo label="Buscar título, proprietário ou e-mail" valor={busca} alterar={setBusca} />
    <Campo label="Situação" valor={filtro} alterar={setFiltro} opcoes={[{ valor: 'todos', texto: 'Todas' }, 'pendente', 'aprovado', 'recusado']} />
    <Estado {...lista} vazio={!itens.length} /><Mensagem erro texto={erro} />
    {itens.map((i) => <Card key={i.id}><Badge status={i.status} /><Text style={s.subtitulo}>{i.titulo}</Text><Text style={s.texto}>{moeda(i.preco)}</Text>
      <Text style={s.muted}>{i.proprietarioNome} • {i.proprietarioEmail}</Text><Text style={s.muted}>{i.endereco}, {i.bairro}, {i.cidade}</Text><Text style={s.texto}>{i.descricao}</Text>
      {fotosImovel(i).map((url) => <Image key={url} source={{ uri: url }} style={[s.foto, { marginVertical: 8 }]} />)}
      <Botao secundario texto="Visualizar comprovante" desativado={!!ocupado} onPress={async () => { try { await abrirComprovante(i); } catch (e) { setErro(erroAmigavel(e)); } }} />
      {i.status !== 'aprovado' ? <><Campo label="Motivo / orientação ao proprietário" longo valor={motivos[i.id] || ''} alterar={(v) => setMotivos((a) => ({ ...a, [i.id]: v }))} />
        <Botao texto="Aprovar e publicar" desativado={!!ocupado} onPress={() => confirmar('Publicar anúncio', 'Confirma a aprovação deste anúncio?', () => agir(i, 'aprovado'))} />
        <Botao secundario texto="Recusar anúncio" desativado={!!ocupado} onPress={() => agir(i, 'recusado')} />
        <Botao secundario texto="Editar dados antes de aprovar" onPress={() => navigation.navigate('EditarImovel', { id: i.id, solicitacao: true })} />
      </> : <><Botao secundario texto="Gerenciar imóvel" onPress={() => navigation.navigate('EditarImovel', { id: i.imovelId || i.id })} />
        <Botao secundario texto="Retornar para análise" desativado={!!ocupado} onPress={() => confirmar('Retornar para análise', 'O anúncio será retirado do catálogo. O histórico será preservado.', () => agir(i, 'pendente'))} /></>}
      {!!i.motivo && <Text style={s.muted}>{i.motivo}</Text>}
    </Card>)}
  </Pagina>;
}
