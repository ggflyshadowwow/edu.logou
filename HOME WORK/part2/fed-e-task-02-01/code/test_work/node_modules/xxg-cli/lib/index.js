// 实现这个项目的构建任务
const { src, dest, series, parallel, watch } = require('gulp');
const path = require('path');
const loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

const del = require('del');

const browserSync = require('browser-sync');
const bs = browserSync.create();
const cwd = process.cwd(); //获取当前命令行所在目录
let config = {
  // default config
  build: {
    src: 'src',
    public: 'public',
    dist: 'dist',
    temp: 'temp',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      fonts: 'assets/fonts/**',
      images: 'assets/images/**',
      extras: '**',
    },
    port: 2080,
  },
};
try {
  const loadConfig = require(path.join(cwd, '/pages.config.js'));
  config = Object.assign({}, config, loadConfig);
} catch (error) {}

// 样式任务
const style = () => {
  return src(config.build.paths.styles, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

// 脚本任务
const scripts = () => {
  return src(config.build.paths.scripts, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(
      plugins.babel({
        presets: [require('@babel/preset-env')],
      })
    )
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

// 页面任务
const page = () => {
  return src(config.build.paths.pages, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.swig({ data: config.data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

// 图片任务
const image = () => {
  return src(config.build.paths.images, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};

// 字体任务
const font = () => {
  return src(config.build.paths.fonts, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};

// 其他文件任务
const extra = () => {
  return src(config.build.paths.extras, {
    base: config.build.public,
    cwd: config.build.public,
  }).pipe(dest(config.build.dist));
};

// 清空dist文件
const clean = () => {
  return del([config.build.dist, config.build.temp]);
};

// 引用任务
const useref = () => {
  return src(config.build.paths.pages, {
    base: config.build.dist,
    cwd: config.build.temp,
  })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
    )
    .pipe(dest(config.build.dist));
};

// 编译代码
const compile = parallel(style, scripts, page);

// 构建任务 上线之前执行
const build = series(
  clean,
  parallel(series(compile, useref), extra, image, font)
);

// 服务
const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style);
  watch(config.build.paths.scripts, { cwd: config.build.src }, scripts);
  watch(config.build.paths.pages, { cwd: config.build.src }, page);
  // watch('src/assets/images/**', image);
  // watch('src/assets/fonts/**', font);
  // watch('public/**', extra);
  watch(
    [config.build.paths.images, config.build.paths.fonts],
    { cwd: config.build.src },
    bs.reload
  );
  watch(config.build.paths.extras, { cwd: config.build.public }, bs.reload);

  bs.init({
    notify: false,
    port: config.build.port,
    // open: false,
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules',
      },
    },
  });
};

// 开发服务
const start = series(compile, serve);

const deploy = (param) => {};

module.exports = {
  build,
  start,
  serve,
  clean,
};
