import React from 'react'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const milestones = [
  {
    year: 'Q1 2025',
    title: 'BizBytes launches for modern businesses',
    description: 'We opened our platform to hospitality, retail, and service businesses that need instant websites and connected operations.'
  },
  {
    year: 'Q2 2025',
    title: 'Deep POS and payments connectivity',
    description: 'Native Clover and Square integrations shipped alongside advanced Stripe capabilities for Apple Pay, Google Pay, and PayPal.'
  },
  {
    year: 'Q3 2025',
    title: 'Growth intelligence suite',
    description: 'Automated analytics, loyalty, and campaign tooling helped operators increase repeat revenue without adding new software.'
  }
]

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8E1F5] via-white to-white">
      <PublicNavbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Helping businesses thrive in a digital-first world
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            We’re a team of hospitality operators, engineers, and designers building software that keeps the guest experience at the core.
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-5xl rounded-3xl bg-white/80 px-8 py-12 shadow-lg backdrop-blur">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">Our philosophy</h2>
              <p className="mt-4 text-gray-600">
                Businesses should spend time delighting guests—not wrestling with technology. BizBytes removes the heavy lifting by automating websites, syncing operations, and surfacing insights in a single place.
              </p>
              <p className="mt-3 text-gray-600">
                Every product decision is tested in real dining rooms alongside our customer advisory council to ensure we ship features that drive measurable results.
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

        <section className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-3xl font-semibold text-gray-900 text-center">Milestones</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {milestones.map((milestone) => (
              <Card key={milestone.year} className="border border-[#C8E1F5] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">{milestone.year}</CardTitle>
                  <CardDescription className="text-base text-gray-700">{milestone.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-r from-[#C8E1F5] via-[#E9F4FC] to-white px-8 py-16 shadow-lg">
            <h2 className="text-3xl font-semibold text-gray-900">Join the BizBytes journey</h2>
            <p className="mt-4 text-gray-600">
              We’re hiring across product, success, and growth to help businesses everywhere modernize operations.
            </p>
            <a
              href="mailto:careers@bistrobytes.app"
              className="mt-6 inline-flex items-center rounded-md bg-[#3B82F6] px-6 py-3 text-white shadow hover:bg-[#2563EB]"
            >
              careers@bistrobytes.app
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AboutPage
