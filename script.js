import { loadLayoutComponents, wireMobileMenu } from './js/layout.js';
import { wireThemeToggle } from './js/theme.js';
import { loadLabSocialLinks, loadHeroDynamic, loadBlogPageInfo, loadQuemSomosDynamic } from './js/info.js';
import { loadHomeLatestPosts } from './js/home.js';
import { loadBlogList, loadNoticiasList, loadPostPage } from './js/posts.js';
import { loadIntegrantesPage, loadIntegranteProfilePage } from './js/authors.js';
import { loadHomeEventos, loadEventosList, loadEventoPage } from './js/eventos.js';

async function initPage() {
  try {
    await loadLayoutComponents();
  } catch (error) {
    console.error('Falha ao carregar componentes de layout.', error);
  }

  wireMobileMenu();
  wireThemeToggle();

  // Load content
  await Promise.all([
    loadLabSocialLinks(),
    loadHeroDynamic(),
    loadBlogPageInfo(),
    loadQuemSomosDynamic(),
    loadHomeLatestPosts(),
    loadBlogList(),
    loadNoticiasList(),
    loadPostPage(),
    loadIntegrantesPage(),
    loadIntegranteProfilePage(),
    loadHomeEventos(),
    loadEventosList(),
    loadEventoPage(),
  ]);
}

initPage();