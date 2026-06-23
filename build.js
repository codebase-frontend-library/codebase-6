const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const nunjucks = require('nunjucks');
const fastGlob = require('fast-glob');
const grayMatter = require('gray-matter');

const SRC = 'src';
const DEST = 'docs';

// Pretty URls with trailing-slash URL for templates
function getUrl(relPath) {
  let clean = relPath
    .replace(/^pages\//, '')
    .replace(/\.njk$/, '')
    .replace(/\/index$/, '');  // treat index.njk as the parent folder

  if (clean === 'index' || clean === '') {
    return '/';
  }

  return '/' + clean + '/';
}

// Load global data (metadata.json)
let globalData = {
  site: { title: 'Untitled Site', description: '' },
  version: '0.0.0'
};

async function loadGlobalData() {
  try {
    const metadataPath = path.join(SRC, 'data/metadata.json');
    const raw = await fs.readFile(metadataPath, 'utf-8');
    const data = JSON.parse(raw);
    globalData = {
      ...globalData,
      ...data,
      site: { ...globalData.site, ...data?.site }
    };
    console.log(`Global data loaded: ${globalData.site.title} v${globalData.version}`);
  } catch (err) {
    console.warn('Warning: Could not load metadata.json — using defaults');
    console.warn(err.message);
  }
}

// Configure Nunjucks
nunjucks.configure(SRC, {
  autoescape: true,
  noCache: true,
  trimBlocks: true,
  lstripBlocks: true
});

// Copy static assets
async function copyStaticAssets() {
  const staticPatterns = [
    'css/other/**/*.{css}',
    'js/**/*.{js,mjs}',
    'img/**/*.{png,jpg,jpeg,gif,svg,webp,avif,ico}',
    'fonts/**/*.{woff,woff2,ttf,otf,eot}',
    '*.{ico,png,xml,txt,json,webmanifest,robots.txt}',
  ];

  console.log('Copying static assets...');

  for (const pattern of staticPatterns) {
    const files = await fastGlob(path.join(SRC, pattern), { onlyFiles: true });
    for (const srcFile of files) {
      const relPath = path.relative(SRC, srcFile);
      const destFile = path.join(DEST, relPath);
      await fs.mkdir(path.dirname(destFile), { recursive: true });
      await fs.copyFile(srcFile, destFile);
      console.log(` copied: ${relPath}`);
    }
  }
}

// Main build function
async function build() {
  console.time('Build completed');
  await loadGlobalData();

  // 1. Clean destination
  await fs.rm(DEST, { recursive: true, force: true });
  await fs.mkdir(DEST, { recursive: true });

  // 2. Copy static assets
  await copyStaticAssets();

  // 3. Build & minify CSS
  try {
    execSync(
      'npx postcss src/css/codebase-6.css -o docs/css/codebase-6.min.css --verbose',
      { stdio: 'inherit' }
    );
    console.log('CSS built → docs/css/codebase-6.min.css');
  } catch (err) {
    console.error('CSS build failed:');
    console.error(err.message);
    process.exit(1);
  }

  // 4. Render Nunjucks pages with dynamic layout + pretty URLs
  const pageFiles = await fastGlob(path.join(SRC, 'pages/**/*.njk'), { onlyFiles: true });

  if (pageFiles.length === 0) {
    console.warn('No .njk pages found in src/pages/');
  }

  for (const file of pageFiles) {
    const relPath = path.relative(SRC, file);

    let html;
    let outRel;

    try {
      const fileContent = await fs.readFile(file, 'utf-8');
      const { data: frontMatter, content: pageContent } = grayMatter(fileContent);

      const context = {
        ...globalData,
        page: {
          title: frontMatter.title || globalData.site?.title || 'Untitled Page',
          description: frontMatter.description || globalData.site?.description || '',
          url: getUrl(relPath),           // ← now uses trailing slash
          isHome: relPath === 'pages/index.njk' || relPath.endsWith('/index.njk'),
          ...frontMatter,
        },
        year: new Date().getFullYear(),
        content: ''
      };

      const renderedPageContent = nunjucks.renderString(pageContent, context);

      const layoutPath = frontMatter.layout || '_includes/layout.njk';

      context.content = renderedPageContent;
      html = nunjucks.render(layoutPath, context);

      // Pretty URLs with trailing slash → folder/index.html
      let cleanPath = relPath
        .replace(/^pages\//, '')
        .replace(/\.njk$/, '');

      if (cleanPath === 'index' || cleanPath === '') {
        outRel = 'index.html';
      } else {
        outRel = path.join(cleanPath, 'index.html');
      }

      console.log(` rendered: ${relPath} → ${outRel} (URL: ${getUrl(relPath)}) (layout: ${frontMatter.layout || 'default'})`);

    } catch (err) {
      console.error(`Render error in ${relPath}:`);
      console.error(err.message);
      continue;
    }

    const outFile = path.join(DEST, outRel);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, html);
  }

  console.timeEnd('Build completed');
  console.log('Build finished successfully.');
}

// Run build
build().catch(err => {
  console.error('Build script error:');
  console.error(err);
  process.exit(1);
});