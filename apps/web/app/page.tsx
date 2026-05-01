import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  if (accessToken) {
    redirect('/dashboard');
  }

  redirect('/login');
}
