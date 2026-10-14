'use client';

import { Input } from '@/components/ui/input';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

// Friendly pre-check only — blocks the submit with a native message instead
// of sending a rejected file to the server. lib/storage/kycDocuments.ts
// re-validates size and the file's real bytes; nothing here is trusted.
export function KycDocumentInput() {
  return (
    <Input
      id="document"
      name="document"
      type="file"
      accept="application/pdf,image/jpeg,image/png"
      onChange={(e) => {
        const input = e.currentTarget;
        const file = input.files?.[0];
        let message = '';
        if (file && file.size > MAX_BYTES) message = 'That file is larger than 4 MB. Choose a smaller one.';
        else if (file && !ALLOWED.includes(file.type)) message = 'Choose a PDF, JPEG or PNG file.';
        input.setCustomValidity(message);
        if (message) input.reportValidity();
      }}
    />
  );
}
