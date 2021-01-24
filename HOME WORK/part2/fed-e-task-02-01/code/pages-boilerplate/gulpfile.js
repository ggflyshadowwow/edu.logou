// 实现这个项目的构建任务
const { src, dest, series, parallel, watch } = require('gulp')

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()

const del = require('del')

const browserSync = require('browser-sync')
const bs = browserSync.create()

const data = {
  menus: [{ name: 'Home', link: 'index.html' }],
  pkg: require('./package.json'),
  date: new Date()
}

// 样式任务
const style = () => {
  return src('src/**/*.scss', { base: 'src' }).pipe(plugins.sass({ outputStyle: 'expanded' })).pipe(dest('temp')).pipe(bs.reload({ stream: true }))
}

// 脚本任务
const scripts = () => {
  return src('src/*.js', { base: 'src' }).pipe(plugins.babel({
    presets: ['@babel/preset-env']
  })).pipe(dest('temp')).pipe(bs.reload({ stream: true }))
}

// 页面任务
const page = () => {
  return src('src/*.html', { base: 'src' }).pipe(plugins.swig({ data })).pipe(dest('temp')).pipe(bs.reload({ stream: true }))
}

// 图片任务
const image = () => {
  return src('src/assets/images/**', { base: 'src' }).pipe(plugins.imagemin()).pipe(dest('dist'))
}

// 字体任务
const font = () => {
  return src('src/assets/fonts/**', { base: 'src' }).pipe(plugins.imagemin()).pipe(dest('dist'))
}

// 其他文件任务
const extra = () => {
  return src('public/**', { base: 'public' }).pipe(dest('dist'))
}

// 清空dist文件
const clean = () => {
  return del(['dist', 'temp'])
}

// 引用任务 
const useref = () => {
  return src('temp/*.html', { base: 'dist' }).pipe(plugins.useref({ searchPath: ['dist', '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true })))
    .pipe(dest('dist'))
}

// 编译代码
const compile = parallel(style, scripts, page)

// 构建任务 上线之前执行
const build = series(clean, parallel(series(compile, extra, ), image, font))

// 服务
const serve = () => {
  watch('src/**/*.scss', style);
  watch('src/*.js', scripts);
  watch('src/*.html', page);
  // watch('src/assets/images/**', image);
  // watch('src/assets/fonts/**', font);
  // watch('public/**', extra);
  watch(['src/assets/images/**', 'src/assets/fonts/**', 'public/**'], bs.reload)

  bs.init({
    notify: false,
    port: '2080',
    // open: false,
    // files: 'dist/**',
    server: {
      baseDir: ['temp', 'src', 'public'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

// 开发服务
const start = series(compile, serve)

const deploy = (param) => {

}


module.exports = {
  build,
  start,
  serve,
}