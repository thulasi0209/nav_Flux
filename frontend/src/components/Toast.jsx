import React, { useEffect } from 'react';

const Toast = ({ toasts, onRemove }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    info: 'var(--primary)',
    warning: 'var(--warning)'
  };

  return (
    <div className="glass" style={{
      padding: '12px 24px',
      borderLeft: `4px solid ${colors[toast.type] || colors.info}`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'fly-in-stagger 0.3s ease-out forwards',
      background: 'rgba(15, 23, 42, 0.9)'
    }}>
      <span style={{ fontSize: '1.2rem' }}>
        {toast.type === 'success' ? '✅' : (toast.type === 'error' ? '❌' : 'ℹ️')}
      </span>
      <span className="hud-font" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{toast.message}</span>
    </div>
  );
};

export default Toast;
