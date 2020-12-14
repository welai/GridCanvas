const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

function generateConfig(name) {
  var uglify = name.indexOf('min') > -1;
  var config = {
    mode:   'development',
    entry:  './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: 'gridcanvas',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          exclude: /node_modules/
        }
      ]
    }
  };
  if(uglify) {
    config.optimization = {
      minimize: true, minimizer: [ new TerserPlugin() ]
    }
    config.mode = 'production';
  }
  return config;
}

module.exports = ['gridcanvas', 'gridcanvas.min'].map((name) => generateConfig(name));

