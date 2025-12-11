'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Rocket,
  Heart,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  Users,
  Coffee,
  Gamepad2,
  Gift,
  Plane,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  Briefcase,
  Code,
  Palette,
  Megaphone,
  HeadphonesIcon,
  TrendingUp,
  Building2,
  Star,
  PartyPopper,
  Target,
  Lightbulb,
  Shield,
  IndianRupee
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isVisible, end, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function CareersPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const perks = [
    { icon: IndianRupee, title: 'Competitive Salary', desc: 'Top-of-market pay + equity options', color: 'from-emerald-500 to-teal-500' },
    { icon: Plane, title: 'Unlimited PTO', desc: 'Take time off when you need it', color: 'from-blue-500 to-cyan-500' },
    { icon: Coffee, title: 'Free Meals & Snacks', desc: 'Breakfast, lunch & endless chai ☕', color: 'from-amber-500 to-orange-500' },
    { icon: GraduationCap, title: 'Learning Budget', desc: '₹50,000/year for courses & books', color: 'from-violet-500 to-purple-600' },
    { icon: Heart, title: 'Health Insurance', desc: 'Full coverage for you + family', color: 'from-rose-500 to-pink-500' },
    { icon: Gamepad2, title: 'Fun Fridays', desc: 'Games, movies & team activities', color: 'from-indigo-500 to-blue-600' },
    { icon: Gift, title: 'Festival Bonuses', desc: 'Extra love during celebrations', color: 'from-red-500 to-orange-500' },
    { icon: Building2, title: 'Hybrid Work', desc: 'Work from home 3 days/week', color: 'from-gray-600 to-gray-800' },
  ]

  const values = [
    { 
      icon: Rocket, 
      title: 'Move Fast', 
      desc: 'We ship quickly, learn fast, and iterate. Perfect is the enemy of good.', 
      emoji: '🚀',
      color: 'from-orange-500 to-red-500' 
    },
    { 
      icon: Heart, 
      title: 'Customer Obsessed', 
      desc: 'Every decision starts with "How does this help our customers?"', 
      emoji: '❤️',
      color: 'from-pink-500 to-rose-500' 
    },
    { 
      icon: Users, 
      title: 'One Team', 
      desc: 'No egos, no politics. We win together and lose together.', 
      emoji: '🤝',
      color: 'from-blue-500 to-indigo-500' 
    },
    { 
      icon: Lightbulb, 
      title: 'Think Big', 
      desc: 'We\'re building for 100 million users. Dream big or go home.', 
      emoji: '💡',
      color: 'from-amber-500 to-yellow-500' 
    },
  ]

  const departments = [
    { id: 'all', name: 'All Roles', count: 12 },
    { id: 'engineering', name: 'Engineering', count: 5, icon: Code },
    { id: 'design', name: 'Design', count: 2, icon: Palette },
    { id: 'marketing', name: 'Marketing', count: 2, icon: Megaphone },
    { id: 'operations', name: 'Operations', count: 2, icon: TrendingUp },
    { id: 'support', name: 'Support', count: 1, icon: HeadphonesIcon },
  ]

  const openPositions = [
    {
      id: 1,
      title: 'Senior Full Stack Developer',
      department: 'engineering',
      location: 'Bangalore / Remote',
      type: 'Full-time',
      experience: '4-7 years',
      salary: '₹25-40 LPA',
      hot: true,
      description: 'Build the future of home services with React, Node.js & AI',
    },
    {
      id: 2,
      title: 'React Native Developer',
      department: 'engineering',
      location: 'Bangalore / Remote',
      type: 'Full-time',
      experience: '2-5 years',
      salary: '₹15-25 LPA',
      hot: true,
      description: 'Create beautiful mobile experiences for millions of users',
    },
    {
      id: 3,
      title: 'Backend Engineer (Python)',
      department: 'engineering',
      location: 'Bangalore',
      type: 'Full-time',
      experience: '3-6 years',
      salary: '₹20-35 LPA',
      hot: false,
      description: 'Scale our AI matching algorithms to handle 10x growth',
    },
    {
      id: 4,
      title: 'DevOps Engineer',
      department: 'engineering',
      location: 'Remote',
      type: 'Full-time',
      experience: '3-5 years',
      salary: '₹18-30 LPA',
      hot: false,
      description: 'Keep our platform running smoothly at scale',
    },
    {
      id: 5,
      title: 'ML Engineer',
      department: 'engineering',
      location: 'Bangalore',
      type: 'Full-time',
      experience: '3-6 years',
      salary: '₹25-45 LPA',
      hot: true,
      description: 'Build AI models that power smart pricing & matching',
    },
    {
      id: 6,
      title: 'Product Designer',
      department: 'design',
      location: 'Bangalore / Remote',
      type: 'Full-time',
      experience: '3-5 years',
      salary: '₹15-28 LPA',
      hot: true,
      description: 'Design delightful experiences for our web & mobile apps',
    },
    {
      id: 7,
      title: 'UI/UX Designer',
      department: 'design',
      location: 'Bangalore',
      type: 'Full-time',
      experience: '2-4 years',
      salary: '₹10-18 LPA',
      hot: false,
      description: 'Craft pixel-perfect interfaces that users love',
    },
    {
      id: 8,
      title: 'Growth Marketing Manager',
      department: 'marketing',
      location: 'Bangalore',
      type: 'Full-time',
      experience: '4-7 years',
      salary: '₹18-30 LPA',
      hot: true,
      description: 'Drive user acquisition & retention strategies',
    },
    {
      id: 9,
      title: 'Content Marketing Lead',
      department: 'marketing',
      location: 'Remote',
      type: 'Full-time',
      experience: '3-5 years',
      salary: '₹12-20 LPA',
      hot: false,
      description: 'Tell our story through compelling content',
    },
    {
      id: 10,
      title: 'City Operations Manager',
      department: 'operations',
      location: 'Multiple Cities',
      type: 'Full-time',
      experience: '3-6 years',
      salary: '₹12-22 LPA',
      hot: false,
      description: 'Launch & scale Helparo in new cities',
    },
    {
      id: 11,
      title: 'Supply Operations Lead',
      department: 'operations',
      location: 'Bangalore',
      type: 'Full-time',
      experience: '2-5 years',
      salary: '₹10-18 LPA',
      hot: false,
      description: 'Recruit & manage our network of service professionals',
    },
    {
      id: 12,
      title: 'Customer Support Lead',
      department: 'support',
      location: 'Bangalore',
      type: 'Full-time',
      experience: '2-4 years',
      salary: '₹8-15 LPA',
      hot: false,
      description: 'Build a world-class support team',
    },
  ]

  const filteredPositions = selectedDepartment === 'all' 
    ? openPositions 
    : openPositions.filter(p => p.department === selectedDepartment)

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Senior Engineer',
      tenure: '1.5 years',
      avatar: '👩‍💻',
      quote: 'I\'ve worked at 3 startups before. Helparo has the best engineering culture by far. Zero micro-management, real ownership, and I\'ve grown more here than anywhere else.',
    },
    {
      name: 'Rahul Verma',
      role: 'Product Designer',
      tenure: '8 months',
      avatar: '👨‍🎨',
      quote: 'The autonomy here is unreal. I proposed a complete redesign of our booking flow on day 2, and within a month it was live. Where else does that happen?',
    },
    {
      name: 'Ananya Reddy',
      role: 'Growth Manager',
      tenure: '1 year',
      avatar: '👩‍💼',
      quote: 'The team genuinely cares about work-life balance. I took 3 weeks off for my wedding with zero guilt. Plus the festival bonuses are 🔥',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Glass Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] border-b border-gray-100' 
          : 'bg-white/50 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg">H</span>
              </div>
              <span className="text-xl font-extrabold text-gray-900 hidden sm:block">helparo</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/services" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Services</Link>
              <Link href="/about" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">About</Link>
              <Link href="/careers" className="px-4 py-2 text-[15px] font-semibold text-emerald-600 bg-emerald-50 rounded-xl">Careers</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-5 font-semibold shadow-lg" asChild>
                <a href="#openings">We&apos;re Hiring!</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - EXCITING
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pt-28 lg:pt-36 pb-20 lg:pb-28 bg-gradient-to-b from-violet-50/80 via-pink-50/30 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-200/40 to-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />
        
        {/* Floating Emojis */}
        <div className="absolute top-32 left-10 text-5xl animate-bounce hidden lg:block" style={{ animationDelay: '0s' }}>🚀</div>
        <div className="absolute top-60 right-20 text-4xl animate-bounce hidden lg:block" style={{ animationDelay: '0.3s' }}>💜</div>
        <div className="absolute bottom-40 left-1/4 text-4xl animate-bounce hidden lg:block" style={{ animationDelay: '0.6s' }}>✨</div>
        <div className="absolute top-40 right-1/3 text-3xl animate-bounce hidden lg:block" style={{ animationDelay: '0.9s' }}>🎯</div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Hiring Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-2.5 rounded-full shadow-lg shadow-violet-500/30 mb-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-sm font-bold">We&apos;re Hiring! 12 Open Positions</span>
              <PartyPopper className="w-4 h-4" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Build the Future of
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Home Services</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join India&apos;s fastest-growing home services startup. Work on problems that 
              impact <span className="font-bold text-gray-900">millions of families</span> every day.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
                <p className="text-3xl font-black text-violet-600 mb-1">
                  <AnimatedCounter end={50} suffix="+" />
                </p>
                <p className="text-sm text-gray-500 font-medium">Team Size</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
                <p className="text-3xl font-black text-emerald-600 mb-1">
                  <AnimatedCounter end={12} suffix="" />
                </p>
                <p className="text-sm text-gray-500 font-medium">Open Roles</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
                <p className="text-3xl font-black text-amber-600 mb-1">
                  <AnimatedCounter end={25} suffix="+" />
                </p>
                <p className="text-sm text-gray-500 font-medium">Cities</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
                <p className="text-3xl font-black text-pink-600 mb-1">4.8★</p>
                <p className="text-sm text-gray-500 font-medium">Glassdoor</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl px-10 h-14 text-lg font-bold shadow-xl shadow-violet-500/30 hover:scale-105 transition-all" asChild>
                <a href="#openings">
                  View Open Positions
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-10 h-14 text-lg font-semibold border-2 hover:bg-gray-50" asChild>
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY JOIN US - FUN SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Why Join Helparo?
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Not your typical <span className="text-amber-600">startup</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              We&apos;re building something special, and we want you to be part of it.
            </p>
          </div>

          {/* Big Impact Card */}
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-[2.5rem] p-10 lg:p-14 text-white mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
            
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="text-6xl mb-6">🎯</div>
                <h3 className="text-3xl lg:text-4xl font-black mb-4">Real Impact, Real Scale</h3>
                <p className="text-lg text-white/80 leading-relaxed mb-6">
                  Your work won&apos;t sit in a backlog. Features you build today will be used by 
                  <span className="font-bold text-white"> millions of Indians tomorrow</span>. 
                  We&apos;re solving real problems for real families.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <span className="font-bold">50,000+</span> Active Users
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <span className="font-bold">10,000+</span> Service Pros
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <span className="font-bold">100,000+</span> Services Done
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🏃', text: 'Fast-paced environment' },
                  { icon: '🧠', text: 'Learn something new daily' },
                  { icon: '💪', text: 'Real ownership' },
                  { icon: '🎉', text: 'Celebrate wins together' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/20 transition-colors">
                    <span className="text-3xl block mb-2">{item.icon}</span>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Typical Startup */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">😴</span>
                </div>
                <h3 className="text-xl font-bold text-gray-400">Typical Startup</h3>
              </div>
              <ul className="space-y-4 text-gray-500">
                <li className="flex items-center gap-3">
                  <span className="text-red-400">✗</span> Endless meetings, no action
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-400">✗</span> Politics & hierarchy
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-400">✗</span> "We&apos;ll review in Q3"
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-400">✗</span> Burnout culture
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-400">✗</span> Empty pizza party perks
                </li>
              </ul>
            </div>

            {/* Helparo */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-700">Life at Helparo</h3>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center gap-3">
                  <span className="text-emerald-500">✓</span> Ship code on day one
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-500">✓</span> Zero politics, flat structure
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-500">✓</span> Ideas → Production in days
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-500">✓</span> Real work-life balance
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-500">✓</span> Perks that actually matter
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PERKS & BENEFITS - COLORFUL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_60%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/20">
              <Gift className="w-4 h-4" />
              Perks & Benefits
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-4">
              We take care of <span className="text-violet-400">our people</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Because happy people build amazing products.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {perks.map((perk, idx) => (
              <div key={idx} className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${perk.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <perk.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{perk.title}</h3>
                <p className="text-gray-400 text-sm">{perk.desc}</p>
              </div>
            ))}
          </div>

          {/* Extra Fun Perks */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-center mb-6">Plus some extras... 🎁</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                '🎮 Gaming Room',
                '🧘 Yoga Sessions',
                '📚 Book Club',
                '🎂 Birthday Leave',
                '🐕 Pet-Friendly Office',
                '🎤 Karaoke Nights',
                '⚽ Sports Teams',
                '🌴 Annual Offsite',
                '🎓 Conference Budget',
                '💻 MacBook Pro',
              ].map((perk, idx) => (
                <span key={idx} className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-default">
                  {perk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          OUR VALUES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Target className="w-4 h-4" />
              Our Values
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              What we <span className="text-emerald-600">believe</span> in
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <div key={idx} className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-emerald-200 hover:shadow-xl transition-all">
                <div className="text-5xl mb-4">{value.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TEAM TESTIMONIALS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-amber-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Heart className="w-4 h-4" />
              From Our Team
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Hear from <span className="text-pink-600">Helparians</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                    <p className="text-sm text-gray-500">{t.role}</p>
                    <p className="text-xs text-violet-600 font-medium">{t.tenure} at Helparo</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          OPEN POSITIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="openings" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Briefcase className="w-4 h-4" />
              Open Positions
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Find your <span className="text-violet-600">perfect role</span>
            </h2>
            <p className="text-xl text-gray-500">
              {openPositions.length} positions across {departments.length - 1} teams
            </p>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  selectedDepartment === dept.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {dept.name}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedDepartment === dept.id ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {dept.count}
                </span>
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredPositions.map((job) => (
              <div 
                key={job.id}
                className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-violet-200 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                        {job.title}
                      </h3>
                      {job.hot && (
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          🔥 HOT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> {job.type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                        <BadgeCheck className="w-3.5 h-3.5" /> {job.experience}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                        <IndianRupee className="w-3.5 h-3.5" /> {job.salary}
                      </span>
                    </div>
                  </div>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 font-semibold shadow-lg shrink-0">
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredPositions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No positions found</h3>
              <p className="text-gray-500">Try selecting a different department</p>
            </div>
          )}

          {/* Don't see your role? */}
          <div className="mt-12 bg-gradient-to-br from-violet-50 to-pink-50 rounded-3xl p-8 lg:p-12 text-center border border-violet-100">
            <div className="text-5xl mb-4">🤔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Don&apos;t see your role?</h3>
            <p className="text-gray-500 mb-6 max-w-xl mx-auto">
              We&apos;re always looking for exceptional talent. Send us your resume and we&apos;ll 
              reach out if there&apos;s a match!
            </p>
            <Button size="lg" variant="outline" className="rounded-xl px-8 font-semibold border-2" asChild>
              <a href="mailto:careers@helparo.in">
                Send Your Resume
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HIRING PROCESS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-violet-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Hiring Process
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Fast & <span className="text-blue-600">transparent</span>
            </h2>
            <p className="text-xl text-gray-500">
              We respect your time. Our process takes ~2 weeks.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Apply', desc: 'Submit your application. We review every single one.', time: 'Day 1', icon: '📝' },
              { step: '2', title: 'Screen', desc: 'Quick 20-min call with our recruiter.', time: 'Day 3-5', icon: '📞' },
              { step: '3', title: 'Interview', desc: 'Technical/skill round with the team.', time: 'Day 7-10', icon: '💻' },
              { step: '4', title: 'Offer', desc: 'Meet founders & get your offer!', time: 'Day 12-14', icon: '🎉' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{item.time}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-gray-300">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Ready to make an impact?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join us in building India&apos;s most loved home services platform. 
            Your future teammates are excited to meet you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100 rounded-2xl px-10 h-14 text-lg font-bold shadow-xl hover:scale-105 transition-all" asChild>
              <a href="#openings">
                View All Openings
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-10 h-14 text-lg font-semibold backdrop-blur-sm hover:scale-105 transition-all" asChild>
              <a href="mailto:careers@helparo.in">Email Us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-xl font-bold">helparo</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                India&apos;s most trusted home services platform. Verified professionals at your doorstep.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">SERVICES</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="/customer/book" className="hover:text-white transition-colors">Book Now</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">COMPANY</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">LEGAL</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/legal/refunds" className="hover:text-white transition-colors">Refunds</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Helparo Services Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              Made with <Heart className="w-4 h-4 text-red-500" /> in India 🇮🇳
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
