#!/usr/bin/env node
/*
  Build SPX Graphics Controller as a desktop app.

  Official SPX binaries are Node apps packed with @yao-pkg/pkg, plus
  sidecar folders (ASSETS, DATAROOT, locales). This script does the same
  and wraps the Mac build as a double-clickable .app.

  Usage:
    node scripts/build-desktop.js              # macOS (arm64 + x64)
    node scripts/build-desktop.js macos
    node scripts/build-desktop.js macos-arm64
    node scripts/build-desktop.js macos-x64
    node scripts/build-desktop.js windows
    node scripts/build-desktop.js linux
    node scripts/build-desktop.js all
*/

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PKG_OUT = path.join(DIST, 'pkg');
const pkgJson = require(path.join(ROOT, 'package.json'));
const VERSION = pkgJson.version || '0.0.0';

const TARGETS = {
  'macos-arm64': {
    pkg: 'node22-macos-arm64',
    binaryName: 'SPX',
    platform: 'macos',
    arch: 'arm64',
    label: 'macOS Apple Silicon',
  },
  'macos-x64': {
    pkg: 'node22-macos-x64',
    binaryName: 'SPX',
    platform: 'macos',
    arch: 'x64',
    label: 'macOS Intel',
  },
  'windows': {
    pkg: 'node22-win-x64',
    binaryName: 'SPX.exe',
    platform: 'windows',
    arch: 'x64',
    label: 'Windows x64',
  },
  'linux': {
    pkg: 'node22-linux-x64',
    binaryName: 'SPX',
    platform: 'linux',
    arch: 'x64',
    label: 'Linux x64',
  },
};

function fail(message) {
  console.error('\n[build-desktop] ' + message);
  process.exit(1);
}

function log(message) {
  console.log('[build-desktop] ' + message);
}

function run(command, args, options) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: ROOT,
    ...options,
  });
  if (result.error) {
    fail('Failed to run ' + command + ': ' + result.error.message);
  }
  if (result.status !== 0) {
    fail(command + ' exited with code ' + result.status);
  }
}

function rimraf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function copyRecursive(src, dest, options) {
  const opts = options || {};
  const skipNames = opts.skipNames || [];
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    mkdirp(dest);
    for (const entry of fs.readdirSync(src)) {
      if (skipNames.indexOf(entry) !== -1) continue;
      if (entry === '.DS_Store' || entry === 'Thumbs.db') continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry), options);
    }
    return;
  }
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function resolveTargets(argv) {
  const arg = (argv[0] || 'macos').toLowerCase();
  if (arg === 'macos' || arg === 'mac' || arg === 'darwin') {
    return ['macos-arm64', 'macos-x64'];
  }
  if (arg === 'win' || arg === 'win32') {
    return ['windows'];
  }
  if (arg === 'all') {
    return ['macos-arm64', 'macos-x64', 'windows', 'linux'];
  }
  if (!TARGETS[arg]) {
    fail(
      'Unknown target "' +
        arg +
        '". Use macos, macos-arm64, macos-x64, windows, linux, or all.'
    );
  }
  return [arg];
}

function findPkgBin() {
  const names = process.platform === 'win32' ? ['pkg.cmd', 'pkg'] : ['pkg'];
  for (const name of names) {
    const candidate = path.join(ROOT, 'node_modules', '.bin', name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'pkg';
}

function copyRuntimeFiles(destDir) {
  const skipNames = ['node_modules', 'LOG', '.DS_Store'];
  copyRecursive(path.join(ROOT, 'ASSETS'), path.join(destDir, 'ASSETS'), {
    skipNames: skipNames,
  });
  copyRecursive(path.join(ROOT, 'DATAROOT'), path.join(destDir, 'DATAROOT'), {
    skipNames: skipNames,
  });
  copyRecursive(path.join(ROOT, 'locales'), path.join(destDir, 'locales'), {
    skipNames: skipNames,
  });
  const licenseSrc = path.join(ROOT, 'LICENSE.txt');
  if (fs.existsSync(licenseSrc)) {
    fs.copyFileSync(licenseSrc, path.join(destDir, 'LICENSE.txt'));
  }
}

function pngToIcns(pngBuffer, outPath) {
  const chunks = [
    { type: 'ic10', data: pngBuffer },
    { type: 'ic09', data: pngBuffer },
  ];
  let bodySize = 0;
  for (let i = 0; i < chunks.length; i++) {
    bodySize += 8 + chunks[i].data.length;
  }
  const total = 8 + bodySize;
  const buf = Buffer.alloc(total);
  buf.write('icns', 0);
  buf.writeUInt32BE(total, 4);
  let offset = 8;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    buf.write(chunk.type, offset);
    buf.writeUInt32BE(8 + chunk.data.length, offset + 4);
    chunk.data.copy(buf, offset + 8);
    offset += 8 + chunk.data.length;
  }
  fs.writeFileSync(outPath, buf);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createFallbackIconPng() {
  const size = 256;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x++) {
      const i = 1 + x * 4;
      const onBar = y >= 196;
      const inRound =
        x >= 8 && x < size - 8 && y >= 8 && y < size - 8;
      if (!inRound) {
        row[i] = 0;
        row[i + 1] = 0;
        row[i + 2] = 0;
        row[i + 3] = 0;
      } else if (onBar) {
        row[i] = 84;
        row[i + 1] = 174;
        row[i + 2] = 71;
        row[i + 3] = 255;
      } else {
        row[i] = 33;
        row[i + 1] = 38;
        row[i + 2] = 46;
        row[i + 3] = 255;
      }
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

function rasterizeOfficialSvg() {
  const svgPath = path.join(ROOT, 'static', 'img', 'spx.svg');
  if (!fs.existsSync(svgPath)) return null;

  try {
    const { Resvg } = require('@resvg/resvg-js');
    const svg = fs.readFileSync(svgPath);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
    return resvg.render().asPng();
  } catch (error) {
    log('Could not rasterize SVG with @resvg/resvg-js (' + error.message + ').');
  }

  const rsvg = spawnSync(
    'rsvg-convert',
    ['-w', '1024', '-h', '1024', svgPath],
    { encoding: 'buffer' }
  );
  if (rsvg.status === 0 && rsvg.stdout && rsvg.stdout.length > 100) {
    return rsvg.stdout;
  }
  return null;
}

function prepareIcons() {
  const assetsDir = path.join(__dirname, 'assets');
  mkdirp(assetsDir);
  const pngPath = path.join(assetsDir, 'icon.png');
  const icnsPath = path.join(assetsDir, 'icon.icns');

  let pngBuffer = rasterizeOfficialSvg();
  if (!pngBuffer) {
    log('Using fallback generated icon (install @resvg/resvg-js for the official SVG).');
    pngBuffer = createFallbackIconPng();
  }
  fs.writeFileSync(pngPath, pngBuffer);

  try {
    pngToIcns(pngBuffer, icnsPath);
  } catch (error) {
    log('Could not write icns: ' + error.message);
  }

  return { pngPath, icnsPath };
}

function zipDirectory(sourceDir, zipPath) {
  rimraf(zipPath);
  const parent = path.dirname(sourceDir);
  const name = path.basename(sourceDir);
  const zipCmd = spawnSync(
    'zip',
    ['-r', '-q', zipPath, name],
    { cwd: parent, stdio: 'inherit' }
  );
  if (zipCmd.status === 0) return;

  const tarPath = zipPath.replace(/\.zip$/, '.tar.gz');
  log('zip not available, writing ' + path.basename(tarPath) + ' instead.');
  run('tar', ['-czf', tarPath, name], { cwd: parent });
}

function assembleMacApp(target, binaryPath, icons) {
  const distName = 'SPX-' + VERSION + '-macos-' + target.arch;
  const appRoot = path.join(DIST, distName);
  const appPath = path.join(appRoot, 'SPX.app');
  const contents = path.join(appPath, 'Contents');
  const macOs = path.join(contents, 'MacOS');
  const resources = path.join(contents, 'Resources');
  const runtime = path.join(resources, 'app');

  rimraf(appRoot);
  mkdirp(macOs);
  mkdirp(runtime);

  const plistTemplate = fs.readFileSync(
    path.join(__dirname, 'macos', 'Info.plist'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(contents, 'Info.plist'),
    plistTemplate.replace(/__VERSION__/g, VERSION)
  );

  const launcherSrc = path.join(__dirname, 'macos', 'launch.sh');
  const launcherDest = path.join(macOs, 'SPX');
  fs.copyFileSync(launcherSrc, launcherDest);
  fs.chmodSync(launcherDest, 0o755);

  const serverDest = path.join(runtime, 'SPX');
  fs.copyFileSync(binaryPath, serverDest);
  fs.chmodSync(serverDest, 0o755);
  copyRuntimeFiles(runtime);

  if (icons.icnsPath && fs.existsSync(icons.icnsPath)) {
    fs.copyFileSync(icons.icnsPath, path.join(resources, 'AppIcon.icns'));
  }

  zipDirectory(appRoot, path.join(DIST, distName + '.zip'));
  log('Mac app: ' + appPath);
  return appPath;
}

function assembleFolder(target, binaryPath) {
  const distName = 'SPX-' + VERSION + '-' + target.platform + '-' + target.arch;
  const folder = path.join(DIST, distName);
  rimraf(folder);
  mkdirp(folder);

  const binaryDest = path.join(folder, target.binaryName);
  fs.copyFileSync(binaryPath, binaryDest);
  if (target.platform !== 'windows') {
    fs.chmodSync(binaryDest, 0o755);
  }
  copyRuntimeFiles(folder);

  if (target.platform === 'windows') {
    fs.copyFileSync(
      path.join(__dirname, 'windows', 'start-spx.cmd'),
      path.join(folder, 'start-spx.cmd')
    );
  }

  zipDirectory(folder, path.join(DIST, distName + '.zip'));
  log('Portable build: ' + folder);
  return folder;
}

function buildTarget(name, icons) {
  const target = TARGETS[name];
  log('Packing ' + target.label + ' (' + target.pkg + ')');
  mkdirp(PKG_OUT);

  const outputBinary = path.join(PKG_OUT, target.binaryName);
  rimraf(outputBinary);

  run(findPkgBin(), [
    'server.js',
    '--compress',
    'GZip',
    '--targets',
    target.pkg,
    '--output',
    outputBinary,
  ]);

  if (!fs.existsSync(outputBinary)) {
    fail('pkg did not produce ' + outputBinary);
  }

  if (target.platform === 'macos') {
    assembleMacApp(target, outputBinary, icons);
  } else {
    assembleFolder(target, outputBinary);
  }
}

function main() {
  const names = resolveTargets(process.argv.slice(2));
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    fail('node_modules is missing. Run npm install first.');
  }

  log('SPX ' + VERSION + ' on ' + os.platform() + '/' + os.arch());
  log('Targets: ' + names.join(', '));
  mkdirp(DIST);

  const icons = prepareIcons();
  for (let i = 0; i < names.length; i++) {
    buildTarget(names[i], icons);
  }
  log('Done. Output is in ' + DIST);
}

main();
