import "./modal.css";

import React from "react";
import ReactModal from "react-modal";

interface Properties {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<Properties> = ({ open, children, onClose }) => {
  return (
    <ReactModal
      isOpen={open}
      onRequestClose={onClose}
      overlayClassName="pt-modal-overlay"
      className="pt-modal-content"
    >
      {children}
    </ReactModal>
  );
};

export default Modal;
