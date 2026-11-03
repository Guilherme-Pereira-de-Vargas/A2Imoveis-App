export const ETAPAS_FINANCIAMENTO = ['Análise inicial', 'Documentação', 'Análise de crédito', 'Projeto e orçamento', 'Análise da Caixa', 'Contrato', 'Obra em andamento', 'Entregue'];
export const CONFIG_SERVICOS = {
  terreno: { titulo: 'Terreno + Construção', descricao: 'Solicite o acompanhamento do seu projeto e do financiamento pela Caixa.', campos: [
    { id: 'situacao', label: 'Você já tem terreno?', opcoes: ['Já tenho terreno', 'Ainda procuro um terreno'] },
    { id: 'cidade', label: 'Cidade de interesse' }, { id: 'endereco', label: 'Bairro ou endereço', opcional: true },
    { id: 'area', label: 'Área desejada (m²)', numero: true, opcional: true }, { id: 'orcamento', label: 'Orçamento aproximado (R$)', numero: true, opcional: true },
    { id: 'renda', label: 'Renda familiar mensal (R$)', numero: true, opcional: true }, { id: 'entrada', label: 'Entrada disponível (R$)', numero: true, opcional: true },
    { id: 'fgts', label: 'Pretende utilizar FGTS?', opcoes: ['Sim', 'Não', 'Ainda não sei'], opcional: true },
    { id: 'observacoes', label: 'Conte mais sobre seu projeto', longo: true, opcional: true },
  ] },
  avaliacao: { titulo: 'Avaliação de imóveis', descricao: 'Solicite avaliação para venda, locação ou uma estimativa dos custos de construção.', campos: [
    { id: 'tipoImovel', label: 'Tipo de imóvel', opcoes: ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Outro'] },
    { id: 'finalidade', label: 'Objetivo', opcoes: ['Venda', 'Locação', 'Construção'] }, { id: 'cidade', label: 'Cidade' }, { id: 'endereco', label: 'Endereço e bairro' },
    { id: 'area', label: 'Área aproximada (m²)', numero: true, opcional: true }, { id: 'observacoes', label: 'Características do imóvel ou projeto', longo: true, opcional: true },
  ] },
  visita: { titulo: 'Agende uma visita', descricao: 'Sugira uma data e aguarde a confirmação da equipe antes de comparecer.', campos: [
    { id: 'data', label: 'Data desejada (DD/MM/AAAA)', limite: 10 },
    { id: 'horario', label: 'Horário desejado', opcoes: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
    { id: 'observacoes', label: 'Observações', longo: true, opcional: true },
  ] },
  atendimento: { titulo: 'Fale com um corretor', descricao: 'Envie sua dúvida e acompanhe o retorno do profissional responsável.', campos: [
    { id: 'assunto', label: 'Assunto', opcoes: ['Comprar', 'Alugar', 'Vender', 'Construir', 'Outras dúvidas'] },
    { id: 'preferencia', label: 'Como prefere receber o contato?', opcoes: ['WhatsApp', 'Telefone', 'E-mail'] },
    { id: 'mensagem', label: 'Mensagem', longo: true },
  ] },
};
