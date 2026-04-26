import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function MakeupArtistDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:  'MAKEUP_ARTIST',
      label:        'Makeup & Beauty',
      icon:         '💄',
      color:        '#E85AA3',
      gradient:     'linear-gradient(135deg,#E85AA3,#A78BFA)',
      packageHint:  'e.g. Bridal, Engagement, Simple…',
      eventLabel:   'Wedding / Event',
    }} />
  );
}
