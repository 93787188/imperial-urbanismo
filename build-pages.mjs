/* =========================================================
   Gera as páginas de empreendimento a partir de um template
   único + dados por projeto. Rode: node build-pages.mjs
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(ROOT, 'assets', 'img');

/* ---------- utilidades ---------- */
const DIC = {
  terreo:'Térreo', praca:'Praça', pan:'Panorâmica', subsolo:'Subsolo', 'sub':'Sub',
  solo:'Solo', voo:'Voo', passaro:'Pássaro', estudio:'Estúdio', suite:'Suíte',
  qt:'Quartos', qts:'Quartos', st:'Suítes', ap:'Apto', pav:'Pavimento',
  ao:'ao', de:'de', da:'da', do:'do', e:'e',
  dia:'Dia', noite:'Noite', frente:'Frente', direita:'Direita', esquerda:'Esquerda',
  academia:'Academia', coworking:'Coworking', gourmet:'Gourmet', festas:'Festas',
  laundry:'Lavanderia', lavanderia:'Lavanderia', minimarket:'Minimarket',
  skybar:'Sky Bar', rooftop:'Rooftop', bikeshop:'Bike Shop', bike:'Bike', shop:'Shop',
  fachada:'Fachada', nicho:'Nicho', torre:'Torre', lateral:'Lateral', detalhe:'Detalhe',
  hall:'Hall', living:'Living', livgin:'Living', penthouse:'Penthouse',
  brinquedoteca:'Brinquedoteca', beauty:'Beauty', gamer:'Gamer', lobby:'Lobby',
  quadra:'Quadra', mini:'Mini', pet:'Pet', care:'Care', piscina:'Piscina',
  adulto:'Adulto', infantil:'Infantil', playground:'Playground', podcast:'Podcast',
  sala:'Sala', entregas:'Entregas', massagem:'Massagem', sauna:'Sauna',
  wellness:'Wellness', wine:'Wine', beer:'Beer', billard:'Bilhar', masterchef:'MasterChef',
  sunset:'Sunset', espaco:'Espaço', acesso:'Acesso', noturna:'Noturna', noturno:'Noturno',
  diurna:'Diurna', fotomontagem:'Fotomontagem', humanizada:'Humanizada',
  inclinada:'Inclinada', cubo:'Cubo', interna:'Interna', final:'Final', dji:'Aérea'
};
const humanize = (slug) =>
  slug.replace(/\.jpg$/, '')
      .split('-')
      .filter(p => !/^\d{6,}$/.test(p) && p !== 'd')
      .map(p => DIC[p] || (/^\d+$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

const listImgs = (proj, cat) => {
  const dir = path.join(IMG, proj, cat);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort()
    .map(f => ({ src: `assets/img/${proj}/${cat}/${f}`, label: humanize(f) }));
};

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ---------- SVGs ---------- */
const LOGO = `<img src="assets/img/logo-imperial.svg" alt="Imperial Urbanismo">`;

const IC = {
  arrowR: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5h10M8.5 3.5l4 4-4 4"/></svg>',
  chevL:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
  chevR:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  close:  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l10 10M14 4L4 14"/></svg>',
  zoom:   '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke-width="1.4" stroke-linecap="round"><circle cx="6.6" cy="6.6" r="4.4"/><path d="M10 10l3 3M6.6 4.6v4M4.6 6.6h4"/></svg>',
  pin:    '<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M8.5 15.5s5.2-4.4 5.2-8.3a5.2 5.2 0 1 0-10.4 0c0 3.9 5.2 8.3 5.2 8.3Z"/><circle cx="8.5" cy="7.1" r="1.9"/></svg>',
  wa:     '<svg width="21" height="21" viewBox="0 0 16 16" fill="none"><path d="M8 1.6a6.3 6.3 0 0 0-5.4 9.5L1.7 14.4l3.4-.9A6.3 6.3 0 1 0 8 1.6Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.9 5c.2-.4.4-.4.6-.4h.4c.1 0 .3 0 .4.3l.5 1.2c.1.2 0 .4-.1.5l-.3.3c-.1.1-.2.2-.1.4.2.4.6.9 1 1.2.4.3.7.4.9.5.2 0 .3 0 .4-.1l.4-.4c.1-.2.3-.1.4-.1l1.1.6c.2.1.3.2.3.3 0 .2 0 .6-.2.9-.2.3-.8.6-1.1.6-.6 0-1.4-.2-2.6-1.1a7 7 0 0 1-2-2.5c-.3-.6-.4-1.1-.4-1.5 0-.4.2-.6.3-.7Z" fill="currentColor"/></svg>'
};

const WA = '5564999943916';

/* =========================================================
   DADOS POR EMPREENDIMENTO
   ========================================================= */
const PROJETOS = [
  {
    slug: 'impulsi-the-one',
    proj: 'the-one',
    nome: 'Impulsi The ONE',
    status: 'Em construção',
    statusTipo: 'obra',
    local: 'Rio Verde · GO',
    hero: 'assets/img/the-one/fachada/torre-lateral-esquerda.jpg',
    descricao: 'Em uma localização privilegiada de Rio Verde, o Impulsi The ONE foi desenvolvido para quem busca viver ou investir com inteligência, oferecendo arquitetura moderna, lazer funcional, tecnologia e excelente potencial de rentabilidade.',
    copyPendente: false,
    poema: ['Arquitetura moderna;','Lazer funcional;','Tecnologia integrada;','Alto potencial de rentabilidade.'],
    amenidades: ['Academia equipada','Hall social','Apartamentos de 2 quartos','Studios','Lazer funcional','Infraestrutura tecnológica'],
    specs: [
      ['Status','Em construção'],
      ['Localização','Rio Verde · GO'],
      ['Evolução da obra','43,72%'],
      ['Última medição','Agosto / 2026']
    ],
    galeria: [ ['fachada','Fachada'], ['interiores','Interiores'] ],
    obra: {
      meses: [{
        label: 'Agosto · 2026', total: 43.72,
        cap: 'Medição referente a Agosto de 2026 · Percentual físico acumulado da obra.',
        etapas: [
          { n:'Implantação da Obra', v:100 },
          { n:'Infra-estrutura', v:93.63 },
          { n:'Estrutura de Concreto Armado', v:94.77 },
          { n:'Terraplanagem', v:76.95 },
          { n:'Paredes / Vedações', v:46.90 },
          { n:'Rev. Paredes Internas', v:15.29 },
          { n:'Pavimentação', v:15.96 }
        ]
      }]
    }
  },

  {
    slug: 'impulsi-interlagos',
    proj: 'interlagos',
    nome: 'Impulsi Interlagos',
    status: 'Em construção',
    statusTipo: 'obra',
    local: 'Rio Verde · GO',
    hero: 'assets/img/interlagos/fachada/dia-frente.jpg',
    descricao: 'Empreendimento em desenvolvimento no Residencial Interlagos, em Rio Verde, com estrutura de lazer completa distribuída entre térreo e rooftop.',
    copyPendente: true,
    poema: ['Lazer completo;','Rooftop com vista;','Estrutura de convivência;','No coração do Interlagos.'],
    amenidades: ['Academia','Bike Shop','Coworking','Salão de Festas','Espaço Gourmet','Lavanderia','Minimarket','Praça de convivência','Sky Bar','Rooftop panorâmico'],
    specs: [
      ['Status','Em construção'],
      ['Localização','Rio Verde · GO'],
      ['Evolução da obra','5,46%'],
      ['Última medição','Agosto / 2026']
    ],
    galeria: [ ['fachada','Fachada'], ['interiores','Áreas comuns'] ],
    plantas: 'plantas',
    obra: {
      meses: [{
        label: 'Agosto · 2026', total: 5.46,
        cap: 'Medição referente a Agosto de 2026 · Percentual físico acumulado da obra.',
        etapas: [
          { n:'Projetos', v:100 },
          { n:'Demolições', v:30.70 },
          { n:'Terraplanagem', v:44.35 },
          { n:'Infra-estrutura', v:48.09 },
          { n:'Estrutura de Concreto Armado', v:2.52 }
        ]
      }]
    }
  },

  {
    slug: 'omni-espelho-dagua',
    proj: 'omni',
    nome: "OMNI Espelho D'Água",
    status: 'Lançamento',
    statusTipo: 'lancamento',
    local: 'Rio Verde · GO',
    hero: 'assets/img/omni/fachada/02-fachada-diurna.jpg',
    descricao: "Lançamento da Imperial Urbanismo em Rio Verde, o OMNI Espelho D'Água reúne 24 espaços de lazer distribuídos entre subsolo, térreo e rooftop, com tipologias de 2 quartos, 2 suítes e penthouse.",
    copyPendente: true,
    poema: ['Espelho d’água na chegada;','Vinte e quatro espaços de lazer;','Rooftop de ponta a ponta;','Tipologias de 2 quartos à penthouse.'],
    amenidades: ['Piscina adulto e infantil','Academia no rooftop','Sky Lounge · Sunset','Espaço Wine e Beer','MasterChef','Bilhar','Coworking','Espaço Gamer','Podcast','Brinquedoteca','Pet Care','Espaço Beauty','Sala de Massagem','Sauna','Wellness','Mini Quadra','Playground','Bike Shop','Lavanderia','Sala de Entregas'],
    specs: [
      ['Status','Lançamento'],
      ['Localização','Rio Verde · GO'],
      ['Tipologias','2 quartos · 2 suítes · Penthouse'],
      ['Lazer','24 espaços']
    ],
    galeria: [ ['fachada','Fachada'], ['area-comum','Áreas comuns'], ['interiores','Decorado'], ['drone','Aéreas'] ],
    plantas: 'plantas',
    obra: null
  }
];

/* =========================================================
   TEMPLATE
   ========================================================= */
/* Mesmo menu do site inteiro — estas são páginas internas.
   "Empreendimentos" fica ativo porque é a seção onde elas vivem. */
/* Mesmo menu das demais páginas — a Revista saiu do ar por ora.
   Qualquer mudança aqui tem que valer também nos .html escritos à mão. */
const NAV = [
  ['home.html','Home'], ['quem-somos.html','Quem Somos'], ['historia.html','História'],
  ['empreendimentos.html','Empreendimentos'], ['portfolio.html','Portfólio'],
  ['acompanhamento-de-obras.html','Acompanhamento de Obras'],
  ['trabalhe-conosco.html','Trabalhe Conosco'], ['contato.html','Contato']
];
const NAV_ATIVO = 'Empreendimentos';

function slidesHTML(p, cats, tall) {
  let out = '';
  cats.forEach(([cat, label]) => {
    listImgs(p.proj, cat).forEach((im, i) => {
      out += `
          <figure class="slide${tall ? ' slide--tall' : ''}" data-cat="${cat}" style="animation-delay:${(i % 8) * 0.06}s">
            <img src="${im.src}" alt="${esc(p.nome)} — ${esc(im.label)}" loading="lazy" decoding="async">
            <button class="slide__zoom" aria-label="Ampliar">${IC.zoom}</button>
            <figcaption class="slide__cap">${esc(label)} · ${esc(im.label)}</figcaption>
          </figure>`;
    });
  });
  return out;
}

function carousel(p, cats, tall, id) {
  const total = cats.reduce((a, [c]) => a + listImgs(p.proj, c).length, 0);
  const tabs = cats.length > 1
    ? `<div class="tabs reveal">
          <button class="tab is-active" data-cat="todos">Todos</button>
          ${cats.map(([c, l]) => `<button class="tab" data-cat="${c}">${esc(l)}</button>`).join('\n          ')}
        </div>`
    : '';
  return `${tabs}
        <div class="carousel" id="${id}">
          <div class="carousel__viewport">${slidesHTML(p, cats, tall)}
          </div>
          <div class="carousel__nav reveal">
            <div class="carousel__arrows">
              <button class="arrow" data-prev aria-label="Anterior">${IC.chevL}</button>
              <button class="arrow" data-next aria-label="Próximo">${IC.chevR}</button>
            </div>
            <div class="progressbar"><i></i></div>
            <span class="carousel__count">01 / ${String(total).padStart(2,'0')}</span>
          </div>
        </div>`;
}

function page(p) {
  const hasPlantas = !!p.plantas && listImgs(p.proj, p.plantas).length > 0;
  const hasObra = !!p.obra;

  /* o menu é o do site inteiro, idêntico em todas as páginas */
  const navLinks = NAV;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.nome)} — Imperial Urbanismo</title>
<meta name="description" content="${esc(p.descricao.slice(0, 155))}">
<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="assets/img/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<meta name="theme-color" content="#3C3F2E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>

<!-- ================= NAV ================= -->
<header class="nav">
  <div class="wrap nav__in">
    <a class="nav__logo" href="home.html" aria-label="Imperial Urbanismo">${LOGO}</a>
    <nav class="nav__links">
      ${navLinks.map(([h, l]) => `<a href="${h}"${l === NAV_ATIVO ? ' class="is-active"' : ''}>${esc(l)}</a>`).join('\n      ')}
    </nav>
    <button class="nav__burger" aria-label="Menu"><span></span></button>
  </div>
</header>

<!-- ================= HERO ================= -->
<section class="hero">
  <div class="hero__card">
    <div class="hero__bg"><img src="${p.hero}" alt="${esc(p.nome)}" fetchpriority="high"></div>
    <div class="hero__scrim"></div>
    <div class="wrap hero__in" data-stagger>
      <div class="hero__chips reveal">
        <span class="chip chip--solid">${esc(p.status)}</span>
        <span class="chip chip--outline">${esc(p.local)}</span>
      </div>
      <h1 class="reveal">${esc(p.nome)}</h1>
      <p class="lead lead--light hero__lead reveal">${esc(p.descricao)}</p>
      <dl class="hero__specs reveal">
        ${p.specs.map(([k, v]) => `<div class="hero__spec"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n        ')}
      </dl>
    </div>
  </div>
</section>

<!-- ================= SOBRE + CADASTRO ================= -->
<section class="sec sec--cream" id="sobre">
  <div class="wrap intro__grid">
    <div data-stagger>
      <p class="eyebrow reveal">— O empreendimento</p>
      <h2 class="h2 reveal" style="margin-top:14px">${esc(p.nome)}</h2>
      <ul class="intro__poem reveal">
        ${p.poema.map(l => `<li>${esc(l)}</li>`).join('\n        ')}
      </ul>
      <p class="lead reveal" style="margin-bottom:36px">${esc(p.descricao)}</p>
      <div class="intro__feats reveal">
        <h3>O que o empreendimento oferece</h3>
        <ul>
          ${p.amenidades.map(a => `<li>${esc(a)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>

    <aside class="formcard reveal" id="contato">
      <div class="formcard__head"><h3>Cadastre-se e saiba mais</h3></div>
      <div class="formcard__body">
        <form novalidate>
          <div class="field"><input type="text" id="n-${p.proj}" placeholder=" " required><label for="n-${p.proj}">Nome</label></div>
          <div class="field"><input type="email" id="e-${p.proj}" placeholder=" " required><label for="e-${p.proj}">E-mail</label></div>
          <div class="field"><input type="tel" id="t-${p.proj}" placeholder=" " required><label for="t-${p.proj}">Telefone</label></div>
          <label class="check">
            <input type="checkbox" required>
            <span>Aceito receber contato da Imperial Urbanismo de acordo com a política de privacidade.</span>
          </label>
          <button class="btn btn--dark btn--wide" type="submit">Enviar ${IC.arrowR}</button>
          <p class="formcard__note">Retorno em até 1 dia útil, em horário comercial.</p>
        </form>
        <div class="formcard__ok">Cadastro recebido. Nossa equipe entrará em contato em breve.</div>
      </div>
    </aside>
  </div>
</section>

<!-- ================= GALERIA ================= -->
<section class="sec sec--cream2" id="galeria">
  <div class="wrap">
    <div class="sec__head reveal">
      <div>
        <p class="eyebrow">— Galeria</p>
        <h2 class="h2">Conheça o projeto.</h2>
      </div>
      <span class="sec__meta">Arraste ou use as setas</span>
    </div>
    ${carousel(p, p.galeria, false, 'gal')}
  </div>
</section>
${hasPlantas ? `
<!-- ================= PLANTAS ================= -->
<section class="sec sec--cream" id="plantas">
  <div class="wrap">
    <div class="sec__head reveal">
      <div>
        <p class="eyebrow">— Plantas</p>
        <h2 class="h2">Plantas humanizadas.</h2>
      </div>
      <span class="sec__meta">Clique para ampliar</span>
    </div>
    ${carousel(p, [[p.plantas, 'Plantas']], true, 'plt')}
  </div>
</section>` : ''}
${hasObra ? `
<!-- ================= ANDAMENTO ================= -->
<section class="sec sec--cream2" id="obra">
  <div class="wrap">
    <div class="andamento__top reveal">
      <div>
        <p class="eyebrow">— Andamento da Obra</p>
        <h2 class="h2" style="margin-top:14px">Evolução física por etapa.</h2>
      </div>
      <div>
        <p class="label" style="margin-bottom:10px">Medição</p>
        <div class="select"><select id="medicao" aria-label="Selecionar medição"></select></div>
      </div>
    </div>

    <div class="rings" id="rings"></div>

    <div class="total reveal">
      <div class="total__row">
        <div>
          <p class="label label--light" style="margin-bottom:8px">Total executado</p>
          <p class="total__num" id="totalNum">0<sup>%</sup></p>
        </div>
        <a class="btn btn--cream" href="#galeria">Ver o projeto ${IC.arrowR}</a>
      </div>
      <div class="total__track"><i id="totalBar"></i></div>
      <p class="total__cap" id="totalCap"></p>
    </div>
  </div>
</section>` : ''}

<!-- ================= CTA FINAL (mesmo box da Home) ================= -->
<section class="hcta" id="fale">
  <div class="hcta__card">
    <div class="hcta__bg"><img src="assets/img/home/cta-bg.jpg" alt="" aria-hidden="true" loading="lazy"></div>
    <div class="hcta__in" data-stagger>
      <p class="hcta__eyebrow reveal"><i></i><span>Fale com a Imperial</span><i></i></p>
      <h2 class="reveal">O próximo passo<br>começa com uma<br>boa conversa.</h2>
      <p class="reveal">Nossa equipe está pronta para apresentar o ${esc(p.nome)}, esclarecer dúvidas e ajudar você a encontrar a oportunidade alinhada ao seu momento.</p>
      <div class="ctafinal__btns reveal">
        <a class="btn btn--cream" href="https://wa.me/${WA}?text=Ol%C3%A1%21%20Vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20${encodeURIComponent(p.nome)}." target="_blank" rel="noopener">Falar pelo WhatsApp ${IC.arrowR}</a>
        <a class="btn btn--ghost-light" href="#contato">Deixar meus dados ${IC.arrowR}</a>
      </div>
    </div>
  </div>
</section>

<!-- ================= FOOTER (igual ao da Home) ================= -->
<footer class="hfoot">
  <div class="hfoot__photo"><img src="assets/img/home/footer-bg.jpg" alt="" aria-hidden="true" loading="lazy"></div>
  <div class="hfoot__word"><img src="assets/img/home/wordmark.png" alt="" aria-hidden="true" loading="lazy"></div>
  <div class="wrap hfoot__in">
    <div class="hfoot__grid">
      <div>
        <p class="hfoot__tag">Impulsionando Valor.<br>Construindo Legado.</p>
        <p class="hfoot__addr">
          Av. Paulo Roberto Cunha, QD44 LT09A<br>
          Jardim Pres., Rio Verde, Goiás — Brasil<br>
          75901-507<br><br>
          <a href="tel:+5564999943916">+55 64 99994-3916</a><br>
          <a href="mailto:contato@imperialurbanismo.com.br">contato@imperialurbanismo.com.br</a>
        </p>
      </div>
      <div>
        <h4>Empresa</h4>
        <ul><li><a href="quem-somos.html">Quem Somos</a></li><li><a href="historia.html">História</a></li><li><a href="trabalhe-conosco.html">Trabalhe Conosco</a></li></ul>
      </div>
      <div>
        <h4>Projetos</h4>
        <ul><li><a href="empreendimentos.html">Empreendimentos</a></li><li><a href="portfolio.html">Portfólio</a></li><li><a href="acompanhamento-de-obras.html">Acompanhamento de Obras</a></li></ul>
      </div>
      <div>
        <h4>Conteúdo</h4>
        <ul><li><a href="contato.html">Contato</a></li></ul>
      </div>
    </div>
    <div class="hfoot__bar">
      <span>© 2026 Imperial Urbanismo. Rio Verde, GO.</span>
      <a href="#">Política de Privacidade</a>
    </div>
  </div>
  <div class="hfoot__rule"></div>
  <div class="hfoot__space"></div>
</footer>

<!-- ================= LIGHTBOX ================= -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Galeria ampliada">
  <button class="lightbox__close" aria-label="Fechar">${IC.close}</button>
  <button class="lightbox__prev" aria-label="Anterior">${IC.chevL}</button>
  <img class="lightbox__img" alt="">
  <button class="lightbox__next" aria-label="Próximo">${IC.chevR}</button>
  <p class="lightbox__cap"></p>
</div>

<a class="wa" href="https://wa.me/${WA}?text=Ol%C3%A1%21%20Vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20${encodeURIComponent(p.nome)}." target="_blank" rel="noopener" aria-label="Falar pelo WhatsApp">
  ${IC.wa}<span>Falar pelo WhatsApp</span>
</a>

${hasObra ? `<script>window.OBRA = ${JSON.stringify(p.obra)};</script>` : ''}
<script src="assets/js/site.js" defer></script>
</body>
</html>
`;
}

/* ---------- escreve ---------- */
let report = [];
for (const p of PROJETOS) {
  const html = page(p);
  const file = path.join(ROOT, p.slug + '.html');
  fs.writeFileSync(file, html, 'utf8');
  const nGal = p.galeria.reduce((a, [c]) => a + listImgs(p.proj, c).length, 0);
  const nPl  = p.plantas ? listImgs(p.proj, p.plantas).length : 0;
  report.push(`${p.slug}.html  —  galeria: ${nGal} | plantas: ${nPl} | andamento: ${p.obra ? p.obra.meses[0].etapas.length + ' etapas' : 'n/a'} | copy pendente: ${p.copyPendente ? 'SIM' : 'nao'}`);
}
console.log(report.join('\n'));
