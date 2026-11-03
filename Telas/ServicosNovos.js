import React, { useContext, useRef, useState } from 'react';
import { Linking, Text } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { useColecao } from '../hooks/useColecao';
import { Badge, Botao, Campo, Card, Estado, Mensagem, Pagina, s } from '../Componentes/UI';
import { atualizarServico } from '../services/agenda';
import { dataVisita, disponivel, equipe, erroAmigavel, estimativa, HORARIOS, moeda, normalizar, numero, STATUS, telefoneValido } from '../utils/domain';
import { CONFIG_SERVICOS as CONFIG, ETAPAS_FINANCIAMENTO } from '../utils/servicosConfig';

function Resultado({ pedido }) {
  return <>
    <Badge status={pedido.status} />
    {!!pedido.corretorNome && <Text style={s.muted}>Responsável: {pedido.corretorNome}</Text>}
    {pedido.tipo === 'visita' && <Text style={s.muted}>{pedido.status === 'confirmado' ? 'Confirmado' : 'Solicitado'}: {pedido.dataConfirmada || pedido.dados.data} às {pedido.horarioConfirmado || pedido.dados.horario}</Text>}
    {!!pedido.resposta && <Text style={s.texto}>{pedido.resposta}</Text>}
    {!!pedido.etapaFinanciamento && <Text style={s.muted}>Financiamento: {pedido.etapaFinanciamento}</Text>}
    {pedido.valorAvaliacao > 0 && <Text style={s.muted}>Avaliação estimada: {moeda(pedido.valorAvaliacao)}</Text>}
    {pedido.estimativaTotal > 0 && <><Text style={s.muted}>Construção: {pedido.areaEstimada} m² × {moeda(pedido.custoM2)} + {moeda(pedido.custosExtras || 0)} = {moeda(pedido.estimativaTotal)}</Text>
      <Text style={s.muted}>Estimativa informativa da equipe, sujeita ao projeto, vistoria e orçamento final.</Text></>}
  </>;
}
export function TelaServico({ tipo, navigation, route }) {
  const { user } = useContext(AuthContext);
  const [dados, setDados] = useState({}), [telefone, setTelefone] = useState(user.telefone || ''), [nome, setNome] = useState(user.nome || '');
  const [imovelId, setImovelId] = useState(route.params?.imovel?.id || ''), [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(''), [aviso, setAviso] = useState('');
  const trava = useRef(false);
  const lista = useColecao('solicitacoesServicos', [['usuarioId', '==', user.uid]]);
  const imoveis = useColecao('imoveis', [['publicado', '==', true], ['catalogoSeguro', '==', true]], tipo === 'visita');
  const config = CONFIG[tipo];
  async function enviar() {
    if (trava.current) return;
    setErro(''); setAviso('');
    if (nome.trim().length < 2 || !telefoneValido(telefone)) { setErro('Informe seu nome e um telefone válido com DDD.'); return; }
    for (const c of config.campos) {
      const valor = (dados[c.id] || '').trim();
      if (!c.opcional && !valor) { setErro(`Preencha: ${c.label}.`); return; }
      if (valor && c.numero && !(numero(valor) >= (c.id === 'entrada' ? 0 : 0.01))) { setErro(`Informe um valor válido em: ${c.label}.`); return; }
    }
    const imovel = imoveis.itens.find((i) => i.id === imovelId && disponivel(i));
    if (tipo === 'visita') {
      const data = dataVisita(dados.data, dados.horario);
      if (!imovel || !data || data <= new Date()) { setErro('Escolha um imóvel disponível e uma data/horário futuros válidos.'); return; }
    }
    trava.current = true; setOcupado(true);
    try {
      await addDoc(collection(database, 'solicitacoesServicos'), {
        usuarioId: user.uid, nome: nome.trim(), telefone: telefone.trim(), email: user.email, tipo,
        dados: Object.fromEntries(config.campos.map((c) => [c.id, (dados[c.id] || '').trim()])),
        imovelId: imovel?.id || '', imovelTitulo: imovel?.titulo || '', corretorId: imovel?.corretorId || '', corretorNome: imovel?.corretorNome || '',
        status: 'pendente', resposta: '', atualizadoPor: '', agendaId: '', agendaCorretorId: '', dataConfirmada: '', horarioConfirmado: '',
        etapaFinanciamento: '', valorAvaliacao: 0, areaEstimada: 0, custoM2: 0, custosExtras: 0, estimativaTotal: 0,
        criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
      });
      setDados({}); setAviso('Solicitação enviada. Acompanhe o retorno abaixo.');
    } catch (e) { setErro(erroAmigavel(e)); } finally { trava.current = false; setOcupado(false); }
  }
  const historico = lista.itens.filter((p) => p.tipo === tipo).sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
  return <Pagina navigation={navigation} titulo={config.titulo} descricao={config.descricao}><Card>
    <Campo label="Nome" valor={nome} alterar={setNome} maxLength={100} editable={!ocupado} /><Campo label="Telefone com DDD" valor={telefone} alterar={setTelefone} keyboardType="phone-pad" maxLength={20} editable={!ocupado} />
    {tipo === 'visita' && <><Estado {...imoveis} /><Campo label="Buscar imóvel" valor={busca} alterar={setBusca} editable={!ocupado} />
      <Text style={s.muted}>Selecionado: {imoveis.itens.find((i) => i.id === imovelId)?.titulo || 'Nenhum'}</Text>
      <Campo label="Imóvel" valor={imovelId} alterar={setImovelId} opcoes={imoveis.itens.filter((i) => disponivel(i) && normalizar(`${i.titulo} ${i.cidade}`).includes(normalizar(busca))).slice(0, 15).map((i) => ({ valor: i.id, texto: `${i.titulo} — ${i.cidade}` }))} editable={!ocupado} /></>}
    {config.campos.map((c) => <Campo key={c.id} {...c} maxLength={c.limite || (c.longo ? 1500 : 160)} valor={dados[c.id] || ''} alterar={(v) => setDados((a) => ({ ...a, [c.id]: v }))} editable={!ocupado} />)}
    {tipo === 'terreno' && <Text style={s.muted}>A aprovação do crédito e as condições do financiamento dependem da análise da Caixa. Nossa equipe acompanha as etapas com você.</Text>}
    <Mensagem erro texto={erro} /><Mensagem texto={aviso} /><Botao texto="Enviar solicitação" onPress={enviar} carregando={ocupado} />
  </Card><Text style={s.subtitulo}>Meus pedidos deste serviço</Text><Estado {...lista} vazio={!historico.length} />
    {historico.map((pedido) => <Historico key={pedido.id} pedido={pedido} user={user} />)}
  </Pagina>;
}
function Historico({ pedido, user }) {
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('');
  return <Card><Text style={s.subtitulo}>{pedido.imovelTitulo || CONFIG[pedido.tipo]?.titulo}</Text><Resultado pedido={pedido} />
    {!['cancelado', 'concluido'].includes(pedido.status) && <Botao secundario texto="Cancelar solicitação" carregando={ocupado} onPress={async () => {
      if (ocupado) return; setOcupado(true); setErro('');
      try { await atualizarServico(pedido.id, { status: 'cancelado' }, user.uid); } catch (e) { setErro(erroAmigavel(e)); } finally { setOcupado(false); }
    }} />}<Mensagem erro texto={erro} /></Card>;
}
function PedidoAdmin({ pedido, pessoas, user }) {
  const [d, setD] = useState({ status: pedido.status, resposta: pedido.resposta || '', corretorId: pedido.corretorId || '', corretorNome: pedido.corretorNome || '',
    dataConfirmada: pedido.dataConfirmada || pedido.dados.data || '', horarioConfirmado: pedido.horarioConfirmado || pedido.dados.horario || '',
    etapaFinanciamento: pedido.etapaFinanciamento || '', valorAvaliacao: pedido.valorAvaliacao || '', areaEstimada: pedido.areaEstimada || pedido.dados.area || '', custoM2: pedido.custoM2 || '', custosExtras: pedido.custosExtras || '0' });
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(''), [aviso, setAviso] = useState('');
  const campo = (k) => (v) => { setAviso(''); setD((a) => ({ ...a, [k]: v })); };
  const construcao = pedido.tipo === 'terreno' || (pedido.tipo === 'avaliacao' && pedido.dados.finalidade === 'Construção');
  const total = estimativa(d.areaEstimada, d.custoM2, d.custosExtras || '0');
  async function salvar() {
    if (ocupado) return;
    if ((d.custoM2 || d.custosExtras !== '0') && construcao && !Number.isFinite(total)) { setErro('Preencha área, custo por m² e custos extras com valores válidos.'); return; }
    if (d.valorAvaliacao !== '' && !(numero(d.valorAvaliacao) > 0)) { setErro('Informe uma avaliação válida.'); return; }
    setOcupado(true); setErro(''); setAviso('');
    try {
      await atualizarServico(pedido.id, { ...d, valorAvaliacao: d.valorAvaliacao ? numero(d.valorAvaliacao) : 0,
        areaEstimada: construcao && Number.isFinite(total) ? numero(d.areaEstimada) : 0, custoM2: construcao && Number.isFinite(total) ? numero(d.custoM2) : 0,
        custosExtras: construcao && Number.isFinite(total) ? numero(d.custosExtras || '0') : 0, estimativaTotal: construcao && Number.isFinite(total) ? total : 0,
      }, user.uid); setAviso('Atendimento atualizado.');
    } catch (e) { setErro(erroAmigavel(e)); } finally { setOcupado(false); }
  }
  return <Card><Text style={s.subtitulo}>{pedido.nome}</Text><Text style={s.muted}>{pedido.telefone} • {pedido.email}</Text>
    <Text style={s.texto}>{pedido.imovelTitulo}</Text>
    {CONFIG[pedido.tipo]?.campos.map((c) => pedido.dados[c.id] ? <Text key={c.id} style={s.muted}>{c.label}: {pedido.dados[c.id]}</Text> : null)}
    <Resultado pedido={pedido} />
    {equipe(user.tipo) && <Campo label="Corretor responsável" valor={d.corretorId} alterar={(v) => setD((a) => ({ ...a, corretorId: v, corretorNome: pessoas.find((p) => p.id === v)?.nome || '' }))}
      opcoes={[{ valor: '', texto: 'Sem responsável' }, ...pessoas.filter((p) => p.tipo === 'corretor' && p.ativo !== false).map((p) => ({ valor: p.id, texto: p.nome }))]} editable={!ocupado} />}
    <Campo label="Situação" valor={d.status} alterar={campo('status')} opcoes={['pendente', pedido.tipo === 'visita' ? 'confirmado' : 'em_atendimento', 'concluido', 'cancelado']} editable={!ocupado} />
    {pedido.tipo === 'visita' && <><Campo label="Data confirmada (DD/MM/AAAA)" valor={d.dataConfirmada} alterar={campo('dataConfirmada')} maxLength={10} editable={!ocupado} />
      <Campo label="Horário confirmado" valor={d.horarioConfirmado} alterar={campo('horarioConfirmado')} opcoes={HORARIOS} editable={!ocupado} /></>}
    {pedido.tipo === 'terreno' && <Campo label="Etapa do financiamento" valor={d.etapaFinanciamento} alterar={campo('etapaFinanciamento')} opcoes={ETAPAS_FINANCIAMENTO} editable={!ocupado} />}
    {pedido.tipo === 'avaliacao' && pedido.dados.finalidade !== 'Construção' && <Campo label="Valor estimado do imóvel (R$)" numero valor={d.valorAvaliacao} alterar={campo('valorAvaliacao')} editable={!ocupado} />}
    {construcao && <><Campo label="Área da estimativa (m²)" numero valor={d.areaEstimada} alterar={campo('areaEstimada')} editable={!ocupado} /><Campo label="Custo por m² (R$)" numero valor={d.custoM2} alterar={campo('custoM2')} editable={!ocupado} /><Campo label="Custos extras (R$)" numero valor={d.custosExtras} alterar={campo('custosExtras')} editable={!ocupado} />
      {Number.isFinite(total) && <Text style={s.subtitulo}>Estimativa: {moeda(total)}</Text>}</>}
    <Campo label="Resposta ao cliente" longo valor={d.resposta} alterar={campo('resposta')} editable={!ocupado} />
    <Mensagem erro texto={erro} /><Mensagem texto={aviso} /><Botao texto="Salvar atendimento" onPress={salvar} carregando={ocupado} />
    <Botao secundario texto="Abrir WhatsApp do cliente" onPress={async () => { try { const n = pedido.telefone.replace(/\D/g, ''); await Linking.openURL(`https://wa.me/${n.length > 11 ? n : `55${n}`}`); } catch { setErro('Não foi possível abrir o WhatsApp.'); } }} />
  </Card>;
}
export function SolicitacoesServicos({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const tipo = route.params?.tipo;
  const lista = useColecao('solicitacoesServicos', equipe(user.tipo) ? [['tipo', '==', tipo]] : [['corretorId', '==', user.uid]]);
  const pessoas = useColecao('usuarios', [], equipe(user.tipo));
  const [filtro, setFiltro] = useState('todos'), [busca, setBusca] = useState(''), [data, setData] = useState('');
  const itens = lista.itens.filter((p) => p.tipo === tipo && (filtro === 'todos' || p.status === filtro) &&
    normalizar(`${p.nome} ${p.email} ${p.imovelTitulo}`).includes(normalizar(busca)) && (!data || (p.dataConfirmada || p.dados.data || '').includes(data)))
    .sort((a, b) => tipo === 'visita' ? (dataVisita(a.dataConfirmada || a.dados.data, a.horarioConfirmado || a.dados.horario)?.getTime() || 0) - (dataVisita(b.dataConfirmada || b.dados.data, b.horarioConfirmado || b.dados.horario)?.getTime() || 0) : (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
  return <Pagina navigation={navigation} titulo={tipo === 'visita' ? 'Agenda de visitas' : CONFIG[tipo]?.titulo} descricao={equipe(user.tipo) ? 'Atribua responsáveis, responda aos clientes e acompanhe os pedidos.' : 'Atendimentos atribuídos a você.'}>
    <Campo label="Buscar cliente ou imóvel" valor={busca} alterar={setBusca} /><Campo label="Situação" valor={filtro} alterar={setFiltro} opcoes={[{ valor: 'todos', texto: 'Todas' }, 'pendente', tipo === 'visita' ? 'confirmado' : 'em_atendimento', 'concluido', 'cancelado']} />
    {tipo === 'visita' && <Campo label="Filtrar data (DD/MM/AAAA)" valor={data} alterar={setData} maxLength={10} opcional />}
    <Estado {...lista} vazio={!itens.length} />{equipe(user.tipo) && <Estado {...pessoas} />}
    {itens.map((pedido) => <PedidoAdmin key={`${pedido.id}-${pedido.atualizadoEm?.seconds || 0}-${pedido.atualizadoEm?.nanoseconds || 0}`} pedido={pedido} pessoas={pessoas.itens} user={user} />)}
  </Pagina>;
}
export const TerrenoConstrucao = (props) => <TelaServico {...props} tipo="terreno" />;
export const AvaliacaoImovel = (props) => <TelaServico {...props} tipo="avaliacao" />;
export const AgendarVisita = (props) => <TelaServico {...props} tipo="visita" />;
export const Atendimento = (props) => <TelaServico {...props} tipo="atendimento" />;
