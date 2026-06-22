import { supabase } from '../supabase-config.js';
import { getPath, escapeHtml, formatPostDatePtBr, getCurrentPageKey } from './utils.js';

const mockEvents = {
  '11111111-1111-1111-1111-111111111111': {
    id: '11111111-1111-1111-1111-111111111111',
    titulo: 'I Seminário Internacional sobre Extrema Direita',
    data: '2026-10-25',
    local: 'São Paulo, SP',
    descricao: 'Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita. O seminário contará com palestras magnas, painéis de discussão e apresentação de trabalhos científicos.\n\n### Programação Prevista:\n- **09:00** - Abertura oficial e credenciamento\n- **10:00** - Painel 1: Teorias da Conspiração e Política Regional\n- **14:00** - Painel 2: Economia e Autoritarismo\n- **17:00** - Palestra de encerramento\n\nParticipe presencialmente ou assista à transmissão ao vivo pelo canal oficial do OEDLA no YouTube.',
    capa: '',
    imagens: []
  },
  '22222222-2222-2222-2222-222222222222': {
    id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Mesa Redonda: Mídias Sociais e Populismo',
    data: '2026-11-12',
    local: 'Online',
    descricao: 'Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina. Nossos palestrantes debaterão o papel das grandes plataformas, a desinformação programática e os desafios regulatórios e democráticos.\n\n### Eixos Temáticos:\n1. Algoritmos de recomendação e radicalização\n2. Campanhas coordenadas de desinformação\n3. Regulação de plataformas sob perspectiva latino-americana',
    capa: '',
    imagens: []
  },
  '33333333-3333-3333-3333-333333333333': {
    id: '33333333-3333-3333-3333-333333333333',
    titulo: 'Conferência Regional: Democracia e Resistência',
    data: '2026-12-05',
    local: 'Buenos Aires, Argentina',
    descricao: 'Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional. O evento reunirá ativistas, acadêmicos e formuladores de políticas públicas para construir pontes e propor soluções inovadoras.\n\nMais informações sobre as mesas redondas e chamadas para artigos acadêmicos serão divulgadas em breve.',
    capa: '',
    imagens: []
  }
};

function buildEventoHomeCard(evento) {
  const dateStr = formatPostDatePtBr(evento.data);
  const capaUrl = evento.capa || getPath('posts/img/place-holder.png');
  const detailsUrl = getPath('pages/evento.html?slug=') + encodeURIComponent(evento.id);
  
  return `
    <article class="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300">
      <div class="w-full aspect-[16/10] bg-gray-255 dark:bg-gray-800 rounded overflow-hidden relative">
        <a href="${detailsUrl}"><img src="${escapeHtml(capaUrl)}" alt="Capa: ${escapeHtml(evento.titulo)}" class="w-full h-full object-cover rounded hover:scale-105 transition-all duration-300"></a>
      </div>
      <div class="flex flex-col justify-between flex-1">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(dateStr)}</time>
            <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(evento.local || 'Sem local')}</span>
          </div>
          <h3 class="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            <a href="${detailsUrl}" class="hover:text-primary transition-colors line-clamp-2">${escapeHtml(evento.titulo)}</a>
          </h3>
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">${escapeHtml(evento.descricao || '')}</p>
        </div>
        <a href="${detailsUrl}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4 inline-block">Ver mais detalhes &rarr;</a>
      </div>
    </article>
  `;
}

function buildEventoListCard(evento) {
  const dateStr = formatPostDatePtBr(evento.data);
  const capaUrl = evento.capa || getPath('posts/img/place-holder.png');
  const detailsUrl = getPath('pages/evento.html?slug=') + encodeURIComponent(evento.id);
  
  return `
    <article class="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300 w-full">
      <div class="md:w-1/3 shrink-0 h-48 md:h-40 bg-gray-255 dark:bg-gray-800 rounded overflow-hidden relative">
        <a href="${detailsUrl}"><img src="${escapeHtml(capaUrl)}" alt="Capa: ${escapeHtml(evento.titulo)}" class="w-full h-full object-cover rounded hover:scale-105 transition-all duration-300"></a>
      </div>
      <div class="flex flex-col justify-between py-1 flex-1">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(dateStr)}</time>
            <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(evento.local || 'Sem local')}</span>
          </div>
          <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            <a href="${detailsUrl}" class="hover:text-primary transition-colors">${escapeHtml(evento.titulo)}</a>
          </h3>
          <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">${escapeHtml(evento.descricao || '')}</p>
        </div>
        <a href="${detailsUrl}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">Ver mais detalhes &rarr;</a>
      </div>
    </article>
  `;
}

const placeholdersHomeHtml = `
  <article class="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300">
    <div class="w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">Capa do Evento</div>
    </div>
    <div class="flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">25 Out 2026</time>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">São Paulo, SP</span>
        </div>
        <h3 class="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <a href="${getPath('pages/evento.html?slug=11111111-1111-1111-1111-111111111111')}" class="hover:text-primary transition-colors line-clamp-2">I Seminário Internacional sobre Extrema Direita</a>
        </h3>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita.</p>
      </div>
      <a href="${getPath('pages/evento.html?slug=11111111-1111-1111-1111-111111111111')}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4 inline-block">Ver mais detalhes &rarr;</a>
    </div>
  </article>

  <article class="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300">
    <div class="w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">Capa do Evento</div>
    </div>
    <div class="flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">12 Nov 2026</time>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Online</span>
        </div>
        <h3 class="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <a href="${getPath('pages/evento.html?slug=22222222-2222-2222-2222-222222222222')}" class="hover:text-primary transition-colors line-clamp-2">Mesa Redonda: Mídias Sociais e Populismo</a>
        </h3>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina.</p>
      </div>
      <a href="${getPath('pages/evento.html?slug=22222222-2222-2222-2222-222222222222')}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4 inline-block">Ver mais detalhes &rarr;</a>
    </div>
  </article>

  <article class="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300">
    <div class="w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">Capa do Evento</div>
    </div>
    <div class="flex flex-col justify-between flex-1">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">05 Dez 2026</time>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Buenos Aires, Argentina</span>
        </div>
        <h3 class="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <a href="${getPath('pages/evento.html?slug=33333333-3333-3333-3333-333333333333')}" class="hover:text-primary transition-colors line-clamp-2">Conferência Regional: Democracia e Resistência</a>
        </h3>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional.</p>
      </div>
      <a href="${getPath('pages/evento.html?slug=33333333-3333-3333-3333-333333333333')}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4 inline-block">Ver mais detalhes &rarr;</a>
    </div>
  </article>
`;

const placeholdersListHtml = `
  <article class="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300 w-full">
    <div class="md:w-1/3 shrink-0 h-48 md:h-40 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">Capa do Evento</div>
    </div>
    <div class="flex flex-col justify-between py-1 flex-1">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">25 Out 2026</time>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">São Paulo, SP</span>
        </div>
        <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <a href="${getPath('pages/evento.html?slug=11111111-1111-1111-1111-111111111111')}" class="hover:text-primary transition-colors">I Seminário Internacional sobre Extrema Direita</a>
        </h3>
        <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">Um debate abrangente com especialistas latino-americanos discutindo a ascensão e os impactos das narrativas de extrema direita.</p>
      </div>
      <a href="${getPath('pages/evento.html?slug=11111111-1111-1111-1111-111111111111')}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">Ver mais detalhes &rarr;</a>
    </div>
  </article>

  <article class="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300 w-full">
    <div class="md:w-1/3 shrink-0 h-48 md:h-40 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">Capa do Evento</div>
    </div>
    <div class="flex flex-col justify-between py-1 flex-1">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">12 Nov 2026</time>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Online</span>
        </div>
        <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <a href="${getPath('pages/evento.html?slug=22222222-2222-2222-2222-222222222222')}" class="hover:text-primary transition-colors">Mesa Redonda: Mídias Sociais e Populismo</a>
        </h3>
        <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">Análise das dinâmicas e algoritmos que facilitam a difusão de discursos populistas de extrema direita na América Latina.</p>
      </div>
      <a href="${getPath('pages/evento.html?slug=22222222-2222-2222-2222-222222222222')}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">Ver mais detalhes &rarr;</a>
    </div>
  </article>

  <article class="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-all duration-300 w-full">
    <div class="md:w-1/3 shrink-0 h-48 md:h-40 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">Capa do Evento</div>
    </div>
    <div class="flex flex-col justify-between py-1 flex-1">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">05 Dez 2026</time>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Buenos Aires, Argentina</span>
        </div>
        <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <a href="${getPath('pages/evento.html?slug=33333333-3333-3333-3333-333333333333')}" class="hover:text-primary transition-colors">Conferência Regional: Democracia e Resistência</a>
        </h3>
        <p class="font-sans text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">Mapeamento de iniciativas democráticas e estratégias de resistência frente ao avanço do autoritarismo regional.</p>
      </div>
      <a href="${getPath('pages/evento.html?slug=33333333-3333-3333-3333-333333333333')}" class="font-sans text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">Ver mais detalhes &rarr;</a>
    </div>
  </article>
`;

export async function loadHomeEventos() {
  const grid = document.querySelector('#home-eventos-grid');
  if (!grid) return;
  
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data', { ascending: false }); // mais recentes primeiro
      
    if (error) throw error;
    
    if (data && data.length) {
      // Mostra apenas os 3 mais recentes no home
      const latestThree = data.slice(0, 3);
      grid.innerHTML = latestThree.map(buildEventoHomeCard).join('');
    } else {
      grid.innerHTML = placeholdersHomeHtml;
    }
  } catch (err) {
    console.warn('Erro ao buscar eventos do banco, exibindo placeholders:', err);
    grid.innerHTML = placeholdersHomeHtml;
  }
}

export async function loadEventosList() {
  const grid = document.querySelector('#eventos-list-grid');
  if (!grid) return;
  
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data', { ascending: false });
      
    if (error) throw error;
    
    if (data && data.length) {
      grid.innerHTML = data.map(buildEventoListCard).join('');
    } else {
      grid.innerHTML = placeholdersListHtml;
    }
  } catch (err) {
    console.warn('Erro ao buscar eventos do banco, exibindo placeholders:', err);
    grid.innerHTML = placeholdersListHtml;
  }
}

export async function loadEventoPage() {
  const container = document.querySelector('#evento-content');
  if (!container) return;
  
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    container.innerHTML = '<h1>Evento não encontrado</h1>';
    return;
  }
  
  try {
    const { data: ev, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', slug)
      .single();
      
    if (error || !ev) {
      // Fallback: check if we have it in mockEvents locally
      if (mockEvents[slug]) {
        renderEventDetail(mockEvents[slug], container);
        return;
      }
      container.innerHTML = '<h1>Evento não encontrado</h1>';
      return;
    }
    
    renderEventDetail(ev, container);
  } catch (err) {
    // Fallback: check mockEvents on fatal error
    if (mockEvents[slug]) {
      renderEventDetail(mockEvents[slug], container);
      return;
    }
    container.innerHTML = '<h1>Erro ao carregar o evento</h1>';
    console.error(err);
  }
}

function renderEventDetail(ev, container) {
  const title = ev.titulo || 'Sem título';
  const dateStr = formatPostDatePtBr(ev.data);
  const location = ev.local || 'Sem local';
  const image = String(ev.capa || '').trim();
  const desc = ev.descricao || '';
  const imagesList = Array.isArray(ev.imagens) ? ev.imagens : [];
  
  let htmlContent = `<p class="whitespace-pre-wrap">${escapeHtml(desc)}</p>`;
  if (window.marked && typeof window.marked.parse === 'function') {
    htmlContent = window.marked.parse(desc);
  }
  
  let galleryMarkup = '';
  if (imagesList.length) {
    galleryMarkup = `
      <section class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 class="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-6">Galeria de Imagens</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          ${imagesList.map(img => `
            <div class="overflow-hidden rounded bg-gray-100 dark:bg-gray-800 aspect-video">
              <img src="${escapeHtml(img)}" alt="Foto do evento" class="w-full h-full object-cover hover:scale-105 transition-all duration-300">
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }
  
  document.title = `${title} | OEDLA`;
  container.innerHTML = `
    <div class="mb-12">
      <p class="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-6"><a href="${getPath('pages/eventos.html')}" class="hover:text-gray-900 dark:hover:text-white transition-colors">&larr; Voltar para Eventos</a></p>
      <div class="flex items-center gap-3 mb-6">
        <time class="font-sans text-xs font-bold uppercase tracking-widest text-primary">${escapeHtml(dateStr)}</time>
        <span class="w-1 h-1 rounded-full bg-primary"></span>
        <span class="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">${escapeHtml(location)}</span>
      </div>
      <h1 class="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-8">${escapeHtml(title)}</h1>
    </div>
    <div class="flex flex-col">
      ${image ? `<div class="mb-10 w-full"><img src="${escapeHtml(image)}" alt="Capa: ${escapeHtml(title)}" class="w-full h-auto aspect-video object-cover rounded shadow-md"></div>` : ''}
      <div class="post-markdown max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg">${htmlContent}</div>
      ${galleryMarkup}
    </div>
  `;
}
