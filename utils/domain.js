export const TIPOS_IMOVEL = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Outro'];
export const FINALIDADES = ['Venda', 'Locação'];
export const HORARIOS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
export const PAPEIS = ['cliente', 'proprietario', 'corretor', 'admin', 'dono'];
export const STATUS = {
  pendente: 'Pendente', em_atendimento: 'Em atendimento', confirmado: 'Confirmado',
  concluido: 'Concluído', cancelado: 'Cancelado', aprovado: 'Aprovado', recusado: 'Recusado',
  disponivel: 'Disponível', vendido: 'Vendido', alugado: 'Alugado', suspenso: 'Suspenso',
  enviada: 'Enviada', em_analise: 'Em análise', contraproposta: 'Contraproposta',
  aceita: 'Aceita', recusada: 'Recusada', cancelada: 'Cancelada', concluida: 'Concluída',
};
export const equipe = (tipo) => ['admin', 'dono'].includes(tipo);
export const profissional = (tipo) => equipe(tipo) || tipo === 'corretor';
export const normalizar = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const telefoneValido = (v) => /^(?:\d{10,11}|55\d{10,11})$/.test(String(v).replace(/\D/g, ''));
export function numero(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  const s = String(v ?? '').replace(/R\$\s*/g, '').replace(/\s/g, '');
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+(?:[.,]\d{1,2})?$/.test(s)) return Number(s.replace(',', '.'));
  return NaN;
}
export const moeda = (v) => Number.isFinite(numero(v))
  ? numero(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consultar valor';
export const fotosImovel = (i = {}) => [...new Set([...(Array.isArray(i.fotos) ? i.fotos : []), i.imagem,
  ...(Array.isArray(i.imagens) ? i.imagens : [])].filter((v) => typeof v === 'string' && v.trim()))];
export const disponivel = (i) => i?.publicado === true && i?.catalogoSeguro === true && (!i.situacao || i.situacao === 'disponivel');
export function dataVisita(data, horario) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data || '') || !HORARIOS.includes(horario)) return null;
  const [d, m, a] = data.split('/').map(Number);
  const [h, min] = horario.split(':').map(Number);
  const resultado = new Date(a, m - 1, d, h, min);
  return resultado.getFullYear() === a && resultado.getMonth() === m - 1 && resultado.getDate() === d ? resultado : null;
}
export const idAgenda = (imovelId, data, horario) => `${imovelId}_${data.split('/').reverse().join('-')}_${horario.replace(':', '')}`;
export function estimativa(area, custo, extras = 0) {
  const valores = [numero(area), numero(custo), numero(extras)];
  return valores.every(Number.isFinite) && valores[0] > 0 && valores[1] > 0 && valores[2] >= 0
    ? Math.round((valores[0] * valores[1] + valores[2]) * 100) / 100 : NaN;
}
export function filtrarImoveis(itens, f = {}) {
  return itens.filter((i) => {
    const texto = normalizar(`${i.titulo} ${i.cidade} ${i.bairro} ${i.tipo} ${i.codigo || i.id}`);
    const valor = numero(i.preco);
    return (!f.busca || normalizar(f.busca).split(/\s+/).every((t) => texto.includes(t))) &&
      (!f.tipo || normalizar(i.tipo) === normalizar(f.tipo)) &&
      (!f.cidade || normalizar(i.cidade).includes(normalizar(f.cidade))) &&
      (!f.bairro || normalizar(i.bairro).includes(normalizar(f.bairro))) &&
      (!f.finalidade || normalizar(i.finalidade) === normalizar(f.finalidade)) &&
      (!f.min || (Number.isFinite(valor) && valor >= numero(f.min))) &&
      (!f.max || (Number.isFinite(valor) && valor <= numero(f.max)));
  }).sort((a, b) => {
    if (f.ordem === 'Menor preço' || f.ordem === 'Maior preço') {
      const x = numero(a.preco), y = numero(b.preco);
      if (!Number.isFinite(x)) return Number.isFinite(y) ? 1 : 0;
      if (!Number.isFinite(y)) return -1;
      return (x - y) * (f.ordem === 'Maior preço' ? -1 : 1);
    }
    return (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0);
  });
}
export function validarImovel(d) {
  if (String(d.titulo || '').trim().length < 3) return 'Informe um título com pelo menos 3 caracteres.';
  if (!TIPOS_IMOVEL.includes(d.tipo) || !FINALIDADES.includes(d.finalidade)) return 'Selecione o tipo e a finalidade.';
  if (!d.cidade?.trim() || !d.bairro?.trim() || !d.endereco?.trim()) return 'Preencha cidade, bairro e endereço.';
  if (!(numero(d.preco) > 0)) return 'Informe um preço válido maior que zero.';
  if (!telefoneValido(d.telefone)) return 'Informe o telefone de contato com DDD.';
  for (const campo of ['quartos', 'banheiros', 'vagas']) {
    if (d[campo] !== '' && d[campo] != null && (!Number.isInteger(numero(d[campo])) || numero(d[campo]) < 0)) return `Informe um número inteiro válido em ${campo}.`;
  }
  if (d.area !== '' && d.area != null && !(numero(d.area) > 0)) return 'Informe uma área válida maior que zero.';
  if (!fotosImovel(d).length) return 'Adicione pelo menos uma foto.';
  return '';
}
export const erroAmigavel = (e) => {
  const code = String(e?.code || '');
  if (code.includes('permission-denied')) return 'Acesso não permitido. Confira sua conta e as regras do Firebase.';
  if (code.includes('unavailable') || code.includes('network')) return 'Sem conexão. Verifique a internet e tente novamente.';
  if (code.includes('requires-recent-login')) return 'Entre novamente na conta para continuar.';
  if (code.includes('invalid-credential')) return 'E-mail ou senha incorretos.';
  if (code.includes('email-already-in-use')) return 'Este e-mail já está cadastrado.';
  if (code.includes('invalid-email')) return 'Informe um e-mail válido.';
  if (code.includes('weak-password')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
  return e?.message || 'Não foi possível concluir. Tente novamente.';
};
