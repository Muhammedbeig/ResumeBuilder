process.env.PDF2JSON_DISABLE_LOGS ??= "1";

const SUPPRESSED_WARNINGS = [
  "Setting up fake worker.",
  "Unsupported: field.type of Link",
  "NOT valid form element",
];

type PdfParserInstance = {
  on: (event: string, listener: (...args: any[]) => void) => void;
  parseBuffer: (buffer: Buffer) => void;
  getRawTextContent: () => string;
};

const shouldSuppressWarning = (value: unknown) => {
  if (typeof value !== "string") return false;
  return SUPPRESSED_WARNINGS.some((snippet) => value.includes(snippet));
};

const withSuppressedPdfWarnings = async <T>(task: () => Promise<T>) => {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const firstArg = args[0];
    if (shouldSuppressWarning(firstArg)) return;
    originalWarn(...args);
  };

  try {
    return await task();
  } finally {
    console.warn = originalWarn;
  }
};

const createPdfParser = async (rawTextMode: boolean | number): Promise<PdfParserInstance> => {
  const pdf2jsonModule = (await import("pdf2json")) as unknown as {
    default: new (context: unknown, rawTextMode: boolean | number) => PdfParserInstance;
  };
  return new pdf2jsonModule.default(null, rawTextMode);
};

export const extractPdfText = async (buffer: Buffer, rawTextMode: boolean | number = true) => {
  const parser = await createPdfParser(rawTextMode);

  return withSuppressedPdfWarnings(
    () =>
      new Promise<string>((resolve, reject) => {
        parser.on("pdfParser_dataError", (errData: any) => reject(errData?.parserError ?? errData));
        parser.on("pdfParser_dataReady", () => {
          resolve(parser.getRawTextContent());
        });

        parser.parseBuffer(buffer);
      })
  );
};
