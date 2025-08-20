# Core Components

This directory contains core/base components that are used throughout the application.

## Component Guidelines

1. All components must:

   - Have PropTypes defined
   - Include JSDoc documentation
   - Have unit tests
   - Be exported as named exports

2. Naming Conventions:

   - Use PascalCase for component names
   - Use .jsx extension
   - Test files should be ComponentName.test.jsx

3. Props:

   - Document all props using PropTypes
   - Provide default props where appropriate
   - Use consistent prop naming across components

4. Styling:
   - Use CSS modules or styled-components
   - Follow BEM naming convention for CSS classes
   - Keep styles colocated with components
