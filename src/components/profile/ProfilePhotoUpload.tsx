import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { StorageService } from '../../services/storage';
import { userService } from '../../services/user';
import { useAuth } from '../../contexts/AuthContext';
import { ImageOptimizationService } from '../../services/imageOptimization';
import { UserIcon } from '@heroicons/react/24/outline';

interface ProfilePhotoUploadProps {
  currentPhotoURL?: string | null;
  onUploadComplete: (photoURL: string) => void;
  onError: (error: Error) => void;
}

const storageService = new StorageService();

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoURL,
  onUploadComplete,
  onError
}) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) {
      onError(new Error('No user logged in'));
      return;
    }

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

      // Upload optimized image
      setOptimizationProgress(null);
      const result = await storageService.uploadProfilePhoto(
        optimizedFile,
        user.uid,
        (progress) => setUploadProgress(progress)
      );

      // Update user profile with new photo URL
      await userService.updateUserProfile(user.uid, {
        photoURL: result.url
      });

      onUploadComplete(result.url);
    } catch (error) {
      console.error('Profile photo upload failed:', error);
      onError(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setOptimizationProgress(null);
    }
  }, [user, onUploadComplete, onError, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB max size
    multiple: false,
    disabled: isUploading,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0];
      if (error) {
        onError(new Error(error.message));
      }
    }
  });

  return (
    <div className="space-y-4">
      {/* Current Profile Photo Display */}
      <div className="flex items-center justify-center">
        {currentPhotoURL || preview ? (
          <div className="relative">
            <img
              src={preview || currentPhotoURL || ''}
              alt="Profile"
              className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {(isUploading || optimizationProgress) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="text-white text-center text-sm">
                  {optimizationProgress || `${Math.round(uploadProgress)}%`}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg">
            <UserIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <p className="text-gray-600">
            {isDragActive
              ? 'Drop your photo here...'
              : 'Drag & drop a photo here, or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Maximum file size: 5MB (will be optimized)
          </p>
        </div>
      </div>
    </div>
  );
}; 