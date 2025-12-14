import React, { useState, useRef } from 'react';
import { Upload, X, Lock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ImageUpload = ({
  currentImageUrl = null,
  onImageUpload,
  onImageRemove,
  readOnly = false,
  maxSizeMB = 5,
  recommendedDimensions = "800x600px (4:3 ratio)"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];

  const validateFile = (file) => {
    setError(null);

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    if (!allowedFormats.includes(fileExtension)) {
      setError(`Invalid file format. Allowed: ${allowedFormats.join(', ').toUpperCase()}`);
      return false;
    }

    // Check MIME type
    if (!file.type.startsWith('image/')) {
      setError('File must be a valid image');
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file) => {
    if (!file || readOnly) return;

    if (!validateFile(file)) return;

    setIsUploading(true);
    setError(null);

    try {
      await onImageUpload(file);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (readOnly) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = async () => {
    if (readOnly) return;

    setIsUploading(true);
    setError(null);

    try {
      await onImageRemove();
    } catch (err) {
      setError('Failed to remove image. Please try again.');
      console.error('Image removal error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (!readOnly && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Menu Item Image
        </label>
        <span className="text-xs text-gray-500">
          Recommended: {recommendedDimensions}
        </span>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        {/* Drag and Drop Zone / Image Preview */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg transition-all
            ${currentImageUrl ? 'border-gray-300' : 'border-gray-300'}
            ${isDragging && !readOnly ? 'border-blue-500 bg-blue-50' : ''}
            ${readOnly ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          `}
          onClick={!currentImageUrl && !readOnly ? handleUploadClick : undefined}
        >
          {currentImageUrl ? (
            // Image Preview (matches MenuPage menu card size)
            <div className="relative max-w-xs mx-auto">
              <img
                src={currentImageUrl}
                alt="Menu item preview"
                className="w-full h-48 object-cover rounded-lg"
              />

              {/* Read-only overlay */}
              {readOnly && (
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Lock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Image from Square POS</p>
                    <p className="text-xs">Cannot be modified</p>
                  </div>
                </div>
              )}

              {/* Remove button */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            // Upload Zone
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                {readOnly ? (
                  <Lock className="h-6 w-6 text-gray-400" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>

              {readOnly ? (
                <p className="text-sm text-gray-500">No image available</p>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1 text-sm mb-1">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {allowedFormats.join(', ').toUpperCase()} up to {maxSizeMB}MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.map(f => `.${f}`).join(',')}
          onChange={handleFileInputChange}
          disabled={readOnly || isUploading}
          className="hidden"
        />

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">
                {currentImageUrl ? 'Removing...' : 'Uploading...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload button for when image exists */}
      {currentImageUrl && !readOnly && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={handleUploadClick}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Replace Image
        </Button>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        {readOnly
          ? 'This image is managed by your POS system and cannot be changed here.'
          : `Upload a high-quality image for better presentation. Recommended size: ${recommendedDimensions}`
        }
      </p>
    </div>
  );
};

export default ImageUpload;
