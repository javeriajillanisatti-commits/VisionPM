const MessageDropdown = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
   
    <div className="fixed inset-0 z-[9999] bg-black/40 dark:bg-black/70 flex items-center justify-center p-4">
     <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-5 shadow-lg dark:shadow-black/30 relative transition-colors duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-3 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
};

export default MessageDropdown;