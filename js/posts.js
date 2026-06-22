import { supabase } from '../supabase-config.js';
import { getPath, escapeHtml, formatPostDatePtBr, normalizeCategoryValue, formatCategoryLabel, slugifyHeading, getCurrentPageKey } from './utils.js';
import { getIntegrantesIndex, resolveAuthorNames, buildIntegranteProfileUrl } from './authors.js';

function buildPostTocAndHtml(markdownBody) {
  if (!window.marked || typeof window.marked.parse !== 'function') {
    return { html: `<pre>${escapeHtml(markdownBody)}</pre>`, toc: [] };
  }
  const rawHtml = window.marked.parse(markdownBody);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const usedSlugs = new Set();
  const toc = [];
  doc.querySelectorAll('h2, h3').forEach((heading) => {
    const headingText = heading.textContent ? heading.textContent.trim() : '';
    const slug = slugifyHeading(headingText, usedSlugs);
    heading.setAttribute('id', slug);
    toc.push({ id: slug, label: headingText, level: heading.tagName.toLowerCase() === 'h3' ? 3 : 2 });
  });
  return { html: doc.body.innerHTML, toc };
}

function buildTocListMarkup(tocItems) {
  if (!tocItems.length) return '<p class="preview-meta">Sem seções neste artigo.</p>';
  return `<ul class="post-toc-list">${tocItems.map(item => `<li class="toc-level-${item.level}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`).join('')}</ul>`;
}

function buildPostCard(post) {
  const categoryTokens = post.categories.join('|');
  const categoryBadges = post.categoryLabels.map(label =>
    `<span class="inline-block px-2 py-0.5 border border-primary/20 dark:border-primary/30 text-primary text-[9px] font-sans font-bold uppercase tracking-wider bg-primary/5 rounded-none">${escapeHtml(label)}</span>`
  ).join('');
  const authorsText = post.authorLinks.length
    ? post.authorLinks.map(a => a.url ? `<a href="${a.url}" class="relative z-20 hover:text-primary transition-colors">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)).join(', ')
    : '';

  return `
    <article class="post-card group relative grid grid-cols-12 gap-4 md:gap-6 items-start py-8 md:py-10 border-b border-gray-200 dark:border-gray-800 last:border-0" data-categories="${escapeHtml(categoryTokens)}" data-href="${getPath('pages/post.html?slug=')}${encodeURIComponent(post.slug)}">
      <a class="absolute inset-0 z-10" href="${getPath('pages/post.html?slug=')}${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
      <div class="col-span-12 md:col-span-2 flex flex-col pt-1 gap-2 text-left">
        <time class="font-sans text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">${escapeHtml(post.date)}</time>
        <div class="flex flex-wrap gap-1.5 md:flex-col md:items-start">
          ${categoryBadges}
        </div>
      </div>
      <div class="col-span-8 md:col-span-7">
        <h2 class="font-serif text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-tight mb-2 md:mb-4">${escapeHtml(post.title)}</h2>
        <p class="font-sans text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 md:line-clamp-none">${escapeHtml(post.excerpt)}</p>
        ${authorsText ? `<p class="font-sans text-xs md:text-sm font-semibold text-gray-500 mt-3">Por: ${authorsText}</p>` : ''}
      </div>
      <div class="col-span-4 md:col-span-3">
        <img src="${escapeHtml(post.image || getPath('posts/img/place-holder.png'))}" alt="Capa do post: ${escapeHtml(post.title)}" class="${post.image ? 'w-full aspect-[4/3] object-cover rounded shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500' : 'w-full aspect-[4/3] object-contain rounded opacity-80 dark:invert dark:opacity-50 transition-all duration-500'}">
      </div>
    </article>
  `;
}

function buildDynamicFilters(posts) {
  const filtersContainer = document.querySelector('#blog-filters');
  if (!filtersContainer) return;
  const categoryMap = new Map();
  posts.forEach((post) => {
    post.categories.forEach((category, index) => {
      if (!categoryMap.has(category)) categoryMap.set(category, post.categoryLabels[index] || category);
    });
  });
  const categoryButtons = [...categoryMap.entries()].map(([cat, label]) =>
    `<button class="filter px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors rounded-none" data-filter="${escapeHtml(cat)}">${escapeHtml(label)}</button>`
  ).join('');
  filtersContainer.innerHTML = `<button class="filter active px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors rounded-none" data-filter="all">Todos</button>${categoryButtons}`;
}

let currentPostsList = [];
let currentPage = 1;
let itemsPerPage = 25;

function renderPagination(totalItems) {
  const container = document.querySelector('#pagination-controls');
  if (!container) return;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous page button
  if (currentPage > 1) {
    html += `<button class="page-btn px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900" data-page="${currentPage - 1}">Anterior</button>`;
  } else {
    html += `<button class="px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/10" disabled>Anterior</button>`;
  }
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1.5 text-xs font-bold font-sans border border-primary text-primary bg-primary/10 cursor-default" disabled>${i}</button>`;
    } else {
      html += `<button class="page-btn px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900" data-page="${i}">${i}</button>`;
    }
  }
  
  // Next page button
  if (currentPage < totalPages) {
    html += `<button class="page-btn px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900" data-page="${currentPage + 1}">Próxima</button>`;
  } else {
    html += `<button class="px-3 py-1.5 text-xs font-bold font-sans border border-gray-200 dark:border-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/10" disabled>Próxima</button>`;
  }
  
  container.innerHTML = html;
}

function renderFilteredPosts() {
  const grid = document.querySelector('#posts-grid');
  if (!grid) return;
  
  const activeFilterBtn = document.querySelector('.filter.active');
  const searchInput = document.querySelector('#search-input');
  const sortSelect = document.querySelector('#sort-select');
  
  const selectedCategory = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const sortOrder = sortSelect ? sortSelect.value : 'newest';
  
  let filtered = currentPostsList.filter(post => {
    const categoryMatches = (selectedCategory === 'all' || post.categories.includes(selectedCategory));
    
    let searchMatches = true;
    if (searchQuery) {
      const title = post.title.toLowerCase();
      const excerpt = post.excerpt.toLowerCase();
      const authors = post.authorLinks.map(a => a.name.toLowerCase()).join(' ');
      searchMatches = title.includes(searchQuery) || excerpt.includes(searchQuery) || authors.includes(searchQuery);
    }
    
    return categoryMatches && searchMatches;
  });
  
  filtered.sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.sortTs - a.sortTs;
    } else {
      return a.sortTs - b.sortTs;
    }
  });
  
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);
  
  if (paginated.length) {
    grid.innerHTML = paginated.map(buildPostCard).join('');
  } else {
    grid.innerHTML = '<p class="font-sans text-sm text-gray-500 py-12 text-center">Nenhuma publicação corresponde aos critérios.</p>';
  }
  
  renderPagination(totalItems);
}

function wireFilters() {
  const filtersContainer = document.querySelector('#blog-filters');
  const searchInput = document.querySelector('#search-input');
  const sortSelect = document.querySelector('#sort-select');
  const toggleSidebarBtn = document.querySelector('#toggle-sidebar-btn');
  const sidebarFilters = document.querySelector('#sidebar-filters');
  const limitSelect = document.querySelector('#limit-select');
  const paginationContainer = document.querySelector('#pagination-controls');
  
  if (toggleSidebarBtn && sidebarFilters) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebarFilters.classList.toggle('hidden');
      sidebarFilters.classList.toggle('flex');
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 1;
      renderFilteredPosts();
    });
  }
  
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentPage = 1;
      renderFilteredPosts();
    });
  }
  
  if (limitSelect) {
    limitSelect.addEventListener('change', () => {
      itemsPerPage = parseInt(limitSelect.value, 10);
      currentPage = 1;
      renderFilteredPosts();
    });
  }

  if (filtersContainer) {
    filtersContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.filter');
      if (!button) return;
      
      const filters = filtersContainer.querySelectorAll('.filter');
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      
      currentPage = 1;
      renderFilteredPosts();
    });
  }
  
  if (paginationContainer) {
    paginationContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.page-btn');
      if (!button) return;
      currentPage = parseInt(button.dataset.page, 10);
      renderFilteredPosts();
      const grid = document.querySelector('#posts-grid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

async function loadPostsList(tipoFilter) {
  const grid = document.querySelector('#posts-grid');
  if (!grid) return;
  try {
    const { data, error } = await supabase.from('posts').select('*');
    if (error) throw error;
    const integrantesIndex = await getIntegrantesIndex();
    const filtered = (data || []).filter(p => {
      if (tipoFilter === 'artigo') return p.tipo === 'artigo' || p.tipo === 'blog';
      if (tipoFilter === 'notícia') return p.tipo === 'notícia' || p.tipo === 'noticia';
      return true;
    });
    currentPostsList = filtered.map(post => {
      const categoriesRaw = post.categorias || [];
      const categories = categoriesRaw.map(normalizeCategoryValue);
      const categoryLabels = categoriesRaw.map(formatCategoryLabel);
      const authorLinks = resolveAuthorNames([post.autor], integrantesIndex).map(a => ({
        ...a, url: a.slug ? buildIntegranteProfileUrl(a.slug) : '',
      }));
      return {
        slug: post.id, categories, categoryLabels, authorLinks,
        date: formatPostDatePtBr(post.data),
        sortTs: Date.parse(String(post.data)) || 0,
        title: post.titulo || 'Sem título',
        excerpt: post.resumo || 'Sem resumo.',
        image: String(post.poster || '').trim(),
      };
    });
    buildDynamicFilters(currentPostsList);
    renderFilteredPosts();
    wireFilters();
  } catch (error) {
    grid.innerHTML = '<article class="post-card"><p class="preview-meta">Erro</p><h2>Não foi possível carregar os posts</h2></article>';
    console.error(error);
  }
}

export async function loadBlogList() {
  if (getCurrentPageKey() !== 'blog') return;
  currentPage = 1;
  await loadPostsList('artigo');
}

export async function loadNoticiasList() {
  if (getCurrentPageKey() !== 'noticias') return;
  currentPage = 1;
  await loadPostsList('notícia');
}

export async function loadPostPage() {
  const article = document.querySelector('#post-content');
  if (!article) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) { article.innerHTML = '<h1>Publicação não encontrada</h1>'; return; }

  try {
    const { data: post, error } = await supabase.from('posts').select('*').eq('id', slug).single();
    if (error || !post) { article.innerHTML = '<h1>Publicação não encontrada</h1>'; return; }
    const integrantesIndex = await getIntegrantesIndex();
    const title = post.titulo || 'Sem título';
    const categoriesRaw = post.categorias || [];
    const categoryLabels = categoriesRaw.map(formatCategoryLabel);
    const authorLinks = resolveAuthorNames([post.autor], integrantesIndex).map(a => ({
      ...a, url: a.slug ? buildIntegranteProfileUrl(a.slug) : '',
    }));
    const date = formatPostDatePtBr(post.data);
    const excerpt = post.resumo || '';
    const image = String(post.poster || '').trim();
    const tocResult = buildPostTocAndHtml(post.conteudo || '');
    const tocList = buildTocListMarkup(tocResult.toc);
    const isNews = post.tipo === 'notícia' || post.tipo === 'noticia';
    const backText = isNews ? 'Voltar para Notícias' : 'Voltar para o Blog';
    const backUrl = isNews ? getPath('pages/noticias.html') : getPath('pages/blog.html');

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
        ${authorLinks.length ? `<p class="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">Por: ${authorLinks.map(a => a.url ? `<a href="${a.url}" class="text-gray-900 dark:text-white hover:text-primary transition-colors">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)).join(', ')}</p>` : ''}
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
    article.innerHTML = '<h1>Erro ao carregar a publicação</h1>';
    console.error(error);
  }
}
