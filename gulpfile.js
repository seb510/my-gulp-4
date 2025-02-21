"use strict"

const { src, dest, series, parallel, watch } = require("gulp")
const gulp = require("gulp")
const autoprefixer = require("gulp-autoprefixer")
const cssbeautify = require("gulp-cssbeautify")
const removeComments = require("gulp-strip-css-comments")
const rename = require("gulp-rename")
const concat = require("gulp-concat")
const sass = require("gulp-sass")(require("sass"))
const cssnano = require("gulp-cssnano")
const uglify = require("gulp-uglify")
const plumber = require("gulp-plumber")
const panini = require("panini")
const imagemin = require("gulp-imagemin")
const del = require("del")
const notify = require("gulp-notify")
const imagewebp = require("gulp-webp")
const browserSync = require("browser-sync").create()

/* Paths */
const srcPath = "src/"
const distPath = "dist/"
const assetsPath = "assets/"

const path = {
    build: {
        html: distPath,
        css: `${distPath}${assetsPath}css/`,
        js: `${distPath}${assetsPath}js/`,
        images: `${distPath}${assetsPath}images/`,
        fonts: `${distPath}${assetsPath}fonts/`
    },
    src: {
        html: `${srcPath}*.html`,
        css: `${srcPath}${assetsPath}scss/**/*.scss`,
        cssLibs: `${srcPath}${assetsPath}css/libs/*.css`,
        js: `${srcPath}${assetsPath}js/*.js`,
        jsLibs: `${srcPath}${assetsPath}js/libs/*.js`,
        images: `${srcPath}${assetsPath}img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}`,
        fonts: `${srcPath}${assetsPath}fonts/**/*.{eot,woff,woff2,ttf,svg}`
    },
    watch: {
        html: `${srcPath}**/*.html`,
        css: `${srcPath}${assetsPath}scss/**/*.scss`,
        js: `${srcPath}${assetsPath}js/*.js`,
        images: `${srcPath}${assetsPath}images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}`,
        fonts: `${srcPath}${assetsPath}fonts/**/*.{eot,woff,woff2,ttf,svg}`
    },
    clean: `./${distPath}`
}

/* Browser Sync */
function serve() {
    browserSync.init({
        server: { baseDir: `./${distPath}` }
    })
}

/* HTML */
function html() {
    panini.refresh()
    return src(path.src.html)
        .pipe(plumber({ errorHandler: notify.onError("HTML Error: <%= error.message %>") }))
        .pipe(panini({
            root: srcPath,
            layouts: `${srcPath}tpl/layouts/`,
            partials: `${srcPath}tpl/partials/`,
            data: `${srcPath}tpl/data/`
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream())
}

/* CSS */
function css() {
    return src(path.src.css)
        .pipe(plumber({ errorHandler: notify.onError("SCSS Error: <%= error.message %>") }))
        .pipe(sass())
        .pipe(autoprefixer({ overrideBrowserslist: ["last 10 versions"], grid: true }))
        .pipe(cssbeautify())
        .pipe(dest(path.build.css))
        .pipe(cssnano({ zindex: false, discardComments: { removeAll: true } }))
        .pipe(removeComments())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream())
}

/* CSS Libraries */
function cssLibs() {
    return src([path.src.cssLibs])
        .pipe(concat("libs.min.css"))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream())
}

/* JavaScript */
function js() {
    return src(path.src.js)
        .pipe(plumber({ errorHandler: notify.onError("JS Error: <%= error.message %>") }))
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream())
}

/* JavaScript Libraries */
function jsLibs() {
    return src([path.src.jsLibs])
        .pipe(concat("libs.min.js"))
        .pipe(uglify())
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream())
}

/* Images */
function images() {
    return src(path.src.images)
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({ plugins: [{ removeViewBox: true }, { cleanupIDs: false }] })
        ]))
        .pipe(dest(path.build.images))
        .pipe(browserSync.stream())
}

/* WebP Images */
function webpImages() {
    return src(path.src.images)
        .pipe(imagewebp())
        .pipe(dest(path.build.images))
}

/* Fonts */
function fonts() {
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.stream())
}

/* Clean */
function clean() {
    return del(path.clean)
}

/* Watch */
function watchFiles() {
    watch(path.watch.html, html)
    watch(path.watch.css, css)
    watch(path.watch.js, js)
    watch(path.watch.images, images)
    watch(path.watch.fonts, fonts)
    serve()
}

/* Tasks */
const build = series(clean, parallel(html, cssLibs, css, jsLibs, js, images, webpImages, fonts))
const dev = parallel(build, watchFiles)

exports.html = html
exports.css = css
exports.cssLibs = cssLibs
exports.js = js
exports.jsLibs = jsLibs
exports.images = images
exports.webpImages = webpImages
exports.fonts = fonts
exports.clean = clean
exports.build = build
exports.dev = dev
exports.default = dev
