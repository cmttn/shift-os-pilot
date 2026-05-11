import { redirect } from 'next/navigation';

export default function LegacyParentPlayerPage() {
  // Keep legacy direct links safe; the canonical parent entry point is /dashboard/parent.
  redirect('/dashboard/parent');
}
