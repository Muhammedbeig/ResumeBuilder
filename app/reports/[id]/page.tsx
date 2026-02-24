import ReportDetailClient from "./ReportDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ReportDetailPage() {
  return <ReportDetailClient />;
}
