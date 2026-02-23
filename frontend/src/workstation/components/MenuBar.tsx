import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDawStore from '../state/dawStore';

const MenuBar: React.FC = () => {
  const navigate = useNavigate();
  const projectName = useDawStore((s) => s.projectName);
  const setProjectName = useDawStore((s) => s.setProjectName);

  const handleSave = async () => {
    console.log('Saving project...', projectName);
    alert('Project saved!');
  };

  return (
    <div style={styles.menuBar}>
      <div style={styles.menuLeft}>
        <button onClick={() => navigate('/create')} style={styles.menuButton}>↩ Exit</button>
        <span style={styles.menuDivider}>|</span>
        <button style={styles.menuButton}>File</button>
        <button style={styles.menuButton}>Edit</button>
        <button style={styles.menuButton}>View</button>
        <button style={styles.menuButton}>Settings</button>
        <button style={styles.menuButton}>Help</button>
      </div>
      <div style={styles.menuRight}>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={styles.projectNameInput}
        />
        <button onClick={handleSave} style={styles.saveButton}>Save</button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  menuBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
  },
  menuLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  menuRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    fontFamily: "'Poppins', sans-serif",
  },
  menuDivider: {
    color: '#3a3a5e',
    margin: '0 8px',
  },
  projectNameInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'right' as const,
    width: '200px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: "'Poppins', sans-serif",
  },
  saveButton: {
    background: 'linear-gradient(135deg, #00d4ff 0%, #0096c7 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
  },
};

export default MenuBar;