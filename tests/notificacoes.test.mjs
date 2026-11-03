import assert from 'node:assert/strict';
import test from 'node:test';
import { criarAvisos, destinoAviso, ordenarAvisos } from '../utils/notificacoes.js';

test('publicação gera aviso ao proprietário e não publica documentos ou valores no aviso', () => {
  const pedido = { proprietarioId: 'owner', titulo: 'Casa no Centro', publicado: false, status: 'pendente', comprovanteResidencia: 'segredo', preco: 250000 };
  const [aviso] = criarAvisos('solicitacoes_anuncios', 'pedido', pedido, { ...pedido, publicado: true, status: 'aprovado' }, 'admin');
  assert.equal(aviso.destinatarioId, 'owner'); assert.equal(aviso.tipo, 'anuncio_publicado'); assert.equal(aviso.lidaEm, null);
  assert.ok(!JSON.stringify(aviso).includes('segredo')); assert.ok(!JSON.stringify(aviso).includes('250000'));
  assert.deepEqual(destinoAviso(aviso), { tela: 'DetalhesImovel', parametros: { imovelId: 'pedido' } });
});
test('salvar novamente um anúncio já publicado não duplica avisos', () => {
  const d = { proprietarioId: 'owner', publicado: true, status: 'aprovado', titulo: 'Casa' };
  assert.equal(criarAvisos('solicitacoes_anuncios', 'p', d, { ...d }, 'admin').length, 0);
});
test('visita confirmada e remarcada informa data e horário corretos', () => {
  const pedido = { usuarioId: 'client', tipo: 'visita', status: 'pendente', imovelTitulo: 'Apartamento', dados: { data: '20/12/2027', horario: '14:00' } };
  const confirmado = { ...pedido, status: 'confirmado', dataConfirmada: '21/12/2027', horarioConfirmado: '15:00' };
  const aviso = criarAvisos('solicitacoesServicos', 'v', pedido, confirmado, 'broker')[0];
  assert.equal(aviso.tipo, 'visita_confirmada'); assert.match(aviso.mensagem, /21\/12\/2027.*15:00/);
  assert.deepEqual(destinoAviso(aviso), { tela: 'AgendarVisita' });
  assert.equal(criarAvisos('solicitacoesServicos', 'v', confirmado, { ...confirmado, horarioConfirmado: '16:00' }, 'broker').length, 1);
  assert.equal(criarAvisos('solicitacoesServicos', 'v', confirmado, { ...confirmado }, 'broker').length, 0);
});
test('cancelamento pelo próprio cliente não notifica a si mesmo', () => {
  const d = { usuarioId: 'client', tipo: 'visita', status: 'pendente' };
  assert.deepEqual(criarAvisos('solicitacoesServicos', 'v', d, { ...d, status: 'cancelado' }, 'client'), []);
});
test('resposta e estimativa da equipe geram aviso sem expor o conteúdo na prévia', () => {
  const d = { usuarioId: 'client', tipo: 'avaliacao', status: 'pendente', resposta: '', estimativaTotal: 0 };
  const [aviso] = criarAvisos('solicitacoesServicos', 'a', d, { ...d, resposta: 'Dados financeiros privados', estimativaTotal: 123000 }, 'admin');
  assert.equal(aviso.tipo, 'servico_atualizado'); assert.ok(!aviso.mensagem.includes('123000')); assert.ok(!aviso.mensagem.includes('financeiros'));
});
test('negociação avisa participantes sem repetir destinatário nem avisar o remetente', () => {
  const d = { versao: 1, status: 'enviada', clienteId: 'client', proprietarioId: 'owner', corretorId: 'owner', imovelTitulo: 'Casa' };
  const avisos = criarAvisos('propostas', 'p', d, { ...d, versao: 2 }, 'client');
  assert.deepEqual(avisos.map((n) => n.destinatarioId), ['owner']);
  assert.deepEqual(destinoAviso(avisos[0]), { tela: 'Negociacao', parametros: { id: 'p' } });
});
test('mensagem em contraproposta existente não anuncia uma nova contraproposta', () => {
  const d = { versao: 2, status: 'contraproposta', contrapropostaValor: 200000, clienteId: 'client', proprietarioId: 'owner' };
  assert.equal(criarAvisos('propostas', 'p', d, { ...d, versao: 3 }, 'client')[0].titulo, 'Novidade na sua negociação');
});
test('navegação aceita apenas destinos conhecidos e ignora tela recebida no payload', () => {
  assert.equal(destinoAviso({ origem: 'inventada', dados: { tela: 'InicialAdm' } }), null);
  assert.equal(destinoAviso({ origem: 'solicitacoesServicos', dados: { tipoServico: 'inventado' } }), null);
  assert.deepEqual(destinoAviso({ origem: 'solicitacoes_anuncios', origemId: 'a', tipo: 'anuncio_recusado' }), { tela: 'MeusAnuncios' });
});
test('ordenação preserva a lista original e coloca os avisos mais recentes primeiro', () => {
  const lista = [{ id: 'antigo', criadoEm: { toMillis: () => 100 } }, { id: 'novo', criadoEm: { toMillis: () => 200 } }];
  assert.deepEqual(ordenarAvisos(lista).map((n) => n.id), ['novo', 'antigo']); assert.equal(lista[0].id, 'antigo');
});
test('aviso guarda apenas os dados da central, sem cadastro de aparelho ou metadados de entrega', () => {
  const [aviso] = criarAvisos('imoveis', 'casa', {}, { proprietarioId: 'owner', publicado: true, titulo: 'Casa' }, 'admin');
  assert.deepEqual(Object.keys(aviso).sort(), ['destinatarioId', 'remetenteId', 'origem', 'origemId', 'tipo', 'titulo', 'mensagem', 'dados', 'lidaEm'].sort());
});
