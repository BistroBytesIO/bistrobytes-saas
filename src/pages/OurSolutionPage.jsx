import React from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
  MonitorSmartphone,
  CreditCard,
  Palette,
  Store,
  Rocket,
  Headphones
} from 'lucide-react'

const solutionPillars = [
  {
    icon: <MonitorSmartphone className="h-8 w-8 text-[#3B82F6]" />,
    title: 'One-Click Website Creation',
    description: 'Instantly launch a fully functional website with just one click, no coding or design experience required.'
  },
  {
    icon: <Palette className="h-8 w-8 text-[#3B82F6]" />,
    title: 'Seamless Customization',
    description: 'Easily personalize your site\'s layout, colors, and content to reflect your brand and business goals.'
  },
  {
    icon: <CreditCard className="h-8 w-8 text-[#3B82F6]" />,
    title: 'Built-In Payment Integration',
    description: 'Accept payments effortlessly through Stripe, Google Pay, and Apple Pay for a smooth checkout experience.'
  },
  {
    icon: <Store className="h-8 w-8 text-[#3B82F6]" />,
    title: 'Versatile for Any Industry',
    description: 'Designed to serve SaaS platforms, retail stores, and service providers with equal efficiency.'
  },
  {
    icon: <Rocket className="h-8 w-8 text-[#3B82F6]" />,
    title: 'Continuous Innovation',
    description: 'Our dedicated R&D team consistently adds new tools and features to keep your website ahead of the curve.'
  },
  {
    icon: <Headphones className="h-8 w-8 text-[#3B82F6]" />,
    title: '24/7 Customer Support',
    description: 'Experience exceptional, around-the-clock assistance from our expert support team whenever you need it.'
  }
]

const OurSolutionPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8E1F5] via-white to-white">
      <PublicNavbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            The all-in-one digital platform for modern restaurants
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            BizBytes combines one-click website deployment, deep POS integrations, and customer engagement tools so you can focus on hospitality—not technology.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg">
              <Link to="/pricing">Explore Pricing</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {solutionPillars.map((pillar) => (
              <Card key={pillar.title} className="card-hover border border-[#C8E1F5] shadow-lg">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white">
                    {pillar.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700">{pillar.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-5xl rounded-3xl bg-white/80 px-8 py-12 shadow-lg backdrop-blur">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">Built for the full guest journey</h2>
              <p className="mt-4 text-gray-600">
                From discovery to repeat visits, BizBytes keeps the guest experience connected. Publish new menu items instantly, trigger loyalty rewards at the register, and keep guests engaged with automated marketing.
              </p>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4">
                <strong className="block text-gray-900">Automated onboarding</strong>
                <span className="text-sm">Tenant provisioning, DNS configuration, and certificate management handled automatically.</span>
              </div>
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4">
                <strong className="block text-gray-900">Operations-first design</strong>
                <span className="text-sm">Ticket routing, prep status visibility, and order throttling keep the kitchen running smoothly.</span>
              </div>
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4">
                <strong className="block text-gray-900">Data you can act on</strong>
                <span className="text-sm">Identify top performers, forecast demand, and keep leadership aligned with scheduled reports.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-r from-[#C8E1F5] via-[#E9F4FC] to-white px-8 py-16 shadow-lg">
            <h2 className="text-3xl font-semibold text-gray-900">See BizBytes in action</h2>
            <p className="mt-4 text-gray-600">
              We’ll connect your POS, import your menu, and spin up a live demo so you can test the full experience before launch.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/contact">Book a walkthrough</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OurSolutionPage
