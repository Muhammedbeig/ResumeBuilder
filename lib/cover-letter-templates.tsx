import React from 'react';
import { CoverLetterData } from '@/types';
import { getFontScale } from '@/lib/typography';
import { RichText } from '@/components/editor/RichText';

const getStyles = (data: CoverLetterData) => {
  const themeColor = data.metadata?.themeColor || '#000000';
  const fontName = data.metadata?.fontFamily || 'Inter';
  const fontSize = data.metadata?.fontSize;
  const scale = getFontScale(fontSize);
  
  return { themeColor, fontName, scale };
};

const ModernCoverLetter = ({ data }: { data: CoverLetterData }) => {
  const { themeColor, fontName, scale } = getStyles(data);

  return (
    <div 
      className="p-8 bg-white text-black min-h-[11in]"
      style={{ 
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>

      <h1 className="text-3xl font-bold mb-4" style={{ color: themeColor }}>{data.personalInfo.fullName}</h1>
      <div className="mb-8 text-sm text-gray-600 border-l-4 pl-4" style={{ borderColor: themeColor }}>
        <p>{data.personalInfo.email} | {data.personalInfo.phone}</p>
        <p>{data.personalInfo.address}, {data.personalInfo.city} {data.personalInfo.zipCode}</p>
      </div>
      
      <div className="mb-8">
        <p className="font-bold text-gray-800">{data.recipientInfo.managerName}</p>
        <p>{data.recipientInfo.companyName}</p>
        <p>{data.recipientInfo.address}</p>
        <p>{data.recipientInfo.city} {data.recipientInfo.zipCode}</p>
      </div>

      <div className="mb-6 font-bold" style={{ color: themeColor }}>
        Subject: <RichText inline text={data.content.subject} />
      </div>
      <div className="mb-4">
        <RichText inline text={data.content.greeting} />
      </div>
      <RichText text={data.content.opening} className="mb-4" />
      <RichText text={data.content.body} className="mb-4 leading-relaxed" />
      <RichText text={data.content.closing} className="mb-8" />
      <div className="font-bold text-xl" style={{ color: themeColor }}>
        <RichText inline text={data.content.signature} />
      </div>
    </div>
  );
};

const ProfessionalCoverLetter = ({ data }: { data: CoverLetterData }) => {
  const { themeColor, fontName, scale } = getStyles(data);

  return (
    <div 
      className="p-12 bg-white text-black min-h-[11in]"
      style={{ 
        fontFamily: `"${fontName}", serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>

      <div className="border-b-2 pb-6 mb-8" style={{ borderColor: themeColor }}>
        <h1 className="text-4xl font-bold uppercase tracking-widest text-gray-900">{data.personalInfo.fullName}</h1>
        <div className="flex justify-between mt-4 text-sm font-medium text-gray-500">
          <span>{data.personalInfo.email}</span>
          <span>{data.personalInfo.phone}</span>
          <span>{data.personalInfo.city}, {data.personalInfo.zipCode}</span>
        </div>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-500 mb-4">{new Date().toLocaleDateString()}</p>
        <div className="pl-4 border-l-2" style={{ borderColor: themeColor }}>
            <p className="font-bold text-gray-900">{data.recipientInfo.managerName}</p>
            <p className="text-gray-700">{data.recipientInfo.companyName}</p>
            <p className="text-gray-600 text-sm">{data.recipientInfo.address}</p>
        </div>
      </div>

      <div className="space-y-4 leading-relaxed text-gray-800">
        <p>
          <RichText inline text={data.content.greeting} />
        </p>
        <RichText text={data.content.opening} />
        <RichText text={data.content.body} className="whitespace-pre-wrap" />
        <RichText text={data.content.closing} />
        <p className="mt-8 font-bold text-lg border-t pt-4 w-48" style={{ borderColor: themeColor }}>
          <RichText inline text={data.content.signature} />
        </p>
      </div>
    </div>
  );
};

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<{ data: CoverLetterData }>;
  premium: boolean;
  previewImage?: string;
}

export const coverLetterTemplates: CoverLetterTemplate[] = [
  {
    id: 'modern',
    name: 'Modern Clean',
    description: 'A clean and contemporary design suitable for startups and tech companies.',
    component: ModernCoverLetter,
    premium: false,
  },
  {
    id: 'professional',
    name: 'Classic Professional',
    description: 'A traditional layout perfect for corporate and executive roles.',
    component: ProfessionalCoverLetter,
    premium: false,
  },
  {
    id: 'creative',
    name: 'Creative Impact',
    description: 'Stand out with bold typography and unique structure.',
    component: ModernCoverLetter, // Reusing modern but user can customize
    premium: true,
  },
];
