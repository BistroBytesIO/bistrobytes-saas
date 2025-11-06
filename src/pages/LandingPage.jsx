import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  MonitorSmartphone,
  Cable,
  CreditCard,
  BarChart3,
  Gift,
  ShieldCheck,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'

const LandingPage = () => {
  const features = [
    {
      icon: <MonitorSmartphone className="h-8 w-8" />,
      title: "One-Click Website Launch",
      description: "Spin up a fully branded site with online ordering, hours, and menus in minutes."
    },
    {
      icon: <Cable className="h-8 w-8" />,
      title: "Seamless POS Sync",
      description: "Connect Clover, Square, or Toast with one click so menus and orders stay in sync."
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Payment Flexibility",
      description: "Accept cards, Apple Pay, Google Pay, and PayPal with secure Stripe processing."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-Time Analytics",
      description: "Track orders, menu performance, and customer trends from a single dashboard."
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Built-In Loyalty",
      description: "Reward repeat business with configurable points, rewards, and targeted campaigns."
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade infrastructure with SSL, data isolation, and role-based access."
    }
  ]

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#C8E1F5] via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Your Website
              <span className="block mt-2 inline-block rounded-xl bg-white px-6 py-2 text-4xl md:text-6xl font-bold text-gray-900">
                In One Click
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your business with one-click websites, seamless POS integration, 
              and comprehensive customer management. Set up in minutes, not months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="/our-solution">
                  Watch Demo
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>
        </div>
        <div className="pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="h-6 w-24 bg-gray-300 rounded" />
              <div className="h-6 w-24 bg-gray-300 rounded" />
              <div className="h-6 w-24 bg-gray-300 rounded" />
              <div className="h-6 w-24 bg-gray-300 rounded" />
              <div className="h-6 w-24 bg-gray-300 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-b from-[#C8E1F5]/40 via-white to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-gray-600">Launch online, sync operations, and start taking orders in four simple steps.</p>
          </div>
          <Tabs defaultValue="launch" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger tabValue="launch">Launch</TabsTrigger>
                <TabsTrigger tabValue="customize">Customize</TabsTrigger>
                <TabsTrigger tabValue="integrate">Integrate</TabsTrigger>
                <TabsTrigger tabValue="grow">Grow</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent tabValue="launch">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Generate a polished website with branded pages, menus, and ordering in under five minutes.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="customize">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Drag-and-drop to tweak sections, upload photos, and adjust menu items with live previews.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="integrate">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Connect Clover, Square, or Toast, sync inventory, and activate Stripe, Apple Pay, and Google Pay in one step.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="grow">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Monitor orders, loyalty engagement, and revenue trends with automated reporting.</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-[#C8E1F5]/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to grow your business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One platform for one-click websites, effortless POS integration, modern payments, and customer growth tools.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border border-[#C8E1F5] shadow-lg">
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
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-24 bg-gradient-to-b from-[#C8E1F5]/40 via-white to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#C8E1F5] via-[#E9F4FC] to-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to launch your business online?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Join brands that build websites, sync POS, and manage customers in a single platform.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
            <Link to="/signup">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
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
                  alt="BistroBytes logo"
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
                <li><a href="#" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-700">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
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
            <p>&copy; 2025 BistroBytes. All rights reserved.</p>
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
    { q: 'How fast can my website go live?', a: 'Most businesses publish in under ten minutes. Start with our templates, drop in your branding, and launch instantly.' },
    { q: 'Which POS systems can I connect?', a: 'BistroBytes integrates with Clover, Square, and Toast out of the box. We handle menu sync, inventory updates, and order push.' },
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
