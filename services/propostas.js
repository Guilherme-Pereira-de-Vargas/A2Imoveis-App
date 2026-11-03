import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { disponivel, equipe, numero } from '../utils/domain';
import { registrarAvisos } from './avisos';

export const TERMINAIS = ['recusada', 'cancelada', 'concluida'];
export function transicaoProposta(atual, proximo, papel, autorCliente = false) {
  if (atual === proximo) return !TERMINAIS.includes(atual);
  if (autorCliente && proximo === 'cancelada') return ['enviada', 'em_analise', 'contraproposta'].includes(atual);
  if (autorCliente && atual === 'contraproposta' && ['aceita', 'recusada'].includes(proximo)) return true;
  if (['admin', 'dono', 'corretor'].includes(papel)) {
    return ({ enviada: ['em_analise', 'contraproposta', 'aceita', 'recusada'], em_analise: ['contraproposta', 'aceita', 'recusada'],
      contraproposta: ['contraproposta', 'recusada'], aceita: ['concluida', 'cancelada'] }[atual] || []).includes(proximo);
  }
  return false;
}
export async function criarProposta(imovelId, d, user) {
  const ref = doc(collection(database, 'propostas'));
  const evento = doc(collection(ref, 'historico'));
  const valor = numero(d.valor);
  if (!(valor > 0)) throw new Error('Informe um valor válido maior que zero.');
  await runTransaction(database, async (tx) => {
    const imovel = await tx.get(doc(database, 'imoveis', imovelId));
    if (!imovel.exists() || !disponivel(imovel.data())) throw new Error('Este imóvel não está mais disponível.');
    const i = imovel.data();
    if (i.proprietarioId === user.uid) throw new Error('Você não pode enviar uma proposta para seu próprio imóvel.');
    const p = { clienteId: user.uid, clienteNome: user.nome, clienteEmail: user.email, clienteTelefone: d.telefone.trim(),
      proprietarioId: i.proprietarioId, corretorId: i.corretorId || '', corretorNome: i.corretorNome || '', imovelId, imovelTitulo: i.titulo,
      finalidade: i.finalidade, valor, contrapropostaValor: 0, status: 'enviada', versao: 1, ultimoEventoId: evento.id,
      criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(), atualizadoPor: user.uid };
    tx.set(ref, p);
    tx.set(evento, { autorId: user.uid, autorNome: user.nome, mensagem: d.mensagem.trim(), status: 'enviada', valor, contrapropostaValor: 0, versao: 1, criadoEm: serverTimestamp() });
    registrarAvisos(tx, 'propostas', ref.id, {}, p, user.uid);
  });
  return ref.id;
}
export async function negociarProposta(id, d, user) {
  const ref = doc(database, 'propostas', id), evento = doc(collection(ref, 'historico'));
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Proposta não encontrada.');
    const p = snap.data(), status = d.status || p.status;
    const cliente = p.clienteId === user.uid;
    const gestor = equipe(user.tipo) || (user.tipo === 'corretor' && p.corretorId === user.uid);
    const soMensagem = status === p.status && d.contrapropostaValor == null && d.corretorId == null;
    if (d.versao !== p.versao) throw new Error('A proposta foi atualizada. Confira o histórico e tente novamente.');
    if (!soMensagem && !transicaoProposta(p.status, status, gestor ? user.tipo : '', cliente)) throw new Error('Esta alteração não é permitida para a situação atual.');
    if (soMensagem && TERMINAIS.includes(p.status)) throw new Error('Esta negociação já foi encerrada.');
    if (!d.mensagem?.trim()) throw new Error('Escreva uma mensagem para registrar no histórico.');
    let valor = p.valor, contra = p.contrapropostaValor;
    if (status === 'contraproposta' && !soMensagem) {
      contra = numero(d.contrapropostaValor);
      if (!gestor || !(contra > 0)) throw new Error('Informe um valor válido para a contraproposta.');
    }
    if (cliente && p.status === 'contraproposta' && status === 'aceita') valor = contra;
    if (status === 'aceita' || status === 'concluida') {
      const imovel = await tx.get(doc(database, 'imoveis', p.imovelId));
      if (!imovel.exists() || !disponivel(imovel.data())) throw new Error('O imóvel não está mais disponível para concluir esta negociação.');
      if (status === 'concluida') {
        const i = imovel.data();
        tx.update(doc(database, 'imoveis', p.imovelId), { publicado: false, situacao: i.finalidade === 'Locação' ? 'alugado' : 'vendido', atualizadoEm: serverTimestamp() });
        if (i.solicitacaoId) tx.update(doc(database, 'solicitacoes_anuncios', i.solicitacaoId), { publicado: false, atualizadoEm: serverTimestamp() });
      }
    }
    const alteracoes = { status, valor, contrapropostaValor: contra, versao: p.versao + 1, ultimoEventoId: evento.id, atualizadoEm: serverTimestamp(), atualizadoPor: user.uid };
    if (d.corretorId != null && equipe(user.tipo)) { alteracoes.corretorId = d.corretorId; alteracoes.corretorNome = d.corretorNome || ''; }
    tx.update(ref, alteracoes);
    tx.set(evento, { autorId: user.uid, autorNome: user.nome, mensagem: d.mensagem.trim(), status, valor, contrapropostaValor: contra, versao: p.versao + 1, criadoEm: serverTimestamp() });
    registrarAvisos(tx, 'propostas', id, p, { ...p, ...alteracoes }, user.uid);
  });
}
