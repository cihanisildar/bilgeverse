/**
 * PDF Utility Functions
 * 
 * Utility functions for managing PDF files with AWS S3
 */

export interface PdfMetadata {
  id: string;
  partId: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

/**
 * Upload a PDF file to S3 via API
 */
export async function uploadPdf(
  file: File,
  partId: number,
  title: string,
  description?: string
): Promise<PdfMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('partId', partId.toString());
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch('/api/admin/pdfs', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload PDF');
  }

  const data = await response.json();
  return data.pdf;
}

/**
 * Get all PDFs, optionally filtered by partId
 */
export async function getPdfs(partId?: number): Promise<PdfMetadata[]> {
  const url = partId
    ? `/api/admin/pdfs?partId=${partId}`
    : '/api/admin/pdfs';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch PDFs');
  }

  return response.json();
}

/**
 * Get PDFs for a specific part
 */
export async function getPdfsByPart(partId: number): Promise<PdfMetadata[]> {
  return getPdfs(partId);
}

/**
 * Update PDF metadata (title, description)
 */
export async function updatePdf(
  pdfId: string,
  title: string,
  description?: string
): Promise<PdfMetadata> {
  const response = await fetch(`/api/admin/pdfs/${pdfId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description: description || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update PDF');
  }

  const data = await response.json();
  return data.pdf;
}

/**
 * Delete a PDF
 */
export async function deletePdf(pdfId: string): Promise<void> {
  const response = await fetch(`/api/admin/pdfs/${pdfId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete PDF');
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Validate PDF file
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Sadece PDF dosyaları yüklenebilir' };
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Dosya boyutu 50MB\'dan büyük olamaz' };
  }

  return { valid: true };
}

/**
 * Download PDF (opens in new tab)
 */
export function downloadPdf(pdf: PdfMetadata): void {
  window.open(pdf.fileUrl, '_blank');
}

