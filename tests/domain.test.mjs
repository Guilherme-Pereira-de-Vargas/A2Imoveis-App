import assert from 'node:assert/strict';
import test from 'node:test';
import { dataVisita, disponivel, estimativa, filtrarImoveis, fotosImovel, idAgenda, moeda, numero, telefoneValido, validarImovel } from '../utils/domain.js';

test('valores monetários brasileiros, decimais e entradas inválidas', () => {
  for (const [entrada, esperado] of [['R$ 250.000,90', 250000.9], ['250000.90', 250000.9], ['1.000', 1000], ['10,5', 10.5], [250000, 250000], ['0', 0]]) assert.equal(numero(entrada), esperado);
  for (const entrada of ['', 'abc', '-1', '12,3,4', '1.2.3', Infinity, null]) assert.ok(Number.isNaN(numero(entrada)));
  assert.equal(moeda('consultar'), 'Consultar valor');
});
test('fotos novas e legadas são combinadas sem duplicação', () => {
  assert.deepEqual(fotosImovel({ fotos: ['nova', 'igual'], imagem: 'antiga', imagens: ['igual', null, ''] }), ['nova', 'igual', 'antiga']);
  assert.deepEqual(fotosImovel(), []);
});
test('filtros combinam categoria, localização, finalidade e valores numéricos', () => {
  const lista = [
    { id: '1', titulo: 'Casa ótima', tipo: 'Casa', cidade: 'Criciúma', bairro: 'Centro', finalidade: 'Venda', preco: '250.000,00' },
    { id: '2', titulo: 'Casa ótima', tipo: 'Casa', cidade: 'Criciúma', bairro: 'Centro', finalidade: 'Locação', preco: 2000 },
    { id: '3', titulo: 'Apartamento', tipo: 'Apartamento', cidade: 'Criciúma', bairro: 'Centro', finalidade: 'Venda', preco: 'Consultar' },
  ];
  assert.deepEqual(filtrarImoveis(lista, { cidade: 'criciuma', bairro: 'centro', tipo: 'Casa', finalidade: 'Venda', min: '200.000', max: '300.000' }).map((i) => i.id), ['1']);
  assert.deepEqual(filtrarImoveis(lista, { busca: 'casa criciuma', ordem: 'Menor preço' }).map((i) => i.id), ['2', '1']);
  assert.equal(filtrarImoveis(lista, { min: '1' }).length, 2);
});
test('datas impossíveis, anos bissextos, horários e chave única da reserva', () => {
  assert.equal(dataVisita('31/02/2028', '09:00'), null);
  assert.equal(dataVisita('29/02/2027', '09:00'), null);
  assert.ok(dataVisita('29/02/2028', '09:00') instanceof Date);
  assert.equal(dataVisita('29/02/2028', '09:30'), null);
  assert.equal(idAgenda('casa1', '03/12/2027', '14:00'), 'casa1_2027-12-03_1400');
});
test('estimativa de construção calcula área, custo e extras sem aceitar entradas inválidas', () => {
  assert.equal(estimativa('100', '2.500,00', '5.000,00'), 255000);
  assert.equal(estimativa('25,50', '1000,99', '0'), 25525.25);
  assert.ok(Number.isNaN(estimativa('0', '2500', '0')));
  assert.ok(Number.isNaN(estimativa('100', '2500', '-1')));
});
test('validação do imóvel exige dados, fotos, preço e números válidos', () => {
  const valido = { titulo: 'Casa de teste', tipo: 'Casa', finalidade: 'Venda', cidade: 'Criciúma', bairro: 'Centro', endereco: 'Rua A', preco: '200.000,00', telefone: '48999999999', fotos: ['https://example.com/foto.jpg'], area: '', quartos: 2, banheiros: 1, vagas: 0 };
  assert.equal(validarImovel(valido), '');
  for (const alteracao of [{ preco: 'abc' }, { fotos: [] }, { quartos: '1,5' }, { telefone: '123' }, { area: '-1' }, { cidade: '' }]) assert.notEqual(validarImovel({ ...valido, ...alteracao }), '');
  assert.ok(telefoneValido('+55 (48) 99999-9999'));
  assert.ok(!disponivel({ publicado: true, situacao: 'vendido' }));
});
