# BistroBytes SaaS Landing Page

A modern, professional SaaS landing page for BistroBytes - the AI-powered restaurant ordering platform. Built with React, Vite, and Tailwind CSS, inspired by enterprise SaaS design patterns.

## 🚀 Features

### **Landing Page**
- **Hero Section** with compelling value proposition
- **Features Showcase** highlighting AI voice ordering and POS integration
- **Pricing Tiers** with monthly/annual billing toggle
- **Customer Testimonials** for social proof
- **Professional Footer** with contact information

### **Multi-Step Signup Form**
- **Step 1**: Restaurant Information (name, type, cuisine, description)
- **Step 2**: Contact & Address Details
- **Step 3**: Business Settings (hours, POS integration, fees)
- **Step 4**: Plan Selection & Branding Customization
- **Step 5**: Success Confirmation

### **Design System**
- **shadcn/ui** components for consistent design
- **Tailwind CSS** for responsive styling
- **RevyOps-inspired** modern enterprise aesthetic
- **Smooth animations** and hover effects

## 🏗️ Technology Stack

- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for professional UI components
- **React Router** for navigation
- **React Hook Form** for form management
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Lucide React** for modern icons

## 🎯 SaaS Integration

The signup form captures comprehensive business data for automated tenant provisioning:

### **Data Captured**
- Restaurant branding and business information
- Contact details and physical address
- Operating hours and business configuration
- POS system integration preferences
- Pricing plan selection and billing preferences
- Custom theme colors and branding

### **Backend Integration**
- Sends complete tenant configuration to `/api/saas/provision-tenant`
- Triggers automated restaurant website creation
- Provisions tenant-specific database schemas
- Deploys customized frontend builds
- Sets up POS integrations and payment processing

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/bistrobytes-saas.git
cd bistrobytes-saas

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Development**
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📁 Project Structure

```
bistrobytes-saas/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── pages/
│   │   ├── LandingPage.jsx    # Main landing page
│   │   └── SignupPage.jsx     # Multi-step signup form
│   ├── lib/
│   │   └── utils.js     # Utility functions
│   └── App.jsx          # Main application component
├── public/              # Static assets
└── package.json
```

## 🎨 Design Philosophy

Inspired by **RevyOps.com** and modern enterprise SaaS platforms:
- Clean, professional typography
- Subtle gradients and modern color schemes
- Card-based layouts with elegant hover effects
- Responsive design for all device sizes
- Accessible form design with proper validation

## 🔧 Configuration

### **API Integration**
The signup form sends data to the backend API endpoint:
```javascript
POST /api/saas/provision-tenant
```

### **Environment Variables**
Create `.env.local` for local development:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_ENVIRONMENT=development
```

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **Deploy to Vercel**
```bash
vercel --prod
```

### **Deploy to Netlify**
```bash
netlify deploy --prod --dir=dist
```

## 📊 Features by Pricing Tier

### **Starter ($49/month)**
- Online ordering system
- Basic customization
- Clover/Square integration
- Up to 500 orders/month

### **Professional ($149/month)**
- Everything in Starter
- Customer loyalty program
- Advanced payment options
- Real-time analytics
- Up to 2,000 orders/month

### **Enterprise ($399/month)**
- Everything in Professional
- 🎤 AI Voice Ordering (OpenAI Realtime API)
- White-label solution
- Custom integrations
- Unlimited orders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [BistroBytes Backend](https://github.com/YOUR_USERNAME/bistro-template-backend) - Multi-tenant backend API
- [BistroBytes Frontend Template](https://github.com/YOUR_USERNAME/bistro-template) - Restaurant ordering application

## 📞 Support

For support and questions:
- Email: hello@bistrobytes.app
- Documentation: [docs.bistrobytes.app](https://docs.bistrobytes.app)

---

**Built with ❤️ for restaurant owners who want to embrace the future of digital ordering**
