import { useState, useEffect, createContext, useContext } from 'react';
import Icon from './Icon';

// Context pour les modals
const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const showConfirm = (message, onConfirm, onCancel) => {
    setModal({
      type: 'confirm',
      message,
      onConfirm: () => {
        setModal(null);
        onConfirm?.();
      },
      onCancel: () => {
        setModal(null);
        onCancel?.();
      }
    });
  };

  const showAlert = (message, onClose) => {
    setModal({
      type: 'alert',
      message,
      onClose: () => {
        setModal(null);
        onClose?.();
      }
    });
  };

  const closeModal = () => setModal(null);

  return (
    <ModalContext.Provider value={{ showConfirm, showAlert, closeModal }}>
      {children}
      {modal && <Modal modal={modal} />}
    </ModalContext.Provider>
  );
};

const Modal = ({ modal }) => {
  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        modal.onCancel?.() || modal.onClose?.();
      }
      if (e.key === 'Enter' && modal.type === 'alert') {
        modal.onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  return (
    <div className="modal-overlay" onClick={modal.onCancel || modal.onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">
          {modal.type === 'confirm' ? <Icon name="warning" size={16} /> : <Icon name="info" size={16} />}
        </div>
        <div className="modal-message">{modal.message}</div>
        <div className="modal-actions">
          {modal.type === 'confirm' ? (
            <>
              <button className="modal-btn cancel" onClick={modal.onCancel}>
                Annuler
              </button>
              <button className="modal-btn confirm" onClick={modal.onConfirm}>
                Confirmer
              </button>
            </>
          ) : (
            <button className="modal-btn confirm" onClick={modal.onClose}>
              OK
            </button>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: linear-gradient(180deg,
            rgba(15, 30, 60, 0.98) 0%,
            rgba(8, 16, 32, 0.98) 100%
          );
          border: 3px solid var(--cyan, #00d4ff);
          border-radius: 12px;
          padding: 30px 40px;
          max-width: 420px;
          width: 90%;
          text-align: center;
          box-shadow:
            0 0 40px rgba(0, 200, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from { transform: scale(0.9) translateY(-20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .modal-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .modal-message {
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem;
          color: white;
          margin-bottom: 25px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .modal-btn {
          padding: 12px 30px;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .modal-btn.cancel {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.7);
        }

        .modal-btn.cancel:hover {
          border-color: rgba(255, 255, 255, 0.6);
          color: white;
        }

        .modal-btn.confirm {
          background: linear-gradient(180deg, #d4a520 0%, #8b6914 100%);
          border: 2px solid #ffd700;
          color: #1a1a1a;
        }

        .modal-btn.confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Modal;
