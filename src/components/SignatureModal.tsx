import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SignatureModalProps {
  documentId: string;
  collectionName: string;
  onClose: () => void;
  signerName: string;
}

export const SignatureModal = ({ documentId, collectionName, onClose, signerName }: SignatureModalProps) => {
  const sigCanvas = useRef<any>(null);

  const handleSave = async () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL();
      await updateDoc(doc(db, collectionName, documentId), {
        digitalSignature: {
          dataUrl,
          signedAt: new Date().toISOString(),
          signerName
        }
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">التوقيع الإلكتروني</h2>
        <div className="border border-zinc-200 rounded-xl mb-4">
          <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{width: 450, height: 200, className: 'sigCanvas'}} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => sigCanvas.current?.clear()} className="flex-1 p-2 bg-zinc-100 rounded-lg">مسح</button>
          <button onClick={handleSave} className="flex-1 p-2 bg-brand-navy text-white rounded-lg">حفظ التوقيع</button>
        </div>
      </div>
    </div>
  );
};
