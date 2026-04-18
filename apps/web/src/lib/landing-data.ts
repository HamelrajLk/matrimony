import type { Feature, PartnerCategory, Step, Testimonial } from '@/types/landing';

export const NAV_LINKS = ['Home', 'About', 'Browse Profiles', 'Partners', 'Blog', 'Contact'];

export const FEATURES: Feature[] = [
  { icon: '👤', titleKey: 'features.individual.title', descKey: 'features.individual.desc', color: '#E8735A' },
  { icon: '✅', titleKey: 'features.verified.title',   descKey: 'features.verified.desc',   color: '#4ABEAA' },
  { icon: '🤝', titleKey: 'features.broker.title',     descKey: 'features.broker.desc',     color: '#F4A435' },
  { icon: '✨', titleKey: 'features.partners.title',   descKey: 'features.partners.desc',   color: '#7B8FE8' },
  { icon: '🌍', titleKey: 'features.global.title',     descKey: 'features.global.desc',     color: '#E85AA3' },
  { icon: '🔒', titleKey: 'features.privacy.title',    descKey: 'features.privacy.desc',    color: '#4ABEAA' },
];

export const PARTNERS_CATEGORIES: PartnerCategory[] = [
  { icon: '📸', titleKey: 'partners.categories.photography', descKey: 'partners.categories.photography', color: '#E8735A', count: '240+' },
  { icon: '🏛️', titleKey: 'partners.categories.venue',       descKey: 'partners.categories.venue',       color: '#F4A435', count: '180+' },
  { icon: '💄', titleKey: 'partners.categories.makeup',      descKey: 'partners.categories.makeup',      color: '#E85AA3', count: '320+' },
  { icon: '🎶', titleKey: 'partners.categories.music',       descKey: 'partners.categories.music',       color: '#7B8FE8', count: '150+' },
  { icon: '💐', titleKey: 'partners.categories.florist',     descKey: 'partners.categories.florist',     color: '#4ABEAA', count: '200+' },
  { icon: '🍽️', titleKey: 'partners.categories.catering',   descKey: 'partners.categories.catering',   color: '#F4935A', count: '120+' },
];

export const STEPS: Step[] = [
  { num: '01', titleKey: 'steps.step1.title', descKey: 'steps.step1.desc', icon: '✍️' },
  { num: '02', titleKey: 'steps.step2.title', descKey: 'steps.step2.desc', icon: '🖼️' },
  { num: '03', titleKey: 'steps.step3.title', descKey: 'steps.step3.desc', icon: '🔍' },
  { num: '04', titleKey: 'steps.step4.title', descKey: 'steps.step4.desc', icon: '💬' },
];

export const TESTIMONIALS: Testimonial[] = [
  { name: 'Priya & Ashan', location: 'Colombo 🇱🇰', text: 'The AI matchmaking was incredible — we had so much in common from day one. Married within a year!', initials: 'PA', color: '#E8735A' },
  { name: 'Kavindi & Roshan', location: 'Melbourne 🇦🇺', text: 'Finding someone who shares our Sri Lankan culture while living abroad felt impossible. This platform changed everything.', initials: 'KR', color: '#7B8FE8' },
  { name: 'Nimali & Dinesh', location: 'London 🇬🇧', text: 'We booked our photographer and venue right here too. The Wedding Partners is truly a one-stop shop!', initials: 'ND', color: '#4ABEAA' },
  { name: 'Sanduni & Harsha', location: 'Toronto 🇨🇦', text: 'Our partner managed everything so professionally. Elegant platform, beautiful experience.', initials: 'SH', color: '#E85AA3' },
];
