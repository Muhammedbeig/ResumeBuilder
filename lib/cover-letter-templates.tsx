import React from 'react';
import { CoverLetterData } from '@/types';

// Placeholder components - we will create these next
const ModernCoverLetter = ({ data }: { data: CoverLetterData }) => (
  <div className="p-8 bg-white text-black font-sans">
    <h1 className="text-2xl font-bold mb-4">{data.personalInfo.fullName}</h1>
    <div className="mb-8 text-sm text-gray-600">
      <p>{data.personalInfo.email} | {data.personalInfo.phone}</p>
      <p>{data.personalInfo.address}, {data.personalInfo.city} {data.personalInfo.zipCode}</p>
    </div>
    
    <div className="mb-8">
      <p className="font-bold">{data.recipientInfo.managerName}</p>
      <p>{data.recipientInfo.companyName}</p>
      <p>{data.recipientInfo.address}</p>
      <p>{data.recipientInfo.city} {data.recipientInfo.zipCode}</p>
    </div>

    <div className="mb-4 font-bold">Subject: {data.content.subject}</div>
    <div className="mb-4">{data.content.greeting}</div>
    <div className="mb-4">{data.content.opening}</div>
    <div className="mb-4 whitespace-pre-wrap">{data.content.body}</div>
    <div className="mb-8">{data.content.closing}</div>
    <div className="font-bold">{data.content.signature}</div>
  </div>
);

const ProfessionalCoverLetter = ({ data }: { data: CoverLetterData }) => (
  <div className="p-8 bg-white text-black font-serif">
    <div className="border-b-2 border-gray-800 pb-4 mb-8">
      <h1 className="text-3xl font-bold uppercase tracking-widest">{data.personalInfo.fullName}</h1>
      <div className="flex justify-between mt-2 text-sm">
        <span>{data.personalInfo.email}</span>
        <span>{data.personalInfo.phone}</span>
        <span>{data.personalInfo.city}</span>
      </div>
    </div>
    
    <div className="mb-8">
      <p>{new Date().toLocaleDateString()}</p>
      <br/>
      <p className="font-bold">{data.recipientInfo.managerName}</p>
      <p>{data.recipientInfo.companyName}</p>
    </div>

    <div className="space-y-4 leading-relaxed">
      <p>{data.content.greeting}</p>
      <p>{data.content.opening}</p>
      <p className="whitespace-pre-wrap">{data.content.body}</p>
      <p>{data.content.closing}</p>
      <p className="mt-8 font-bold">{data.content.signature}</p>
    </div>
  </div>
);

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
    component: ModernCoverLetter, // Reusing for now as placeholder
    premium: true,
  },
];
