import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Crop } from 'lucide-react';

// Helper function to create an image element from a source
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get cropped image as base64
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as base64 PNG
  return canvas.toDataURL('image/png');
}

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropChange = useCallback((newCrop) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
        onClose();
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Crop Logo"
      className="relative bg-white w-full max-w-2xl mx-auto mt-8 p-6 rounded-lg shadow-lg focus:outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4"
      ariaHideApp={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crop className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Crop Logo</h2>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Drag to reposition and use the slider to zoom in or out. The crop area maintains a 1:1 aspect ratio.
      </p>

      {/* Crop Container */}
      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
        {imageSrc && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="rect"
            showGrid={true}
          />
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-4 mt-4 py-3 bg-gray-50 rounded-lg">
        <button
          onClick={() => setZoom(Math.max(1, zoom - 0.1))}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5 text-gray-700" />
        </button>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-xs text-gray-500 w-8">1x</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs text-gray-500 w-8">3x</span>
        </div>

        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <div className="text-center text-sm text-gray-500 mt-2">
        Zoom: {zoom.toFixed(1)}x
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !croppedAreaPixels}>
          {isSaving ? 'Saving...' : 'Save Cropped Image'}
        </Button>
      </div>
    </Modal>
  );
};

export default ImageCropModal;
