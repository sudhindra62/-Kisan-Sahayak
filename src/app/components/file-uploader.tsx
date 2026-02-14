"use client";

import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type FileUploaderProps = {
  label: string;
  docType: string;
  onUploadComplete: (url: string) => void;
  onFileRemove: () => void;
  userId: string | undefined;
  required?: boolean;
};

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = {
  'image/jpeg': [],
  'image/png': [],
  'application/pdf': [],
};

export default function FileUploader({
  label,
  docType,
  onUploadComplete,
  onFileRemove,
  userId,
  required,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storage = useStorage();

  const handleUpload = useCallback(async (acceptedFile: File) => {
    if (!userId || !storage) {
      setError('User not authenticated. Cannot upload file.');
      return;
    }
    setFile(acceptedFile);
    setError(null);
    setUploadProgress(0);

    const storageRef = ref(storage, `farmer_documents/${userId}/${docType}/${acceptedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, acceptedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (uploadError) => {
        console.error('Upload Error:', uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFileUrl(downloadURL);
          onUploadComplete(downloadURL);
          setUploadProgress(100);
        } catch (urlError) {
          console.error('URL Error:', urlError);
          setError(`Could not get file URL: ${ (urlError as Error).message}`);
        }
      }
    );
  }, [userId, storage, docType, onUploadComplete]);


  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
      setError(null);
      if (fileRejections.length > 0) {
          const firstError = fileRejections[0].errors[0];
          if (firstError.code === 'file-too-large') {
              setError(`File is larger than ${MAX_SIZE_MB}MB`);
          } else if (firstError.code === 'file-invalid-type') {
              setError('Invalid file type. Use PDF, JPG, or PNG.');
          } else {
              setError(firstError.message);
          }
          return;
      }
      if (acceptedFiles.length > 0) {
        if(fileUrl) handleRemove(); // Remove existing file before uploading new one
        handleUpload(acceptedFiles[0]);
      }
  }, [handleUpload, fileUrl]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    accept: ALLOWED_TYPES,
  });

  const handleRemove = async () => {
    if (!fileUrl || !userId) return;

    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      // If file doesn't exist on storage, it's fine.
      // Log other errors.
      if ((error as any).code !== 'storage/object-not-found') {
          console.error("Error deleting file from storage:", error);
      }
    } finally {
      setFile(null);
      setFileUrl(null);
      setUploadProgress(null);
      setError(null);
      onFileRemove();
    }
  };

  const containerClasses = useMemo(() => `
    file-uploader-container
    ${isDragActive ? 'active' : ''}
    ${error ? 'has-error' : ''}
    ${fileUrl ? 'has-file' : ''}
  `, [isDragActive, error, fileUrl]);


  return (
    <div className="w-full">
      <label className="uploader-label">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      <div {...getRootProps()} className={containerClasses}>
        <input {...getInputProps()} />

        {fileUrl && file ? (
          <div className="file-preview">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="remove-btn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : uploadProgress !== null ? (
            <div className="upload-progress">
              <FileIcon className="h-5 w-5 mr-3 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-white mb-1 truncate">{file?.name}</p>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            </div>
        ) : (
          <div className="uploader-idle-content">
            <UploadCloud className="h-8 w-8 text-slate-500" />
            <p>
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag & drop or click to upload'}
            </p>
            <span className="text-xs text-slate-500">PDF, JPG, PNG (Max {MAX_SIZE_MB}MB)</span>
          </div>
        )}
      </div>
       {error && <p className="error-message mt-2">{error}</p>}
    </div>
  );
}
