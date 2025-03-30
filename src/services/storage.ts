import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  UploadMetadata,
  StorageError
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface UploadProgressCallback {
  (progress: number): void;
}

interface PhotoUploadResult {
  url: string;
  path: string;
  fileName: string;
  thumbnailUrl?: string;
}

export class StorageService {
  private storage = getStorage();

  /**
   * Uploads a photo for a note with proper metadata
   * @param file The file to upload
   * @param noteId The ID of the note this photo belongs to
   * @param userId The ID of the user uploading the photo
   * @param onProgress Optional callback for upload progress
   * @returns Promise with the download URL and file details
   */
  async uploadNotePhoto(
    file: File,
    noteId: string,
    userId: string,
    onProgress?: UploadProgressCallback
  ): Promise<PhotoUploadResult> {
    try {
      // Debug logging
      console.debug('Upload photo - File object:', {
        name: file?.name,
        type: file?.type,
        size: file?.size,
        lastModified: file?.lastModified
      });

      if (!file?.name) {
        throw new Error('Invalid file object: missing name property');
      }

      // Generate a unique filename to prevent collisions
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      
      // Determine if this is a thumbnail based on file size and metadata
      const isThumbnail = file.size < 500 * 1024; // Less than 500KB is likely a thumbnail
      const filePath = isThumbnail 
        ? `notes/${noteId}/thumbnails/${fileName}`
        : `notes/${noteId}/images/${fileName}`;
      
      const storageRef = ref(this.storage, filePath);

      // Set up metadata according to our security rules requirements
      const metadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
          noteId: noteId,
          uploadedBy: userId,
          originalName: file.name,
          isThumbnail: isThumbnail.toString()
        }
      };

      // Start the upload with metadata
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // Return a promise that resolves when the upload is complete
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculate and report progress if callback provided
            if (onProgress) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            }
          },
          (error: StorageError) => {
            // Handle specific upload errors
            switch (error.code) {
              case 'storage/unauthorized':
                reject(new Error('Not authorized to upload files'));
                break;
              case 'storage/canceled':
                reject(new Error('Upload was canceled'));
                break;
              default:
                reject(new Error(`Upload failed: ${error.message}`));
            }
          },
          async () => {
            try {
              // Get the download URL once upload is complete
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url: downloadURL,
                path: filePath,
                fileName: fileName
              });
            } catch (error) {
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Failed to initiate upload: ${error}`);
    }
  }

  /**
   * Uploads a profile photo for a user
   * @param file The file to upload
   * @param userId The ID of the user
   * @param onProgress Optional callback for upload progress
   * @returns Promise with the download URL and file details
   */
  async uploadProfilePhoto(
    file: File,
    userId: string,
    onProgress?: UploadProgressCallback
  ): Promise<PhotoUploadResult> {
    try {
      if (!file?.name) {
        throw new Error('Invalid file object: missing name property');
      }

      // Generate a unique filename to prevent collisions
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `users/${userId}/profile/${fileName}`;
      
      const storageRef = ref(this.storage, filePath);

      // Set up metadata
      const metadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          originalName: file.name,
          type: 'profile'
        }
      };

      // Start the upload with metadata
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // Return a promise that resolves when the upload is complete
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (onProgress) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            }
          },
          (error: StorageError) => {
            switch (error.code) {
              case 'storage/unauthorized':
                reject(new Error('Not authorized to upload profile photo'));
                break;
              case 'storage/canceled':
                reject(new Error('Upload was canceled'));
                break;
              default:
                reject(new Error(`Upload failed: ${error.message}`));
            }
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url: downloadURL,
                path: filePath,
                fileName: fileName
              });
            } catch (error) {
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Failed to initiate profile photo upload: ${error}`);
    }
  }

  /**
   * Deletes a photo from storage
   * @param path The full storage path to the file
   */
  async deletePhoto(path: string): Promise<void> {
    try {
      const fileRef = ref(this.storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      throw new Error(`Failed to delete photo: ${error}`);
    }
  }
} 