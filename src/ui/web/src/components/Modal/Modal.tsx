import { useEffect, useId, useMemo, useRef } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const getFocusable = (root: HTMLElement) => {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector));
  return nodes.filter((node) => {
    if (node.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    // Hidden elements can't be focused reliably.
    const style = window.getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
};

export const useModalTitleId = () => {
  const reactId = useId();
  return useMemo(() => `modal-title-${reactId}`, [reactId]);
};

export const Modal = ({
  open,
  onClose,
  labelledBy,
  ariaLabel,
  className,
  initialFocusRef,
  children
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusInitial = () => {
      const root = modalRef.current;
      if (!root) {
        return;
      }

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      const focusables = getFocusable(root);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        root.focus();
      }
    };

    // Wait a tick so the DOM is painted before focusing.
    const raf = window.requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const root = modalRef.current;
      if (!root) {
        return;
      }

      const focusables = getFocusable(root);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? focusables.indexOf(active) : -1;

      if (event.shiftKey) {
        const nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
        event.preventDefault();
        focusables[nextIndex].focus();
      } else {
        const nextIndex = currentIndex === -1 || currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
        event.preventDefault();
        focusables[nextIndex].focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [initialFocusRef, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`modal ${className ?? ''}`.trim()}
        ref={modalRef}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

