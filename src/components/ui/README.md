# UI Components Documentation

## Table of Contents

1. [Button](#button)
2. [Card](#card)
3. [FormInput](#forminput)
4. [LoadingSpinner](#loadingspinner)
5. [Modal](#modal)
6. [Alert](#alert)
7. [Table](#table)

## Button

A versatile button component with multiple variants and states.

### Props

- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `fullWidth`: boolean (default: false)
- `disabled`: boolean (default: false)
- `loading`: boolean (default: false)
- `type`: 'button' | 'submit' | 'reset' (default: 'button')
- `onClick`: function
- `className`: string for additional styling

### Example

```jsx
<Button variant='primary' size='md' onClick={() => console.log('clicked')} loading={false}>
  Click Me
</Button>
```

## Card

A container component for grouping related content.

### Props

- `variant`: 'default' | 'highlighted' | 'error' | 'success' (default: 'default')
- `title`: string (optional)
- `subtitle`: string (optional)
- `action`: ReactNode (optional)
- `noPadding`: boolean (default: false)
- `className`: string for additional styling

### Example

```jsx
<Card title='Card Title' subtitle='Card Subtitle' variant='default'>
  Card content goes here
</Card>
```

## FormInput

A form input component with built-in label and error handling.

### Props

- `label`: string
- `id`: string
- `error`: string
- `type`: string (default: 'text')
- `required`: boolean (default: false)
- `helperText`: string
- `className`: string for additional styling

### Example

```jsx
<FormInput
  label='Email'
  id='email'
  type='email'
  required
  error='Invalid email address'
  helperText="We'll never share your email"
/>
```

## LoadingSpinner

A loading indicator component.

### Props

- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `color`: 'primary' | 'secondary' | 'white' (default: 'primary')
- `fullScreen`: boolean (default: false)
- `text`: string (optional)
- `className`: string for additional styling

### Example

```jsx
<LoadingSpinner size='md' color='primary' text='Loading...' />
```

## Modal

A modal dialog component.

### Props

- `isOpen`: boolean
- `onClose`: function
- `title`: string (optional)
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md')
- `showClose`: boolean (default: true)
- `footer`: ReactNode (optional)
- `className`: string for additional styling

### Example

```jsx
<Modal isOpen={true} onClose={() => setIsOpen(false)} title='Modal Title' size='md'>
  Modal content goes here
</Modal>
```

## Alert

An alert message component for notifications and feedback.

### Props

- `title`: string (optional)
- `message`: string (optional)
- `variant`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `onClose`: function (optional)
- `showIcon`: boolean (default: true)
- `className`: string for additional styling

### Example

```jsx
<Alert
  title='Success!'
  message='Operation completed successfully'
  variant='success'
  onClose={() => setShow(false)}
/>
```

## Table

A flexible table component for displaying data.

### Props

- `columns`: array of column definitions
- `data`: array of data objects
- `onRowClick`: function (optional)
- `striped`: boolean (default: true)
- `hover`: boolean (default: true)
- `border`: boolean (default: true)
- `compact`: boolean (default: false)
- `className`: string for additional styling

### Example

```jsx
const columns = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Name' },
  {
    field: 'actions',
    header: 'Actions',
    render: (_, row) => <Button onClick={() => handleAction(row)}>Edit</Button>
  }
];

<Table columns={columns} data={data} onRowClick={row => console.log(row)} striped hover />;
```
