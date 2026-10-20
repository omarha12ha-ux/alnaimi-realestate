import React from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { Property } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ArchiveViewProps {
  properties: Property[];
}

export const ArchiveView = ({ properties }: ArchiveViewProps) => {
  const archivedProperties = properties.filter(p => p.archived);

  return (
    <div className="p-6 text-right" dir="rtl">
      <h2 className="text-2xl font-black mb-6 text-brand-navy flex items-center gap-2">
        <Archive className="text-brand-gold" />
        الأرشيف العقاري
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archivedProperties.map(prop => (
          <div key={prop.id} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-lg mb-2">{prop.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{prop.location}</p>
            <button 
              onClick={async () => {
                await updateDoc(doc(db, 'properties', prop.id), { archived: false });
              }}
              className="bg-brand-navy text-brand-gold py-2 px-4 rounded-lg text-sm font-bold w-full flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              استعادة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
