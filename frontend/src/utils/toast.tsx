import toast from 'react-hot-toast';


export const showToast = {
  success: (message: string) => {
    toast.success(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 500 }}>{message}</span>
            <span style={{ fontSize: '9px', opacity: 0.6, fontStyle: 'italic' }}></span>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      ),
      { duration: 4000 }
    );
  },
  error: (message: string) => {
    toast.error(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 500 }}>{message}</span>
            <span style={{ fontSize: '9px', opacity: 0.6, fontStyle: 'italic' }}></span>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      ),
      { duration: 4000 }
    );
  },
  custom: (message: string, icon?: string) => {
    toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 500 }}>{message}</span>
            <span style={{ fontSize: '9px', opacity: 0.6, fontStyle: 'italic' }}></span>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      ),
      {
        icon,
        duration: 4000
      }
    );
  }
};
