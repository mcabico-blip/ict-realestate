import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NewListingForm } from "@/components/dashboard/new-listing-form";

export default async function NewListingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">List a Property</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to publish your property listing</p>
      </div>
      <NewListingForm />
    </div>
  );
}
