const fs = require('fs');
const path = require('path');

// Function to convert file to .jsx and add proper imports/exports
function standardizeComponent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add React import if missing
  if (!content.includes('import React')) {
    content = `import React from 'react';\n${content}`;
  }

  // Add prop-types if component has props
  if (content.includes('props')) {
    content = `import PropTypes from 'prop-types';\n${content}`;
  }

  // Convert to .jsx
  const newPath = filePath.replace('.js', '.jsx');
  fs.writeFileSync(newPath, content);

  // Remove old .js file if different
  if (newPath !== filePath) {
    fs.unlinkSync(filePath);
  }
}

// Process all component directories
const componentDirs = [
  'src/components/core',
  'src/components/layout',
  'src/components/auth',
  'src/components/dashboard',
  'src/components/pages',
  'src/components/features'
];

componentDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.js')) {
        standardizeComponent(path.join(dir, file));
      }
    });
  }
});
