import { requireAdmin } from "@/lib/auth";
import { PageHeader, LinkButton } from "@/components/ui";
import { NewCustomerForm } from "@/components/new-customer-form";

export const metadata = { title: "New account opening" };

export default async function NewCustomerPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New account opening"
        description="Open customer relationships, issue account numbers and temporary credentials."
      >
        <LinkButton href="/admin/users" variant="ghost">
          ← Back to customers
        </LinkButton>
      </PageHeader>
      <div className="max-w-3xl">
        <NewCustomerForm />
      </div>
    </>
  );
}
