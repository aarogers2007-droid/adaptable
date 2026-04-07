import ConsentForm from "./ConsentForm";

export const metadata = {
  title: "Parental Consent — Adaptable",
};

export default async function ParentalConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <ConsentForm token={token} />
      </div>
    </main>
  );
}
