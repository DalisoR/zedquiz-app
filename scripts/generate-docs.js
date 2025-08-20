const fs = require('fs');
const path = require('path');

const markdown = require('jsdoc-to-markdown');
const reactDocs = require('react-docgen');

// Component directories to process
const COMPONENT_DIRS = [
  'src/components/core',
  'src/components/layout',
  'src/components/auth',
  'src/components/dashboard',
  'src/components/pages',
  'src/components/features'
];

/**
 * Generate documentation for a single component
 */
async function generateComponentDoc(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);

    if (ext === '.jsx' || ext === '.js') {
      // Parse React component documentation
      const componentInfo = reactDocs.parse(content);

      // Generate markdown documentation
      const docs = `# ${componentInfo.displayName || path.basename(filePath, ext)}

${componentInfo.description || ''}

## Props

${Object.entries(componentInfo.props || {})
  .map(
    ([name, prop]) => `
### \`${name}\`

${prop.description || ''}

- Type: \`${prop.type?.name || 'unknown'}\`
${prop.defaultValue ? `- Default: \`${prop.defaultValue.value}\`` : ''}
${prop.required ? '- Required' : '- Optional'}
`
  )
  .join('\n')}

## Examples

\`\`\`jsx
${componentInfo.examples?.join('\n') || '// No examples provided'}
\`\`\`
`;

      // Write documentation file
      const docsDir = path.join('docs/components', path.dirname(filePath).split('components/')[1]);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      fs.writeFileSync(path.join(docsDir, `${path.basename(filePath, ext)}.md`), docs);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

/**
 * Generate documentation for all components
 */
async function generateAllDocs() {
  // Create docs directory if it doesn't exist
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs');
  }
  if (!fs.existsSync('docs/components')) {
    fs.mkdirSync('docs/components');
  }

  // Process each component directory
  for (const dir of COMPONENT_DIRS) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.jsx') || file.endsWith('.js')) {
          await generateComponentDoc(path.join(dir, file));
        }
      }
    }
  }

  // Generate index file
  const index = `# Component Documentation

${COMPONENT_DIRS.map(dir => {
  const categoryName = dir.split('/').pop();
  const categoryPath = `components/${categoryName}`;
  return `## ${categoryName}

${
  fs.existsSync(`docs/${categoryPath}`)
    ? fs
        .readdirSync(`docs/${categoryPath}`)
        .map(file => `- [${path.basename(file, '.md')}](${categoryPath}/${file})`)
        .join('\n')
    : 'No components documented yet'
}
`;
}).join('\n\n')}
`;

  fs.writeFileSync('docs/index.md', index);
}

// Run documentation generation
generateAllDocs().catch(console.error);
