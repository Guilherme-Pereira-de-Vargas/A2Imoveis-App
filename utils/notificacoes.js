export function criarAvisos(origem, origemId, anterior, atual, remetenteId) {
  const nome = String(atual.imovelTitulo || atual.titulo || 'seu imóvel').slice(0, 100);
  let tipo, titulo, mensagem, destinatarios = [], dados = {};
  if (origem === 'solicitacoes_anuncios' || origem === 'imoveis') {
    destinatarios = [atual.proprietarioId];
    dados = { imovelId: atual.imovelId || origemId };
    if (atual.publicado === true && (anterior.publicado !== true || anterior.status !== atual.status)) {
      tipo = 'anuncio_publicado'; titulo = 'Seu anúncio foi publicado'; mensagem = `O anúncio “${nome}” já está disponível no catálogo.`;
    } else if (atual.status === 'recusado' && anterior.status !== 'recusado') {
      tipo = 'anuncio_recusado'; titulo = 'Seu anúncio precisa de ajustes'; mensagem = `A equipe analisou “${nome}”. Confira o retorno e faça os ajustes solicitados.`;
    } else if (anterior.publicado === true && atual.publicado === false) {
      tipo = 'anuncio_atualizado'; titulo = 'Atualização no seu anúncio'; mensagem = `O anúncio “${nome}” foi retirado do catálogo. Consulte a situação em Meus anúncios.`;
    }
  } else if (origem === 'solicitacoesServicos') {
    destinatarios = [atual.usuarioId]; dados = { tipoServico: atual.tipo };
    if (atual.tipo === 'visita' && atual.status === 'confirmado' && (anterior.status !== 'confirmado' || anterior.dataConfirmada !== atual.dataConfirmada || anterior.horarioConfirmado !== atual.horarioConfirmado)) {
      tipo = 'visita_confirmada'; titulo = 'Sua visita está confirmada'; mensagem = `${nome}: ${atual.dataConfirmada || atual.dados?.data}, às ${atual.horarioConfirmado || atual.dados?.horario}. Confira os detalhes antes de comparecer.`;
    } else if (atual.status === 'cancelado' && anterior.status !== 'cancelado') {
      tipo = 'servico_cancelado'; titulo = atual.tipo === 'visita' ? 'Atualização na sua visita' : 'Solicitação cancelada'; mensagem = 'A situação da sua solicitação mudou. Confira o retorno da equipe.';
    } else if (anterior.status !== atual.status || (atual.resposta && anterior.resposta !== atual.resposta) || anterior.etapaFinanciamento !== atual.etapaFinanciamento || anterior.valorAvaliacao !== atual.valorAvaliacao || anterior.estimativaTotal !== atual.estimativaTotal) {
      tipo = 'servico_atualizado'; titulo = 'Você recebeu um retorno da equipe'; mensagem = 'Há uma atualização na sua solicitação. Abra para acompanhar os detalhes.';
    }
  } else if (origem === 'propostas' && anterior.versao !== atual.versao) {
    destinatarios = [atual.clienteId, atual.proprietarioId, atual.corretorId];
    tipo = 'proposta_atualizada'; titulo = !anterior.versao ? 'Nova proposta recebida' : atual.status === 'contraproposta' && (anterior.status !== atual.status || anterior.contrapropostaValor !== atual.contrapropostaValor) ? 'Nova contraproposta recebida' : 'Novidade na sua negociação';
    mensagem = `Há uma atualização na negociação de “${nome}”. Acompanhe o histórico no aplicativo.`;
  }
  if (!tipo || !remetenteId) return [];
  return [...new Set(destinatarios.filter((id) => id && id !== remetenteId))].map((destinatarioId) => ({
    destinatarioId, remetenteId, origem, origemId, tipo, titulo, mensagem, dados,
    lidaEm: null,
  }));
}
export function destinoAviso(aviso) {
  if (aviso.origem === 'propostas') return { tela: 'Negociacao', parametros: { id: aviso.origemId } };
  if (aviso.origem === 'solicitacoes_anuncios' || aviso.origem === 'imoveis') return aviso.tipo === 'anuncio_publicado'
    ? { tela: 'DetalhesImovel', parametros: { imovelId: aviso.dados?.imovelId || aviso.origemId } } : { tela: 'MeusAnuncios' };
  const telas = { visita: 'AgendarVisita', terreno: 'TerrenoConstrucao', avaliacao: 'AvaliacaoImovel', atendimento: 'Atendimento' };
  return aviso.origem === 'solicitacoesServicos' && telas[aviso.dados?.tipoServico] ? { tela: telas[aviso.dados.tipoServico] } : null;
}
export const iconeAviso = (tipo) => ({ visita_confirmada: 'calendar-outline', anuncio_publicado: 'megaphone-outline', anuncio_recusado: 'create-outline', anuncio_atualizado: 'home-outline', servico_atualizado: 'chatbubble-ellipses-outline', servico_cancelado: 'calendar-clear-outline', proposta_atualizada: 'documents-outline' }[tipo] || 'notifications-outline');
export function ordenarAvisos(itens) {
  return [...itens].sort((a, b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0));
}
