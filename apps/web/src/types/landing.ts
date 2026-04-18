export interface Feature {
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
}

export interface PartnerCategory {
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
  count: string;
}

export interface Step {
  num: string;
  titleKey: string;
  descKey: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  location: string;
  text: string;
  initials: string;
  color: string;
}

export type AnimDirection = 'up' | 'left' | 'right' | 'scale';
