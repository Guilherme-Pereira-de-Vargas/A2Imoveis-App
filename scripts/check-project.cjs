const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const raiz = path.resolve(__dirname, '..');
const pastas = ['.', 'Telas', 'Componentes', 'contexts', 'services', 'hooks', 'utils', 'scripts', 'tests'];
let analisados = 0, erros = 0;
for (const pasta of pastas) for (const nome of fs.readdirSync(path.join(raiz, pasta))) {
  if (!/\.(js|cjs|mjs)$/.test(nome)) continue;
  const arquivo = path.join(raiz, pasta, nome);
  try {
    const ast = parser.parse(fs.readFileSync(arquivo, 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
    for (const item of ast.program.body) {
      const id = item.source?.value;
      if (!id?.startsWith('.')) continue;
      const base = path.resolve(path.dirname(arquivo), id);
      if (![base, `${base}.js`, `${base}.mjs`, `${base}.json`, path.join(base, 'index.js')].some((p) => fs.existsSync(p))) throw new Error(`Importação local não encontrada: ${id}`);
    }
    analisados++;
  } catch (e) { erros++; console.error(`${path.relative(raiz, arquivo)}: ${e.message}`); }
}
console.log(`${analisados} arquivos analisados; ${erros} erro(s).`);
process.exitCode = erros ? 1 : 0;
