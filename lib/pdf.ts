import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function generatePDF(elementId: string, filename: string = 'resume.pdf'): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  try {
    // Use the live element directly. 
    // html-to-image handles the capture via SVG foreignObject.
    // We use pixelRatio 2 for better quality (simulating 2x scale).
    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });

    const pdf = new jsPDF('p', 'mm', 'letter');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(dataUrl);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Subsequent pages - only add if there is significant content left (more than 2mm)
    while (heightLeft > 2) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const blob = pdf.output('blob');
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

export function downloadPDF(url: string, filename: string = 'resume.pdf') {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function generateImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    return dataUrl;
  } catch (error) {
    console.error('Image Generation Error:', error);
    throw error;
  }
}

export function downloadImage(dataUrl: string, filename: string = 'resume.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}