import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { AnimatedCard } from '../components/ui/animated-card'
import {
  MonitorSmartphone,
  CreditCard,
  ArrowRight,
  Phone,
  Mail,
  Palette,
  Store,
  Rocket,
  Headphones,
  Cable,
  BarChart3
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'

const LandingPage = () => {
  const heroSlides = [
    {
      src: '/mock-restaurant-site.png',
      alt: 'BizBytes restaurant website mockup',
      caption: 'Launch a polished restaurant site with online ordering in minutes.'
    },
    {
      src: '/mock-retail-site.png',
      alt: 'BizBytes retail website mockup',
      caption: 'Showcase retail inventory with instant checkout and loyalty rewards.'
    },
    {
      src: '/mock-services-site.png',
      alt: 'BizBytes services website mockup',
      caption: 'Book appointments and take payments for service businesses on one page.'
    }
  ]

  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [heroSlides.length])

  const handleContactSubmit = (event) => {
    event.preventDefault()
  }

  const features = [
    {
      icon: <MonitorSmartphone className="h-8 w-8" />,
      title: "One-Click Website Creation",
      description: "Instantly launch a fully functional website with just one click, no coding or design experience required."
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "Seamless Customization",
      description: "Easily personalize your site's layout, colors, and content to reflect your brand and business goals."
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Built-In Payment Integration",
      description: "Accept payments effortlessly through Stripe, Google Pay, and Apple Pay for a smooth checkout experience."
    },
    {
      icon: <Store className="h-8 w-8" />,
      title: "Versatile for Any Industry",
      description: "Designed to serve SaaS platforms, restaurants, retail stores, and service providers with equal efficiency."
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "Continuous Innovation",
      description: "Our dedicated R&D team consistently adds new tools and features to keep your website ahead of the curve."
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "24/7 Customer Support",
      description: "Experience exceptional, around-the-clock assistance from our expert support team whenever you need it."
    }
  ]

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#C8E1F5] via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Your Website In One Click
            </h1>
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Transform your business with one-click websites, seamless POS integration,
              and comprehensive customer management. Set up in minutes, not months.
            </p>
          </div>
        </div>
        <div className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center">
            <div className="relative w-full overflow-hidden rounded-3xl border border-[#C8E1F5] bg-white shadow-lg">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.src}
                  className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-700 ${
                    index === activeSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="h-[300px] w-full object-cover sm:h-[400px] md:h-[460px]"
                  />
                </div>
              ))}
              <div className="relative flex h-[300px] w-full items-end justify-end bg-gradient-to-t from-black/30 to-transparent p-6 sm:h-[400px] md:h-[460px]">
                <p className="rounded-lg bg-black/50 px-4 py-2 text-right text-sm text-white whitespace-nowrap">
                  {heroSlides[activeSlide].caption}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center space-x-3">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  aria-label={`Show slide ${index + 1}`}
                  className={`h-3 w-3 rounded-full transition ${
                    activeSlide === index ? 'bg-[#3B82F6]' : 'bg-gray-300 hover:bg-[#90CAF9]'
                  }`}
                  onClick={() => setActiveSlide(index)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why BizBytes */}
      <section className="py-24 bg-gradient-to-b from-[#C8E1F5]/30 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why use BizBytes?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedCard key={index} className="border border-[#C8E1F5] shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center text-gray-900 mb-4 bg-white border border-[#C8E1F5]">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gradient-to-b from-[#C8E1F5]/40 via-white to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gradient-to-b from-[#C8E1F5]/30 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-gray-900">Ready to talk?</h2>
            <p className="mt-3 text-gray-600">
              Reach out and ask a question to see how we can help you with your business needs.
            </p>
          </div>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6 rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur">
              <div className="flex items-center space-x-3 text-gray-700">
                <Mail className="h-6 w-6 text-[#3B82F6]" />
                <span>hello@bizbytes.app</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="h-6 w-6 text-[#3B82F6]" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="rounded-2xl bg-[#C8E1F5]/40 p-4 text-gray-700">
                Our customer success team is available Monday through Friday, 8am–6pm CT, with emergency support after hours for Enterprise plans.
              </div>
            </div>
            <form
              onSubmit={handleContactSubmit}
              className="space-y-6 rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur"
            >
              <div>
                <label htmlFor="lp-name" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="lp-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
                />
              </div>
              <div>
                <label htmlFor="lp-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="lp-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@business.com"
                  className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
                />
              </div>
              <div>
                <label htmlFor="lp-company" className="block text-sm font-medium text-gray-700">
                  Business or brand
                </label>
                <input
                  id="lp-company"
                  name="company"
                  type="text"
                  placeholder="Rivera Hospitality Group"
                  className="mt-2 w-full rounded-lg border border-[#C8E1F5] px-4 py-3 text-gray-900 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
                />
              </div>
              <div>
                <label htmlFor="lp-message" className="block text-sm font-medium text-gray-700">
                  How can we help?
                </label>
                <textarea
                  id="lp-message"
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
                By submitting, you agree to receive updates from BizBytes. You can unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-[#C8E1F5] via-[#E9F4FC] to-white text-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/BizBytes Logo.png"
                  alt="BizBytes logo"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-700">
                One platform for one-click websites, payments, and POS integration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-700">
                <li><Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-700">
                <li><a href="#faq" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#contact" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-700">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@bistrobytes.app</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/60 mt-8 pt-8 text-center text-gray-700">
            <p>&copy; 2025 BizBytes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

// Simple FAQ using Accordion primitives without logic changes elsewhere
const FAQ = () => {
  const [open, setOpen] = React.useState(null)
  const items = [
    { q: 'How quickly can my website be launched?', a: 'Most businesses publish in under ten minutes. Start with our templates, drop in your branding, and launch instantly.' },
    { q: 'Which POS systems can I connect?', a: 'BizBytes integrates with Clover and Square out of the box. We handle menu sync, inventory updates, and order push.' },
    { q: 'Do you support digital wallets and online payments?', a: 'Yes. Stripe powers credit and debit cards, Apple Pay, Google Pay, and PayPal so guests can pay however they prefer.' },
    { q: 'Can I manage multiple locations?', a: 'Our platform scales with your business. Enterprise plans support multi-location menus, reporting, and role-based access for staff.' },
  ]
  return (
    <Accordion>
      {items.map((it, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger onClick={() => setOpen(open === idx ? null : idx)}>
            <span>{it.q}</span>
            <span className="text-muted-foreground">{open === idx ? '−' : '+'}</span>
          </AccordionTrigger>
          <AccordionContent open={open === idx}>
            <p className="text-gray-600">{it.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
