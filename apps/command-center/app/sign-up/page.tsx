import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
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
          <h1 className="text-3xl font-bold text-[#1F2937] mb-2">Create Account</h1>
          <p className="text-[#6B7280]">Set up your Kealee account</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white",
            },
          }}
          redirectUrl="/onboarding"
        />

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{" "}
          <a href="/sign-in" className="text-[#FF8C22] font-semibold hover:text-[#E67E1A]">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
