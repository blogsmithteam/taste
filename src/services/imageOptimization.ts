import imageCompression from 'browser-image-compression';

interface ImageDimensions {
  width: number;
  height: number;
}

interface OptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  preserveExif?: boolean;
}

export class ImageOptimizationService {
  private static readonly DEFAULT_OPTIONS: OptimizationOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    preserveExif: true
  };

  /**
   * Get the dimensions of an image file
   */
  private static async getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxDimension: number
  ): ImageDimensions {
    if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / aspectRatio)
      };
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: maxDimension
      };
    }
  }

  /**
   * Optimize an image for web use
   * @param file The image file to optimize
   * @param customOptions Optional custom optimization options
   * @returns Promise with the optimized file
   */
  static async optimizeImage(
    file: File,
    customOptions?: Partial<OptimizationOptions>
  ): Promise<File> {
    // Debug logging for input file
    console.debug('Before optimization - File object:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      lastModified: file?.lastModified
    });

    // Merge default options with custom options
    const options = { ...this.DEFAULT_OPTIONS, ...customOptions };

    try {
      // Get original image dimensions
      const dimensions = await this.getImageDimensions(file);
      
      // Calculate optimal dimensions
      const optimalDimensions = this.calculateOptimalDimensions(
        dimensions.width,
        dimensions.height,
        options.maxWidthOrHeight!
      );

      // Prepare compression options
      const compressionOptions = {
        ...options,
        maxWidthOrHeight: Math.max(optimalDimensions.width, optimalDimensions.height)
      };

      // Log optimization details for debugging
      console.debug('Image optimization:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        originalDimensions: dimensions,
        targetDimensions: optimalDimensions,
        options: compressionOptions
      });

      // Compress the image
      let optimizedFile = await imageCompression(file, compressionOptions);

      // Debug logging for output file
      console.debug('After optimization - File object:', {
        name: optimizedFile?.name,
        type: optimizedFile?.type,
        size: optimizedFile?.size,
        lastModified: optimizedFile?.lastModified
      });

      // Ensure the optimized file has a name
      if (!optimizedFile.name) {
        optimizedFile = new File([optimizedFile], file.name, {
          type: optimizedFile.type,
          lastModified: optimizedFile.lastModified
        });
      }

      // Log results
      console.debug('Optimization complete:', {
        finalSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
        compressionRatio: `${((1 - optimizedFile.size / file.size) * 100).toFixed(1)}%`
      });

      return optimizedFile;
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Generate a thumbnail version of an image
   * @param file The image file to create a thumbnail from
   * @param maxDimension Maximum width or height of the thumbnail
   * @returns Promise with the thumbnail file
   */
  static async createThumbnail(file: File, maxDimension: number = 300): Promise<File> {
    try {
      return await this.optimizeImage(file, {
        maxWidthOrHeight: maxDimension,
        maxSizeMB: 0.2, // Smaller size for thumbnails
        preserveExif: false // No need for EXIF data in thumbnails
      });
    } catch (error) {
      console.error('Thumbnail creation failed:', error);
      throw new Error('Failed to create thumbnail');
    }
  }
} 