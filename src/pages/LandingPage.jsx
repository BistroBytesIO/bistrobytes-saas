import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { 
  CheckCircle, 
  Star, 
  Mic, 
  Smartphone, 
  CreditCard, 
  BarChart3, 
  Zap,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'

const LandingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const features = [
    {
      icon: <Mic className="h-8 w-8" />,
      title: "AI Voice Ordering",
      description: "Revolutionary speech-to-speech AI powered by OpenAI for natural voice ordering experiences"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "One-Click POS Integration",
      description: "Connect with Clover, Square, and other major POS systems instantly via OAuth"
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Advanced Payment Processing",
      description: "Accept all payment methods: cards, Apple Pay, Google Pay, PayPal with secure processing"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-Time Analytics",
      description: "Comprehensive dashboards with customer insights, sales trends, and performance metrics"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Customer Loyalty Program",
      description: "Built-in rewards system to increase customer retention and repeat orders"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Enterprise Security",
      description: "Multi-tenant architecture with data isolation and enterprise-grade security"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: billingCycle === 'monthly' ? 49 : 499,
      originalPrice: billingCycle === 'monthly' ? null : 588,
      description: "Perfect for small restaurants and cafes",
      features: [
        "Online Ordering System",
        "Menu Management (up to 100 items)",
        "Basic Customization",
        "Stripe Payment Processing",
        "Customer Accounts",
        "One-Click Clover/Square Integration",
        "Up to 500 orders/month",
        "Email Support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: billingCycle === 'monthly' ? 149 : 1499,
      originalPrice: billingCycle === 'monthly' ? null : 1788,
      description: "Complete solution for established restaurants",
      features: [
        "Everything in Starter",
        "Customer Loyalty Program",
        "Advanced Payment Options (Apple Pay, Google Pay)",
        "Real-Time Analytics Dashboard",
        "Custom Domain Support",
        "Advanced Branding",
        "Real-Time Notifications",
        "Up to 2,000 orders/month",
        "Priority Support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: billingCycle === 'monthly' ? 399 : 3999,
      originalPrice: billingCycle === 'monthly' ? null : 4788,
      description: "Premium solution with AI voice ordering",
      features: [
        "Everything in Professional",
        "🎤 AI Voice Ordering (OpenAI Realtime API)",
        "Voice Payment Processing",
        "White-Label Solution",
        "Advanced Business Intelligence",
        "Custom Integrations & APIs",
        "99.9% Uptime SLA",
        "Unlimited orders",
        "24/7 Dedicated Support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Owner, Pizza Palace",
      content: "BistroBytes transformed our ordering process. The voice AI is incredible - customers love it!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Manager, Burger Barn",
      content: "Setup took 5 minutes. Orders now go straight to our Clover POS. Game changer.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Owner, Cafe Express",
      content: "The loyalty program increased our repeat customers by 40%. ROI was immediate.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/60 bg-[#C8E1F5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <img
                src="/BizBytes Logo.png"
                alt="BistroBytes logo"
                className="h-20 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <Button variant="outline">Sign In</Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#C8E1F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              The Future of
              <span className="block mt-2 inline-block rounded-xl bg-white px-6 py-2 text-4xl md:text-6xl font-bold text-gray-900">
                Restaurant Ordering
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your restaurant with AI-powered voice ordering, seamless POS integration, 
              and comprehensive customer management. Set up in minutes, not months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Watch Demo
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
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-gray-600">From hello to paid order in under a minute.</p>
          </div>
          <Tabs defaultValue="speak" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger tabValue="speak">Speak</TabsTrigger>
                <TabsTrigger tabValue="confirm">Confirm</TabsTrigger>
                <TabsTrigger tabValue="pay">Pay</TabsTrigger>
                <TabsTrigger tabValue="track">Track</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent tabValue="speak">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Customer talks naturally; our AI understands items, modifiers, and quantities in real-time.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="confirm">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">AI reads back the order and subtotals; customer approves by voice or tap.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="pay">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Pay with card on file, Apple Pay, or Google Pay — securely via Stripe.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="track">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 text-center text-gray-700">Live updates via WebSocket — prep, ready, and pickup notifications.</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to grow your restaurant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From voice AI to analytics, we've built the most comprehensive restaurant technology platform
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Choose the plan that fits your restaurant's needs
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#C8E1F5] transition-colors"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={billingCycle === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                Annual
                <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-[#C8E1F5] text-gray-900">
                  Save 15%
                </span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative card-hover ${plan.popular ? 'ring-2 ring-[#C8E1F5] shadow-xl scale-105' : 'shadow-lg border border-[#C8E1F5]'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="px-4 py-1 bg-[#C8E1F5] text-gray-900 border border-white/60">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'year'}</span>
                  </div>
                  {plan.originalPrice && (
                    <span className="text-gray-500 line-through text-lg">${plan.originalPrice}</span>
                  )}
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-[#C8E1F5] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link to="/signup">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by restaurant owners
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about BistroBytes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-hover shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#C8E1F5]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to transform your restaurant?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Join thousands of restaurants already using BistroBytes
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
            <Link to="/signup">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#C8E1F5] text-gray-900 py-12">
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
                The future of restaurant ordering, powered by AI.
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
    { q: 'How accurate is the voice ordering?', a: 'Our OpenAI-powered Realtime integration achieves high accuracy in restaurant contexts with sub-800ms latency for voice-to-voice.' },
    { q: 'How long does setup take?', a: 'Most tenants are provisioned in minutes. You can go from signup to first order the same day.' },
    { q: 'Which payments are supported?', a: 'Stripe, Apple Pay, Google Pay, and cards. Off-session payments are supported with saved methods.' },
    { q: 'Can I connect my POS?', a: 'Yes, we offer one-click integrations with Clover and others. Menu sync and order push are supported.' },
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
