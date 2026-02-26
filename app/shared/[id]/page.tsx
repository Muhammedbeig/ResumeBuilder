import SharedDocumentPageClient from "./SharedDocumentPageClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function SharedResumePage() {
  return <SharedDocumentPageClient />;
}
