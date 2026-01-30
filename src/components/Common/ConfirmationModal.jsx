import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className={`modal-header ${type}`}>
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn btn-${type === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
