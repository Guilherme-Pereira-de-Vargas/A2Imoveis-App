import React, { useContext, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { useColecao } from '../hooks/useColecao';
import { Badge, Botao, Campo, Card, Estado, Mensagem, Pagina, s } from '../Componentes/UI';
import { criarProposta, negociarProposta, TERMINAIS } from '../services/propostas';
import { disponivel, equipe, erroAmigavel, moeda, normalizar, numero, STATUS, telefoneValido } from '../utils/domain';

export function NovaProposta({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const [imovel, setImovel] = useState(null), [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false);
  const [valor, setValor] = useState(''), [mensagem, setMensagem] = useState(''), [telefone, setTelefone] = useState(user.telefone || '');
  const trava = useRef(false);
  useEffect(() => onSnapshot(doc(database, 'imoveis', route.params.imovelId), (snap) => {
    setImovel(snap.exists() ? snap.data() : null);
    if (!snap.exists()) setErro('Imóvel não encontrado.');
  }, (e) => setErro(erroAmigavel(e))), [route.params.imovelId]);
  async function enviar() {
    if (trava.current) return;
    if (!(numero(valor) > 0) || !telefoneValido(telefone) || !mensagem.trim()) { setErro('Informe um valor válido, telefone com DDD e as condições da proposta.'); return; }
    trava.current = true; setOcupado(true); setErro('');
    try { const id = await criarProposta(route.params.imovelId, { valor, mensagem, telefone }, user); navigation.replace('Negociacao', { id }); }
    catch (e) { setErro(erroAmigavel(e)); } finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina navigation={navigation} titulo="Enviar proposta"><Card>
    <Text style={s.subtitulo}>{imovel?.titulo || 'Carregando imóvel…'}</Text><Text style={s.muted}>Valor anunciado: {moeda(imovel?.preco)}</Text>
    <Campo label="Valor da proposta (R$)" numero valor={valor} alterar={setValor} editable={!ocupado} /><Campo label="Telefone com DDD" valor={telefone} alterar={setTelefone} keyboardType="phone-pad" maxLength={20} editable={!ocupado} />
    <Campo label="Condições e mensagem para a equipe" longo valor={mensagem} alterar={setMensagem} editable={!ocupado} />
    <Text style={s.muted}>A proposta inicia uma negociação. A contratação depende da confirmação das partes e da documentação.</Text>
    <Mensagem erro texto={erro} /><Botao texto="Enviar proposta" carregando={ocupado} desativado={!disponivel(imovel)} onPress={enviar} />
  </Card></Pagina>;
}
export function Propostas({ navigation }) {
  const { user } = useContext(AuthContext);
  const [modo, setModo] = useState(user.tipo === 'corretor' ? 'equipe' : 'cliente'), [filtro, setFiltro] = useState('todas'), [busca, setBusca] = useState('');
  const condicoes = equipe(user.tipo) ? [] : user.tipo === 'corretor' && modo === 'equipe' ? [['corretorId', '==', user.uid]] : [[modo === 'proprietario' ? 'proprietarioId' : 'clienteId', '==', user.uid]];
  const lista = useColecao('propostas', condicoes);
  const itens = lista.itens.filter((p) => (filtro === 'todas' || p.status === filtro) && normalizar(`${p.imovelTitulo} ${p.clienteNome} ${p.corretorNome}`).includes(normalizar(busca)))
    .sort((a, b) => (b.atualizadoEm?.seconds || 0) - (a.atualizadoEm?.seconds || 0));
  return <Pagina navigation={navigation} titulo={equipe(user.tipo) || user.tipo === 'corretor' ? 'Propostas e negociações' : 'Minhas propostas'}>
    {user.tipo === 'proprietario' && <Campo label="Exibir propostas" valor={modo} alterar={setModo} opcoes={[{ valor: 'cliente', texto: 'Enviadas por mim' }, { valor: 'proprietario', texto: 'Recebidas nos meus imóveis' }]} />}
    {user.tipo === 'corretor' && <Campo label="Exibir propostas" valor={modo} alterar={setModo} opcoes={[{ valor: 'equipe', texto: 'Atribuídas a mim' }, { valor: 'cliente', texto: 'Enviadas por mim' }]} />}
    <Campo label="Buscar imóvel, cliente ou corretor" valor={busca} alterar={setBusca} /><Campo label="Situação" valor={filtro} alterar={setFiltro} opcoes={[{ valor: 'todas', texto: 'Todas' }, 'enviada', 'em_analise', 'contraproposta', 'aceita', 'recusada', 'cancelada', 'concluida']} />
    <Estado {...lista} vazio={!itens.length} />{itens.map((p) => <Card key={p.id}><Badge status={p.status} /><Text style={s.subtitulo}>{p.imovelTitulo}</Text><Text style={[s.texto, { fontSize: 20, fontWeight: '700' }]}>{moeda(p.valor)}</Text><Text style={s.muted}>{p.clienteNome} • {p.corretorNome || 'Aguardando responsável'}</Text>
      <Botao texto="Acompanhar negociação" onPress={() => navigation.navigate('Negociacao', { id: p.id })} /></Card>)}
  </Pagina>;
}
export function Negociacao({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const [p, setP] = useState(null), [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false), [mensagem, setMensagem] = useState(''), [contra, setContra] = useState(''), [responsavel, setResponsavel] = useState(null);
  const eventos = useColecao(`propostas/${route.params.id}/historico`);
  const pessoas = useColecao('usuarios', [], equipe(user.tipo));
  const trava = useRef(false);
  useEffect(() => onSnapshot(doc(database, 'propostas', route.params.id), (snap) => {
    setP(snap.exists() ? { ...snap.data(), id: snap.id } : null);
    if (!snap.exists()) setErro('Proposta não encontrada.');
  }, (e) => setErro(erroAmigavel(e))), [route.params.id]);
  const gestor = p && (equipe(user.tipo) || (user.tipo === 'corretor' && p.corretorId === user.uid));
  const cliente = p?.clienteId === user.uid;
  async function agir(status, atribuir = false, contrapropor = false) {
    if (trava.current || !p) return;
    if (!mensagem.trim()) { setErro('Escreva uma mensagem para registrar a alteração no histórico.'); return; }
    trava.current = true; setOcupado(true); setErro('');
    try {
      await negociarProposta(p.id, { status, mensagem, versao: p.versao,
        ...(contrapropor ? { contrapropostaValor: contra } : {}),
        ...(atribuir ? { corretorId: responsavel ?? p.corretorId, corretorNome: pessoas.itens.find((i) => i.id === (responsavel ?? p.corretorId))?.nome || '' } : {}),
      }, user);
      setMensagem(''); setContra(''); setResponsavel(null);
    } catch (e) { setErro(erroAmigavel(e)); } finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina navigation={navigation} titulo="Negociação"><Mensagem erro texto={erro} />
    {p && <><Card><Badge status={p.status} /><Text style={s.subtitulo}>{p.imovelTitulo}</Text><Text style={[s.texto, { fontSize: 22, fontWeight: '700' }]}>{moeda(p.valor)}</Text>
      {p.contrapropostaValor > 0 && <Text style={s.muted}>Última contraproposta: {moeda(p.contrapropostaValor)}</Text>}
      <Text style={s.muted}>Cliente: {p.clienteNome} • {p.clienteEmail} • {p.clienteTelefone}</Text><Text style={s.muted}>Corretor: {p.corretorNome || 'Não atribuído'}</Text>
    </Card><Text style={s.subtitulo}>Histórico da negociação</Text><Estado {...eventos} vazio={!eventos.itens.length} />
      {[...eventos.itens].sort((a, b) => a.versao - b.versao).map((e) => <Card key={e.id}><Text style={s.label}>{e.autorNome} • {STATUS[e.status]}</Text>
        <Text style={s.texto}>{e.mensagem}</Text><Text style={s.muted}>{moeda(e.valor)}{e.contrapropostaValor > 0 ? ` • Contraproposta: ${moeda(e.contrapropostaValor)}` : ''}</Text>
        <Text style={s.muted}>{e.criadoEm?.toDate?.().toLocaleString('pt-BR') || 'Enviando…'}</Text></Card>)}
      {!TERMINAIS.includes(p.status) && <Card><Campo label="Mensagem para o histórico" longo valor={mensagem} alterar={setMensagem} editable={!ocupado} />
        <Botao secundario texto="Enviar mensagem" desativado={ocupado} onPress={() => agir(p.status)} />
        {equipe(user.tipo) && <><Estado {...pessoas} /><Campo label="Atribuir corretor" valor={responsavel ?? p.corretorId} alterar={setResponsavel} opcoes={[{ valor: '', texto: 'Sem corretor' }, ...pessoas.itens.filter((i) => i.tipo === 'corretor' && i.ativo !== false).map((i) => ({ valor: i.id, texto: i.nome }))]} editable={!ocupado} />
          <Botao secundario texto="Salvar responsável" desativado={ocupado} onPress={() => agir(p.status, true)} /></>}
        {gestor && ['enviada', 'em_analise', 'contraproposta'].includes(p.status) && <>
          {p.status === 'enviada' && <Botao secundario texto="Iniciar análise" desativado={ocupado} onPress={() => agir('em_analise')} />}
          <Campo label="Valor da contraproposta (R$)" numero valor={contra} alterar={setContra} editable={!ocupado} /><Botao texto="Enviar contraproposta" desativado={ocupado} onPress={() => agir('contraproposta', false, true)} />
          {p.status !== 'contraproposta' && <Botao texto="Aceitar proposta" desativado={ocupado} onPress={() => agir('aceita')} />}
          <Botao secundario texto="Recusar proposta" desativado={ocupado} onPress={() => agir('recusada')} />
        </>}
        {cliente && p.status === 'contraproposta' && <><Botao texto="Aceitar contraproposta" desativado={ocupado} onPress={() => agir('aceita')} /><Botao secundario texto="Recusar contraproposta" desativado={ocupado} onPress={() => agir('recusada')} /></>}
        {cliente && ['enviada', 'em_analise', 'contraproposta'].includes(p.status) && <Botao secundario texto="Cancelar proposta" desativado={ocupado} onPress={() => agir('cancelada')} />}
        {gestor && p.status === 'aceita' && <><Text style={s.muted}>Conclua após a formalização. O imóvel será marcado como vendido ou alugado e sairá do catálogo.</Text>
          <Botao texto="Concluir negociação" desativado={ocupado} onPress={() => agir('concluida')} /><Botao secundario texto="Cancelar negociação" desativado={ocupado} onPress={() => agir('cancelada')} /></>}
      </Card>}
    </>}
  </Pagina>;
}
