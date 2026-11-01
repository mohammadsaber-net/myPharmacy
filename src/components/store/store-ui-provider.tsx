'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ContactForm from './contact-form';
import ProductRequestForm from './product-request-form';
import { StoreUiContext, type ToastKind } from './store-ui-context';

type ToastItem = { id: number; message: string; kind: ToastKind };

export function StoreUiProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<'contact' | 'request' | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const openModal = useCallback((kind: 'contact' | 'request') => setModal(kind), []);
  const closeModal = useCallback(() => setModal(null), []);
  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setModal(null); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [modal]);
  const value = useMemo(() => ({ openModal, closeModal, toast }), [openModal, closeModal, toast]);
  return <StoreUiContext.Provider value={value}>
    {children}
    {modal && <div className="store-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
      <section className="store-modal-panel" role="dialog" aria-modal="true" aria-labelledby="store-modal-title" dir="rtl">
        <div className="store-modal-heading"><div><span className="store-modal-kicker">صيدليتي · خدمة العملاء</span><h2 id="store-modal-title">{modal === 'contact' ? 'تواصل مع الصيدلية' : 'اطلب منتجًا غير متوفر'}</h2></div><button type="button" onClick={closeModal} aria-label="إغلاق النافذة" className="store-modal-close">×</button></div>
        {modal === 'contact' ? <ContactForm onSuccess={closeModal} /> : <ProductRequestForm onSuccess={closeModal} />}
      </section>
    </div>}
    <div className="store-toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((item) => 
      <div key={item.id} 
      className={`store-toast store-toast-${item.kind}`} 
      role={item.kind === 'error' ? 'alert' : 'status'}>
        <span className="store-toast-icon">
          {item.kind === 'success' ? '✓' : item.kind === 'error' ? '!' : 'i'}
          </span>
          <span>
            {item.message}</span>
            <button type="button" aria-label="إغلاق التنبيه"
             onClick={() => setToasts((current) =>
              current.filter((toastItem) => toastItem.id !== item.id))}>×</button>
        </div>)}
    </div>
  </StoreUiContext.Provider>;
}
