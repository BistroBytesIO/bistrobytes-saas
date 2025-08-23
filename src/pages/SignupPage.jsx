import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { ArrowLeft, Check, AlertCircle, Loader2, Info } from 'lucide-react'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Tooltip } from '../components/ui/tooltip'
import { Skeleton } from '../components/ui/skeleton'
import toast from 'react-hot-toast'
import api from '../lib/api'

const SignupPage = () => {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const navigate = useNavigate()
  
  const { register, handleSubmit, control, watch, formState: { errors }, trigger } = useForm({
    defaultValues: {
      // Business Information
      restaurantName: '',
      businessType: 'restaurant',
      cuisine: '',
      description: '',
      
      // Contact Information
      ownerName: '',
      email: '',
      phone: '',
      
      // Address Information
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      
      // Business Hours (simplified for now)
      openTime: '09:00',
      closeTime: '21:00',
      timezone: 'America/New_York',
      
      // Business Configuration
      currency: 'USD',
      taxRate: '8.875',
      serviceFeeName: 'Service Fee',
      serviceFeeRate: '3',
      minimumOrder: '10.00',
      
      // Branding & Customization
      primaryColor: '#4F46E5',
      secondaryColor: '#F59E0B',
      logoUrl: '',
      websiteUrl: '',
      
      // Features & Plan
      plan: 'professional',
      billingCycle: 'monthly',
      
      // POS Integration
      posSystem: '',
      hasExistingPOS: 'no',
      
      // Marketing
      howDidYouHear: '',
      marketingEmails: true
    }
  })

  const businessTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'food_truck', label: 'Food Truck' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'bar', label: 'Bar/Pub' },
    { value: 'pizza', label: 'Pizza Shop' },
    { value: 'fast_food', label: 'Fast Food' },
    { value: 'fine_dining', label: 'Fine Dining' }
  ]

  const cuisineTypes = [
    'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'French',
    'Mediterranean', 'Greek', 'Korean', 'Vietnamese', 'Brazilian', 'Turkish', 'Fusion', 'Other'
  ]

  const posOptions = [
    { value: 'clover', label: 'Clover' },
    { value: 'square', label: 'Square' },
    { value: 'toast', label: 'Toast' },
    { value: 'resy', label: 'Resy' },
    { value: 'other', label: 'Other' },
    { value: 'none', label: 'No POS System' }
  ]

  // Hardcoded features for each plan
  const planFeatures = {
    starter: ['Up to 500 orders/month', 'Basic customization', 'Email support', 'Online ordering', 'Basic analytics'],
    professional: ['Up to 2,000 orders/month', 'Loyalty program', 'Priority support', 'Advanced analytics', 'Custom branding', 'POS integrations'],
    enterprise: ['Unlimited orders', 'AI voice ordering', '24/7 support', 'White-label options', 'Custom integrations', 'Dedicated account manager']
  }

  // Fetch subscription plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true)
        const response = await api.get('/subscriptions/plans')
        const plans = response.data.map(plan => ({
          id: plan.planId,
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          description: plan.description,
          features: planFeatures[plan.planId] || [],
          popular: plan.popular
        }))
        setSubscriptionPlans(plans)
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error)
        toast.error('Failed to load subscription plans')
      } finally {
        setPlansLoading(false)
      }
    }
    
    fetchPlans()
  }, [])

  const nextStep = async () => {
    const isValid = await trigger()
    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleStripeCheckout = async (data) => {
    setIsLoading(true)
    
    try {
      // Generate tenant slug from restaurant name
      const tenantSlug = data.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')

      // Create flat tenant configuration for Stripe metadata
      const tenantConfig = {
        // Basic tenant info (flat structure as expected by backend)
        tenantSlug: tenantSlug,
        tenantName: data.restaurantName,
        domain: data.websiteUrl || `${tenantSlug}.bistrobytes.app`,
        
        // Business information (flat fields)
        businessType: data.businessType,
        cuisine: data.cuisine,
        description: data.description,
        
        // Contact information (flat fields)
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        
        // Address information (flat fields)
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        
        // Business settings (flat fields)
        openTime: data.openTime,
        closeTime: data.closeTime,
        timezone: data.timezone,
        currency: data.currency,
        taxRate: parseFloat(data.taxRate) || 8.875,
        serviceFeeName: data.serviceFeeName,
        serviceFeeRate: parseFloat(data.serviceFeeRate) || 3.0,
        minimumOrderAmount: parseFloat(data.minimumOrder) || 10.0,
        
        // Branding (flat fields)
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        logoUrl: data.logoUrl,
        
        // Plan (flat field)
        plan: data.plan,
        billingCycle: data.billingCycle,
        
        // POS Integration (flat fields)
        posSystem: data.posSystem,
        hasExistingPOS: data.hasExistingPOS === 'yes',
        
        // Marketing (flat fields)
        howDidYouHear: data.howDidYouHear,
        marketingEmails: data.marketingEmails
      }

      // Create Stripe checkout session
      const response = await api.post('/subscriptions/create-checkout-session', {
        planId: data.plan,
        billingCycle: data.billingCycle,
        email: data.email,
        tenantData: tenantConfig
      })
      
      if (response.data.success) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error(response.data.error || 'Failed to create checkout session')
      }
      
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.response?.data?.error || 'Failed to create checkout session. Please try again.')
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // Just go to payment step, don't provision yet
    setStep(5)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your restaurant</h2>
              <p className="text-gray-600">Let's start with the basics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Restaurant Name *</Label>
                <Input
                  {...register('restaurantName', { required: 'Restaurant name is required' })}
                  placeholder="Pizza Palace"
                  className={errors.restaurantName ? 'border-red-500' : ''}
                />
                {errors.restaurantName && (
                  <p className="text-red-500 text-sm mt-1">{errors.restaurantName.message}</p>
                )}
              </div>
              
              <div>
                <Label className="mb-1 block">Business Type *</Label>
                <Select
                  {...register('businessType', { required: 'Business type is required' })}
                  className=""
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Label className="mb-1 block">Cuisine Type</Label>
                <Select
                  {...register('cuisine')}
                  className=""
                >
                  <option value="">Select cuisine...</option>
                  {cuisineTypes.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Label className="mb-1 block">Website URL (optional)</Label>
                <Input
                  {...register('websiteUrl')}
                  placeholder="https://pizzapalace.com"
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-1 block">Description</Label>
              <textarea
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Tell customers about your restaurant..."
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
              <p className="text-gray-600">How can customers reach you?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Owner/Manager Name *</Label>
                <Input
                  {...register('ownerName', { required: 'Owner name is required' })}
                  placeholder="John Smith"
                  className={errors.ownerName ? 'border-red-500' : ''}
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.ownerName.message}</p>
                )}
              </div>
              
              <div>
                <Label className="mb-1 block">Email Address *</Label>
                <Input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="john@pizzapalace.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label className="mb-1 block">Phone Number *</Label>
                <Input
                  {...register('phone', { required: 'Phone number is required' })}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Address</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="mb-1 block">Street Address *</Label>
                  <Input
                    {...register('address', { required: 'Address is required' })}
                    placeholder="123 Main Street"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-1 block">City *</Label>
                    <Input
                      {...register('city', { required: 'City is required' })}
                      placeholder="New York"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-1 block">State *</Label>
                    <Input
                      {...register('state', { required: 'State is required' })}
                      placeholder="NY"
                      className={errors.state ? 'border-red-500' : ''}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-1 block">ZIP Code *</Label>
                    <Input
                      {...register('zipCode', { required: 'ZIP code is required' })}
                      placeholder="10001"
                      className={errors.zipCode ? 'border-red-500' : ''}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-1 block">Country</Label>
                    <Select
                      {...register('country')}
                      className=""
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Settings</h2>
              <p className="text-gray-600">Configure your restaurant operations</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Opening Time</Label>
                <Input
                  type="time"
                  {...register('openTime')}
                />
              </div>
              
              <div>
                <Label className="mb-1 block">Closing Time</Label>
                <Input
                  type="time"
                  {...register('closeTime')}
                />
              </div>
              
              <div>
                <Label className="mb-1 block">Timezone</Label>
                <Select
                  {...register('timezone')}
                  className=""
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </Select>
              </div>
              
              <div>
                <Label className="mb-1 block">Currency</Label>
                <Select
                  {...register('currency')}
                  className=""
                >
                  <option value="USD">USD ($)</option>
                  <option value="CAD">CAD ($)</option>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label className="mb-1 block">Tax Rate (%)</Label>
                  <Tooltip content="Typical restaurant sales tax e.g. 8.875% in NYC">
                    <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  step="0.001"
                  {...register('taxRate')}
                  placeholder="8.875"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label className="mb-1 block">Service Fee Rate (%)</Label>
                  <Tooltip content="Optional service fee for online orders">
                    <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  {...register('serviceFeeRate')}
                  placeholder="3"
                />
              </div>
              
              <div>
                <Label className="mb-1 block">Minimum Order Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('minimumOrder')}
                  placeholder="10.00"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">POS Integration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Do you have an existing POS system?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('hasExistingPOS')}
                        value="yes"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('hasExistingPOS')}
                        value="no"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                
                {watch('hasExistingPOS') === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Which POS system?</label>
                    <select
                      {...register('posSystem')}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select POS system...</option>
                      {posOptions.map(pos => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">Select the plan that fits your needs</p>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={watch('billingCycle') === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                Monthly
              </span>
              <Controller
                name="billingCycle"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(field.value === 'monthly' ? 'annual' : 'monthly')}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        field.value === 'annual' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              />
              <span className={watch('billingCycle') === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                Annual
                <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Save 15%
                </span>
              </span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {plansLoading ? (
                <div className="col-span-3 text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading subscription plans...</p>
                </div>
              ) : (
                subscriptionPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all ${
                    watch('plan') === plan.id 
                      ? 'ring-2 ring-blue-600 shadow-lg' 
                      : 'hover:shadow-md'
                  } ${plan.popular ? 'scale-105' : ''}`}
                  onClick={() => register('plan').onChange({ target: { value: plan.id } })}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold">
                        ${watch('billingCycle') === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                      </span>
                      <span className="text-gray-500 ml-1">
                        /{watch('billingCycle') === 'monthly' ? 'mo' : 'year'}
                      </span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
            
            {/* Hidden input for plan selection */}
            <input type="hidden" {...register('plan')} />
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Brand Color</label>
                    <Input
                      type="color"
                      {...register('primaryColor')}
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <Input
                      type="color"
                      {...register('secondaryColor')}
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                <select
                  {...register('howDidYouHear')}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="google">Google Search</option>
                  <option value="social">Social Media</option>
                  <option value="referral">Referral</option>
                  <option value="ad">Advertisement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('marketingEmails')}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">
                  I'd like to receive marketing emails about new features and updates
                </label>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment & Account Setup</h2>
              <p className="text-gray-600">Complete your payment to create your restaurant website</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plan: {watch('plan')} ({watch('billingCycle')})</span>
                  <span className="font-medium">
                    ${watch('billingCycle') === 'monthly' 
                      ? subscriptionPlans.find(p => p.id === watch('plan'))?.monthlyPrice 
                      : subscriptionPlans.find(p => p.id === watch('plan'))?.annualPrice
                    }
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    ${watch('billingCycle') === 'monthly' 
                      ? subscriptionPlans.find(p => p.id === watch('plan'))?.monthlyPrice 
                      : subscriptionPlans.find(p => p.id === watch('plan'))?.annualPrice
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
              {/* Plans loading state (visual only) */}
              {plansLoading && (
                <div className="mb-3">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              )}
              <Alert variant="info" className="flex items-start gap-3">
                <div>
                  <AlertTitle>Secure checkout via Stripe</AlertTitle>
                  <AlertDescription>You'll be redirected to Stripe to complete your subscription. After payment, you will return here while we provision your tenant.</AlertDescription>
                </div>
              </Alert>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-4">Payment integration would go here</p>
                <Button
                  type="button"
                  onClick={() => handleStripeCheckout(watch())}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    'Subscribe & Create Restaurant'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BistroBytes!</h2>
              <p className="text-gray-600">
                Your restaurant website is being created. You'll receive an email with login details shortly.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Your website will be ready in 2-3 minutes</li>
                <li>• We'll send setup instructions to your email</li>
                <li>• You can connect your POS system with one click</li>
                <li>• Start taking orders immediately!</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BistroBytes
                </span>
              </div>
            </Link>
            {step < 6 && (
              <div className="text-sm text-gray-500">
                Step {step} of 5
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {step < 6 && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(step / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {renderStep()}
              
              {/* Navigation Buttons */}
              {step < 6 && (
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1}
                  >
                    Previous
                  </Button>
                  
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                    >
                      Next
                    </Button>
                  ) : step === 4 ? (
                    <Button
                      type="submit"
                      className="min-w-[140px]"
                    >
                      Review & Payment
                    </Button>
                  ) : null}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SignupPage
