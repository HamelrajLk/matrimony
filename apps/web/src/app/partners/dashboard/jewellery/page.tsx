import ServiceContentDashboard from '@/components/partner/ServiceContentDashboard';

export default function JewelleryDashboard() {
  return (
    <ServiceContentDashboard cfg={{
      serviceType:  'JEWELLERY',
      label:        'Jewellery',
      icon:         '💎',
      color:        '#7B8FE8',
      gradient:     'linear-gradient(135deg,#7B8FE8,#A78BFA)',
      packageHint:  'e.g. Bridal Gold Set, Diamond Package…',
      eventLabel:   'Wedding / Event',
      showPackages: true,
      showProducts: true,
      showAlbum:    true,
      showEvents:   false,
      productLabel: 'Jewellery Item',
      productHint:  'e.g. Necklace, Ring, Earrings, Bangles…',
    }} />
  );
}
