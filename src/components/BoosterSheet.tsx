import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackShop } from './PackShop';
import type { PackShopProps } from './PackShop';
import './BoosterSheet.css';

interface BoosterSheetProps {
  open: boolean;
  onClose: () => void;
  packShopProps: Omit<PackShopProps, 'compact'>;
}

export function BoosterSheet({ open, onClose, packShopProps }: BoosterSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 100);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="booster-sheet-backdrop"
            aria-label="Close booster shop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            className="booster-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booster-sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="booster-sheet-handle-wrap">
              <span className="booster-sheet-handle" aria-hidden />
            </div>
            <div className="booster-sheet-head">
              <h2 id="booster-sheet-title" className="booster-sheet-heading">
                Choose your booster
              </h2>
              <button type="button" className="booster-sheet-close" onClick={onClose}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="visually-hidden">Close</span>
              </button>
            </div>
            <div className="booster-sheet-body">
              <PackShop {...packShopProps} compact />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
