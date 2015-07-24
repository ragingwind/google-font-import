# google-font-importer [![Build Status](https://travis-ci.org/ragingwind/google-font-importer.svg?branch=master)](https://travis-ci.org/ragingwind/google-font-importer)

> Download google fonts

## Install

```
$ npm install --save gf-got
```


## Usage

```js
var gfGot = require("gf-got");

gfGot("http://google-font/robotics.css", funcion(fontStream) {
  
});

gfGot("http://google-font/robotics.css").pipe(writeFontStream());
```


## API

### googleFontImporter(input, [options])

#### input

*Required*  
Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`  
Default: `false`

Lorem ipsum.


## License

MIT © [ragingwind](http://ragingwind.me)
