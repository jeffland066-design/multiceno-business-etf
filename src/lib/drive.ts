import { getAccessToken } from './auth';

export async function uploadFileToDrive(file: File): Promise<{ id: string, webViewLink: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("No Drive authorization.");

  const metadata = {
    name: file.name,
    mimeType: file.type
  };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);
  
  // Multipart upload
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Drive upload error", err);
    throw new Error('Upload failed');
  }

  return await res.json();
}

export async function shareDriveFile(fileId: string, emailAddress: string, role: 'reader' | 'writer' = 'writer') {
  const token = await getAccessToken();
  if (!token) return;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'user',
      role,
      emailAddress
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Drive share error", err);
    throw new Error('Share failed');
  }
}
