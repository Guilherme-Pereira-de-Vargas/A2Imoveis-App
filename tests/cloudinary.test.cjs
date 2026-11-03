const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { transformSync } = require('@babel/core');

function carregar(arquivo, substituicoes) {
  const filename = path.resolve(arquivo), mod = new Module(filename);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => substituicoes[id] || original(id);
  mod._compile(transformSync(fs.readFileSync(filename, 'utf8'), { plugins: ['@babel/plugin-transform-modules-commonjs'] }).code, filename);
  return mod.exports;
}
const link = 'https://res.cloudinary.com/boycvhni/image/upload/v1/comprovante.jpg';
function comprovantes({ tamanho = 100, upload = async () => link, abrir = async () => {} } = {}) {
  return carregar('services/comprovantes.js', {
    'expo-file-system': { File: class { constructor() { this.size = tamanho; } } },
    'react-native': { Linking: { openURL: abrir } },
    './cloudinary': { uploadImagem: upload },
  });
}
test('comprovante usa o arquivo nativo e devolve a URL Cloudinary para o pedido', async () => {
  let chamada;
  const service = comprovantes({ upload: async (...args) => { chamada = args; return link; } });
  assert.equal(await service.enviarComprovante({ uri: 'file:///comprovante.jpg', mimeType: 'image/jpeg' }), link);
  assert.deepEqual(chamada, ['file:///comprovante.jpg']);
});
test('comprovante aceita o limite de 5 MB', async () => {
  let uri;
  const service = comprovantes({ tamanho: 5 * 1024 * 1024, upload: async (value) => { uri = value; return link; } });
  await service.enviarComprovante({ uri: 'file:///comprovante.jpg', mimeType: 'image/jpeg' });
  assert.equal(uri, 'file:///comprovante.jpg');
});
test('arquivo vazio, não imagem e imagem acima de 5 MB não são enviados', async () => {
  let envios = 0;
  for (const [tamanho, mimeType] of [[0, 'image/jpeg'], [5 * 1024 * 1024 + 1, 'image/jpeg'], [100, 'application/pdf']]) {
    const service = comprovantes({ tamanho, upload: async () => { envios++; return link; } });
    await assert.rejects(service.enviarComprovante({ uri: 'file:///arquivo', mimeType }));
  }
  assert.equal(envios, 0);
});
test('abertura usa o link Cloudinary e rejeita links inválidos', async () => {
  let aberto;
  const service = comprovantes({ abrir: async (url) => { aberto = url; } });
  await service.abrirComprovante({ comprovanteResidencia: link }); assert.equal(aberto, link);
  for (const url of ['', 'javascript:alert(1)', 'https://example.com/arquivo', 'https://res.cloudinary.com.evil.test/arquivo']) await assert.rejects(service.abrirComprovante({ comprovanteResidencia: url }));
});
test('upload envia o arquivo nativo com o cloud e o preset existentes', async () => {
  let enviada, uriRecebida;
  const { uploadImagem } = carregar('services/cloudinary.js', {
    'expo-file-system': { File: class extends Blob { constructor(uri) { super(['imagem'], { type: 'image/jpeg' }); uriRecebida = uri; } } },
    'expo/fetch': { fetch: async (url, options) => { enviada = { url, options }; return { ok: true, json: async () => ({ secure_url: link }) }; } },
  });
  assert.equal(await uploadImagem('file:///imagem.jpg'), link);
  assert.equal(uriRecebida, 'file:///imagem.jpg');
  assert.equal(enviada.url, 'https://api.cloudinary.com/v1_1/boycvhni/image/upload');
  assert.equal(enviada.options.body.get('upload_preset'), 'a2_imoveis');
  assert.equal(enviada.options.body.get('file').size, 6);
});
