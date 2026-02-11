import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

type PdfWatermarkOptions = {
  text: string;
  opacity?: number;
  size?: number;
  rotation?: number;
  style?: string;
  position?: string;
};

type PdfBrandingOptions = {
  watermarkText?: string;
  watermark?: PdfWatermarkOptions;
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

    const resolveWatermark = (): PdfWatermarkOptions | null => {
      if (options?.watermark) return options.watermark;
      if (options?.watermarkText) return { text: options.watermarkText };
      return null;
    };

    const addWatermark = () => {
      const watermark = resolveWatermark();
      if (!watermark?.text) return;

      const opacity = Math.min(1, Math.max(0, watermark.opacity ?? 0.18));
      const sizePx = Math.min(160, Math.max(10, watermark.size ?? 46));
      const fontSize = Math.round(sizePx * 0.75);
      const rotation = Number.isFinite(watermark.rotation) ? watermark.rotation : 30;
      const style = watermark.style ?? "single";
      const position = watermark.position ?? "center";
      const shade = Math.round(255 * (1 - opacity));

      pdf.setTextColor(shade, shade, shade);
      pdf.setFontSize(fontSize);

      if (style === "tile") {
        const cols = 3;
        const rows = 4;
        const stepX = pdfWidth / cols;
        const stepY = pdfHeight / rows;
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const x = stepX * col + stepX / 2;
            const y = stepY * row + stepY / 2;
            pdf.text(watermark.text, x, y, {
              angle: rotation,
              align: "center",
            });
          }
        }
        return;
      }

      const margin = 12;
      let x = pdfWidth / 2;
      let y = pdfHeight / 2;
      let align: "center" | "left" | "right" = "center";

      if (position === "top-left") {
        x = margin;
        y = margin + fontSize;
        align = "left";
      } else if (position === "top-right") {
        x = pdfWidth - margin;
        y = margin + fontSize;
        align = "right";
      } else if (position === "bottom-left") {
        x = margin;
        y = pdfHeight - margin;
        align = "left";
      } else if (position === "bottom-right") {
        x = pdfWidth - margin;
        y = pdfHeight - margin;
        align = "right";
      }

      pdf.text(watermark.text, x, y, {
        angle: rotation,
        align,
      });
    };

    const addBranding = () => {
      addWatermark();

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
