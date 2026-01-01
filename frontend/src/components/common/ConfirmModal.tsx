import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef } from 'react';
import { useModal } from '../layout/AppContainer';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';

interface ConfirmModalProps {
  title: string;
  description: string;
  setIsConfirm: (isConfirm: boolean) => void;
}

export default function ConfirmModal({
  title,
  description,
  setIsConfirm,
}: ConfirmModalProps) {
  const { openLoginModal } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);
  const sidebarWidth = useSidebarWidth();

  useOutsideClick(modalRef, () => {
    setIsConfirm(false);
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-60 flex w-full transform items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={modalRef}
          className="w-fit rounded-2xl bg-white p-6 text-center shadow-2xl"
          style={{
            marginLeft: sidebarWidth > 0 ? `${sidebarWidth}px` : 0,
          }}
        >
          <h3 className="mb-4 text-lg font-bold text-gray-900">{title}</h3>
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            {description}
          </p>
          <button
            onClick={() => {
              openLoginModal();
              setIsConfirm(false);
            }}
            className="w-full rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
          >
            로그인
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
