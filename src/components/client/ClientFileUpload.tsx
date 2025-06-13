"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Eye, Download, FileText, Image, Archive } from 'lucide-react';
import { validateAttachmentFile } from '@/lib/storage';

interface ClientFileUploadProps {
  rfiId: string;
  clientToken: string;
  clientName?: string;
  clientEmail?: string;
  onUploadComplete?: (attachments: ClientAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
  disabled?: boolean;
}

interface ClientAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by_type: 'client';
  attachment_category: string;
  client_uploaded_by: string;
  public_url?: string;
}

export function ClientFileUpload({
  rfiId,
  clientToken,
  clientName = 'Client User',
  clientEmail = '',
  onUploadComplete,
  maxFiles = 5,
  maxFileSize = 25, // 25MB for clients
  disabled = false
}: ClientFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<ClientAttachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // File type categories for client uploads
  const getAttachmentCategory = (file: File): string => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (fileType.includes('image')) return 'photo';
    if (fileType.includes('pdf')) return 'client_response';
    if (fileName.includes('drawing') || fileName.includes('plan')) return 'drawing';
    if (fileName.includes('spec')) return 'specification';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'archive';
    
    return 'client_response';
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.includes('image')) {
      return <Image className="w-5 h-5 text-green-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else if (fileType.includes('zip') || fileType.includes('rar')) {
      return <Archive className="w-5 h-5 text-purple-600" />;
    } else {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const validateFile = (file: File): string | null => {
    // Use the existing validation function but with client-specific limits
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      return validation.error || 'File validation failed';
    }

    // Additional client-specific validations
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB for client uploads.`;
    }

    return null;
  };

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList || disabled) return;

    const newFiles = Array.from(fileList);
    const errors: string[] = [];

    // Check total file count
    if (files.length + newFiles.length > maxFiles) {
      setError(`Cannot add ${newFiles.length} files. Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const uploadFiles = async () => {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    setError(null);
    const uploadedFiles: ClientAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileKey = `${file.name}-${i}`;
        
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

        // Simulate upload progress (in real implementation, this would track actual upload)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: Math.min((prev[fileKey] || 0) + Math.random() * 30, 90)
          }));
        }, 200);

        try {
          // Create form data for upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('rfi_id', rfiId);
          formData.append('client_token', clientToken);
          formData.append('client_uploaded_by', clientName);
          formData.append('attachment_category', getAttachmentCategory(file));

          // Upload to our API endpoint (we'll create this)
          const response = await fetch('/api/client/upload-attachment', {
            method: 'POST',
            body: formData,
            headers: {
              'X-Client-Token': clientToken,
              'X-Client-Email': clientEmail,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const result = await response.json();
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));

          // Add to uploaded files
          uploadedFiles.push({
            id: result.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            uploaded_by_type: 'client',
            attachment_category: getAttachmentCategory(file),
            client_uploaded_by: clientName,
            public_url: result.public_url,
          });

        } catch (error) {
          clearInterval(progressInterval);
          console.error(`Failed to upload ${file.name}:`, error);
          setError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          break;
        }
      }

      if (uploadedFiles.length > 0) {
        setUploadedAttachments(prev => [...prev, ...uploadedFiles]);
        setFiles([]); // Clear pending files
        onUploadComplete?.(uploadedFiles);
        
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress({});
        }, 2000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const triggerFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        onClick={disabled ? undefined : triggerFileSelect}
        onDragEnter={disabled ? undefined : handleDragIn}
        onDragLeave={disabled ? undefined : handleDragOut}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
            : dragActive 
              ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02] cursor-pointer' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
          }
          ${files.length >= maxFiles && !disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className={`mb-4 transition-all duration-300 ${dragActive ? 'text-blue-500 transform scale-110' : 'text-gray-400'}`}>
          <Upload className="mx-auto h-12 w-12" />
        </div>
        
        <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
          disabled 
            ? 'text-gray-400' 
            : dragActive 
              ? 'text-blue-700' 
              : 'text-gray-700'
        }`}>
          {disabled ? 'Upload Disabled' : dragActive ? 'Drop your files here!' : 'Upload Response Documents'}
        </h3>
        
        <p className={`text-sm mb-4 transition-colors duration-300 ${
          disabled 
            ? 'text-gray-400' 
            : dragActive 
              ? 'text-blue-600' 
              : 'text-gray-600'
        }`}>
          {disabled 
            ? 'File upload is currently disabled' 
            : 'Click to browse or drag and drop files here'
          }
        </p>
        
        <div className={`text-xs transition-colors duration-300 ${
          disabled 
            ? 'text-gray-400' 
            : dragActive 
              ? 'text-blue-600' 
              : 'text-gray-500'
        }`}>
          Maximum {maxFiles} files, up to {maxFileSize}MB each
          <br />
          Supported: PDF, Images, Documents, Archives
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar"
        onChange={(e) => {
          handleFileSelect(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
        disabled={disabled || files.length >= maxFiles}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-center">
            <X className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Pending files to upload */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Files Ready to Upload ({files.length}/{maxFiles})
            </h4>
            <button
              onClick={uploadFiles}
              disabled={uploading || disabled}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => {
              const fileKey = `${file.name}-${index}`;
              const progress = uploadProgress[fileKey] || 0;
              
              return (
                <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.name, file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {getAttachmentCategory(file)}
                      </p>
                      {uploading && progress > 0 && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!uploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Successfully uploaded files */}
      {uploadedAttachments.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-3">
            Successfully Uploaded ({uploadedAttachments.length})
          </h4>
          
          <div className="space-y-2">
            {uploadedAttachments.map((attachment, index) => (
              <div key={attachment.id} className="flex items-center justify-between bg-white border border-green-200 rounded-md p-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.file_name, attachment.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.file_size)} • {attachment.attachment_category}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {attachment.file_type.includes('image') && attachment.public_url && (
                    <button
                      onClick={() => window.open(attachment.public_url, '_blank')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {attachment.public_url && (
                    <a
                      href={attachment.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 