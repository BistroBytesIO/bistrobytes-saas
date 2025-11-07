import React from 'react'
import PublicNavbar from '../components/layout/PublicNavbar'

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8E1F5] via-white to-white">
      <PublicNavbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Helping businesses thrive in a digital-first world
          </h1>
        </section>

        <section className="mx-auto mt-16 max-w-5xl rounded-3xl bg-white/80 px-8 py-12 shadow-lg backdrop-blur">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">Our philosophy</h2>
              <p className="mt-4 text-gray-600">
                Businesses should spend time delighting guests—not wrestling with technology. BizBytes removes the heavy lifting by automating websites, syncing operations, and surfacing insights in a single place.
              </p>
              <p className="mt-3 text-gray-600">
                Every product decision is tested in real business settings with direct feedback from our customers to ensure we deliver features that create tangible value and meaningful impact.
              </p>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4">
                <strong className="block text-gray-900">Hospitality-led</strong>
                <span className="text-sm">Our leadership team has launched and scaled hospitality concepts across the U.S.</span>
              </div>
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4">
                <strong className="block text-gray-900">Data-driven</strong>
                <span className="text-sm">We obsess over conversion rates, ticket times, and lifetime value to guide the roadmap.</span>
              </div>
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4">
                <strong className="block text-gray-900">Partner focused</strong>
                <span className="text-sm">We collaborate with POS providers, payment processors, and marketing platforms to stay connected.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AboutPage
