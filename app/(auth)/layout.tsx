export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBF0F6] via-[#FAF5FA] to-[#F3EBF5]">
      {children}
    </div>
  );
}
