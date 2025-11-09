import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlatformTrustBadges } from '@/components/trust-badges'
import { 
  CheckCircle, 
  Shield, 
  Users, 
  Zap, 
  Star,
  Clock,
  MapPin,
  Wrench,
  Lightbulb,
  Home,
  Car,
  Sparkles
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">Helparo</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link href="#trust" className="text-sm font-medium hover:text-primary transition-colors">
              Trust & Safety
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center rounded-full border bg-white px-4 py-1.5 w-fit">
                <Shield className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Verified & Trusted Service Professionals</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your Trusted
                <span className="text-primary"> Service Marketplace</span>
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Connect with verified professionals for all your service needs. 
                From plumbing to cleaning, get quality work done with instant payments and maximum trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" asChild>
                  <Link href="/auth/signup?role=customer">
                    Find a Helper
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/auth/signup?role=helper">
                    Become a Helper
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">Verified Helpers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Services Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.8★</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative h-[500px] w-full rounded-2xl bg-gradient-to-br from-primary to-secondary p-1">
                <div className="h-full w-full rounded-xl bg-white p-8 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <ServiceCard icon={Wrench} title="Plumbing" />
                    <ServiceCard icon={Lightbulb} title="Electrical" />
                    <ServiceCard icon={Home} title="Cleaning" />
                    <ServiceCard icon={Car} title="Auto Repair" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl mb-4">
              Why Choose Helparo?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the perfect blend of quality, trust, and convenience
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={Shield}
              title="100% Verified Helpers"
              description="Every helper undergoes strict verification and background checks before joining our platform."
            />
            <FeatureCard 
              icon={Zap}
              title="Instant Payments"
              description="Helpers receive payments instantly after service completion. Fair 12% commission."
            />
            <FeatureCard 
              icon={MapPin}
              title="Location-Based Matching"
              description="Get connected with the nearest available helpers for faster service."
            />
            <FeatureCard 
              icon={Clock}
              title="Emergency Services"
              description="24/7 availability for urgent needs like highway breakdowns and emergency repairs."
            />
            <FeatureCard 
              icon={Star}
              title="Quality Guaranteed"
              description="Read reviews, check ratings, and choose the best helper for your specific needs."
            />
            <FeatureCard 
              icon={Users}
              title="Transparent Pricing"
              description="Know exactly what you'll pay before booking. No hidden charges, ever."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-primary-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard 
              number="1"
              title="Search Service"
              description="Browse through our service categories and find exactly what you need."
            />
            <StepCard 
              number="2"
              title="Choose Helper"
              description="View profiles, ratings, and prices. Select the best helper for your needs."
            />
            <StepCard 
              number="3"
              title="Get It Done"
              description="Schedule the service, track progress, and pay securely after completion."
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl mb-4">
              Popular Services
            </h2>
            <p className="text-lg text-muted-foreground">
              Whatever you need, we've got you covered
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair', 'Appliance Repair', 'Car Service'].map((service) => (
              <div key={service} className="group relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg transition-all cursor-pointer">
                <h3 className="text-xl font-semibold mb-2">{service}</h3>
                <p className="text-sm text-muted-foreground">Professional {service.toLowerCase()} services at your doorstep</p>
                <div className="mt-4 text-primary font-medium group-hover:translate-x-1 transition-transform">
                  Book Now →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section id="trust" className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl mb-6">
            Your Safety is Our Priority
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-primary-100">
            All helpers are verified with government IDs, background checks, and skill certifications. 
            Track service progress in real-time with built-in SOS features for emergencies.
          </p>
          
          {/* Trust Badges */}
          <div className="max-w-4xl mx-auto my-12">
            <PlatformTrustBadges />
          </div>

          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/signup">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">Helparo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted service marketplace connecting customers with verified professionals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Customers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Find Services</Link></li>
                <li><Link href="#" className="hover:text-primary">How It Works</Link></li>
                <li><Link href="#" className="hover:text-primary">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Helpers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/signup?role=helper" className="hover:text-primary">Become a Helper</Link></li>
                <li><Link href="#" className="hover:text-primary">Earnings</Link></li>
                <li><Link href="#" className="hover:text-primary">Requirements</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms & Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Helparo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors">
      <Icon className="h-12 w-12 text-primary mb-2" />
      <span className="font-semibold">{title}</span>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-start p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
