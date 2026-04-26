import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function CakeDesignerDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:         'CAKE_DESIGNER',
      label:               'Cake & Desserts',
      icon:                '🎂',
      color:               '#F472B6',
      gradient:            'linear-gradient(135deg,#F472B6,#F4A435)',
      packageHint:         'e.g. Full Wedding Package, Engagement Combo…',
      eventLabel:          'Wedding / Event',
      packageSectionLabel: 'Package',
      packageSectionIcon:  '🎁',
      showPackages:        true,
      showProducts:        true,
      showAlbum:           true,
      showEvents:          false,
      productLabel:        'Cake / Dessert',
      productHint:         'e.g. 3-Tier Wedding Cake, Cupcake Tower, Cheese Cake…',
    }} />
  );
}
