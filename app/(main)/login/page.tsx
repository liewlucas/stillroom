import { SignIn } from '@clerk/nextjs';



export default function LoginPage() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--muted)' }}>
            <SignIn redirectUrl="/dashboard/galleries" />
        </div>
    );
}
