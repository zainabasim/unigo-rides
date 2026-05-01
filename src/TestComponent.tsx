import React from 'react';

const TestComponent = () => {
  console.log('TestComponent: Rendering');
  return (
    <div style={{ 
      backgroundColor: 'blue', 
      color: 'white', 
      padding: '50px', 
      fontSize: '24px',
      textAlign: 'center',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: 9999
    }}>
      TEST: If you can see this blue screen, React is working!
    </div>
  );
};

export default TestComponent;
