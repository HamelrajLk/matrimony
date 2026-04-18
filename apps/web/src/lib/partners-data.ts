export interface Partner {
  id: number;
  name: string;
  type: string;
  slug: string;
  tagline: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  emoji: string;
  tags: string[];
  isVerified: boolean;
  isFeatured?: boolean;
}

export interface PartnerTypeInfo {
  type: string;
  label: string;
  plural: string;
  icon: string;
  color: string;
  gradient: string;
  desc: string;
}

export const PARTNER_TYPES: PartnerTypeInfo[] = [
  { type: 'PHOTOGRAPHER',  label: 'Photographer',   plural: 'Photographers',  icon: '📸', color: '#E8735A', gradient: 'linear-gradient(135deg,#E8735A,#F4A435)', desc: 'Capture every magical moment with Sri Lanka\'s finest wedding photographers.' },
  { type: 'VENUE',         label: 'Venue',           plural: 'Venues',         icon: '🏛️', color: '#F4A435', gradient: 'linear-gradient(135deg,#F4A435,#FEB47B)', desc: 'Grand ballrooms and intimate venues across the island and worldwide.' },
  { type: 'MAKEUP_ARTIST', label: 'Makeup Artist',   plural: 'Makeup Artists', icon: '💄', color: '#E85AA3', gradient: 'linear-gradient(135deg,#E85AA3,#A78BFA)', desc: 'Transform your bridal look with expert makeup from certified artists.' },
  { type: 'DJ_MUSIC',      label: 'DJ & Music',      plural: 'DJ & Music',     icon: '🎶', color: '#7B8FE8', gradient: 'linear-gradient(135deg,#7B8FE8,#60C8F0)', desc: 'Live bands, DJs and sound systems for an unforgettable celebration.' },
  { type: 'FLORIST',       label: 'Florist',         plural: 'Florists',       icon: '💐', color: '#4ABEAA', gradient: 'linear-gradient(135deg,#4ABEAA,#60C8F0)', desc: 'Stunning floral arrangements that turn venues into dreamscapes.' },
  { type: 'CATERING',      label: 'Catering',        plural: 'Caterers',       icon: '🍽️', color: '#F4935A', gradient: 'linear-gradient(135deg,#F4935A,#F4A435)', desc: 'Exquisite cuisine and service for your perfect wedding banquet.' },
  { type: 'CAKE_DESIGNER', label: 'Cake Designer',   plural: 'Cake Designers', icon: '🎂', color: '#E85AA3', gradient: 'linear-gradient(135deg,#E85AA3,#F4A435)', desc: 'Bespoke wedding cakes crafted with artistry and the finest ingredients.' },
  { type: 'VIDEOGRAPHER',  label: 'Videographer',    plural: 'Videographers',  icon: '🎥', color: '#7B8FE8', gradient: 'linear-gradient(135deg,#7B8FE8,#E85AA3)', desc: 'Cinematic wedding films that preserve your memories forever.' },
  { type: 'TRANSPORT',     label: 'Transport',       plural: 'Transport',      icon: '🚗', color: '#4ABEAA', gradient: 'linear-gradient(135deg,#4ABEAA,#7B8FE8)', desc: 'Luxury vehicles and transport services for your wedding party.' },
  { type: 'MATCHMAKER',    label: 'Matchmaker',      plural: 'Matchmakers',    icon: '💑', color: '#E8735A', gradient: 'linear-gradient(135deg,#E8735A,#E85AA3)', desc: 'Professional matchmakers with deep knowledge of Sri Lankan culture.' },
];

/* ─── Dummy partners — 15 per type ─── */
function makePartners(type: string, info: PartnerTypeInfo): Partner[] {
  const names: Record<string, string[]> = {
    PHOTOGRAPHER:  ['Chathura Studios', 'Nimesh Captures', 'Kalani Vision', 'LensArt by Ravi', 'Shutter Stories', 'Pearl Photography', 'Island Frames', 'GoldenHour Studio', 'Moments by Priya', 'Eternal Clicks', 'VisionCraft LK', 'SriLanka Shots', 'Budding Lens', 'Pixel Perfect', 'Royal Frames'],
    VENUE:         ['Cinnamon Grand Hall', 'Kingsbury Ballroom', 'Lotus Tower Events', 'Lanka Princess Hall', 'Mount Lavinia Terrace', 'Taj Samudra Gardens', 'Galadari Ballroom', 'Hilton Rooftop', 'Shangri-La Hall', 'The Water\'s Edge', 'Bolgoda Lake Resort', 'Cloud 9 Venue', 'Hunas Falls Estate', 'Bentota Beach Club', 'Galle Fort Hall'],
    MAKEUP_ARTIST: ['Glamour by Ayesha', 'Bridal Bliss Studio', 'Nimesha Beauty', 'Radiance Artistry', 'Blushed by Dilini', 'The Bridal Suite', 'Crystal Beauty LK', 'Priya\'s Artistry', 'GlowBride Studio', 'Ethereal Beauty', 'Chamara Makeover', 'Luxe Bridal Looks', 'Duwa Beauty Spa', 'Flawless by Nimali', 'Stars & Veils'],
    DJ_MUSIC:      ['DJ Beats Lanka', 'Rhythm Masters', 'SoundWave Events', 'Ceylon DJ Pro', 'Bass & Beats LK', 'Melody Makers', 'Infinite Sound', 'Party Pulse LK', 'DJ KiD Lanka', 'Premier Sound Co', 'Echo Events', 'Vibe Nation LK', 'Acoustic Weddings', 'FusionBeats SL', 'Live Wire Band'],
    FLORIST:       ['Petal Paradise', 'Bloom & Blossom', 'Flower House LK', 'Eden Florals', 'Rose Garden Events', 'Orchid Dreams', 'Lily Lane Florist', 'Ceylon Blooms', 'Flora Fantasy LK', 'Blossom Bridge', 'Nature\'s Touch', 'Jasmine Events', 'Lotus Florals', 'Green Thumb LK', 'Bloom Boutique'],
    CATERING:      ['Royal Feast Caterers', 'Island Delicacies', 'Ceylon Kitchen', 'Heritage Catering', 'Grand Table Events', 'Spice Route Catering', 'Saffron Events', 'Taste of Lanka', 'The Banquet Co', 'Flavour Factory', 'Authentic Ceylon', 'Regal Cuisine LK', 'Gold Platter Events', 'Curry Leaf Catering', 'Spice Palace LK'],
    CAKE_DESIGNER: ['Sweet Dreams Cakes', 'Sugared Dreams LK', 'Cake Couture', 'The Cake Studio', 'Frosting & Art', 'Velvet Cakes LK', 'Bliss Bakery', 'Ceylon Sugar Art', 'Masterpiece Cakes', 'Tiers of Joy', 'Cake Atelier SL', 'Fondant Fantasy', 'Cream & Crumbs', 'Sugar Rush LK', 'Layered Love Cakes'],
    VIDEOGRAPHER:  ['Cinematic Dreams', 'Wedding Films LK', 'Reel Love Studio', 'Story Arc Films', 'Frame by Frame', 'Eternity Films LK', 'Motion Magic SL', 'Premiere Weddings', 'Candid Cinema', 'The Film House', 'Epic Wedding Films', 'Golden Frame LK', 'Iris Films Lanka', 'Crystal Lens Films', 'Moments in Motion'],
    TRANSPORT:     ['Luxury Rides LK', 'Royal Transport', 'Ceylon Classic Cars', 'Prestige Wheels', 'Grand Arrival SL', 'White Rolls Lanka', 'Wedding Wheels LK', 'Elite Chauffeur', 'Island Transfers', 'Bridal Carriage LK', 'Vintage Cars SL', 'Silver Limo Lanka', 'Premier Drives', 'Wedding Fleet LK', 'Crown Transport SL'],
    MATCHMAKER:    ['Hearts United', 'Soulmate Finders', 'Perfect Match LK', 'Ceylon Matchmakers', 'Destiny Connections', 'Union Bridge LK', 'Forever Together', 'Auspicious Matches', 'Harmony Makers', 'Alliance LK', 'Noble Alliances', 'Star Match SL', 'Bond of Life LK', 'Divine Unions', 'Sacred Ties Lanka'],
  };

  const tagSets: Record<string, string[][]> = {
    PHOTOGRAPHER:  [['Candid','Traditional'],['Full Day Coverage','Albums'],['Drone Shots','Digital'],['Portrait','Editorial'],['Premium Albums','Prints']],
    VENUE:         [['Up to 500 Guests','AC Hall'],['Garden Setting','Pool'],['City View','Rooftop'],['Beachfront','Outdoor'],['Heritage Building','Classic']],
    MAKEUP_ARTIST: [['Bridal Package','HD Makeup'],['Airbrush','Traditional'],['Saree Draping','Hair'],['Skincare Prep','Lashes'],['Night Looks','Day Looks']],
    DJ_MUSIC:      [['Live Band','DJ'],['Bollywood','Baila'],['Sound System','Lighting'],['Acoustic Sets','Classical'],['International','Local']],
    FLORIST:       [['Bouquets','Centerpieces'],['Arch Decor','Stage'],['Imported Flowers','Local'],['Table Decor','Aisle'],['Custom Designs','Bulk']],
    CATERING:      [['Sri Lankan Cuisine','Continental'],['Buffet','Plated'],['Halal Certified','Veg Options'],['Dessert Bar','Live Stations'],['Premium Menu','Budget Friendly']],
    CAKE_DESIGNER: [['Fondant','Buttercream'],['Multi-Tier','Custom Design'],['Floral Cakes','Modern'],['Traditional','Fusion'],['Dessert Tables','Cupcakes']],
    VIDEOGRAPHER:  [['Cinematic Edit','Drone','4K'],['Short Film','Full Length'],['Same-Day Edit','Highlights'],['Colour Graded','Raw Footage'],['Documentary Style','Creative']],
    TRANSPORT:     [['Rolls Royce','Bentley'],['Vintage Cars','Modern'],['Limousines','SUV'],['Chauffeur','Decorated'],['Airport Pickup','All Day']],
    MATCHMAKER:    [['Traditional','Modern'],['Horoscope','Compatibility'],['Nationwide','International'],['Premium Service','Family Approval'],['Cultural Match','Religion Based']],
  };

  const locations = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Kurunegala', 'Matara', 'Anuradhapura', 'Jaffna', 'Batticaloa', 'London, UK', 'Melbourne, AU', 'Toronto, CA', 'Dubai, UAE', 'Sydney, AU', 'Singapore'];
  const prices: Record<string, string[]> = {
    PHOTOGRAPHER:  ['LKR 45,000+', 'LKR 65,000+', 'LKR 85,000+', 'LKR 120,000+', 'LKR 35,000+'],
    VENUE:         ['LKR 150,000+', 'LKR 250,000+', 'LKR 400,000+', 'LKR 600,000+', 'LKR 100,000+'],
    MAKEUP_ARTIST: ['LKR 18,000+', 'LKR 25,000+', 'LKR 40,000+', 'LKR 60,000+', 'LKR 15,000+'],
    DJ_MUSIC:      ['LKR 30,000+', 'LKR 50,000+', 'LKR 75,000+', 'LKR 100,000+', 'LKR 25,000+'],
    FLORIST:       ['LKR 20,000+', 'LKR 35,000+', 'LKR 55,000+', 'LKR 80,000+', 'LKR 15,000+'],
    CATERING:      ['LKR 800/head', 'LKR 1,200/head', 'LKR 1,800/head', 'LKR 2,500/head', 'LKR 600/head'],
    CAKE_DESIGNER: ['LKR 15,000+', 'LKR 25,000+', 'LKR 40,000+', 'LKR 65,000+', 'LKR 12,000+'],
    VIDEOGRAPHER:  ['LKR 50,000+', 'LKR 75,000+', 'LKR 100,000+', 'LKR 150,000+', 'LKR 40,000+'],
    TRANSPORT:     ['LKR 25,000+', 'LKR 40,000+', 'LKR 60,000+', 'LKR 90,000+', 'LKR 20,000+'],
    MATCHMAKER:    ['LKR 10,000+', 'LKR 20,000+', 'LKR 35,000+', 'LKR 50,000+', 'Free Consult'],
  };

  const nameList = names[type] ?? [];
  const tagList  = tagSets[type]  ?? [['Premium Service']];
  const priceList = prices[type]  ?? ['LKR 30,000+'];

  return nameList.map((name, i) => ({
    id: i + 1,
    name,
    type,
    slug: type.toLowerCase().replace(/_/g, '-'),
    tagline: `Trusted by ${200 + i * 47} couples across Sri Lanka & diaspora`,
    location: locations[i % locations.length],
    rating: parseFloat((4.2 + (i % 8) * 0.1).toFixed(1)),
    reviews: 28 + i * 17,
    price: priceList[i % priceList.length],
    emoji: info.icon,
    tags: tagList[i % tagList.length],
    isVerified: i % 4 !== 3,
    isFeatured: i < 3,
  }));
}

/* Build all partners */
const ALL_PARTNERS: Partner[] = [];
for (const info of PARTNER_TYPES) {
  ALL_PARTNERS.push(...makePartners(info.type, info));
}

export function getPartnersByType(type: string): Partner[] {
  return ALL_PARTNERS.filter(p => p.type === type);
}

export function getPartnerTypeInfo(type: string): PartnerTypeInfo | undefined {
  return PARTNER_TYPES.find(t => t.type === type);
}
