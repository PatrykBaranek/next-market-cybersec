import { ListingForm } from '@/components/ListingForm';

export default function NewListingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dodaj ogłoszenie</h1>
      <ListingForm mode="create" />
    </div>
  );
}
