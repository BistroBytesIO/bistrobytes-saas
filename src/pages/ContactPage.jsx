import React from 'react'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Button } from '../components/ui/button'
import { Mail, Phone, MapPin } from 'lucide-react'

const ContactPage = () => {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8E1F5] via-white to-white">
      <PublicNavbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Let’s build your next digital guest experience</h1>
          <p className="mt-4 text-lg text-gray-600">
            Reach out to our onboarding team for demos, partnership inquiries, or support. We respond within one business day.
          </p>
        </section>

        <section className="mx-auto mt-12 flex max-w-5xl flex-col gap-12 lg:flex-row">
          <div className="flex-1 space-y-6 rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur">
            <div className="flex items-center space-x-3 text-gray-700">
              <Mail className="h-6 w-6 text-[#3B82F6]" />
              <span>hello@bistrobytes.app</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <Phone className="h-6 w-6 text-[#3B82F6]" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <MapPin className="h-6 w-6 text-[#3B82F6]" />
              <span>124 Market Street, Suite 200, Austin, TX</span>
            </div>
            <div className="rounded-2xl bg-[#C8E1F5]/40 p-4 text-gray-700">
              Our customer success team is available Monday through Friday, 8am–6pm CT, with emergency support after hours for Enterprise plans.
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 space-y-6 rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Alex Rivera"
                className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@restaurant.com"
                className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Restaurant or brand
              </label>
              <input
                id="company"
                name="company"
                type="text"
                placeholder="Rivera Hospitality Group"
                className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                How can we help?
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                placeholder="Tell us about your project, timeline, and goals."
                className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Send message
            </Button>
            <p className="text-xs text-gray-500">
              By submitting, you agree to receive updates and communications about BistroBytes. You can unsubscribe at any time.
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}

export default ContactPage
