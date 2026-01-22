import { Navigation } from '@/components/navigation';



export default function Home() {
  return (
    <main>
      <Navigation />
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', fontWeight: 800 }}>
          Deliver Photos securely.
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          The professional platform for photographers to share galleries and manage projects.
        </p>
      </div>
    </main>
  );
}
