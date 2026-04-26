import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function FloristDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:  'FLORIST',
      label:        'Decorations & Florals',
      icon:         '💐',
      color:        '#E8735A',
      gradient:     'linear-gradient(135deg,#E8735A,#F4A435)',
      packageHint:  'e.g. Full Décor, Table Setup, Stage…',
      eventLabel:   'Wedding / Event',
      showPackages: true,
      showProducts: true,
      showAlbum:    true,
      showEvents:   true,
      productLabel: 'Floral Item',
      productHint:  'e.g. Bridal Bouquet, Malai, Centrepiece, Posy…',
    }} />
  );
}
