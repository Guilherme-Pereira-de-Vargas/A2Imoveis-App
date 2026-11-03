import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { dataVisita, disponivel, idAgenda } from '../utils/domain';
import { registrarAvisos } from './avisos';

export async function atualizarServico(id, alteracoes, uid) {
  await runTransaction(database, async (tx) => {
    const ref = doc(database, 'solicitacoesServicos', id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Solicitação não encontrada.');
    const pedido = snap.data();
    const novo = { ...pedido, ...alteracoes };
    const agendaAntiga = pedido.agendaId ? doc(database, 'agendaVisitas', pedido.agendaId) : null;
    const corretorAntigo = pedido.agendaCorretorId ? doc(database, 'agendaVisitas', pedido.agendaCorretorId) : null;
    let agendaNova, agendaCorretor, reserva;
    if (novo.tipo === 'visita' && novo.status === 'confirmado') {
      const data = dataVisita(novo.dataConfirmada || novo.dados.data, novo.horarioConfirmado || novo.dados.horario);
      if (!data || data <= new Date()) throw new Error('Confirme uma data e um horário futuros.');
      const imovel = await tx.get(doc(database, 'imoveis', novo.imovelId));
      if (!imovel.exists() || !disponivel(imovel.data())) throw new Error('Este imóvel não está mais disponível.');
      if (!novo.corretorId) throw new Error('Atribua um corretor antes de confirmar a visita.');
      novo.dataConfirmada = novo.dataConfirmada || novo.dados.data;
      novo.horarioConfirmado = novo.horarioConfirmado || novo.dados.horario;
      novo.agendaId = idAgenda(novo.imovelId, novo.dataConfirmada, novo.horarioConfirmado);
      agendaNova = doc(database, 'agendaVisitas', novo.agendaId);
      reserva = await tx.get(agendaNova);
      if (reserva.exists() && reserva.data().pedidoId !== id) throw new Error('Este imóvel já possui uma visita confirmada neste horário. Escolha outro.');
      novo.agendaCorretorId = idAgenda(`corretor_${novo.corretorId}`, novo.dataConfirmada, novo.horarioConfirmado);
      agendaCorretor = doc(database, 'agendaVisitas', novo.agendaCorretorId);
      const reservaCorretor = await tx.get(agendaCorretor);
      if (reservaCorretor.exists() && reservaCorretor.data().pedidoId !== id) throw new Error('Este corretor já possui uma visita confirmada neste horário. Escolha outro horário ou profissional.');
    } else { novo.agendaId = ''; novo.agendaCorretorId = ''; }
    // Todas as leituras ficam antes das gravações da transação.
    if (agendaAntiga && agendaAntiga.id !== novo.agendaId) tx.delete(agendaAntiga);
    if (corretorAntigo && corretorAntigo.id !== novo.agendaCorretorId) tx.delete(corretorAntigo);
    if (agendaNova) tx.set(agendaNova, { pedidoId: id, imovelId: novo.imovelId, data: novo.dataConfirmada, horario: novo.horarioConfirmado, corretorId: novo.corretorId });
    if (agendaCorretor) tx.set(agendaCorretor, { pedidoId: id, imovelId: novo.imovelId, data: novo.dataConfirmada, horario: novo.horarioConfirmado, corretorId: novo.corretorId });
    tx.update(ref, { ...alteracoes, agendaId: novo.agendaId, agendaCorretorId: novo.agendaCorretorId, ...(agendaNova ? { dataConfirmada: novo.dataConfirmada, horarioConfirmado: novo.horarioConfirmado } : {}), atualizadoEm: serverTimestamp(), atualizadoPor: uid });
    registrarAvisos(tx, 'solicitacoesServicos', id, pedido, novo, uid);
  });
}
