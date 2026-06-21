import { db } from './firebase-config.js';
import { collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }
  return response.text();
}

const THEME_STORAGE_KEY = 'oedla-theme';
const BACKGROUND_STORAGE_KEY = 'oedla-bg-image';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const BACKGROUND_LIGHT_PATH = 'assets/img/background-light.png';
const BACKGROUND_DARK_PATH = 'assets/img/background-dark.png';

function getCurrentPageKey() {
  return String(document.body?.dataset?.page || '').trim();
}

function setActiveNavigation() {
  const currentPage = getCurrentPageKey();
  document.querySelectorAll('.main-nav a[data-page]').forEach((link) => {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

async function mountLayoutComponent(selector, path) {
  const mountPoint = document.querySelector(selector);
  if (!mountPoint) {
    return;
  }

  const html = await fetchText(path);
  mountPoint.outerHTML = html;
}

async function loadLayoutComponents() {
  await Promise.all([
    mountLayoutComponent('#site-header', 'components/header.html'),
    mountLayoutComponent('#site-footer', 'components/footer.html'),
  ]);

  setActiveNavigation();
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
}

function getStoredTheme() {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === THEME_DARK || value === THEME_LIGHT ? value : '';
}

function updateThemeToggleUi(theme) {
  const isDark = theme === THEME_DARK;
  document.querySelectorAll('.theme-toggle').forEach((button) => {
    button.setAttribute('aria-pressed', String(isDark));
    const actionLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';
    button.setAttribute('aria-label', actionLabel);
    button.setAttribute('title', actionLabel);
  });
}

function getBackgroundPathForTheme(theme) {
  return theme === THEME_DARK ? BACKGROUND_DARK_PATH : BACKGROUND_LIGHT_PATH;
}

function applyBackgroundPath(path) {
  const safePath = String(path || '').trim() || BACKGROUND_LIGHT_PATH;
  document.documentElement.style.setProperty('--page-bg-image', `url('${safePath}')`);
}

function persistBackgroundPath(path) {
  try {
    window.localStorage.setItem(BACKGROUND_STORAGE_KEY, path);
  } catch (_error) {
    // Ignore storage failures (private mode, quota).
  }
}

function applyTheme(theme) {
  const safeTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  const backgroundPath = getBackgroundPathForTheme(safeTheme);
  document.documentElement.setAttribute('data-theme', safeTheme);
  applyBackgroundPath(backgroundPath);
  persistBackgroundPath(backgroundPath);
  updateThemeToggleUi(safeTheme);
}

function wireThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) {
    return;
  }

  const initialTheme = getStoredTheme() || getSystemTheme();
  applyTheme(initialTheme);

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
      const nextTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      applyTheme(nextTheme);
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    if (!getStoredTheme()) {
      applyTheme(getSystemTheme());
    }
  });
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }
  return response.json();
}

let integrantesIndexPromise;

async function getIntegrantesIndex() {
  if (integrantesIndexPromise) {
    return integrantesIndexPromise;
  }

  integrantesIndexPromise = (async () => {
    try {
      const snap = await getDocs(collection(db, 'authors'));
      const records = [];
      snap.forEach(docSnap => {
        records.push([docSnap.id, docSnap.data()]);
      });
      return new Map(records);
    } catch (_error) {
      console.error(_error);
      return new Map();
    }
  })();

  return integrantesIndexPromise;
}

function escapeHtml(value) {
  const safeValue = String(value ?? '');
  return safeValue
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildIntegranteProfileUrl(slug) {
  return `integrante.html?slug=${encodeURIComponent(slug)}`;
}

function inferIconFromLink(titulo, url) {
  const title = String(titulo || '').trim().toLocaleLowerCase('pt-BR');
  const href = String(url || '').trim().toLocaleLowerCase('pt-BR');

  if (!href) {
    return '';
  }

  if (title.includes('lattes') || href.includes('lattes.cnpq.br')) {
    return '';
  }

  const rules = [
    { match: () => href.includes('orcid.org') || title === 'orcid', icon: 'orcid' },
    { match: () => href.includes('instagram.com') || title.includes('instagram'), icon: 'instagram' },
    { match: () => href.includes('linkedin.com') || title.includes('linkedin'), icon: 'linkedin' },
    { match: () => href.includes('x.com') || href.includes('twitter.com') || title === 'x' || title.includes('twitter'), icon: 'x-twitter' },
    { match: () => href.includes('bsky.app') || href.includes('bluesky') || title.includes('bluesky'), icon: 'bluesky' },
    { match: () => href.includes('youtube.com') || href.includes('youtu.be') || title.includes('youtube'), icon: 'youtube' },
    { match: () => href.includes('github.com') || title.includes('github'), icon: 'github' },
    { match: () => href.includes('facebook.com') || title.includes('facebook'), icon: 'facebook' },
    { match: () => href.includes('tiktok.com') || title.includes('tiktok'), icon: 'tiktok' },
    { match: () => href.includes('t.me') || href.includes('telegram.') || title.includes('telegram'), icon: 'telegram' },
    { match: () => href.includes('wa.me') || href.includes('whatsapp') || title.includes('whatsapp'), icon: 'whatsapp' },
    { match: () => href.includes('mastodon') || title.includes('mastodon'), icon: 'mastodon' },
  ];

  const matched = rules.find((rule) => rule.match());
  return matched ? matched.icon : '';
}

function resolveConfiguredIconClass(rawIcon) {
  const value = String(rawIcon || '').trim().toLocaleLowerCase('pt-BR');
  if (!value) {
    return '';
  }

  // Accept explicit Font Awesome classes directly from JSON.
  if (value.includes('fa-')) {
    const allowedTokens = value
      .split(/\s+/)
      .map((token) => token.replace(/[^a-z0-9-]/g, ''))
      .filter((token) => token.startsWith('fa'));

    return allowedTokens.join(' ').trim();
  }

  // Backward-compatible aliases mapped to Font Awesome.
  const aliasMap = {
    'brand-instagram': 'fa-brands fa-instagram',
    'brand-x': 'fa-brands fa-x-twitter',
    'brand-bluesky': 'fa-brands fa-bluesky',
    'brand-linkedin': 'fa-brands fa-linkedin',
    'brand-youtube': 'fa-brands fa-youtube',
    'brand-github': 'fa-brands fa-github',
    orcid: 'fa-brands fa-orcid',
    'id-badge-2': 'fa-brands fa-orcid',
  };

  if (aliasMap[value]) {
    return aliasMap[value];
  }

  const normalized = value
    .replace(/^fa\s+/, '')
    .replace(/^fa-/, '')
    .replace(/^icon-/, '');
  const safeToken = normalized.replace(/[^a-z0-9-]/g, '');

  if (!safeToken) {
    return '';
  }

  return `fa-brands fa-${safeToken}`;
}

function buildSocialLink(link, cssClassName) {
  const title = escapeHtml(link.titulo || 'Link');
  const url = escapeHtml(link.url || '#');
  const rawIcon = String(link.icone || link.icon || '').trim().toLocaleLowerCase('pt-BR')
    || inferIconFromLink(link.titulo, link.url);
  const iconClass = resolveConfiguredIconClass(rawIcon);
  const hasIcon = Boolean(iconClass);
  const linkClasses = `${cssClassName}${hasIcon ? ' icon-only' : ' no-icon'}`;

  return `<a class="${linkClasses}" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${title}" title="${title}">${hasIcon ? `<span class="social-icon" aria-hidden="true"><i class="${iconClass}"></i></span>` : `<span>${title}</span>`}</a>`;
}

function buildImportantLinks(links) {
  if (!Array.isArray(links) || !links.length) {
    return '<p class="preview-meta">Sem links cadastrados.</p>';
  }

  const items = links
    .map((link) => buildSocialLink(link, 'integrante-link'))
    .join('');

  return `<div class="important-links-inline">${items}</div>`;
}

function buildLabSocialLinks(links) {
  if (!Array.isArray(links) || !links.length) {
    return '<p class="preview-meta">Sem redes cadastradas.</p>';
  }

  return links.map((link) => buildSocialLink(link, 'social-link')).join('');
}

async function loadLabSocialLinks() {
  const containers = document.querySelectorAll('#labiia-social-links');
  if (!containers.length) {
    return;
  }

  try {
    const data = await fetchJson('redes/oedla.json');
    const html = buildLabSocialLinks(data.redes || []);
    containers.forEach((container) => {
      container.innerHTML = html;
    });
  } catch (error) {
    containers.forEach((container) => {
      container.innerHTML = '<p class="preview-meta">Não foi possível carregar as redes do OEDLA.</p>';
    });
    console.error(error);
  }
}

function buildIntegranteCard(person) {
  const nome = escapeHtml(person.nome || person['Nome'] || 'Sem Nome');
  const cargo = escapeHtml(person.cargo || person['Cargo'] || '');
  const formacao = escapeHtml(person.formacao || person['Formação'] || '');
  const minibiografia = escapeHtml(person.minibiografia || person['Minibiografia'] || '');
  const imagem = escapeHtml(person.foto || person['Imagem'] || '');
  const links = buildImportantLinks(person.links || person['Links importantes'] || []);
  const slug = String(person.__slug || '').trim();
  const profileUrl = slug ? buildIntegranteProfileUrl(slug) : '';
  const nameMarkup = profileUrl
    ? `<a class="relative z-20 hover:text-primary transition-colors" href="${profileUrl}" aria-label="Ver perfil de ${nome}"><h2 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">${nome}</h2></a>`
    : `<h2 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">${nome}</h2>`;
  const imageMarkup = imagem
    ? `${profileUrl
      ? `<a class="relative z-20 block w-20 h-20 md:w-24 md:h-24 shrink-0" href="${profileUrl}" aria-hidden="true" tabindex="-1"><img class="w-full h-full object-cover rounded-full transition-all duration-500" src="${imagem}" alt="Foto de ${nome}" loading="lazy"></a>`
      : `<img class="w-20 h-20 md:w-24 md:h-24 shrink-0 object-cover rounded-full" src="${imagem}" alt="Foto de ${nome}" loading="lazy">`
    }`
    : `<div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800"></div>`;

  return `
    <article class="group relative flex items-start gap-6 py-8 border-b border-gray-200 dark:border-gray-800 last:border-0">
      ${profileUrl ? `<a class="absolute inset-0 z-10" href="${profileUrl}" aria-label="${nome}"></a>` : ''}
      ${imageMarkup}
      <div class="flex flex-col gap-2">
        ${nameMarkup}
        <p class="font-sans text-xs md:text-sm font-bold uppercase tracking-widest text-primary">${cargo} • ${formacao}</p>
        <div class="relative z-20 mt-2">${links}</div>
      </div>
    </article>
  `;
}

async function loadIntegrantesPage() {
  const grid = document.querySelector('#integrantes-grid');
  if (!grid) {
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'authors'));
    const integrantes = [];
    snap.forEach(docSnap => {
      integrantes.push({
        ...docSnap.data(),
        __slug: docSnap.id
      });
    });

    grid.innerHTML = integrantes.map(buildIntegranteCard).join('');
  } catch (error) {
    grid.innerHTML = `
      <article class="post-card">
        <p class="preview-meta">Erro</p>
        <h2>Não foi possível carregar os integrantes</h2>
        <p>Confira os arquivos da pasta integrantes/.</p>
      </article>
    `;
    console.error(error);
  }
}

function parseFrontMatter(markdownText) {
  const defaultResult = {
    metadata: {},
    body: markdownText,
  };

  if (!markdownText.startsWith('---\n')) {
    return defaultResult;
  }

  const endMarkerIndex = markdownText.indexOf('\n---\n', 4);
  if (endMarkerIndex === -1) {
    return defaultResult;
  }

  const frontMatterBlock = markdownText.slice(4, endMarkerIndex).trim();
  const body = markdownText.slice(endMarkerIndex + 5);
  const metadata = {};

  frontMatterBlock.split('\n').forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      metadata[key] = rawValue.slice(1, -1);
      return;
    }

    metadata[key] = rawValue;
  });

  return { metadata, body };
}

function getPostBaseDir(postFile) {
  const normalized = String(postFile || '').replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) {
    return '';
  }
  return normalized.slice(0, lastSlash);
}

function resolveImagePath(rawPath, postBaseDir = '') {
  if (!rawPath) {
    return '';
  }
  let path = String(rawPath).trim();
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  if (path.startsWith('assets/images/posts/')) {
    path = path.replace('assets/images/posts/', 'assets/img/posts/');
  }
  if (
    postBaseDir
    && !path.startsWith('assets/')
    && !path.startsWith('integrantes/')
    && !path.startsWith('posts/')
  ) {
    path = `posts/${postBaseDir}/${path}`;
  }
  return path;
}

function resolveBodyImagePlaceholders(markdownBody, postBaseDir) {
  return markdownBody;
}

function buildPostCard(post) {
  const categoryTokens = post.categories.join('|');
  const categoryLabelText = post.categoryLabels.join(' • ');
  const authorsText = post.authorLinks.length
    ? `${post.authorLinks
      .map((author) => (author.url ? `<a href="${author.url}" class="relative z-20 hover:text-primary transition-colors">${escapeHtml(author.name)}</a>` : escapeHtml(author.name)))
      .join(', ')}`
    : '';

  return `
    <article class="post-card group relative grid grid-cols-1 md:grid-cols-12 gap-6 items-start py-10 border-b border-gray-200 dark:border-gray-800 last:border-0" data-categories="${escapeHtml(categoryTokens)}" data-href="post.html?slug=${encodeURIComponent(post.slug)}">
      <a class="absolute inset-0 z-10" href="post.html?slug=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
      <div class="col-span-1 md:col-span-2 flex flex-col md:text-right pt-1">
        <time class="font-sans text-sm font-bold text-gray-900 dark:text-gray-100">${escapeHtml(post.date)}</time>
        <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary mt-1">${escapeHtml(categoryLabelText)}</span>
      </div>
      <div class="col-span-1 md:col-span-7">
        <h2 class="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-4">${escapeHtml(post.title)}</h2>
        <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed">${escapeHtml(post.excerpt)}</p>
        ${authorsText ? `<p class="font-sans text-sm font-semibold text-gray-500 mt-4">Por: ${authorsText}</p>` : ''}
      </div>
      ${post.image ? `<div class="col-span-1 md:col-span-3"><img src="${escapeHtml(post.image)}" alt="Capa do post: ${escapeHtml(post.title)}" class="w-full aspect-[4/3] object-cover rounded shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500"></div>` : ''}
    </article>
  `;
}

function buildHomePreviewCard(post) {
  return `
    <article class="group relative flex flex-col items-start pb-8 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0">
      <a class="absolute inset-0 z-10" href="post.html?slug=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
      <div class="flex items-center gap-3 mb-3">
        <time class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(post.date)}</time>
        <span class="w-1 h-1 rounded-full bg-primary"></span>
        <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(post.categoryLabel)}</span>
      </div>
      <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight">${escapeHtml(post.title)}</h3>
    </article>
  `;
}

function parseListValue(rawValue) {
  if (!rawValue) {
    return [];
  }

  return String(rawValue)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPostDatePtBr(rawDate) {
  const value = String(rawDate || '').trim();
  if (!value) {
    return 'Sem data';
  }

  // Keep YYYY-MM-DD stable without timezone side effects.
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function normalizeCategoryValue(category) {
  return String(category || '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function formatCategoryLabel(category) {
  const text = String(category || '').trim();
  if (!text) {
    return 'Categoria';
  }

  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
}

function slugifyHeading(text, usedSlugs) {
  const baseSlug = String(text || '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const fallback = baseSlug || 'secao';
  let slug = fallback;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${fallback}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function buildPostTocAndHtml(markdownBody, postBaseDir = '') {
  const preparedBody = postBaseDir
    ? resolveBodyImagePlaceholders(markdownBody, postBaseDir)
    : markdownBody;

  if (!window.marked || typeof window.marked.parse !== 'function') {
    return {
      html: `<pre>${escapeHtml(preparedBody)}</pre>`,
      toc: [],
    };
  }

  const rawHtml = window.marked.parse(preparedBody);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const usedSlugs = new Set();
  const toc = [];

  doc.querySelectorAll('h2, h3').forEach((heading) => {
    const headingText = heading.textContent ? heading.textContent.trim() : '';
    const slug = slugifyHeading(headingText, usedSlugs);
    heading.setAttribute('id', slug);

    toc.push({
      id: slug,
      label: headingText,
      level: heading.tagName.toLowerCase() === 'h3' ? 3 : 2,
    });
  });

  return {
    html: doc.body.innerHTML,
    toc,
  };
}

function buildTocListMarkup(tocItems) {
  if (!tocItems.length) {
    return '<p class="preview-meta">Sem seções neste artigo.</p>';
  }

  return `
    <ul class="post-toc-list">
      ${tocItems
        .map(
          (item) =>
            `<li class="toc-level-${item.level}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`
        )
        .join('')}
    </ul>
  `;
}

function normalizeAuthorKey(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR');
}

function resolveAuthorNames(authorValues, integrantesIndex) {
  return authorValues.map((authorValue) => {
    const key = normalizeAuthorKey(authorValue);
    const integrante = integrantesIndex.get(key);
    if (integrante && (integrante.nome || integrante.Nome)) {
      return {
        slug: key,
        name: String(integrante.nome || integrante.Nome),
      };
    }

    return {
      slug: '',
      name: String(authorValue).trim(),
    };
  });
}

function buildDynamicFilters(posts) {
  const filtersContainer = document.querySelector('#blog-filters');
  if (!filtersContainer) {
    return;
  }

  const categoryMap = new Map();
  posts.forEach((post) => {
    post.categories.forEach((category, index) => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, post.categoryLabels[index] || category);
      }
    });
  });

  const categoryButtons = [...categoryMap.entries()]
    .map(
      ([category, label]) =>
        `<button class="filter px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors rounded-none" data-filter="${escapeHtml(category)}">${escapeHtml(label)}</button>`
    )
    .join('');

  filtersContainer.innerHTML = `
    <button class="filter active px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors rounded-none" data-filter="all">Todos</button>
    ${categoryButtons}
  `;
}

function wireFilters() {
  const filters = document.querySelectorAll('.filter');
  const posts = document.querySelectorAll('.post-card');

  if (!filters.length || !posts.length) {
    return;
  }

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');

      const selected = button.dataset.filter;
      posts.forEach((post) => {
        const categories = (post.dataset.categories || '').split('|').filter(Boolean);
        const match = selected === 'all' || categories.includes(selected);
        post.style.display = match ? '' : 'none';
      });
    });
  });
}

function wireMobileMenu() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  if (!header || !toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

async function loadBlogList() {
  const grid = document.querySelector('#posts-grid');
  if (!grid || getCurrentPageKey() !== 'blog') {
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'posts'));
    const integrantesIndex = await getIntegrantesIndex();
    const postsData = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.tipo === 'artigo' || data.tipo === 'blog') {
        postsData.push(data);
      }
    });

    const posts = postsData.map(post => {
      const categoriesRaw = post.categorias || [];
      const categories = categoriesRaw.map(item => normalizeCategoryValue(item));
      const categoryLabels = categoriesRaw.map(item => formatCategoryLabel(item));
      
      const authorLinks = resolveAuthorNames([post.autor], integrantesIndex)
        .map(author => ({
          ...author,
          url: author.slug ? buildIntegranteProfileUrl(author.slug) : '',
        }));

      return {
        slug: post.id,
        categories,
        categoryLabels,
        authorLinks,
        date: formatPostDatePtBr(post.data),
        sortTs: Date.parse(String(post.data)) || 0,
        title: post.titulo || 'Sem título',
        excerpt: post.resumo || 'Sem resumo.',
        image: post.poster || '',
      };
    });

    const sorted = [...posts].sort((a, b) => b.sortTs - a.sortTs);
    buildDynamicFilters(sorted);
    grid.innerHTML = sorted.map(buildPostCard).join('');
    wireFilters();
  } catch (error) {
    grid.innerHTML = `
      <article class="post-card">
        <p class="preview-meta">Erro</p>
        <h2>Não foi possível carregar os posts do Blog</h2>
        <p>Tente abrir o site com servidor local.</p>
      </article>
    `;
    console.error(error);
  }
}

async function loadNoticiasList() {
  const grid = document.querySelector('#posts-grid');
  if (!grid || getCurrentPageKey() !== 'noticias') {
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'posts'));
    const integrantesIndex = await getIntegrantesIndex();
    const postsData = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.tipo === 'notícia' || data.tipo === 'noticia') {
        postsData.push(data);
      }
    });

    const posts = postsData.map(post => {
      const categoriesRaw = post.categorias || [];
      const categories = categoriesRaw.map(item => normalizeCategoryValue(item));
      const categoryLabels = categoriesRaw.map(item => formatCategoryLabel(item));
      
      const authorLinks = resolveAuthorNames([post.autor], integrantesIndex)
        .map(author => ({
          ...author,
          url: author.slug ? buildIntegranteProfileUrl(author.slug) : '',
        }));

      return {
        slug: post.id,
        categories,
        categoryLabels,
        authorLinks,
        date: formatPostDatePtBr(post.data),
        sortTs: Date.parse(String(post.data)) || 0,
        title: post.titulo || 'Sem título',
        excerpt: post.resumo || 'Sem resumo.',
        image: post.poster || '',
      };
    });

    const sorted = [...posts].sort((a, b) => b.sortTs - a.sortTs);
    buildDynamicFilters(sorted);
    grid.innerHTML = sorted.map(buildPostCard).join('');
    wireFilters();
  } catch (error) {
    grid.innerHTML = `
      <article class="post-card">
        <p class="preview-meta">Erro</p>
        <h2>Não foi possível carregar as notícias</h2>
        <p>Tente abrir o site com servidor local.</p>
      </article>
    `;
    console.error(error);
  }
}

async function loadHomeLatestPosts() {
  const blogGrid = document.querySelector('#home-blog-preview');
  const newsGrid = document.querySelector('#home-news-preview');
  if (!blogGrid && !newsGrid) {
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'posts'));
    const postsData = [];
    snap.forEach(docSnap => postsData.push(docSnap.data()));

    const posts = postsData.map((post, postIndex) => {
      const categoriesRaw = post.categorias || [];
      const categoryLabel = formatCategoryLabel(categoriesRaw[0] || 'Categoria');
      const parsedDate = Date.parse(String(post.data));

      return {
        slug: post.id,
        date: formatPostDatePtBr(post.data),
        categoryLabel,
        title: post.titulo || 'Sem título',
        publishedAtTs: Number.isNaN(parsedDate) ? -1 : parsedDate,
        sourceIndex: postIndex,
        type: post.tipo === 'notícia' ? 'noticia' : 'blog',
        image: post.poster || '',
      };
    });

    const sorted = [...posts].sort((left, right) => right.publishedAtTs - left.publishedAtTs || right.sourceIndex - left.sourceIndex);

    if (blogGrid) {
      const latestBlog = sorted.filter((p) => p.type === 'blog').slice(0, 5);
      blogGrid.innerHTML = latestBlog.length
        ? latestBlog.map(buildHomePreviewCard).join('')
        : '<p class="preview-meta">Nenhuma análise disponível.</p>';
    }

    if (newsGrid) {
      const latestNews = sorted.filter((p) => p.type === 'noticia').slice(0, 5);
      newsGrid.innerHTML = latestNews.length
        ? latestNews.map(buildHomePreviewCard).join('')
        : '<p class="preview-meta">Nenhuma notícia disponível.</p>';
    }
  } catch (error) {
    const errorHtml = `
      <article class="preview-card">
        <p class="preview-meta">Erro</p>
        <h3>Não foi possível carregar as publicações</h3>
        <p>Tente abrir o site com servidor local.</p>
      </article>
    `;
    if (blogGrid) blogGrid.innerHTML = errorHtml;
    if (newsGrid) newsGrid.innerHTML = errorHtml;
    console.error(error);
  }
}

async function loadPostPage() {
  const article = document.querySelector('#post-content');
  if (!article) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    article.innerHTML = '<h1>Publicação não encontrada</h1><p>Use a página inicial ou as seções para buscar um conteúdo válido.</p>';
    return;
  }

  try {
    const docSnap = await getDoc(doc(db, 'posts', slug));
    if (!docSnap.exists()) {
      article.innerHTML = '<h1>Publicação não encontrada</h1><p>Esse link não existe no banco de dados.</p>';
      return;
    }
    const post = docSnap.data();
    const integrantesIndex = await getIntegrantesIndex();

    const title = post.titulo || 'Sem título';
    const categoriesRaw = post.categorias || [];
    const categoryLabels = categoriesRaw.map(item => formatCategoryLabel(item));
    const authorLinks = resolveAuthorNames([post.autor], integrantesIndex)
      .map(author => ({
        ...author,
        url: author.slug ? buildIntegranteProfileUrl(author.slug) : '',
      }));
    const date = formatPostDatePtBr(post.data);
    const excerpt = post.resumo || '';
    const image = post.poster || '';

    const tocResult = buildPostTocAndHtml(post.conteudo || '');
    const tocList = buildTocListMarkup(tocResult.toc);

    const isNews = post.tipo === 'notícia' || post.tipo === 'noticia';
    const backText = isNews ? 'Voltar para Notícias' : 'Voltar para o Blog';
    const backUrl = isNews ? 'noticias.html' : 'blog.html';

    document.title = `${title} | OEDLA`;
    article.innerHTML = `
      <div class="mb-12">
        <p class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6"><a href="${backUrl}" class="hover:text-gray-900 dark:hover:text-white transition-colors">&larr; ${backText}</a></p>
        <div class="flex items-center gap-3 mb-6">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(date)}</time>
          <span class="w-1 h-1 rounded-full bg-primary"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(categoryLabels.join(' • '))}</span>
        </div>
        <h1 class="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-8">${escapeHtml(title)}</h1>
        ${authorLinks.length
          ? `<p class="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">Por: ${authorLinks
            .map((author) => (author.url ? `<a href="${author.url}" class="text-gray-900 dark:text-white hover:text-primary transition-colors">${escapeHtml(author.name)}</a>` : escapeHtml(author.name)))
            .join(', ')}</p>`
          : ''}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div class="lg:col-span-8 flex flex-col">
          ${image ? `<div class="mb-10 w-full"><img src="${escapeHtml(image)}" alt="Capa do post: ${escapeHtml(title)}" class="w-full h-auto aspect-video object-cover rounded grayscale hover:grayscale-0 transition-all duration-500 shadow-md"></div>` : ''}
          <p class="font-serif text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed italic mb-12 border-l-4 border-primary pl-6">${escapeHtml(excerpt)}</p>
          
          <details class="lg:hidden mb-12 border border-gray-200 dark:border-gray-800 rounded p-4">
            <summary class="font-sans text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white cursor-pointer">Sumário do artigo</summary>
            <div class="mt-4 font-sans text-sm text-gray-600 dark:text-gray-400">${tocList}</div>
          </details>

          <div class="post-markdown max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg">${tocResult.html}</div>
          
          <p class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 font-sans text-sm font-bold uppercase tracking-widest"><a href="${backUrl}" class="hover:text-primary transition-colors">&larr; ${backText}</a></p>
        </div>

        <aside class="hidden lg:block lg:col-span-4 sticky top-32" aria-label="Sumário do artigo">
          <h2 class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Sumário</h2>
          <div class="font-sans text-sm text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800 pl-6">${tocList}</div>
        </aside>
      </div>
    `;
  } catch (error) {
    article.innerHTML = '<h1>Erro ao carregar a publicação</h1><p>Confira se o arquivo existe e tente novamente.</p>';
    console.error(error);
  }
}

async function loadIntegranteProfilePage() {
  const container = document.querySelector('#integrante-profile');
  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = normalizeAuthorKey(params.get('slug') || '');

  if (!slug) {
    container.innerHTML = '<h1>Integrante não encontrado</h1><p>Use a página Quem somos para selecionar um integrante.</p>';
    return;
  }

  const integrantesIndex = await getIntegrantesIndex();
  const integrante = integrantesIndex.get(slug);

  if (!integrante) {
    container.innerHTML = '<h1>Integrante não encontrado</h1><p>Não foi possível localizar esse perfil.</p>';
    return;
  }

  const nome = escapeHtml(integrante.nome || integrante['Nome'] || 'Integrante');
  const cargo = escapeHtml(integrante.cargo || integrante['Cargo'] || '');
  const formacao = escapeHtml(integrante.formacao || integrante['Formação'] || '');
  const minibiografia = escapeHtml(integrante.minibiografia || integrante['Minibiografia'] || '');
  const imagem = escapeHtml(integrante.foto || integrante['Imagem'] || '');
  const links = buildImportantLinks(integrante.links || integrante['Links importantes'] || []);

  const snap = await getDocs(collection(db, 'posts'));
  const postsData = [];
  snap.forEach(docSnap => postsData.push(docSnap.data()));

  const authoredPosts = postsData.filter(post => post.autor === slug).map(post => {
    const categoriesRaw = post.categorias || [];
    const categoryLabels = categoriesRaw.map(item => formatCategoryLabel(item));

    return {
      slug: post.id,
      title: post.titulo || 'Sem título',
      date: formatPostDatePtBr(post.data),
      excerpt: post.resumo || 'Sem resumo.',
      categoryLabels,
    };
  });

  const postsMarkup = authoredPosts.length
    ? `
      <div class="flex flex-col gap-0 border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
        ${authoredPosts
          .map(
            (post) => `
              <article class="group relative py-8 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0 flex flex-col items-start" data-href="post.html?slug=${encodeURIComponent(post.slug)}">
                <a class="absolute inset-0 z-10" href="post.html?slug=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
                <div class="flex items-center gap-3 mb-3">
                  <time class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(post.date)}</time>
                  <span class="w-1 h-1 rounded-full bg-primary"></span>
                  <span class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(post.categoryLabels.join(' • '))}</span>
                </div>
                <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-2">${escapeHtml(post.title)}</h3>
                <p class="font-sans text-sm text-gray-600 dark:text-gray-400">${escapeHtml(post.excerpt)}</p>
              </article>
            `
          )
          .join('')}
      </div>
    `
    : '<p class="font-sans text-sm text-gray-500 italic mt-8">Este integrante ainda não possui publicações.</p>';

  document.title = `${nome} | OEDLA`;
  container.innerHTML = `
    <div class="mb-12">
      <p class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6"><a href="quemsomos.html" class="hover:text-gray-900 dark:hover:text-white transition-colors">&larr; Voltar para Equipe</a></p>
      <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
        ${imagem ? `<div class="w-32 h-32 md:w-48 md:h-48 shrink-0"><img class="w-full h-full object-cover rounded-full transition-all duration-500 shadow-md" src="${imagem}" alt="Foto de ${nome}" loading="lazy"></div>` : '<div class="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 shadow-md"></div>'}
        <div class="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 class="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">${nome}</h1>
          <p class="font-sans text-sm md:text-base font-bold uppercase tracking-widest text-primary mt-2">${cargo}${cargo && formacao ? ' • ' : ''}${formacao}</p>
          <div class="mt-6 flex gap-3 relative z-20">${links}</div>
        </div>
      </div>
    </div>
    
    <div class="font-sans text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl border-t border-gray-200 dark:border-gray-800 pt-10">
      ${minibiografia ? `<p>${minibiografia}</p>` : ''}
    </div>

    <section class="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
      <h2 class="font-serif text-3xl font-bold text-gray-900 dark:text-white">Publicações do Autor</h2>
      ${postsMarkup}
    </section>
  `;
}

async function initPage() {
  try {
    await loadLayoutComponents();
  } catch (error) {
    console.error('Falha ao carregar componentes de layout.', error);
  }

  wireMobileMenu();
  wireThemeToggle();

  await Promise.all([
    loadLabSocialLinks(),
    loadHomeLatestPosts(),
    loadBlogList(),
    loadNoticiasList(),
    loadPostPage(),
    loadIntegrantesPage(),
    loadIntegranteProfilePage(),
  ]);
}

initPage();