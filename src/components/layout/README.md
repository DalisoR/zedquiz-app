# Layout Components

This directory contains layout components that define the overall structure of the application.

## Components Overview

- `AppLayout.jsx` - Main application layout wrapper
- `ErrorBoundary.jsx` - Error handling wrapper component

## Guidelines

1. Layout Components Must:

   - Be responsive and mobile-friendly
   - Handle different screen sizes gracefully
   - Include proper error boundaries
   - Use CSS Grid or Flexbox for layouts
   - Consider accessibility (proper landmarks, ARIA roles)

2. Structure:

   - Keep layouts simple and flat
   - Use CSS modules for styling
   - Implement proper prop drilling or context
   - Handle loading and error states

3. Performance:

   - Minimize DOM nesting
   - Use React.memo() for heavy components
   - Implement proper code splitting
   - Optimize for layout shifts (CLS)

4. Error Handling:
   - Implement ErrorBoundary components
   - Provide fallback UI
   - Log errors appropriately
   - Handle async errors

## Best Practices

- Use semantic HTML elements
- Implement proper heading hierarchy
- Consider print stylesheets where needed
- Test across different viewports
- Document breakpoints and grid systems
