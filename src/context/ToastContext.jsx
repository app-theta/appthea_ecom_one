import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let seq = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);

  const push = useCallback((message, kind = 'success', ttl = 3600) => {
    if (!message) return;
    const id = ++seq;
    setItems((list) => [...list, { id, message: String(message), kind }]);
    window.setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), ttl);
  }, []);

  const value = useMemo(() => ({
    push,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 5200),
    info: (m) => push(m, 'info'),
    dismiss,
    items,
  }), [push, dismiss, items]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast-item toast-item--${i.kind}`}>
            <i
              className={`bi ${
                i.kind === 'error' ? 'bi-exclamation-circle' : i.kind === 'info' ? 'bi-info-circle' : 'bi-check-circle'
              }`}
              aria-hidden="true"
            />
            <span className="flex-grow-1">{i.message}</span>
            <button type="button" className="btn-close btn-close-sm" onClick={() => dismiss(i.id)} aria-label="Close" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
