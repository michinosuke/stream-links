/* eslint-disable no-console */
/*

  【 Usage 】

  ・ルートディレクトリで作業する場合
      $ gulp

  ・apple.comというサブディレクトリで作業する場合
      $ gulp --base apple.com

*/

const gulp = require('gulp');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
// const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const pug = require('gulp-pug');
const minimist = require('minimist');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const htmlValidator = require('gulp-w3c-html-validator');
// const plumber = require('gulp-plumber');
const through2 = require('through2');
const mode = require('gulp-mode')({
  modes: ['production', 'development'],
  default: 'development',
  verbose: false,
});

// --base オプションが付与されている場合は、それをbaseとする。
const parseArgs = () => {
  switch (process.argv.length) {
    case 3: return minimist(process.argv.slice(1));
    case 4: return minimist(process.argv.slice(2));
    case 5: return minimist(process.argv.slice(3));
    case 6: return minimist(process.argv.slice(3));
    default: return {};
  }
};

// baseとmodeの設定
const args = parseArgs();
if (!args.base) args.base = '';
const base = args.base === '' ? '' : `/${args.base}`;
const isDevelopment = !args.production;
console.log(`
[debug]
・args: ${JSON.stringify(args)}
・base: ${base}
・mode: ${isDevelopment ? 'development' : 'production'}
・isDevelopment: ${isDevelopment}
`);

// パスの管理
const path = {
  pug: {
    input: {
      dir: `src${base}/pug`,
      index: `src${base}/pug/index.pug`,
      all: `src${base}/pug/**/*.pug`,
    },
    output: {
      dir: `docs${base}`,
    },
  },
  sass: {
    input: {
      dir: `src${base}/sass`,
      index: `src${base}/sass/style.scss`,
      all: `src${base}/sass/**/*.scss`,
    },
    output: {
      dir: `docs${base}`,
    },
  },
  ts: {
    input: {
      dir: `src${base}/typescript`,
      index: `src${base}/typescript/index.ts`,
      all: `src${base}/typescript/**/*.ts`,
    },
    output: {
      dir: `docs${base}`,
    },
  },
};

// ブラウザの同期
gulp.task('browser-sync', () => {
  browserSync.init({
    port: 3000,
    files: ['./docs/**/*.*'],
    browser: 'google chrome',
    server: {
      baseDir: 'docs',
      index: 'index.html',
    },
    open: 'external',
    reloadDelay: 1000,
    reloadOnRestart: true,
    startPath: `.${base}/index.html`,
  });
});

// ブラウザのリロード
gulp.task('reload', (done) => {
  browserSync.reload();
  done();
});

// Pugのコンパイル
gulp.task('pug', () => gulp.src(path.pug.input.index)
  // .pipe(plumber())
  .pipe(pug({ pretty: isDevelopment }))
  .pipe(htmlValidator())
  .pipe(through2.obj((file, encoding, callback) => {
    callback(null, file);
    if (!file.w3cjs.success) { throw Error(`HTML validation error(s) found in 【${base}】`); }
  }))
  // .pipe(htmlValidator.reporter())
  .pipe(gulp.dest(path.pug.output.dir))
  .pipe(notify({
    title: 'Pug compiled.',
    message: new Date(),
    sound: 'Pop',
    icon: './notify-icon/icon_pug.png',
  })));

// SASSのコンパイル
gulp.task('sass', () => gulp.src(path.sass.input.index)
  // .pipe(plumber())
  // .pipe(sassGlob())
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer())
  .pipe(mode.production(cleanCSS()))
  .pipe(gulp.dest(path.sass.output.dir))
  .pipe(notify({
    title: 'Sass compiled.',
    message: new Date(),
    sound: 'Pop',
    icon: './notify-icon/icon_sass.png',
  })));

// TypeScriptのコンパイル
gulp.task('browserify', () => browserify(path.ts.input.index, { debug: isDevelopment })
  .plugin('tsify')
  .transform('babelify', { presets: ['es2015'] })
  .bundle()
  .on('error', (err) => {
    console.log(err.message);
    console.log(err.stack);
  })
  .pipe(source('bundle.min.js'))
  .pipe(buffer())
  .pipe(mode.production(uglify()))
  .pipe(gulp.dest(path.ts.output.dir))
  .pipe(notify({
    title: 'TypeScript compiled.',
    message: new Date(),
    sound: 'Pop',
    icon: './notify-icon/icon_babel.png',
  })));

// ブラウザを立ち上げ、ファイルを監視して、変更があればコンパイルする。
gulp.task('default', gulp.parallel('browser-sync', 'pug', 'sass', 'browserify', () => {
  gulp.watch('./src/**/*.pug', gulp.series('pug', 'reload'));
  gulp.watch('./src/**/*.scss', gulp.series('sass', 'reload'));
  gulp.watch('./src/**/*.ts', gulp.series('browserify', 'reload'));
}));

// ブラウザを立ち上げず、一度のみコンパイルする。
gulp.task('compile', gulp.parallel('pug', 'sass', 'browserify'));
