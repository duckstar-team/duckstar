import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={onCancel}
          />

          {/* 다이얼로그 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="max-width fixed top-1/2 left-1/2 z-60 flex w-full max-w-sm -translate-x-1/2 -translate-y-1/2 transform items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-100 rounded-2xl bg-white p-6 text-center shadow-2xl">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                보너스 투표 사용 조건
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                보너스 투표 사용을 위해서는 일반 투표 10개를 다 사용하셔야
                합니다. 보너스 표를 회수하고 다음으로 넘어갈까요?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  아니오
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 rounded-lg bg-gradient-to-r from-[#cb285e] to-[#9c1f49] px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
                >
                  예
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
