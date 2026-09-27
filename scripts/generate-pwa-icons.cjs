// Derive the required install sizes from the existing app icon using Expo's image pipeline.
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { generateImageAsync } = require('@expo/image-utils');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const output = path.join(projectRoot, 'public', 'icons');
  await mkdir(output, { recursive: true });
  for (const [size, filename] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
    const { source } = await generateImageAsync({ projectRoot }, {
      src: path.join(projectRoot, 'assets', 'icon.png'),
      width: size, height: size, resizeMode: 'contain',
      backgroundColor: '#fafafa', removeTransparency: true,
    });
    await writeFile(path.join(output, filename), source);
  }
  console.log('Generated PWA install icons.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
