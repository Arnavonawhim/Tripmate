// All destination data lives here (shared by every page)
const PLACES = [
  {
    slug: "ladakh", name: "Ladakh", region: "Jammu & Kashmir, India",
    image: "assets/ladakh.jpg", rating: 4.9, price: 480, days: "6 days", best: "May - Sep",
    description: "High-altitude desert of turquoise lakes, monasteries and endless mountain passes. Pangong Tso, Nubra Valley and Khardung La in one unforgettable loop.",
    highlights: ["Pangong Tso lake", "Nubra Valley dunes", "Thiksey Monastery", "Khardung La pass"]
  },
  {
    slug: "himalayan-peaks", name: "Himalayan Peaks", region: "Uttarakhand, India",
    image: "assets/mountain.jpg", rating: 4.8, price: 390, days: "5 days", best: "Mar - Jun",
    description: "Sunrise over snow-capped giants, alpine meadows and quiet trekking trails through pine forests and old hill villages.",
    highlights: ["Sunrise viewpoint trek", "Alpine meadow camp", "Local homestay", "Stargazing night"]
  },
  {
    slug: "island-beaches", name: "Island Beaches", region: "Andaman Islands",
    image: "assets/beach.jpg", rating: 4.7, price: 540, days: "4 days", best: "Nov - Apr",
    description: "Powder-white sand, coral reefs and water so clear you can count the fish. Perfect for snorkelling and slow mornings.",
    highlights: ["Coral reef snorkelling", "Sunset kayaking", "Beach shack dining", "Island hopping"]
  },
  {
    slug: "kerala-backwaters", name: "Kerala Backwaters", region: "Kerala, India",
    image: "assets/backwaters.jpg", rating: 4.8, price: 320, days: "3 days", best: "Sep - Mar",
    description: "Drift through palm-lined canals on a traditional houseboat, with village life unfolding on both banks.",
    highlights: ["Houseboat overnight", "Canoe village tour", "Ayurveda spa", "Toddy tapping visit"]
  }
];

function getPlace(slug) { return PLACES.find(p => p.slug === slug); }
function queryParam(name) { return new URLSearchParams(location.search).get(name); }