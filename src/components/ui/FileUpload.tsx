"use client";

import { useState, useRef } from 'react';
import { Upload, X, File, FileText, Image as ImageIcon, FileSpreadsheet, Paperclip, Eye, ExternalLink } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
}

interface FileWithId extends File {
  id: string;
}

interface PreviewModalProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}

function PreviewModal({ file, isOpen, onClose }: PreviewModalProps) {
  if (!isOpen || !file) return null;

  const createBlobUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  const isImage = (file: File) => {
    return file.type.startsWith('image/');
  };

  const isPDF = (file: File) => {
    return file.type === 'application/pdf';
  };

  const handleDownload = () => {
    const url = createBlobUrl(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl max-h-[95vh] w-full h-full sm:h-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{file.name}</h3>
            <span className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-2">
          {isImage(file) ? (
            <div className="flex justify-center">
              <img
                src={createBlobUrl(file)}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded"
                onLoad={(e) => {
                  // Clean up the blob URL after the image loads
                  setTimeout(() => {
                    URL.revokeObjectURL((e.target as HTMLImageElement).src);
                  }, 1000);
                }}
              />
            </div>
          ) : isPDF(file) ? (
            <div className="w-full h-full">
              <iframe
                src={createBlobUrl(file)}
                className="w-full h-full border-0"
                title={file.name}
                style={{ minHeight: 'calc(95vh - 80px)' }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h4>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed. You can download it to view the contents.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FileUpload({
  files = [],
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedFileTypes = [],
  placeholder = "Click to upload files or drag and drop",
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Add unique IDs to files for tracking
  const filesWithIds: FileWithId[] = files.map((file, index) => {
    console.log('Processing file for display:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      hasFile: !!file,
      index
    });
    
    // Add id property to the file object
    (file as any).id = `${file.name}-${file.lastModified}-${file.size}-${index}`;
    
    return file as FileWithId;
  });

  const openPreview = (file: File) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const validateFile = (file: File): string | null => {
    console.log('Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Check if file object is valid
    if (!file || !file.name) {
      return 'Invalid file object.';
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }

    // Check file type if restrictions are set
    if (acceptedFileTypes.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      console.log('File validation:', {
        fileExtension,
        mimeType,
        acceptedTypes: acceptedFileTypes
      });
      
      const isAccepted = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) {
          return type.toLowerCase() === fileExtension;
        }
        return type === mimeType;
      });

      if (!isAccepted) {
        return `File type "${fileExtension}" is not allowed. Accepted types: ${acceptedFileTypes.join(', ')}`;
      }
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    console.log('handleFileSelect called with:', selectedFiles);
    if (!selectedFiles) {
      console.log('No files selected');
      return;
    }

    const newFiles = Array.from(selectedFiles);
    console.log('Selected files:', newFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    console.log('Current files count:', files.length);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files. Currently have ${files.length} files.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of newFiles) {
      console.log('Processing file:', file);
      
      const validationError = validateFile(file);
      if (validationError) {
        console.log('Validation failed:', validationError);
        setError(validationError);
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(
        existingFile => 
          existingFile.name === file.name && 
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      );

      if (isDuplicate) {
        setError(`File "${file.name}" is already added.`);
        return;
      }
      
      validFiles.push(file);
    }

    console.log('All files validated, adding to state:', validFiles);
    const newFilesList = [...files, ...validFiles];
    console.log('Calling onFilesChange with:', newFilesList);
    setError(null);
    onFilesChange(newFilesList);
  };

  const removeFile = (fileId: string) => {
    console.log('removeFile called with ID:', fileId);
    console.log('Current files:', files.map((f, idx) => ({ 
      name: f.name, 
      id: `${f.name}-${f.lastModified}-${f.size}-${idx}` 
    })));
    
    const updatedFiles = files.filter((file, index) => {
      const id = `${file.name}-${file.lastModified}-${file.size}-${index}`;
      const shouldKeep = id !== fileId;
      console.log(`File ${file.name} (${id}): ${shouldKeep ? 'keeping' : 'removing'}`);
      return shouldKeep;
    });
    
    console.log('Updated files after removal:', updatedFiles);
    onFilesChange(updatedFiles);
    setError(null);
  };

  const triggerFileSelect = () => {
    if (disabled) return;
    console.log('triggerFileSelect called, fileInputRef:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName || typeof fileName !== 'string') {
      return <File className="w-4 h-4 text-gray-500" />;
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      // PDF Documents
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      
      // Microsoft Word Documents
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />;
      
      // Microsoft Excel Spreadsheets
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      
      // Microsoft PowerPoint
      case 'ppt':
      case 'pptx':
        return <FileText className="w-4 h-4 text-orange-500" />;
      
      // Images/Photos
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'tiff':
      case 'tif':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      
      // Outlook Files
      case 'msg':
      case 'eml':
        return <FileText className="w-4 h-4 text-yellow-500" />;
      
      // CAD Files
      case 'dwg':
      case 'dxf':
      case 'dwf':
        return <FileText className="w-4 h-4 text-cyan-500" />;
      
      // Project Files
      case 'mpp':
      case 'mpx':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      
      // Text and Data Files
      case 'txt':
      case 'csv':
      case 'rtf':
        return <FileText className="w-4 h-4 text-gray-600" />;
      
      // Archives
      case 'zip':
      case 'rar':
      case '7z':
        return <Paperclip className="w-4 h-4 text-brown-500" />;
      
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        onClick={disabled ? undefined : triggerFileSelect}
        onDragEnter={disabled ? undefined : handleDragIn}
        onDragLeave={disabled ? undefined : handleDragOut}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
            : dragActive 
              ? 'border-blue-500 bg-blue-100 shadow-lg transform scale-105 cursor-pointer' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
          }
          ${files.length >= maxFiles && !disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className={`mb-2 transition-colors duration-200 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}>
          <Upload className="mx-auto h-8 w-8" />
        </div>
        <p className={`text-sm mb-2 transition-colors duration-200 ${
          disabled 
            ? 'text-gray-400' 
            : dragActive 
              ? 'text-blue-700 font-semibold' 
              : 'text-gray-600'
        }`}>
          {disabled ? 'File upload disabled' : dragActive ? 'Drop files here!' : placeholder}
        </p>
        <p className={`text-xs transition-colors duration-200 ${
          disabled 
            ? 'text-gray-400' 
            : dragActive 
              ? 'text-blue-600' 
              : 'text-gray-500'
        }`}>
          Maximum {maxFiles} files, up to {maxFileSize}MB each
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes.join(',')}
        onChange={(e) => {
          console.log('File input onChange triggered:', e.target.files);
          handleFileSelect(e.target.files);
          // Reset the input value to allow selecting the same file again
          e.target.value = '';
        }}
        className="hidden"
        disabled={disabled || files.length >= maxFiles}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* File list */}
      {filesWithIds.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Attached Files ({filesWithIds.length}/{maxFiles})
          </h4>
          <div className="space-y-1">
            {filesWithIds.map((file, index) => {
              console.log('Rendering file:', { name: file.name, size: file.size, index });
              return (
                <div
                  key={file.id || `file-${index}`}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => openPreview(file)}
                      className="flex-shrink-0 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="Preview file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove file"
                      disabled={disabled}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File count info */}
      {filesWithIds.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          {filesWithIds.length} of {maxFiles} files selected
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal 
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
  );
} 