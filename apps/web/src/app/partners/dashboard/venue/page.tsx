import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function VenueDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:         'VENUE',
      label:               'Venue',
      icon:                '🏛️',
      color:               '#F4A435',
      gradient:            'linear-gradient(135deg,#F4A435,#FEB47B)',
      packageHint:         'e.g. Grand Ballroom, Garden Terrace, Rooftop…',
      eventLabel:          'Wedding',
      packageSectionLabel: 'Hall',
      packageSectionIcon:  '🏛️',
      showCapacity:        true,
    }} />
  );
}
