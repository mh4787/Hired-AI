'use client';

import React, { useEffect, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { ResumeTemplate } from './ResumeTemplate';

export default function PDFPreview({ data }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="w-full h-[600px] bg-[#1a1a1a] rounded-2xl border border-[#333] flex items-center justify-center text-[#888]">Loading Preview...</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-120px)] min-h-[600px] rounded-2xl overflow-hidden border border-[#333] bg-white">
      <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
        <ResumeTemplate data={data} />
      </PDFViewer>
    </div>
  );
}
