import path from 'node:path';
import { ensureDir, readJson, writeJson, writeBinaryFromBase64, writeText } from './lib/io.mjs';
import { slugify } from './lib/slugify.mjs';

function normalizePostType(rawType) {
  const value = String(rawType || '').trim().toLowerCase();
  if (value === 'noticia' || value === 'notícia' || value === 'noticias' || value === 'notícias') {
    return 'noticias';
  }
  return 'artigos';
}

function buildFrontmatter(manifest, coverFileName) {
  const lines = [
    '---',
    `title: ${manifest.title}`,
    `categories: ${manifest.categories}`,
    `authors: ${manifest.authors}`,
    `date: ${manifest.date}`,
    `excerpt: ${manifest.excerpt}`,
    `image: img/${coverFileName}`,
    '---',
    '',
  ];
  return lines.join('\n');
}

export function processPost(bundle, repoRoot) {
  const postType = normalizePostType(bundle.postType);
  const slug = slugify(bundle.slug || bundle.title);
  const postDir = path.join(repoRoot, 'site', 'posts', postType, slug);
  const imgDir = path.join(postDir, 'img');

  ensureDir(imgDir);

  const files = bundle.files || {};
  const cover = files.capa;
  if (!cover?.base64) {
    throw new Error('Post bundle missing files.capa (cover image)');
  }

  const coverExt = String(cover.extension || 'jpg').replace(/^\./, '').toLowerCase();
  const coverFileName = `capa.${coverExt}`;
  writeBinaryFromBase64(path.join(imgDir, coverFileName), cover.base64);

  Object.entries(files).forEach(([key, file]) => {
    if (key === 'capa' || !file?.base64) {
      return;
    }
    const ext = String(file.extension || 'jpg').replace(/^\./, '').toLowerCase();
    writeBinaryFromBase64(path.join(imgDir, `${key}.${ext}`), file.base64);
  });

 let body = String(bundle.body || '').trim();
  
  // Injeta a extensão exata nos placeholders do markdown (ex: transforma {1} em {1.png})
  body = body.replace(/\{(\d+)(?:\.[a-zA-Z0-9]+)?\}/g, (match, num) => {
    const file = files[num];
    if (file && file.extension) {
      const ext = String(file.extension).replace(/^\./, '').toLowerCase();
      return `{${num}.${ext}}`;
    }
    return match;
  });

  const markdown = `${buildFrontmatter(bundle, coverFileName)}${body}\n`;
  writeText(path.join(postDir, 'post.md'), markdown);

  const manifestPath = path.join(repoRoot, 'site', 'posts', 'posts.json');
  const postsManifest = readJson(manifestPath);
  const listKey = postType === 'noticias' ? 'noticias' : 'artigos';
  const list = postsManifest[listKey] || [];

  const entry = {
    slug,
    file: `${postType}/${slug}/post.md`,
  };

  const existingIndex = list.findIndex((item) => item.slug === slug);
  if (existingIndex === -1) {
    list.push(entry);
  } else {
    list[existingIndex] = entry;
  }

  postsManifest[listKey] = list;
  writeJson(manifestPath, postsManifest);

  return { kind: 'post', slug, postType };
}
