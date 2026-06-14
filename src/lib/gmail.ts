import { getAccessToken } from './auth';

export async function sendEmail(to: string, subject: string, bodyText: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const emailLines = [];
  emailLines.push(`To: ${to}`);
  emailLines.push('Content-Type: text/html; charset=utf-8');
  emailLines.push('MIME-Version: 1.0');
  emailLines.push(`Subject: =?utf-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt('0x' + p1, 16))))}?=`);
  emailLines.push('');
  emailLines.push(bodyText);

  const email = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to send email:', err);
    throw new Error('Failed to send email');
  }
  
  const data = await res.json();
  return data.id; // Returns message ID
}

export async function sendEmailWithAttachment(to: string, subject: string, bodyText: string, attachmentName: string, base64Data: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const boundary = "foo_bar_baz_boundary_" + Date.now();
  const emailLines = [];
  
  emailLines.push(`To: ${to}`);
  emailLines.push(`Subject: =?utf-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt('0x' + p1, 16))))}?=`);
  emailLines.push('MIME-Version: 1.0');
  emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  emailLines.push('');
  emailLines.push(`--${boundary}`);
  emailLines.push('Content-Type: text/html; charset="UTF-8"');
  emailLines.push('');
  emailLines.push(bodyText);
  emailLines.push('');
  emailLines.push(`--${boundary}`);
  emailLines.push(`Content-Type: application/pdf; name="${attachmentName}"`);
  emailLines.push(`Content-Disposition: attachment; filename="${attachmentName}"`);
  emailLines.push(`Content-Transfer-Encoding: base64`);
  emailLines.push('');
  emailLines.push(base64Data);
  emailLines.push(`--${boundary}--`);

  const email = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to send email:', err);
    throw new Error('Failed to send email');
  }
  
  const data = await res.json();
  return data.id;
}

export async function ensureLabel(labelName: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  // List all labels
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const existingLabel = data.labels?.find((l: any) => l.name === labelName);
  
  if (existingLabel) {
    return existingLabel.id;
  }
  
  // Create if it doesn't exist
  const createRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    })
  });
  
  const createData = await createRes.json();
  return createData.id;
}

export async function addLabelToMessage(messageId: string, labelId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addLabelIds: [labelId]
    })
  });
  
  if (!res.ok) {
    throw new Error('Failed to modify message labels');
  }
}
