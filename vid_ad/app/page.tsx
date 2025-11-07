import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="w-full">
          <h1 className="mb-8 text-center text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            AI Video Ad Generator
          </h1>
          <p className="mb-12 text-center text-xl text-gray-600">
            Generate professional video advertisements with the power of AI
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg border border-gray-300 px-8 py-3 font-semibold hover:bg-gray-100 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        <FeatureCard
          title="AI Script Generation"
          description="Generate compelling ad scripts with GPT-4o"
          icon="📝"
        />
        <FeatureCard
          title="Video Creation"
          description="Create stunning videos with Replicate AI models"
          icon="🎬"
        />
        <FeatureCard
          title="Voice Generation"
          description="Professional voiceovers with OpenAI TTS"
          icon="🎙️"
        />
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}