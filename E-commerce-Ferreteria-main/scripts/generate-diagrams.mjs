import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Reproducible technical figures, derived from the actual schema and course docs.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'docs/diagramas');
await mkdir(output, { recursive: true });
const schema = await readFile(resolve(root, 'backend/prisma/schema.prisma'), 'utf8');
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map(([, name, body]) => ({
  name,
  lines: body
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean),
}));
const scalarTypes = new Set([
  'String',
  'Int',
  'Boolean',
  'DateTime',
  'Float',
  'Decimal',
  'BigInt',
  'Bytes',
  'Json',
]);
let er = 'erDiagram\n';
const edges = [];
for (const model of models) {
  const foreignKeys = new Set();
  for (const line of model.lines) {
    const relation = line.match(
      /^\w+\s+(\w+)(\?)?\s+@relation\((?:"[^"]+",\s*)?fields:\s*\[(\w+)\]/,
    );
    if (!relation) continue;
    const [, parent, optional, field] = relation;
    foreignKeys.add(field);
    const fieldLine = model.lines.find((x) => x.startsWith(field + ' ')) || '';
    edges.push(
      `    ${parent} ${optional ? 'o|' : '||'}--${fieldLine.includes('@unique') ? 'o|' : 'o{'} ${model.name} : ${field}`,
    );
  }
  er += `    ${model.name} {\n`;
  for (const line of model.lines) {
    const field = line.match(/^(\w+)\s+(\w+)(\?)?(?:\s|$)/);
    if (!field || !scalarTypes.has(field[2])) continue;
    const [, name, type, optional] = field;
    const keys = [];
    if (line.includes('@id')) keys.push('PK');
    if (foreignKeys.has(name)) keys.push('FK');
    if (line.includes('@unique')) keys.push('UK');
    er += `        ${type.toLowerCase()} ${name}${keys.length ? ' ' + keys.join(', ') : ''}${optional ? ' "nullable"' : ''}\n`;
  }
  er += '    }\n';
}
er += edges.join('\n') + '\n';
const architecture = await readFile(resolve(root, 'docs/ARQUITECTURA_CURSO.md'), 'utf8');
const blocks = [...architecture.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map((x) => x[1].trim());
if (blocks.length !== 2 || models.length < 10)
  throw new Error('No se encontraron las fuentes completas');
const diagrams = [
  ['01-modelo-er', er],
  ['02-arquitectura', blocks[0]],
  ['03-flujo-cliente-servidor', blocks[1]],
];
const paymentDocument = await readFile(resolve(root, 'docs/PAGOS_YAPE.md'), 'utf8');
const paymentDiagram = paymentDocument.match(/```mermaid\s*\n([\s\S]*?)```/);
if (!paymentDiagram) throw new Error('Falta el diagrama de pedidos y pagos');
diagrams.push(['04-pedido-pago-demo', paymentDiagram[1].trim()]);
const architectureSlide = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#52685b"/></marker></defs>
<rect width="1600" height="900" fill="#fffdf8"/>
<g font-family="Arial,sans-serif" fill="#202b25">
<rect x="60" y="56" width="56" height="6" rx="3" fill="#d75a20"/>
<text x="60" y="119" font-size="42" font-weight="700">Arquitectura de FerreMax</text>
<text x="60" y="155" font-size="21" fill="#52685b">Frontend Next.js · API Express · persistencia MySQL</text>
<g fill="none" stroke="#52685b" stroke-width="2.5" marker-end="url(#arrow)">
<path d="M420 265H580"/><path d="M800 330V420"/><path d="M1020 505H1330V620"/>
<path d="M580 550H240V620" stroke-dasharray="8 7"/>
</g>
<g fill="#ffffff" stroke="#d7dcd6" stroke-width="2">
<rect x="60" y="205" width="360" height="125" rx="14"/>
<rect x="580" y="205" width="440" height="125" rx="14"/>
<rect x="580" y="420" width="440" height="180" rx="14" stroke="#d75a20"/>
<rect x="1130" y="620" width="400" height="130" rx="14"/>
<rect x="60" y="620" width="360" height="130" rx="14" stroke-dasharray="8 7"/>
</g>
<g font-size="27" font-weight="700"><text x="88" y="251">Navegador</text><text x="608" y="251">Next.js 16</text><text x="608" y="466">Express / Node.js</text><text x="1158" y="668">MySQL + Prisma</text><text x="88" y="668">JSON persistente</text></g>
<g font-size="20" fill="#52685b"><text x="88" y="289">Cliente o personal de la tienda</text><text x="608" y="289">Páginas, navegación y carrito</text><text x="608" y="505">Validación Zod · JWT · roles</text><text x="608" y="541">Servicios: pedidos, ventas y FEFO</text><text x="608" y="577">Interfaz Repository / Unit</text><text x="1158" y="706">Relaciones y transacciones</text><text x="88" y="706">Alternativa solo para demo local</text></g>
<g font-size="18" fill="#52685b"><text x="438" y="244">HTTPS</text><text x="826" y="380">rewrite /api/*</text><text x="1135" y="483">Lectura y escritura</text><text x="1135" y="513">transaccional</text><text x="90" y="585">Driver alternativo</text></g>
<path d="M60 799H1530" stroke="#d7dcd6"/>
<text x="60" y="839" font-size="19" fill="#52685b">El navegador nunca accede directamente a MySQL. Los secretos permanecen en el servidor.</text>
<text x="60" y="870" font-size="16" fill="#52685b">Versión local funcional. Despliegue en nube pospuesto por indicación del estudiante.</text>
</g></svg>`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1100 } });
  await page.setContent(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>',
  );
  await page.addScriptTag({ path: resolve(root, 'node_modules/mermaid/dist/mermaid.min.js') });
  await page.evaluate(() =>
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'Arial, sans-serif',
      themeVariables: {
        primaryColor: '#fff8ee',
        primaryTextColor: '#202b25',
        primaryBorderColor: '#b65522',
        lineColor: '#53695c',
        secondaryColor: '#edf3ee',
        tertiaryColor: '#fffdf9',
        background: '#ffffff',
        fontSize: '17px',
      },
      er: { useMaxWidth: false },
      flowchart: { useMaxWidth: false, htmlLabels: false, curve: 'linear' },
      sequence: { useMaxWidth: false, actorMargin: 80, noteMargin: 20 },
    }),
  );
  for (let i = 0; i < diagrams.length; i++) {
    const [name, source] = diagrams[i];
    const svg =
      name === '02-arquitectura'
        ? architectureSlide
        : await page.evaluate(
            async ({ source, id }) => (await window.mermaid.render(id, source)).svg,
            { source, id: 'ferremax' + i },
          );
    await writeFile(resolve(output, name + '.mmd'), source);
    await writeFile(resolve(output, name + '.svg'), svg);
    await page.evaluate((svg) => {
      document.body.innerHTML = svg;
      document.body.style.margin = '0';
      document.body.style.background = '#ffffff';
    }, svg);
    await page.locator('svg').screenshot({ path: resolve(output, name + '.png'), timeout: 30000 });
    console.log(name + ': SVG + PNG generados');
  }
} finally {
  await browser.close();
}
