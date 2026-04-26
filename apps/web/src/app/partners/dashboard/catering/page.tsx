import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function CateringDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:         'CATERING',
      label:               'Catering',
      icon:                '🍽️',
      color:               '#F4935A',
      gradient:            'linear-gradient(135deg,#F4935A,#F4A435)',
      packageHint:         'e.g. Sri Lankan Brunch, Celebration Menu…',
      eventLabel:          'Wedding / Event',
      packageSectionLabel: 'Menu',
      packageSectionIcon:  '🍽️',
      priceLabel:          'per head',
    }} />
  );
}
