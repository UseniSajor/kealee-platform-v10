import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="inline-block mb-6">
            <Image
              src="/kealee-logo.svg"
              alt="Kealee"
              width={120}
              height={40}
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1F2937] mb-2">Welcome Back</h1>
          <p className="text-[#6B7280]">Sign in to your Kealee account</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white",
            },
          }}
          redirectUrl="/"
        />

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Don't have an account?{" "}
          <a href="/sign-up" className="text-[#FF8C22] font-semibold hover:text-[#E67E1A]">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
