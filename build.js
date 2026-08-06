#!/usr/bin/env node
// Assembles the single-file index.html from the sources under src/.
// No dependencies — only Node's built-in fs/path — so CI needs no npm install.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const OUT_FILE = path.join(ROOT, 'index.html');

const BANNER = '<!-- AUTO-GENERATED FILE — do not edit directly. Source lives under /src; run `node build.js` (or push — CI rebuilds this file). -->\n';

function readTrimmed(filePath){
  return fs.readFileSync(filePath, 'utf8').trimEnd();
}

function build(){
  const template = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
  const styles = readTrimmed(path.join(SRC_DIR, 'styles.css'));

  const jsDir = path.join(SRC_DIR, 'js');
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
  const script = jsFiles.map(f => readTrimmed(path.join(jsDir, f))).join('\n\n');

  let output = template
    .replace('<!-- BUILD:STYLE -->', `<style>\n${styles}\n</style>`)
    .replace('<!-- BUILD:SCRIPT -->', `<script>\n(function(){\n${script}\n})();\n</script>`);

  output = BANNER + output;

  fs.writeFileSync(OUT_FILE, output);
  console.log(`Built ${path.relative(ROOT, OUT_FILE)} from ${jsFiles.length} script files.`);
}

build();
