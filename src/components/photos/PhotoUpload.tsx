import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { StorageService } from '../../services/storage';
import { ImageOptimizationService } from '../../services/imageOptimization';

interface PhotoUploadProps {
  noteId: string;
  userId: string;
  onUploadComplete: (result: { url: string; path: string; thumbnailUrl?: string }) => void;
  onError: (error: Error) => void;
  existingPhotos?: string[];
}

const storageService = new StorageService();

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  noteId,
  userId,
  onUploadComplete,
  onError,
  existingPhotos,
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState<string | null>(null);

  // Track existing photos to prevent duplicates or for future display
  useEffect(() => {
    if (existingPhotos && existingPhotos.length) {
      console.debug(`Note has ${existingPhotos.length} existing photos`);
    }
  }, [existingPhotos]);

  // Clear preview when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        // Clear any previous preview
        if (preview) URL.revokeObjectURL(preview);

        // Show preview of the new file
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Start optimization
        setOptimizationProgress('Optimizing image...');
        const optimizedFile = await ImageOptimizationService.optimizeImage(file);
        setOptimizationProgress('Creating thumbnail...');
        const thumbnail = await ImageOptimizationService.createThumbnail(file);

        // Upload both optimized image and thumbnail
        setOptimizationProgress(null);
        try {
          const [mainResult, thumbnailResult] = await Promise.all([
            storageService.uploadNotePhoto(optimizedFile, noteId, userId, progress =>
              setUploadProgress(progress)
            ),
            storageService.uploadNotePhoto(
              thumbnail,
              noteId,
              userId,
              () => {} // We don't need to track thumbnail upload progress
            ),
          ]);

          // Add thumbnail path to metadata and call onUploadComplete
          onUploadComplete({
            url: mainResult.url,
            path: mainResult.path,
            thumbnailUrl: thumbnailResult.url,
          });
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          onError(uploadError instanceof Error ? uploadError : new Error('Upload failed'));
        }
      } catch (error) {
        console.error('Image processing failed:', error);
        onError(error instanceof Error ? error : new Error('Image processing failed'));
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setOptimizationProgress(null);
      }
    },
    [noteId, userId, onUploadComplete, onError, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB max size (before optimization)
    multiple: false,
    disabled: isUploading,
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await handleUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: rejectedFiles => {
      const error = rejectedFiles[0]?.errors[0];
      if (error) {
        onError(new Error(error.message));
      }
    },
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
            <img src={preview} alt="Upload preview" className="max-h-48 mx-auto rounded-lg" />
            {(isUploading || optimizationProgress) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  {optimizationProgress || `Uploading... ${Math.round(uploadProgress)}%`}
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
            <p className="text-sm text-gray-500">Maximum file size: 10MB (will be optimized)</p>
            {existingPhotos && existingPhotos.length > 0 && (
              <p className="text-xs text-gray-400">
                Note: This note already has {existingPhotos.length} photo
                {existingPhotos.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
