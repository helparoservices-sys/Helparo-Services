'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PlatformTrustBadges } from '@/components/trust-badges'
import { SmoothScrollLink } from '@/components/smooth-scroll-link'
import { FadeInSection, StaggerChildren, StaggerItem } from '@/components/fade-in-section'
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
  ArrowRight,
  BadgeCheck,
  FileText
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-trust-light">
      {/* Header - Glassmorphism with Guardian Teal */}
      <header className="sticky top-0 z-50 w-full border-b border-guardianTeal/10 glass-card">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl p-1 bg-gradient-to-br from-guardianTeal to-aquaGlow">
              <Image src="/logo.jpg" alt="Helparo" width={48} height={48} className="object-contain rounded-xl" />
            </div>
            <span className="text-2xl font-black text-gradient-teal">Helparo</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <SmoothScrollLink href="#features" className="text-sm font-semibold text-deepNavy hover:text-guardianTeal transition-colors">
              Features
            </SmoothScrollLink>
            <SmoothScrollLink href="#how-it-works" className="text-sm font-semibold text-deepNavy hover:text-guardianTeal transition-colors">
              How It Works
            </SmoothScrollLink>
            <SmoothScrollLink href="#services" className="text-sm font-semibold text-deepNavy hover:text-guardianTeal transition-colors">
              Services
            </SmoothScrollLink>
            <SmoothScrollLink href="#trust" className="text-sm font-semibold text-deepNavy hover:text-guardianTeal transition-colors">
              Safety
            </SmoothScrollLink>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-semibold text-deepNavy hover:text-guardianTeal" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button className="btn-accent-glow" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Guardian Teal Gradient */}
      <section className="relative overflow-hidden gradient-navy-teal py-24 md:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-aquaGlow rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-guardianTeal rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-96 h-96 bg-aquaGlow/50 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col gap-8 animate-fadeInUp">
              <div className="inline-flex items-center rounded-full glass-card px-5 py-2 w-fit shadow-glow-sm">
                <BadgeCheck className="mr-2 h-5 w-5 text-aquaGlow" />
                <span className="text-sm font-bold text-white">100% Verified Professionals</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight">
                <span className="text-white">
                  Get Trusted Help
                </span>
                <br />
                <span className="text-gradient-teal bg-gradient-to-r from-aquaGlow to-white bg-clip-text text-transparent">
                  in Minutes
                </span>
              </h1>
              <p className="text-xl text-white/90 md:text-2xl font-medium leading-relaxed">
                Connect with expert helpers instantly. From plumbing to cleaning—get it done right, get it done now. 💫
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="btn-accent-glow text-lg px-8 py-6 rounded-2xl" asChild>
                  <Link href="/auth/signup?role=customer">
                    Find Helpers <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" className="btn-outline-teal bg-white/10 border-white text-white hover:bg-white hover:text-deepNavy text-lg px-8 py-6 rounded-2xl backdrop-blur-sm" asChild>
                  <Link href="/auth/signup?role=helper">
                    Earn as Helper
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-10 pt-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-aquaGlow">10K+</div>
                  <div className="text-sm text-white/80 font-semibold">Helpers</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-aquaGlow">50K+</div>
                  <div className="text-sm text-white/80 font-semibold">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-aquaGlow">4.8★</div>
                  <div className="text-sm text-white/80 font-semibold">Rating</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative h-[600px] w-full">
                {/* Floating Cards */}
                <div className="absolute top-0 left-0 right-0 bottom-0">
                  <div className="absolute top-0 left-0 transform hover:scale-110 transition-transform duration-300">
                    <FloatingServiceCard icon={Wrench} title="Plumbing" color="teal" />
                  </div>
                  <div className="absolute top-0 right-0 transform hover:scale-110 transition-transform duration-300">
                    <FloatingServiceCard icon={Lightbulb} title="Electrical" color="glow" />
                  </div>
                  <div className="absolute bottom-0 left-0 transform hover:scale-110 transition-transform duration-300">
                    <FloatingServiceCard icon={Home} title="Cleaning" color="navy" />
                  </div>
                  <div className="absolute bottom-0 right-0 transform hover:scale-110 transition-transform duration-300">
                    <FloatingServiceCard icon={Car} title="Auto Fix" color="teal" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-glow">
                    <div className="w-32 h-32 rounded-full gradient-teal flex items-center justify-center shadow-glow-lg p-4">
                      <Image src="/logo.jpg" alt="Helparo" width={96} height={96} className="object-contain rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Guardian Teal Theme */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-5xl font-black sm:text-6xl mb-6">
              <span className="text-gradient-teal">
                Why Helparo?
              </span>
            </h2>
            <p className="text-xl text-deepNavy/70 max-w-2xl mx-auto font-medium">
              We&apos;re not just another marketplace—we&apos;re your trusted partner
            </p>
          </FadeInSection>
          <StaggerChildren className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <StaggerItem>
              <ModernFeatureCard 
                icon={Shield}
                title="Verified Pros"
                description="Background checks, ID verification, and skill assessments for every helper."
                gradient="from-guardianTeal to-guardianTeal/80"
              />
            </StaggerItem>
            <StaggerItem>
              <ModernFeatureCard 
                icon={Zap}
                title="Instant Pays"
                description="Helpers get paid immediately. Just 12% commission. Fair and transparent."
                gradient="from-aquaGlow to-aquaGlow/80"
              />
            </StaggerItem>
            <StaggerItem>
              <ModernFeatureCard 
                icon={MapPin}
                title="Near You"
                description="GPS-powered matching finds the closest available helpers in seconds."
                gradient="from-guardianTeal/70 to-aquaGlow/70"
              />
            </StaggerItem>
            <StaggerItem>
              <ModernFeatureCard 
                icon={Clock}
                title="24/7 Ready"
                description="Emergency services available round the clock. We've got your back."
                gradient="from-deepNavy to-guardianTeal"
              />
            </StaggerItem>
            <StaggerItem>
              <ModernFeatureCard 
                icon={Star}
                title="Top Rated"
                description="Real reviews from real customers. Quality you can trust every time."
                gradient="from-aquaGlow to-guardianTeal"
              />
            </StaggerItem>
            <StaggerItem>
              <ModernFeatureCard 
                icon={Users}
                title="No Surprises"
                description="See prices upfront. No hidden fees. Pay what you see. That's it."
                gradient="from-guardianTeal to-deepNavy"
              />
            </StaggerItem>
          </StaggerChildren>
        </div>
      </section>

      {/* How It Works - Guardian Teal Timeline */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-guardianTeal/5 to-aquaGlow/5">
        <div className="container mx-auto px-6">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-5xl font-black sm:text-6xl mb-6">
              <span className="text-deepNavy">Simple. Fast. </span>
              <span className="text-gradient-teal">Done.</span>
            </h2>
            <p className="text-xl text-deepNavy/70 font-medium">
              Three steps to your perfect service
            </p>
          </FadeInSection>
          <StaggerChildren className="max-w-5xl mx-auto grid gap-12 md:grid-cols-3 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 gradient-teal"></div>
            
            <StaggerItem>
              <ModernStepCard 
                number="1"
                title="Post Request"
                description="Tell us what you need. Pick your service. Set your budget. Takes 60 seconds."
                icon={FileText}
              />
            </StaggerItem>
            <StaggerItem>
              <ModernStepCard 
                number="2"
                title="Match & Choose"
                description="Get instant bids from verified helpers nearby. Compare. Pick the best."
                icon={Users}
              />
            </StaggerItem>
            <StaggerItem>
              <ModernStepCard 
                number="3"
                title="Pay & Done"
                description="Service completed? Rate and pay. Money released instantly. Simple."
                icon={CheckCircle}
              />
            </StaggerItem>
          </StaggerChildren>
        </div>
      </section>

      {/* Services Section - Modern Grid */}
      <section id="services" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-5xl font-black sm:text-6xl mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                Popular Services
              </span>
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Whatever you need, we deliver
            </p>
          </FadeInSection>
          <StaggerChildren className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Plumbing', icon: '🔧', color: 'from-blue-500 to-cyan-500' },
              { name: 'Electrical', icon: '💡', color: 'from-yellow-500 to-orange-500' },
              { name: 'Cleaning', icon: '✨', color: 'from-teal-500 to-green-500' },
              { name: 'Carpentry', icon: '🔨', color: 'from-purple-500 to-pink-500' },
              { name: 'Painting', icon: '🎨', color: 'from-red-500 to-rose-500' },
              { name: 'AC Repair', icon: '❄️', color: 'from-cyan-500 to-blue-500' },
              { name: 'Appliances', icon: '🔌', color: 'from-indigo-500 to-purple-500' },
              { name: 'Car Service', icon: '🚗', color: 'from-gray-700 to-gray-900' }
            ].map((service) => (
              <StaggerItem key={service.name}>
                <div className="group relative overflow-hidden rounded-3xl border-2 border-gray-100 bg-white p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <div className="relative z-10">
                    <div className="text-5xl mb-4">{service.icon}</div>
                    <h3 className="text-2xl font-black mb-2 text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 font-medium mb-4">Professional service at your doorstep</p>
                    <div className={`inline-flex items-center text-sm font-bold bg-gradient-to-r ${service.color} bg-clip-text text-transparent group-hover:translate-x-2 transition-transform`}>
                      Book Now <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Trust & Safety - Bold CTA */}
      <section id="trust" className="py-32 bg-gradient-to-br from-purple-600 via-purple-700 to-teal-600 text-white relative overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        
        <FadeInSection className="container mx-auto px-6 text-center relative z-10">
          <div className="w-24 h-24 mx-auto mb-8 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <Shield className="h-14 w-14 text-white" />
          </div>
          <h2 className="text-5xl font-black sm:text-6xl md:text-7xl mb-8">
            Safety First.<br />Always.
          </h2>
          <p className="text-2xl max-w-3xl mx-auto mb-12 text-purple-100 font-medium leading-relaxed">
            Every helper verified with government IDs. Background checked. Skill certified. 
            Plus real-time tracking and SOS features. Your safety isn&apos;t optional—it&apos;s guaranteed.
          </p>
          
          {/* Trust Badges */}
          <div className="max-w-4xl mx-auto my-16">
            <PlatformTrustBadges />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 font-black text-xl px-12 py-7 rounded-2xl shadow-2xl" asChild>
              <Link href="/auth/signup">Start Now <ArrowRight className="ml-2 h-6 w-6" /></Link>
            </Button>
            <SmoothScrollLink href="#features">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-bold text-xl px-12 py-7 rounded-2xl">
                Learn More
              </Button>
            </SmoothScrollLink>
          </div>
        </FadeInSection>
      </section>

      {/* Footer - Clean & Modern */}
      <footer className="border-t border-gray-200 bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl p-1">
                  <Image src="/logo.jpg" alt="Helparo" width={48} height={48} className="object-contain" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Helparo</span>
              </div>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Your trusted service marketplace connecting customers with verified professionals across India.
              </p>
            </div>
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-lg">For Customers</h3>
              <ul className="space-y-3 text-sm text-gray-600 font-medium">
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Find Services</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-lg">For Helpers</h3>
              <ul className="space-y-3 text-sm text-gray-600 font-medium">
                <li><Link href="/auth/signup?role=helper" className="hover:text-purple-600 transition-colors">Become a Helper</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Earnings</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Requirements</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-lg">Company</h3>
              <ul className="space-y-3 text-sm text-gray-600 font-medium">
                <li><Link href="#" className="hover:text-purple-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Terms & Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 font-medium">© {new Date().getFullYear()} Helparo. All rights reserved. Made with 💜 in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Modern Floating Service Card with Guardian Teal
function FloatingServiceCard({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'from-guardianTeal to-guardianTeal/80',
    glow: 'from-aquaGlow to-aquaGlow/80',
    navy: 'from-deepNavy to-deepNavy/80',
  }
  
  return (
    <div className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${colorMap[color]} p-1 shadow-glow animate-float`}>
      <div className="h-full w-full rounded-3xl bg-white flex flex-col items-center justify-center gap-2 card-hover-lift">
        <Icon className="h-12 w-12 text-deepNavy" />
        <span className="font-black text-deepNavy">{title}</span>
      </div>
    </div>
  )
}

// Modern Feature Card with Guardian Teal Gradient Border
function ModernFeatureCard({ icon: Icon, title, description, gradient }: { icon: React.ElementType; title: string; description: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white border-2 border-guardianTeal/10 p-8 card-hover-lift hover:border-guardianTeal/30 transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white mb-6 shadow-card group-hover:shadow-strong transition-shadow duration-300`}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-black mb-3 text-deepNavy">{title}</h3>
        <p className="text-deepNavy/70 font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// Modern Step Card with Guardian Teal Theme
function ModernStepCard({ number, title, description, icon: Icon }: { number: string; title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full gradient-teal text-white text-3xl font-black mb-6 shadow-glow animate-pulse">
        {number}
      </div>
      <div className="w-16 h-16 rounded-full bg-white border-4 border-guardianTeal/20 flex items-center justify-center mb-6 -mt-14 relative z-0 group-hover:border-guardianTeal/40 transition-colors duration-300">
        <Icon className="h-7 w-7 text-guardianTeal" />
      </div>
      <h3 className="text-2xl font-black mb-3 text-deepNavy">{title}</h3>
      <p className="text-deepNavy/70 font-medium leading-relaxed">{description}</p>
    </div>
  )
}
