const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../src/prisma');
const destDir = path.join(__dirname, '../dist/prisma');

// Copy directory recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(sourceDir)) {
  copyRecursiveSync(sourceDir, destDir);
  console.log('✅ Prisma client copied to dist/prisma');
} else {
  console.error('❌ Prisma client not found at:', sourceDir);
  process.exit(1);
}