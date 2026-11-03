import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, database } from '../firebaseConfig';
import { fotosImovel, normalizar, numero, TIPOS_IMOVEL } from '../utils/domain';
import { registrarAvisos } from './avisos';

// Somente os campos do catálogo são publicados. Comprovantes ficam no pedido privado.
export function dadosPublicos(d) {
  const base = {};
  for (const key of ['titulo', 'tipo', 'finalidade', 'cidade', 'bairro', 'endereco', 'descricao', 'telefone', 'proprietarioId', 'corretorId', 'corretorNome', 'codigo']) base[key] = String(d[key] || '').trim();
  base.tipo = TIPOS_IMOVEL.find((t) => normalizar(t) === normalizar(d.tipo)) || 'Outro';
  base.finalidade = ['locacao', 'alugar'].includes(normalizar(d.finalidade)) ? 'Locação' : 'Venda';
  const valorOpcional = (v) => Number.isFinite(numero(v)) && numero(v) >= 0 ? numero(v) : null;
  return { ...base, preco: Number.isFinite(numero(d.preco)) ? numero(d.preco) : 0, area: valorOpcional(d.area),
    quartos: valorOpcional(d.quartos), banheiros: valorOpcional(d.banheiros), vagas: valorOpcional(d.vagas), fotos: fotosImovel(d),
    situacao: d.situacao || 'disponivel', publicado: d.publicado !== false, catalogoSeguro: true,
    solicitacaoId: d.solicitacaoId || '', atualizadoEm: serverTimestamp() };
}
export async function revisarCatalogo() {
  const snapshot = await getDocs(collection(database, 'imoveis'));
  let corrigidos = 0;
  for (const d of snapshot.docs) {
    const alterado = await runTransaction(database, async (tx) => {
      const atual = await tx.get(d.ref);
      const i = atual.data();
      if (!i || (i.catalogoSeguro === true && !['comprovanteResidencia', 'proprietarioEmail', 'proprietarioNome'].some((k) => k in i))) return false;
      const pedidoRef = doc(database, 'solicitacoes_anuncios', i.solicitacaoId || d.id);
      const pedido = await tx.get(pedidoRef);
      const privado = { imovelId: d.id, publicado: i.publicado === true, corretorId: i.corretorId || '', corretorNome: i.corretorNome || '', atualizadoEm: serverTimestamp() };
      // Nunca substitui um comprovante mais recente que já está no pedido privado.
      for (const k of ['comprovanteResidencia', 'proprietarioNome', 'proprietarioEmail']) {
        if (i[k] && !pedido.data()?.[k]) privado[k] = i[k];
      }
      if (pedido.exists()) tx.update(pedidoRef, privado);
      else tx.set(pedidoRef, { ...i, status: 'aprovado', proprietarioNome: i.proprietarioNome || '', proprietarioEmail: i.proprietarioEmail || '', ...privado });
      tx.set(d.ref, { ...dadosPublicos(i), criadoEm: i.criadoEm || serverTimestamp() });
      return true;
    });
    if (alterado) corrigidos++;
  }
  return corrigidos;
}
export async function decidirAnuncio(id, decisao, motivo = '') {
  const pedidoRef = doc(database, 'solicitacoes_anuncios', id);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(pedidoRef);
    if (!snap.exists()) throw new Error('Solicitação não encontrada.');
    const pedido = snap.data();
    const imovelRef = doc(database, 'imoveis', pedido.imovelId || id);
    const imovel = await tx.get(imovelRef);
    if (decisao === 'aprovado') {
      if (!['pendente', 'recusado'].includes(pedido.status)) throw new Error('Este pedido já foi analisado. Atualize a lista.');
      tx.set(imovelRef, { ...dadosPublicos({ ...pedido, publicado: true, situacao: 'disponivel', solicitacaoId: id }), criadoEm: serverTimestamp() });
      tx.update(pedidoRef, { status: 'aprovado', publicado: true, imovelId: imovelRef.id, motivo: '', atualizadoEm: serverTimestamp() });
      registrarAvisos(tx, 'solicitacoes_anuncios', id, pedido, { ...pedido, status: 'aprovado', publicado: true, imovelId: imovelRef.id }, auth.currentUser?.uid);
    } else {
      // Arquivar preserva propostas, visitas e vínculos do imóvel.
      if (imovel.exists()) tx.set(imovelRef, { ...dadosPublicos({ ...imovel.data(), publicado: false, situacao: 'suspenso' }), criadoEm: imovel.data().criadoEm || serverTimestamp() });
      tx.update(pedidoRef, { status: decisao, publicado: false, motivo: motivo.trim(), atualizadoEm: serverTimestamp() });
      registrarAvisos(tx, 'solicitacoes_anuncios', id, pedido, { ...pedido, status: decisao, publicado: false }, auth.currentUser?.uid);
    }
  });
}
export async function salvarImovel(id, dados) {
  const ref = id ? doc(database, 'imoveis', id) : doc(collection(database, 'imoveis'));
  const batch = writeBatch(database);
  const payload = dadosPublicos(dados);
  payload.publicado = payload.situacao === 'disponivel' && dados.publicado === true;
  // Substituição remove campos privados dos registros antigos editados pela equipe.
  batch.set(ref, { ...payload, criadoEm: dados.criadoEm || serverTimestamp() });
  if (dados.solicitacaoId) {
    const pedidoRef = doc(database, 'solicitacoes_anuncios', dados.solicitacaoId);
    const pedido = (await getDoc(pedidoRef)).data() || {};
    batch.update(pedidoRef, { publicado: payload.publicado, corretorId: payload.corretorId, corretorNome: payload.corretorNome, atualizadoEm: serverTimestamp() });
    registrarAvisos(batch, 'solicitacoes_anuncios', dados.solicitacaoId, pedido, { ...pedido, publicado: payload.publicado }, auth.currentUser?.uid);
  } else {
    const anterior = id ? (await getDoc(ref)).data() || {} : {};
    registrarAvisos(batch, 'imoveis', ref.id, anterior, payload, auth.currentUser?.uid);
  }
  await batch.commit();
  return ref.id;
}
