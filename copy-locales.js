const fs = require('fs');
const path = require('path');

// Source and destination directories
const srcDir = path.join(__dirname, 'src/infrastructure/i18n/locales');
const destDir = path.join(__dirname, 'dist/infrastructure/i18n/locales');

// Function to copy directory recursively
function copyDirectory(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory contents
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

// Execute copy operation
try {
  copyDirectory(srcDir, destDir);
  console.log('Locales directory copied successfully.');
} catch (error) {
  console.error('Error copying locales directory:', error);
  process.exit(1);
}
