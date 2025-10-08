import React from 'react';

function TestApp() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#dbeafe', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2563eb' }}>SwasthAI Test Page</h1>
      <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>If you can see this, React is rendering correctly!</p>
      <button style={{ 
        marginTop: '1rem', 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        fontWeight: 'bold', 
        padding: '0.5rem 1rem', 
        borderRadius: '0.25rem',
        border: 'none',
        cursor: 'pointer'
      }}>
        Test Button
      </button>
    </div>
  );
}

export default TestApp;