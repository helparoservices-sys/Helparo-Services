/**
 * Guardian Teal Animation Presets
 * Reusable animation utilities for consistent motion design across Helparo
 */

// ==================== FRAMER MOTION VARIANTS ====================

export const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
};

export const fadeInUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  }
};

export const slideInRightVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
};

export const slideInLeftVariants = {
  hidden: { opacity: 0, x: -100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
};

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }
  }
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

export const glowVariants = {
  rest: { boxShadow: '0 0 20px rgba(53, 241, 205, 0.2)' },
  hover: { 
    boxShadow: '0 0 30px rgba(53, 241, 205, 0.5)',
    transition: { duration: 0.3 }
  }
};

// ==================== CSS ANIMATION CLASSES ====================

export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  scaleIn: 'animate-scale-in',
  shimmer: 'animate-shimmer',
  float: 'animate-float',
  glow: 'animate-glow',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

// ==================== TRANSITION PRESETS ====================

export const transitions = {
  fast: 'transition-all duration-200 ease-smooth',
  normal: 'transition-all duration-300 ease-smooth',
  slow: 'transition-all duration-500 ease-smooth',
  bounce: 'transition-all duration-400 ease-bounce',
  colors: 'transition-colors duration-300 ease-smooth',
  transform: 'transition-transform duration-300 ease-smooth',
  opacity: 'transition-opacity duration-300 ease-smooth',
  shadow: 'transition-shadow duration-300 ease-smooth',
};

// ==================== HOVER EFFECTS ====================

export const hoverEffects = {
  lift: 'hover:scale-[1.02] hover:-translate-y-1 transition-transform duration-300',
  scale: 'hover:scale-105 transition-transform duration-300',
  glow: 'hover:shadow-glow transition-shadow duration-300',
  tealGlow: 'hover:shadow-teal-lg transition-shadow duration-300',
  brightness: 'hover:brightness-110 transition-all duration-300',
  opacity: 'hover:opacity-80 transition-opacity duration-300',
};

// ==================== LOADING STATES ====================

export const loadingStates = {
  spinner: 'animate-spin h-5 w-5 border-2 border-guardian-teal border-t-transparent rounded-full',
  pulse: 'animate-pulse bg-gray-200 rounded',
  shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
  dots: 'flex space-x-1',
};

// ==================== PAGE TRANSITIONS ====================

export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

export const modalTransitions = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.3, ease: [0.68, -0.55, 0.265, 1.55] }
  }
};

// ==================== SCROLL ANIMATIONS ====================

export const scrollFadeIn = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const scrollSlideIn = {
  initial: { opacity: 0, x: -50 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

// ==================== BUTTON ANIMATIONS ====================

export const buttonVariants = {
  rest: { scale: 1 },
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
  disabled: { opacity: 0.5, scale: 1 }
};

export const buttonClasses = {
  primary: 'bg-guardian-teal hover:bg-guardian-teal-600 active:scale-95 transition-all duration-200',
  accent: 'bg-aqua-glow hover:shadow-glow active:scale-95 transition-all duration-200',
  outline: 'border-2 border-guardian-teal hover:bg-guardian-teal/10 active:scale-95 transition-all duration-200',
  ghost: 'hover:bg-guardian-teal/10 active:scale-95 transition-all duration-200',
};

// ==================== CARD ANIMATIONS ====================

export const cardClasses = {
  base: 'transition-all duration-300 ease-smooth',
  hover: 'hover:shadow-teal-lg hover:-translate-y-1',
  interactive: 'cursor-pointer hover:scale-[1.02] hover:shadow-teal-lg hover:-translate-y-1 transition-all duration-300',
  glow: 'hover:shadow-glow transition-shadow duration-300',
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Combine animation classes with custom classes
 */
export const mergeAnimations = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Delay animation execution
 */
export const withDelay = (delay: number) => ({
  transition: { delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }
});

/**
 * Stagger children animations
 */
export const withStagger = (staggerDelay: number = 0.1, childDelay: number = 0.2) => ({
  transition: {
    staggerChildren: staggerDelay,
    delayChildren: childDelay
  }
});

// ==================== EASING FUNCTIONS ====================

export const easings = {
  smooth: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.175, 0.885, 0.32, 1.275] as const,
};

// ==================== DURATION PRESETS ====================

export const durations = {
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
  slowest: 1000,
};

// ==================== EXPORT ALL ====================

const animations = {
  fadeInVariants,
  fadeInUpVariants,
  slideInRightVariants,
  slideInLeftVariants,
  scaleInVariants,
  staggerContainerVariants,
  cardHoverVariants,
  glowVariants,
  animationClasses,
  transitions,
  hoverEffects,
  loadingStates,
  pageTransitions,
  modalTransitions,
  scrollFadeIn,
  scrollSlideIn,
  buttonVariants,
  buttonClasses,
  cardClasses,
  mergeAnimations,
  withDelay,
  withStagger,
  easings,
  durations,
};

export default animations;