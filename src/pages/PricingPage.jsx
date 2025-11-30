import React from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { CheckCircle } from 'lucide-react'

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    description: 'Perfect for small businesses getting online',
    features: [
      'Custom business website (full branding)',
      'Online ordering (pickup)',
      'Full menu management with modifiers & options',
      'Stripe payments (credit and debit cards)',
      'One-click POS integration (Clover, Square)',
      'POS inventory & modifier sync',
      'Basic order management dashboard',
      'Email order confirmations',
      'SSL security & mobile-responsive design',
      'Email support'
    ],
    cta: 'Start Starter Plan',
    popular: false,
    signupLink: '/signup?plan=starter'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 159,
    description: 'Complete solution for growing businesses',
    features: [
      'Everything in Starter',
      'Customer accounts & order history',
      'Customer Loyalty Program (points/rewards)',
      'Advanced payment options (Apple Pay, Google Pay, PayPal)',
      'Advanced menu features (combos, upsells)',
      'Real-time analytics dashboard',
      'Discount & promo codes',
      'Custom domain support (yourrestaurant.com)',
      'Automated email reports (daily/weekly)',
      'Real-time order notifications',
      'Priority support (chat + phone)'
    ],
    cta: 'Upgrade to Professional',
    popular: true,
    signupLink: '/signup?plan=professional'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    description: 'Premium solution with multi-location management',
    features: [
      'Everything in Professional',
      'Multi-location management',
      'Advanced analytics & reporting',
      'Role-based access control (manager vs staff)',
      'API access & webhooks (custom integrations)',
      'Advanced POS features',
      'Dedicated account manager + 24/7 support'
    ],
    cta: 'Talk to Sales',
    popular: false,
    signupLink: '/contact'
  }
]

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8E1F5] via-white to-white">
      <PublicNavbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Pricing built to launch and scale your business online
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that matches your operations today and upgrade as your business grows.
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border border-[#C8E1F5] shadow-lg transition-transform hover:-translate-y-3 ${plan.popular ? 'ring-2 ring-[#3B82F6] scale-105' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute left-1/2 top-0 -translate-y-1/2 -translate-x-1/2 bg-[#3B82F6] text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline justify-center space-x-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 text-base">/month</span>
                  </div>
                  <CardDescription className="mt-2 text-gray-600">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 h-5 w-5 text-[#3B82F6]" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to={plan.signupLink}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl rounded-3xl bg-white/70 px-8 py-10 shadow-lg backdrop-blur">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-semibold text-gray-900">Not sure which plan fits?</h2>
            <p className="mt-3 text-gray-600">
              Our team can help you map your current workflows and recommend the package that delivers the fastest ROI.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start Free Trial
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PricingPage
