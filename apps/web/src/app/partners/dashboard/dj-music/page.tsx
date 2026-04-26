import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function DjMusicDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:  'DJ_MUSIC',
      label:        'Entertainment & DJ',
      icon:         '🎵',
      color:        '#7B8FE8',
      gradient:     'linear-gradient(135deg,#7B8FE8,#E85AA3)',
      packageHint:  'e.g. Full Night, 4-Hour Set, Live Band…',
      eventLabel:   'Wedding / Event',
    }} />
  );
}
