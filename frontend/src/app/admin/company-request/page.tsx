import { SectionTitle } from "@/app/components/ui/section-title";
import CompanyRequestsTable from "@/app/components/admin/company-requests-table";

export default function CompanyRequestPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Company Registration Requests"
        description="Review and approve company requests"
      />

      <CompanyRequestsTable />
    </div>
  );
}
