const fs = require('fs');
const path = require('path');

const prettier = require('prettier');

/**
 * Convert a component file to the new standard
 */
async function convertComponent(filePath) {
  try {
    // Read the component file
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract component name from file path
    const componentName = path.basename(filePath, path.extname(filePath));
    const directory = path.dirname(filePath);
    const categoryName = path.basename(directory);

    // Basic analysis of the component
    const hasProps = content.includes('props') || content.includes('{');
    const hasStyling = content.includes('className');

    // Create standardized component content
    const newContent = `import React from 'react';
${hasProps ? "import PropTypes from 'prop-types';" : ''}
${hasStyling ? `import styles from './${componentName}.module.css';` : ''}

/**
 * @component ${componentName}
 * @category ${categoryName}
 * 
 * @description
 * [Add component description]
 * 
 * @example
 * \`\`\`jsx
 * import { ${componentName} } from './${componentName}';
 * 
 * function Example() {
 *   return (
 *     <${componentName}>
 *       [Add example usage]
 *     </${componentName}>
 *   );
 * }
 * \`\`\`
 */

// Convert the existing component content
${content.replace(
  /export default/g,
  `\n${componentName}.propTypes = {\n  // Add prop types\n};\n\n${componentName}.defaultProps = {\n  // Add default props\n};\n\nexport default`
)}`;

    // Format the code using prettier
    const formattedContent = await prettier.format(newContent, {
      parser: 'babel',
      singleQuote: true
    });

    // Write the new .jsx file
    const newPath = path.join(directory, `${componentName}.jsx`);
    fs.writeFileSync(newPath, formattedContent);

    // Create CSS module if styling is used
    if (hasStyling) {
      const cssContent = `/* Styles for ${componentName} */\n\n`;
      fs.writeFileSync(path.join(directory, `${componentName}.module.css`), cssContent);
    }

    // Create test file
    const testContent = `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders correctly', () => {
    render(<${componentName} />);
    // Add assertions
  });
});`;

    fs.writeFileSync(path.join(directory, `${componentName}.test.jsx`), testContent);

    // Remove the old .js file if it exists
    if (path.extname(filePath) === '.js') {
      fs.unlinkSync(filePath);
    }

    console.log(`✅ Converted ${componentName}`);
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

/**
 * Process all components in a directory
 */
async function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith('.js')) {
      await convertComponent(fullPath);
    }
  }
}

// Main execution
async function main() {
  const componentDirs = [
    'src/components/core',
    'src/components/layout',
    'src/components/auth',
    'src/components/dashboard',
    'src/components/pages',
    'src/components/features',
    'src/components/ui',
    'src/components/teacher',
    'src/components/student'
  ];

  for (const dir of componentDirs) {
    if (fs.existsSync(dir)) {
      console.log(`\nProcessing ${dir}...`);
      await processDirectory(dir);
    }
  }
}

main().catch(console.error);
