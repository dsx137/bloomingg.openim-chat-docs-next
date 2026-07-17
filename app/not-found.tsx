import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <span>404</span>
      <h1>This documentation page does not exist.</h1>
      <p>The requested route is not part of the imported OpenIM documentation structure.</p>
      <Link href="/">Return to OpenIM docs</Link>
    </main>
  );
}
