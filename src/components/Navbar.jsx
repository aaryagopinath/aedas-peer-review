import React from 'react';

const Navbar = ({ activeTab, setActiveTab, isAdmin }) => {
  
  const navStyle = {
    width: '100%',
    background: '#000',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid #333'
  };

  const itemStyle = (tabName) => ({
    cursor: 'pointer',
    color: activeTab === tabName ? 'var(--primary)' : 'var(--text-dim)',
    fontWeight: 600,
    paddingBottom: '5px',
    borderBottom: activeTab === tabName ? '2px solid var(--primary)' : 'none',
    transition: 'color 0.3s'
  });

  return (
    <div style={navStyle}>
      <div 
        style={itemStyle('assessment')} 
        onClick={() => setActiveTab('assessment')}
      >
        Assessment
      </div>
      
      <div 
        style={itemStyle('scores')} 
        onClick={() => setActiveTab('scores')}
      >
        Score Cards
      </div>

      {isAdmin && (
        <>
          <div 
            style={itemStyle('reports')} 
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </div>
          <div 
            style={itemStyle('cycles')} 
            onClick={() => setActiveTab('cycles')}
          >
            Cycles
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;