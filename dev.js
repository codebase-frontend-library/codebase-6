const browserSync = require('browser-sync').create();
const { exec, execSync } = require('child_process');

console.log('→ Performing initial full build...');
try {
  execSync('node build.js', { stdio: 'inherit' });
  console.log('Initial build complete.');
} catch (err) {
  console.error('Initial build failed:', err.message);
  process.exit(1);
}

browserSync.init({
  server: {
    baseDir: 'docs',
    index: 'index.html'
  },
  open: true,
  notify: false,
  ui: false
});

// Fast path: CSS-only changes → rebuild & inject CSS live
browserSync.watch('src/**/*.css').on('change', (filepath) => {
  console.log(`CSS change detected: ${filepath} → rebuilding CSS only...`);

  exec('npx postcss src/css/codebase-6.css -o docs/css/codebase-6.min.css --verbose', (err, stdout, stderr) => {
    if (err) {
      console.error('CSS rebuild failed:');
      console.error(stderr || err.message);
      browserSync.notify('CSS build failed — check terminal', 6000);
      return;
    }

    console.log('CSS rebuilt successfully');
    browserSync.reload('*.css');  // live-inject CSS without full reload
  });
});

// Full rebuild for everything else (templates, data, JS, images, fonts, root static files)
browserSync.watch([
  'src/**/*.njk',
  'src/data/metadata.json',
  'src/js/**/*',
  'src/img/**/*',
  'src/fonts/**/*',
  'src/*.{ico,png,xml,txt,json,webmanifest,robots.txt}'
]).on('change', (filepath) => {
  console.log(`Change detected: ${filepath} → full rebuild`);
  rebuild();
});

// Full rebuild function (used for non-CSS changes)
function rebuild() {
  console.log('Running full build...');
  try {
    execSync('node build.js', { stdio: 'inherit' });
    console.log('Full rebuild complete.');
    browserSync.reload();  // full page reload
  } catch (err) {
    console.error('Full rebuild failed:');
    console.error(err.message);
    browserSync.notify('Build failed — check terminal', 6000);
  }
}

console.log('Watching for changes...');