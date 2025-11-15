
import React from 'react';
// Note: In a real environment, you would install this with 'npm install qrcode.react'
// For this single-file setup, we assume it can be loaded or this is for demonstration.
// A real implementation would need a library for QR code generation.
// This is a placeholder component.

interface QrCodeModalProps {
  onClose: () => void;
}

const QRCodePlaceholder: React.FC<{ value: string, size: number }> = ({ value, size }) => (
  <div className="flex flex-col items-center justify-center bg-white p-4 border-4 border-gray-800" style={{ width: size, height: size }}>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    <span className="text-xs text-center mt-2 text-gray-600">QR CODE</span>
    <span className="text-xxs text-center text-gray-400 break-all">{value}</span>
  </div>
);

const QrCodeModal: React.FC<QrCodeModalProps> = ({ onClose }) => {
  const orderUrl = window.location.href; // In a real scenario, this might be a specific link

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Scan to Order!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Open your camera app and point it here to start your order via our chat assistant.</p>
        <div className="flex justify-center">
            <QRCodePlaceholder value={orderUrl} size={256} />
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
