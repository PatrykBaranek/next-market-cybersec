import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-xs">
        {children}
      </div>
    </div>
  );
}
