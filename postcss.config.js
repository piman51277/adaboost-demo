const config = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-calc'),
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default',
    }),
  ]
}
module.exports = config;