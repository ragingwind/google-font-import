# google-font-import

> Download google fonts and write html/css file with updated path

## Install

```
$ npm install --save google-font-import
```


## Usage

### Console

```sh
gf-import ./fixture/roboto.html --html=./.tmp --font=./.tmp/fonts --style=./.tmp
```

#### Options

- --html: html path to save the file having new path of style
- --fonts<optional>: destination path to download fonts
- --style<optional>: stylesheet path to save the file having new path of fonts

### API

```js
var imports = require("google-font-import");

var opts = {
  src: './fixture/roboto.html',
  htmlpath: './.tmp',
  fontpath: './.tmp/fonts',
  stylepath: './.tmp'
};

imports(opts).then(function () {
  console.log('done')
});
```

## API

### imports(options, [callback])

#### options

##### src

*Required*

The path of source html file having stylesheet of google fonts.

##### htmlpath

*Required*

html path to save a new html file having new path of stylesheet.

##### fontpath

The path for destination to download fonts, If it is not given it will be replaced by htmlpath.

##### stylepath

The path for stylesheet to save the file having new path of fonts. If it is not given it will be replaced by htmlpath.

## License

MIT © [Jimmy Moon](http://ragingwind.me)
