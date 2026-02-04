import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

type PdfBrandingOptions = {
  watermarkText?: string;
  footerText?: string;
  qrDataUrl?: string;
  qrSizeMm?: number;
};

export async function generatePDF(
  elementId: string,
  filename: string = 'resume.pdf',
  options?: PdfBrandingOptions
): Promise<string> {
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

    const tempPdf = new jsPDF('p', 'mm', 'letter');
    const imgProps = tempPdf.getImageProperties(dataUrl);
    const imgRatio = imgProps.height / imgProps.width;
    const letterRatio = 279 / 216;
    const a4Ratio = 297 / 210;
    const format = Math.abs(imgRatio - a4Ratio) < Math.abs(imgRatio - letterRatio) ? 'a4' : 'letter';

    const pdf = new jsPDF('p', 'mm', format);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    const addBranding = () => {
      if (options?.watermarkText) {
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(46);
        pdf.text(options.watermarkText, pdfWidth / 2, pdfHeight / 2, {
          angle: 30,
          align: 'center',
        });
      }

      if (options?.footerText) {
        pdf.setTextColor(120, 120, 120);
        pdf.setFontSize(9);
        pdf.text(options.footerText, pdfWidth / 2, pdfHeight - 6, {
          align: 'center',
        });
      }

      if (options?.qrDataUrl) {
        const size = options.qrSizeMm ?? 18;
        const x = pdfWidth - size - 8;
        const y = pdfHeight - size - 10;
        pdf.addImage(options.qrDataUrl, 'PNG', x, y, size, size);
      }
    };

    // First page
    // If the image slightly exceeds a single page, scale it down to fit.
    if (imgHeight > pdfHeight && imgHeight - pdfHeight <= 12) {
      const scale = pdfHeight / imgHeight;
      const scaledWidth = imgWidth * scale;
      const x = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(dataUrl, 'JPEG', x, 0, scaledWidth, pdfHeight);
      addBranding();
      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
    }

    pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight);
    addBranding();
    heightLeft -= pdfHeight;

    // Subsequent pages - only add if there is significant content left (more than 2mm)
    while (heightLeft > 2) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight);
      addBranding();
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
