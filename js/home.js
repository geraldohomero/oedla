import { supabase } from '../supabase-config.js';
import { getPath, escapeHtml, formatPostDatePtBr, formatCategoryLabel } from './utils.js';

function buildHomeFourColumnCard(post) {
  const imageSrc = post.image || getPath('posts/img/place-holder.png');
  const imageClass = post.image
    ? 'w-full h-full object-cover shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500'
    : 'w-full h-full object-contain opacity-80 dark:invert dark:opacity-50 transition-all duration-500';
  
  return `
    <article class="group relative flex flex-row sm:flex-col items-start gap-4 cursor-pointer w-full" data-href="${getPath('pages/post.html?slug=' + encodeURIComponent(post.slug))}">
      <a class="absolute inset-0 z-10" href="${getPath('pages/post.html?slug=' + encodeURIComponent(post.slug))}" aria-label="${escapeHtml(post.title)}"></a>
      
      <!-- Image container: order-2 on mobile (right side), order-1 on tablet/desktop (top) -->
      <div class="w-24 h-24 sm:w-full sm:aspect-[4/3] shrink-0 overflow-hidden rounded relative order-2 sm:order-1">
        <img src="${escapeHtml(imageSrc)}" alt="Capa: ${escapeHtml(post.title)}" class="${imageClass}">
      </div>
      
      <!-- Content container: order-1 on mobile (left side), order-2 on tablet/desktop (bottom) -->
      <div class="flex-1 flex flex-col gap-1 w-full min-w-0 mt-1 order-1 sm:order-2">
        <span class="font-sans text-[10px] font-bold uppercase tracking-wider text-primary">${escapeHtml(post.date)} &bull; ${escapeHtml(post.categoryLabel)}</span>
        <h3 class="font-serif text-sm md:text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-3">
          ${escapeHtml(post.title)}
        </h3>
        <span class="font-sans text-[10px] text-gray-400 group-hover:text-primary transition-colors mt-auto flex items-center gap-1">
          Ler mais &rarr;
        </span>
      </div>
    </article>
  `;
}

function buildCarouselSlide(post, index, isActive = false) {
  const imageSrc = post.image || getPath('posts/img/place-holder.png');
  const imageClass = post.image
    ? 'w-full aspect-video md:aspect-[4/3] object-cover rounded-lg shadow-md grayscale hover:grayscale-0 transition-all duration-500'
    : 'w-full aspect-video md:aspect-[4/3] object-contain rounded opacity-80 dark:invert dark:opacity-50 transition-all duration-500';
  
  const typeLabel = post.type === 'noticia' ? 'Notícia' : 'Análise';
  
  return `
    <div class="home-carousel-slide ${isActive ? 'active' : ''}" data-index="${index}">
      <div class="flex flex-col items-start text-left max-w-xl pr-0 md:pr-8">
        <span class="font-sans text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
          ${escapeHtml(post.date)} &bull; ${typeLabel}
        </span>
        <h3 class="font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-4 hover:text-primary transition-colors">
          <a href="${getPath('pages/post.html?slug=' + encodeURIComponent(post.slug))}">${escapeHtml(post.title)}</a>
        </h3>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 line-clamp-4">
          ${escapeHtml(post.excerpt)}
        </p>
        <a href="${getPath('pages/post.html?slug=' + encodeURIComponent(post.slug))}" class="inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wider text-primary hover:text-gray-900 dark:hover:text-white transition-colors border-b border-primary pb-1">
          Ler publicação completa &rarr;
        </a>
      </div>
      <div class="relative w-full overflow-hidden rounded-lg">
        <a href="${getPath('pages/post.html?slug=' + encodeURIComponent(post.slug))}"><img src="${escapeHtml(imageSrc)}" alt="Destaque: ${escapeHtml(post.title)}" class="${imageClass}"></a>
      </div>
    </div>
  `;
}

function initHomeCarousel(slidesCount) {
  if (slidesCount <= 1) return;
  
  let currentSlide = 0;
  const container = document.getElementById('home-carousel-container');
  if (!container) return;

  const slides = container.querySelectorAll('.home-carousel-slide');
  const dots = container.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  let autoplayTimer;
  
  function goToSlide(n) {
    if (!slides[currentSlide] || !dots[currentSlide]) return;
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = (n + slidesCount) % slidesCount;
    
    if (!slides[currentSlide] || !dots[currentSlide]) return;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }
  
  function nextSlide() {
    goToSlide(currentSlide + 1);
  }
  
  function prevSlide() {
    goToSlide(currentSlide - 1);
  }
  
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, 7000);
  }
  
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoplay();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoplay();
    });
  }
  
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      goToSlide(idx);
      startAutoplay();
    });
  });
  
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);
  
  startAutoplay();
}

export async function loadHomeLatestPosts() {
  const blogGrid = document.querySelector('#home-blog-grid');
  const newsGrid = document.querySelector('#home-news-grid');
  const carouselSlides = document.querySelector('#home-carousel-slides');
  const carouselDots = document.querySelector('#home-carousel-dots');
  
  if (!blogGrid && !newsGrid && !carouselSlides) {
    return;
  }

  try {
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*');
    
    if (error) throw error;

    const posts = (postsData || []).map((post, postIndex) => {
      const categoriesRaw = post.categorias || [];
      const categoryLabel = formatCategoryLabel(categoriesRaw[0] || 'Categoria');
      const parsedDate = Date.parse(String(post.data));

      return {
        slug: post.id,
        date: formatPostDatePtBr(post.data),
        categoryLabel,
        title: post.titulo || 'Sem título',
        excerpt: post.resumo || 'Sem resumo disponível.',
        publishedAtTs: Number.isNaN(parsedDate) ? -1 : parsedDate,
        sourceIndex: postIndex,
        type: post.tipo === 'notícia' ? 'noticia' : 'blog',
        image: String(post.poster || '').trim(),
        destaque: !!post.destaque,
      };
    });

    const sorted = [...posts].sort((left, right) => right.publishedAtTs - left.publishedAtTs || right.sourceIndex - left.sourceIndex);

    // 1. Carousel - Featured posts (max 3), fallback to latest 3 if none selected
    if (carouselSlides) {
      let latestHighlights = sorted.filter((p) => p.destaque).slice(0, 3);
      if (latestHighlights.length === 0) {
        latestHighlights = sorted.slice(0, 3);
      }
      if (latestHighlights.length) {
        carouselSlides.innerHTML = latestHighlights.map((post, idx) => buildCarouselSlide(post, idx, idx === 0)).join('');
        if (carouselDots) {
          carouselDots.innerHTML = latestHighlights.map((_, idx) => `
            <button class="carousel-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}" aria-label="Ir para slide ${idx + 1}"></button>
          `).join('');
        }
        initHomeCarousel(latestHighlights.length);
      } else {
        carouselSlides.innerHTML = '<p class="font-sans text-sm text-gray-500 p-8 w-full text-center">Nenhuma publicação disponível.</p>';
      }
    }

    // 2. Blog Grid - Latest 4
    if (blogGrid) {
      const latestBlog = sorted.filter((p) => p.type === 'blog').slice(0, 4);
      blogGrid.innerHTML = latestBlog.length
        ? latestBlog.map(buildHomeFourColumnCard).join('')
        : '<p class="font-sans text-sm text-gray-500 py-8 w-full text-center">Nenhum artigo disponível.</p>';
    }

    // 3. News Grid - Latest 4
    if (newsGrid) {
      const latestNews = sorted.filter((p) => p.type === 'noticia').slice(0, 4);
      newsGrid.innerHTML = latestNews.length
        ? latestNews.map(buildHomeFourColumnCard).join('')
        : '<p class="font-sans text-sm text-gray-500 py-8 w-full text-center">Nenhuma notícia disponível.</p>';
    }

    // Bind click events on cards
    document.querySelectorAll('[data-href]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        window.location.href = el.dataset.href;
      });
    });

  } catch (error) {
    const errorHtml = `
      <div class="col-span-full py-8 text-center text-red-500 font-sans">
        <p class="font-bold">Erro ao carregar conteúdo</p>
        <p class="text-xs">Tente abrir o site com servidor local.</p>
      </div>
    `;
    if (blogGrid) blogGrid.innerHTML = errorHtml;
    if (newsGrid) newsGrid.innerHTML = errorHtml;
    if (carouselSlides) carouselSlides.innerHTML = '<p class="font-sans text-sm text-gray-500 p-8 w-full text-center">Não foi possível carregar as investigações em destaque.</p>';
    console.error(error);
  }
}
