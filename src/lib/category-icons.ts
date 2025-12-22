// Maps service category slugs/icons to proper emojis and colors
// This is used as a fallback when Lucide icons are not available

export const categoryIconMap: Record<string, { emoji: string; color: string; lightColor: string; textColor: string }> = {
  // Home Services
  'home-services': { emoji: '🏠', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'plumbing': { emoji: '🔧', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'plumber': { emoji: '🔧', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'electrical-work': { emoji: '⚡', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'electrical': { emoji: '⚡', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'electrician': { emoji: '⚡', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'carpentry': { emoji: '🪚', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'carpenter': { emoji: '🪚', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'painting': { emoji: '🎨', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'painter': { emoji: '🎨', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'ac-repair': { emoji: '❄️', color: 'bg-cyan-500', lightColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  'appliance-repair': { emoji: '🔌', color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-600' },
  'appliances': { emoji: '🔌', color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-600' },

  // Cleaning Services
  'cleaning-services': { emoji: '✨', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  'cleaning': { emoji: '🧹', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  'house-cleaning': { emoji: '🏡', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  'office-cleaning': { emoji: '🏢', color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600' },
  'bathroom-cleaning': { emoji: '🚿', color: 'bg-blue-400', lightColor: 'bg-blue-50', textColor: 'text-blue-500' },
  'kitchen-cleaning': { emoji: '🍳', color: 'bg-orange-400', lightColor: 'bg-orange-50', textColor: 'text-orange-500' },
  'sofa-cleaning': { emoji: '🛋️', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'sofa-carpet-cleaning': { emoji: '🛋️', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'carpet-cleaning': { emoji: '🧼', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'window-cleaning': { emoji: '🪟', color: 'bg-blue-400', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },

  // Car Services
  'car-services': { emoji: '🚗', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600' },
  'vehicle-services': { emoji: '🚗', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600' },
  'car-wash': { emoji: '🚿', color: 'bg-blue-400', lightColor: 'bg-blue-50', textColor: 'text-blue-500' },
  'car-service': { emoji: '🔧', color: 'bg-gray-600', lightColor: 'bg-gray-50', textColor: 'text-gray-700' },
  'car-repair': { emoji: '🔩', color: 'bg-slate-600', lightColor: 'bg-slate-50', textColor: 'text-slate-700' },
  'tire-service': { emoji: '🛞', color: 'bg-gray-700', lightColor: 'bg-gray-50', textColor: 'text-gray-800' },
  'battery-service': { emoji: '🔋', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-600' },
  'denting-painting': { emoji: '🛠️', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'car-ac-service': { emoji: '❄️', color: 'bg-cyan-500', lightColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  'bike-service': { emoji: '🏍️', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'vehicle-repair': { emoji: '🔩', color: 'bg-slate-600', lightColor: 'bg-slate-50', textColor: 'text-slate-700' },

  // Pest Control
  'pest-control': { emoji: '🐛', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600' },
  'cockroach-control': { emoji: '🪳', color: 'bg-amber-600', lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
  'termite-control': { emoji: '🐜', color: 'bg-brown-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
  'mosquito-control': { emoji: '🦟', color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-600' },
  'bed-bug-control': { emoji: '🛏️', color: 'bg-purple-600', lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
  'rodent-control': { emoji: '🐀', color: 'bg-gray-600', lightColor: 'bg-gray-50', textColor: 'text-gray-700' },

  // Beauty & Wellness
  'beauty-wellness': { emoji: '💆', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'beauty': { emoji: '💅', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'salon-at-home': { emoji: '💇', color: 'bg-rose-500', lightColor: 'bg-rose-50', textColor: 'text-rose-600' },
  'massage': { emoji: '💆', color: 'bg-purple-400', lightColor: 'bg-purple-50', textColor: 'text-purple-500' },
  'spa': { emoji: '🧖', color: 'bg-teal-400', lightColor: 'bg-teal-50', textColor: 'text-teal-500' },
  'facial': { emoji: '✨', color: 'bg-yellow-400', lightColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  'haircut-styling': { emoji: '💇', color: 'bg-rose-500', lightColor: 'bg-rose-50', textColor: 'text-rose-600' },
  'massage-therapy': { emoji: '💆', color: 'bg-purple-400', lightColor: 'bg-purple-50', textColor: 'text-purple-500' },
  'manicure-pedicure': { emoji: '💅', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'makeup-artist': { emoji: '💄', color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-600' },
  'waxing-threading': { emoji: '🧵', color: 'bg-amber-400', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },

  // Moving & Packing
  'moving-packing': { emoji: '📦', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'moving-services': { emoji: '📦', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'packers-movers': { emoji: '🚚', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'movers': { emoji: '🚚', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'moving': { emoji: '🚚', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'local-shifting': { emoji: '🏠', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'furniture-moving': { emoji: '🛋️', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'intercity-moving': { emoji: '🧳', color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600' },
  'packing-services': { emoji: '📦', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'office-relocation': { emoji: '🏢', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'vehicle-transport': { emoji: '🚙', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },

  // Events
  'event-services': { emoji: '🎉', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  'catering': { emoji: '🍽️', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'decoration': { emoji: '🎊', color: 'bg-pink-400', lightColor: 'bg-pink-50', textColor: 'text-pink-500' },
  'photography': { emoji: '📸', color: 'bg-gray-700', lightColor: 'bg-gray-50', textColor: 'text-gray-800' },
  'birthday-party-planning': { emoji: '🎂', color: 'bg-rose-500', lightColor: 'bg-rose-50', textColor: 'text-rose-600' },
  'wedding-planning': { emoji: '💍', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'catering-service': { emoji: '🍽️', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'decoration-service': { emoji: '🎀', color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-600' },
  'photography-videography': { emoji: '🎥', color: 'bg-gray-700', lightColor: 'bg-gray-50', textColor: 'text-gray-800' },
  'entertainment': { emoji: '🎭', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },

  // Personal Services
  'personal-services': { emoji: '👤', color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600' },
  'cook': { emoji: '👨‍🍳', color: 'bg-red-400', lightColor: 'bg-red-50', textColor: 'text-red-500' },
  'driver': { emoji: '🚗', color: 'bg-blue-600', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
  'gardening': { emoji: '🌱', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-600' },
  'security': { emoji: '🛡️', color: 'bg-gray-700', lightColor: 'bg-gray-50', textColor: 'text-gray-800' },

  // Gardening & Landscaping
  'gardening-landscaping': { emoji: '🌿', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-600' },
  'lawn-mowing': { emoji: '🌾', color: 'bg-lime-500', lightColor: 'bg-lime-50', textColor: 'text-lime-600' },
  'garden-design': { emoji: '🪴', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  'plant-care': { emoji: '🌱', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-600' },
  'tree-trimming': { emoji: '🌳', color: 'bg-teal-600', lightColor: 'bg-teal-50', textColor: 'text-teal-700' },
  'irrigation-system': { emoji: '💧', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'garden-pest-control': { emoji: '🐞', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600' },

  // Pet Care
  'pet-care': { emoji: '🐾', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'pet-grooming': { emoji: '✂️', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'dog-walking': { emoji: '🐕', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  'pet-training': { emoji: '🦮', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'pet-sitting': { emoji: '🏠', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'vet-consultation': { emoji: '🩺', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  'pet-taxi': { emoji: '🚕', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },

  // Computer & IT Services
  'computer-it-services': { emoji: '💻', color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-600' },
  'laptop-repair': { emoji: '💻', color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-600' },
  'desktop-repair': { emoji: '🖥️', color: 'bg-slate-600', lightColor: 'bg-slate-50', textColor: 'text-slate-700' },
  'data-recovery': { emoji: '💽', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'software-installation': { emoji: '📀', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'network-setup': { emoji: '🌐', color: 'bg-cyan-500', lightColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  'printer-repair': { emoji: '🖨️', color: 'bg-gray-700', lightColor: 'bg-gray-50', textColor: 'text-gray-800' },

  // Laundry Services
  'laundry-services': { emoji: '🧺', color: 'bg-cyan-500', lightColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  'wash-iron': { emoji: '🧼', color: 'bg-blue-400', lightColor: 'bg-blue-50', textColor: 'text-blue-500' },
  'dry-cleaning': { emoji: '🧴', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'iron-only': { emoji: '🪡', color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-600' },
  'steam-press': { emoji: '🌫️', color: 'bg-slate-500', lightColor: 'bg-slate-50', textColor: 'text-slate-600' },
  'shoe-cleaning': { emoji: '👟', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'carpet-curtain-cleaning': { emoji: '🛋️', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },

  // Other
  'locksmith': { emoji: '🔑', color: 'bg-yellow-600', lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  'other': { emoji: '🔧', color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-600' },
  'home-repair': { emoji: '🏠', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
}

// Lucide icon name to emoji mapping
export const lucideToEmoji: Record<string, string> = {
  'Home': '🏠',
  'Wrench': '🔧',
  'Zap': '⚡',
  'Hammer': '🪚',
  'Paintbrush': '🎨',
  'Wind': '❄️',
  'Settings': '🔌',
  'Sparkles': '✨',
  'Briefcase': '💼',
  'Droplet': '💧',
  'ChefHat': '👨‍🍳',
  'Armchair': '🛋️',
  'Car': '🚗',
  'Bike': '🏍️',
  'Bug': '🐛',
  'Heart': '❤️',
  'Scissors': '✂️',
  'Truck': '🚚',
  'Package': '📦',
  'Camera': '📸',
  'User': '👤',
  'Leaf': '🌱',
  'Shield': '🛡️',
  'Key': '🔑',
}

// Get category icon info by slug or name
export function getCategoryIcon(slugOrName: string): { emoji: string; color: string; lightColor: string; textColor: string } {
  const normalized = slugOrName.toLowerCase().replace(/\s+/g, '-')
  
  return categoryIconMap[normalized] || categoryIconMap[slugOrName] || {
    emoji: '🔧',
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    textColor: 'text-gray-600',
  }
}

// Get emoji from Lucide icon name
export function getEmojiFromLucideIcon(iconName: string): string {
  return lucideToEmoji[iconName] || '🔧'
}

// Convert a category to display-ready format
export function formatCategory(category: { name: string; slug?: string; icon?: string }): {
  name: string
  emoji: string
  color: string
  lightColor: string
  textColor: string
} {
  const iconInfo = getCategoryIcon(category.slug || category.name)
  let emoji = iconInfo.emoji
  
  // Try to use Lucide icon mapping if available
  if (category.icon && lucideToEmoji[category.icon]) {
    emoji = lucideToEmoji[category.icon]
  }
  
  return {
    name: category.name,
    emoji,
    color: iconInfo.color,
    lightColor: iconInfo.lightColor,
    textColor: iconInfo.textColor,
  }
}
