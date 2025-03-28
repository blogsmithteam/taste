import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { StorageService } from '../../services/storage';

interface PhotoUploadProps {
  noteId: string;
  userId: string;
  onUploadComplete: (result: { url: string; path: string }) => void;
  onError: (error: Error) => void;
}

const storageService = new StorageService();

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  noteId,
  userId,
  onUploadComplete,
  onError
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      // Clear any previous preview
      if (preview) URL.revokeObjectURL(preview);
      
      // Show preview of the new file
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Start upload with progress tracking
      const result = await storageService.uploadNotePhoto(
        file,
        noteId,
        userId,
        (progress) => setUploadProgress(progress)
      );

      onUploadComplete(result);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [noteId, userId, onUploadComplete, onError, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB max size
    multiple: false,
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await handleUpload(acceptedFiles[0]);
      }
    }
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Upload preview"
              className="max-h-48 mx-auto rounded-lg"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white">
                  Uploading... {Math.round(uploadProgress)}%
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the image here...'
                : 'Drag & drop an image here, or click to select'}
            </p>
            <p className="text-sm text-gray-500">
              Maximum file size: 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 