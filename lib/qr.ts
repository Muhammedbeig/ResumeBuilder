export async function createQrDataUrl(value: string, size = 128) {
  const { toDataURL } = await import("qrcode");
  return toDataURL(value, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#111827",
      light: "#FFFFFF",
    },
  });
}
