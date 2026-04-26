import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function MehendiDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:  'MEHENDI',
      label:        'Mehendi & Henna',
      icon:         '🌿',
      color:        '#4ABEAA',
      gradient:     'linear-gradient(135deg,#4ABEAA,#7B8FE8)',
      packageHint:  'e.g. Full Bridal, Simple Design, Group…',
      eventLabel:   'Wedding / Event',
      showPackages: false,
      showProducts: true,
      showAlbum:    true,
      showEvents:   true,
      productLabel: 'Design',
      productHint:  'e.g. Full Hand Bridal, Arabic Pattern, Leg Design…',
    }} />
  );
}
