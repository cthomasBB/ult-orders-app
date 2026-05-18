import type { UltOrderFeedItem } from "@/types/feed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

// ─── Mock authors ─────────────────────────────────────────────────────────────

const AUTHORS = {
  spice_oracle: {
    id: "user-001",
    username: "spice_oracle",
    display_name: "Spice Oracle",
    avatar_url: null,
    is_verified: true,
  },
  ramen_ronin: {
    id: "user-002",
    username: "ramen_ronin",
    display_name: "Ramen Ronin",
    avatar_url: null,
    is_verified: false,
  },
  plant_palate: {
    id: "user-003",
    username: "plant_palate",
    display_name: "Plant Palate",
    avatar_url: null,
    is_verified: false,
  },
  brunch_boss: {
    id: "user-004",
    username: "brunch_boss",
    display_name: "Brunch Boss",
    avatar_url: null,
    is_verified: true,
  },
  street_eats_sam: {
    id: "user-005",
    username: "street_eats_sam",
    display_name: "Street Eats Sam",
    avatar_url: null,
    is_verified: false,
  },
};

// ─── Mock restaurants ─────────────────────────────────────────────────────────

const RESTAURANTS = {
  ippudo: {
    id: "rest-001",
    name: "Ippudo NY",
    address: "65 4th Ave, New York, NY",
    city: "New York",
    cuisine_type: ["Japanese", "Ramen"],
    average_rating: 4.6,
    cover_image_url: null,
  },
  hmart: {
    id: "rest-002",
    name: "Bonchon Chicken",
    address: "325 5th Ave, New York, NY",
    city: "New York",
    cuisine_type: ["Korean", "Chicken"],
    average_rating: 4.4,
    cover_image_url: null,
  },
  by_chloe: {
    id: "rest-003",
    name: "PLNT Burger",
    address: "1140 3rd Ave, New York, NY",
    city: "New York",
    cuisine_type: ["Vegan", "Burgers"],
    average_rating: 4.3,
    cover_image_url: null,
  },
  the_halal_guys: {
    id: "rest-004",
    name: "The Halal Guys",
    address: "W 53rd St & 6th Ave, New York, NY",
    city: "New York",
    cuisine_type: ["Middle Eastern", "Street Food"],
    average_rating: 4.5,
    cover_image_url: null,
  },
  balthazar: {
    id: "rest-005",
    name: "Balthazar",
    address: "80 Spring St, New York, NY",
    city: "New York",
    cuisine_type: ["French", "Brunch"],
    average_rating: 4.7,
    cover_image_url: null,
  },
};

// ─── Mock UltOrders ───────────────────────────────────────────────────────────

export const MOCK_FEED_ITEMS: UltOrderFeedItem[] = [
  // ── 1. Spice Oracle — Ippudo Ramen ────────────────────────────────────────
  {
    id: "ult-001",
    user_id: "user-001",
    restaurant_id: "rest-001",
    title: "The Akamaru Modern is non-negotiable",
    caption:
      "Been coming here for 7 years and I still can't explain the broth. It's just built different. Pork chashu was falling apart today 🔥",
    status: "published",
    total: 2847,
    currency: "USD",
    author: AUTHORS.spice_oracle,
    restaurant: RESTAURANTS.ippudo,
    media: [
      {
        id: "med-001",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
        thumbnail_url:
          "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=60",
        width: 800,
        height: 600,
        duration_seconds: null,
        sort_order: 0,
      },
    ],
    items: [
      { id: "item-001", name: "Akamaru Modern", quantity: 1, unit_price: 1900, notes: "extra rich", dietary_tags: [] },
      { id: "item-002", name: "Pork Chashu (add-on)", quantity: 2, unit_price: 350, notes: null, dietary_tags: [] },
      { id: "item-003", name: "Spicy Kakuni Bun", quantity: 1, unit_price: 850, notes: "no mayo", dietary_tags: [] },
    ],
    tags: ["Japanese", "Ramen", "Spicy"],
    like_count: 284,
    save_count: 97,
    comment_count: 31,
    try_count: 58,
    view_count: 1420,
    trending_score: 94.2,
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: false,
    published_at: hoursAgo(3),
    created_at: hoursAgo(3.5),
    updated_at: hoursAgo(3),
  },

  // ── 2. Ramen Ronin — Bonchon ──────────────────────────────────────────────
  {
    id: "ult-002",
    user_id: "user-002",
    restaurant_id: "rest-002",
    title: "Bonchon wings hit different at midnight",
    caption:
      "Half soy garlic, half spicy. Always. This is the build that ends debates.",
    status: "published",
    total: 3240,
    currency: "USD",
    author: AUTHORS.ramen_ronin,
    restaurant: RESTAURANTS.hmart,
    media: [
      {
        id: "med-002",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80",
        thumbnail_url:
          "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=60",
        width: 800,
        height: 600,
        duration_seconds: null,
        sort_order: 0,
      },
    ],
    items: [
      { id: "item-004", name: "Wings (16 pc)", quantity: 1, unit_price: 2200, notes: "half soy garlic / half spicy", dietary_tags: [] },
      { id: "item-005", name: "Japchae", quantity: 1, unit_price: 1200, notes: null, dietary_tags: [] },
      { id: "item-006", name: "Kimchi Fried Rice", quantity: 1, unit_price: 1100, notes: "add egg", dietary_tags: [] },
    ],
    tags: ["Korean", "Chicken", "Late Night"],
    like_count: 412,
    save_count: 183,
    comment_count: 47,
    try_count: 89,
    view_count: 2310,
    trending_score: 187.4,
    viewer_has_liked: false,
    viewer_has_saved: true,
    viewer_has_tried: false,
    published_at: hoursAgo(8),
    created_at: hoursAgo(8.5),
    updated_at: hoursAgo(8),
  },

  // ── 3. Plant Palate — PLNT Burger ─────────────────────────────────────────
  {
    id: "ult-003",
    user_id: "user-003",
    restaurant_id: "rest-003",
    title: "Finally a vegan burger that makes me forget meat",
    caption:
      "The PLNT Burger smash with special sauce is doing things. Mushroom fries are the surprise MVP.",
    status: "published",
    total: 2195,
    currency: "USD",
    author: AUTHORS.plant_palate,
    restaurant: RESTAURANTS.by_chloe,
    media: [
      {
        id: "med-003",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80",
        thumbnail_url:
          "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60",
        width: 800,
        height: 600,
        duration_seconds: null,
        sort_order: 0,
      },
    ],
    items: [
      { id: "item-007", name: "PLNT Smash Burger", quantity: 1, unit_price: 1450, notes: "no onion", dietary_tags: ["vegan"] },
      { id: "item-008", name: "Mushroom Fries", quantity: 1, unit_price: 895, notes: null, dietary_tags: ["vegan", "gluten-free"] },
    ],
    tags: ["Vegan", "Burgers", "Healthy"],
    like_count: 156,
    save_count: 74,
    comment_count: 18,
    try_count: 29,
    view_count: 880,
    trending_score: 61.8,
    viewer_has_liked: true,
    viewer_has_saved: false,
    viewer_has_tried: false,
    published_at: hoursAgo(14),
    created_at: hoursAgo(14.5),
    updated_at: hoursAgo(14),
  },

  // ── 4. Street Eats Sam — The Halal Guys ───────────────────────────────────
  {
    id: "ult-004",
    user_id: "user-005",
    restaurant_id: "rest-004",
    title: "The OG cart. No competition.",
    caption:
      "White sauce. Hot sauce. Rice over chicken. That's the formula. That's always been the formula.",
    status: "published",
    total: 1450,
    currency: "USD",
    author: AUTHORS.street_eats_sam,
    restaurant: RESTAURANTS.the_halal_guys,
    media: [
      {
        id: "med-004",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80",
        thumbnail_url:
          "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=60",
        width: 800,
        height: 600,
        duration_seconds: null,
        sort_order: 0,
      },
    ],
    items: [
      { id: "item-009", name: "Combo Platter (Chicken + Rice)", quantity: 1, unit_price: 1200, notes: "extra white sauce", dietary_tags: ["halal"] },
      { id: "item-010", name: "Pita Bread", quantity: 2, unit_price: 125, notes: null, dietary_tags: ["halal"] },
    ],
    tags: ["Street Food", "Middle Eastern", "Halal"],
    like_count: 621,
    save_count: 241,
    comment_count: 88,
    try_count: 197,
    view_count: 4100,
    trending_score: 312.9,
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: true,
    published_at: hoursAgo(22),
    created_at: hoursAgo(22.5),
    updated_at: hoursAgo(22),
  },

  // ── 5. Brunch Boss — Balthazar ────────────────────────────────────────────
  {
    id: "ult-005",
    user_id: "user-004",
    restaurant_id: "rest-005",
    title: "Sunday brunch at Balthazar is still the standard",
    caption:
      "The French onion soup then the steak frites. A ritual. The people-watching alone is worth the reservation.",
    status: "published",
    total: 8750,
    currency: "USD",
    author: AUTHORS.brunch_boss,
    restaurant: RESTAURANTS.balthazar,
    media: [
      {
        id: "med-005",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        thumbnail_url:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=60",
        width: 800,
        height: 600,
        duration_seconds: null,
        sort_order: 0,
      },
    ],
    items: [
      { id: "item-011", name: "French Onion Soup", quantity: 1, unit_price: 2400, notes: null, dietary_tags: [] },
      { id: "item-012", name: "Steak Frites", quantity: 1, unit_price: 4600, notes: "medium rare", dietary_tags: [] },
      { id: "item-013", name: "Crème Brûlée", quantity: 1, unit_price: 1400, notes: null, dietary_tags: [] },
      { id: "item-014", name: "Café au Lait", quantity: 2, unit_price: 175, notes: null, dietary_tags: [] },
    ],
    tags: ["French", "Brunch", "Fine Dining"],
    like_count: 88,
    save_count: 45,
    comment_count: 12,
    try_count: 8,
    view_count: 540,
    trending_score: 28.3,
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: false,
    published_at: hoursAgo(31),
    created_at: hoursAgo(31.5),
    updated_at: hoursAgo(31),
  },
];


// ─── Mock Saved Orders (different restaurants from feed) ──────────────────────

export const MOCK_SAVED_ITEMS: UltOrderFeedItem[] = [
  {
    id: "ult-006",
    user_id: "user-006",
    restaurant_id: "rest-006",
    title: "The Truffle Burger is elite",
    caption: "Order it medium. Add the fried egg. Thank me later.",
    status: "published",
    total: 2850,
    currency: "USD",
    author: {
      id: "user-006",
      username: "burgerphd",
      display_name: "Burger PhD",
      avatar_url: null,
      is_verified: true,
    },
    restaurant: {
      id: "rest-006",
      name: "Gordon Ramsay Burger",
      address: "3667 Las Vegas Blvd S",
      city: "Las Vegas",
      cuisine_type: ["American", "Burgers"],
      average_rating: 4.7,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-006",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-015", name: "Truffle Burger", quantity: 1, unit_price: 2200, notes: "medium, add fried egg", dietary_tags: [] },
      { id: "item-016", name: "Hell's Kitchen Fries", quantity: 1, unit_price: 899, notes: null, dietary_tags: [] },
    ],
    tags: ["Burgers", "LasVegas", "Strip"],
    like_count: 521, save_count: 312, comment_count: 67, try_count: 143,
    view_count: 3200, trending_score: 280.4,
    viewer_has_liked: false, viewer_has_saved: true, viewer_has_tried: false,
    published_at: hoursAgo(5), created_at: hoursAgo(5.5), updated_at: hoursAgo(5),
  },
  {
    id: "ult-007",
    user_id: "user-007",
    restaurant_id: "rest-007",
    title: "Best omakase under $100 in Vegas",
    caption: "Ask for the chef's selection. Tell them you want the spicy tuna on crispy rice.",
    status: "published",
    total: 9500,
    currency: "USD",
    author: {
      id: "user-007",
      username: "sushi_sensei",
      display_name: "Sushi Sensei",
      avatar_url: null,
      is_verified: true,
    },
    restaurant: {
      id: "rest-007",
      name: "Kabuto Edomae Sushi",
      address: "5040 W Spring Mountain Rd",
      city: "Las Vegas",
      cuisine_type: ["Japanese", "Sushi", "Omakase"],
      average_rating: 4.9,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-007",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-017", name: "Omakase (Chef Selection)", quantity: 1, unit_price: 8500, notes: "ask for spicy tuna on crispy rice", dietary_tags: [] },
      { id: "item-018", name: "Sake Pairing", quantity: 1, unit_price: 1800, notes: null, dietary_tags: [] },
    ],
    tags: ["Sushi", "Omakase", "LasVegas", "HiddenGem"],
    like_count: 892, save_count: 634, comment_count: 112, try_count: 201,
    view_count: 5400, trending_score: 520.1,
    viewer_has_liked: true, viewer_has_saved: true, viewer_has_tried: false,
    published_at: hoursAgo(12), created_at: hoursAgo(12.5), updated_at: hoursAgo(12),
  },
  {
    id: "ult-008",
    user_id: "user-008",
    restaurant_id: "rest-008",
    title: "The Birria tacos changed my life",
    caption: "Get the consomme for dipping. Double meat. This is the move.",
    status: "published",
    total: 1895,
    currency: "USD",
    author: {
      id: "user-008",
      username: "taco_oracle",
      display_name: "Taco Oracle",
      avatar_url: null,
      is_verified: false,
    },
    restaurant: {
      id: "rest-008",
      name: "Tacos El Gordo",
      address: "3049 Las Vegas Blvd S",
      city: "Las Vegas",
      cuisine_type: ["Mexican", "Tacos", "Street Food"],
      average_rating: 4.8,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-008",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-019", name: "Birria Tacos (3pc)", quantity: 1, unit_price: 1299, notes: "double meat", dietary_tags: [] },
      { id: "item-020", name: "Consomme", quantity: 1, unit_price: 299, notes: null, dietary_tags: [] },
      { id: "item-021", name: "Horchata", quantity: 1, unit_price: 399, notes: null, dietary_tags: [] },
    ],
    tags: ["Mexican", "Tacos", "LasVegas", "StreetFood"],
    like_count: 743, save_count: 445, comment_count: 89, try_count: 267,
    view_count: 4100, trending_score: 410.8,
    viewer_has_liked: false, viewer_has_saved: true, viewer_has_tried: true,
    published_at: hoursAgo(18), created_at: hoursAgo(18.5), updated_at: hoursAgo(18),
  },
  {
    id: "ult-009",
    user_id: "user-009",
    restaurant_id: "rest-009",
    title: "The Nashville Hot at Fried Chicken Joint",
    caption: "Level 3 heat. Pickles on everything. Milk tea to survive.",
    status: "published",
    total: 2299,
    currency: "USD",
    author: {
      id: "user-009",
      username: "heat_seeker",
      display_name: "Heat Seeker",
      avatar_url: null,
      is_verified: false,
    },
    restaurant: {
      id: "rest-009",
      name: "Hattie B's Hot Chicken",
      address: "450 Fremont St",
      city: "Las Vegas",
      cuisine_type: ["American", "Fried Chicken", "Southern"],
      average_rating: 4.6,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-009",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-022", name: "Hot Chicken Plate (Level 3)", quantity: 1, unit_price: 1599, notes: "extra pickles", dietary_tags: [] },
      { id: "item-023", name: "Mac & Cheese", quantity: 1, unit_price: 499, notes: null, dietary_tags: [] },
      { id: "item-024", name: "Sweet Tea", quantity: 1, unit_price: 299, notes: null, dietary_tags: [] },
    ],
    tags: ["HotChicken", "Southern", "LasVegas", "Spicy"],
    like_count: 334, save_count: 198, comment_count: 44, try_count: 88,
    view_count: 2100, trending_score: 189.3,
    viewer_has_liked: false, viewer_has_saved: true, viewer_has_tried: false,
    published_at: hoursAgo(24), created_at: hoursAgo(24.5), updated_at: hoursAgo(24),
  },
];


// ─── Mock Profile Orders (for the Me tab demo) ───────────────────────────────

export const MOCK_MY_ORDERS: UltOrderFeedItem[] = [
  {
    id: "ult-010",
    user_id: "my-user",
    restaurant_id: "rest-010",
    title: "The Vegas Strip steak that changed everything",
    caption: "Ask for the bone-in ribeye. Medium rare. The truffle butter is non-negotiable.",
    status: "published",
    total: 12800,
    currency: "USD",
    author: {
      id: "my-user",
      username: "chaz28hb",
      display_name: "Chaz",
      avatar_url: null,
      is_verified: false,
    },
    restaurant: {
      id: "rest-010",
      name: "Golden Steer Steakhouse",
      address: "308 W Sahara Ave",
      city: "Las Vegas",
      cuisine_type: ["American", "Steakhouse"],
      average_rating: 4.8,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-010",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-025", name: "Bone-in Ribeye (32oz)", quantity: 1, unit_price: 9800, notes: "medium rare, truffle butter", dietary_tags: [] },
      { id: "item-026", name: "Lobster Mac & Cheese", quantity: 1, unit_price: 2200, notes: null, dietary_tags: [] },
      { id: "item-027", name: "Old Fashioned", quantity: 1, unit_price: 1800, notes: "Woodford Reserve", dietary_tags: [] },
    ],
    tags: ["Steakhouse", "LasVegas", "FineDining", "ULT"],
    like_count: 892, save_count: 567, comment_count: 134, try_count: 203,
    view_count: 6800, trending_score: 580.2,
    viewer_has_liked: false, viewer_has_saved: false, viewer_has_tried: false,
    published_at: hoursAgo(2), created_at: hoursAgo(2.5), updated_at: hoursAgo(2),
  },
  {
    id: "ult-011",
    user_id: "my-user",
    restaurant_id: "rest-011",
    title: "Late night pizza at Evel Pie hits different",
    caption: "The Hot Lips pizza at 2am after a show. This is the move.",
    status: "published",
    total: 3200,
    currency: "USD",
    author: {
      id: "my-user",
      username: "chaz28hb",
      display_name: "Chaz",
      avatar_url: null,
      is_verified: false,
    },
    restaurant: {
      id: "rest-011",
      name: "Evel Pie",
      address: "508 Fremont St",
      city: "Las Vegas",
      cuisine_type: ["Pizza", "Italian", "Late Night"],
      average_rating: 4.7,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-011",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-028", name: "Hot Lips Pizza (Large)", quantity: 1, unit_price: 2400, notes: "extra spicy", dietary_tags: [] },
      { id: "item-029", name: "Craft Beer", quantity: 2, unit_price: 800, notes: null, dietary_tags: [] },
    ],
    tags: ["Pizza", "LateNight", "Fremont", "LasVegas"],
    like_count: 445, save_count: 289, comment_count: 67, try_count: 112,
    view_count: 3400, trending_score: 298.4,
    viewer_has_liked: false, viewer_has_saved: false, viewer_has_tried: false,
    published_at: hoursAgo(48), created_at: hoursAgo(48.5), updated_at: hoursAgo(48),
  },
  {
    id: "ult-012",
    user_id: "my-user",
    restaurant_id: "rest-012",
    title: "The breakfast burrito that cures everything",
    caption: "Green chile. Crispy potatoes. This is the only breakfast spot that matters.",
    status: "published",
    total: 1895,
    currency: "USD",
    author: {
      id: "my-user",
      username: "chaz28hb",
      display_name: "Chaz",
      avatar_url: null,
      is_verified: false,
    },
    restaurant: {
      id: "rest-012",
      name: "The Egg & I",
      address: "4533 W Sahara Ave",
      city: "Las Vegas",
      cuisine_type: ["American", "Breakfast", "Brunch"],
      average_rating: 4.5,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-012",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-030", name: "Green Chile Breakfast Burrito", quantity: 1, unit_price: 1299, notes: "extra green chile, crispy potatoes", dietary_tags: [] },
      { id: "item-031", name: "Fresh OJ", quantity: 1, unit_price: 499, notes: null, dietary_tags: [] },
      { id: "item-032", name: "Side of Bacon", quantity: 1, unit_price: 399, notes: null, dietary_tags: [] },
    ],
    tags: ["Breakfast", "Brunch", "LasVegas", "HiddenGem"],
    like_count: 234, save_count: 156, comment_count: 34, try_count: 78,
    view_count: 1900, trending_score: 167.8,
    viewer_has_liked: false, viewer_has_saved: false, viewer_has_tried: false,
    published_at: hoursAgo(72), created_at: hoursAgo(72.5), updated_at: hoursAgo(72),
  },
  {
    id: "ult-013",
    user_id: "my-user",
    restaurant_id: "rest-013",
    title: "Best ramen in Vegas and it's not even close",
    caption: "Tonkotsu with extra chashu. Add the spicy egg. Come hungry.",
    status: "published",
    total: 2650,
    currency: "USD",
    author: {
      id: "my-user",
      username: "chaz28hb",
      display_name: "Chaz",
      avatar_url: null,
      is_verified: false,
    },
    restaurant: {
      id: "rest-013",
      name: "Fukuburger Ramen",
      address: "1049 E Sahara Ave",
      city: "Las Vegas",
      cuisine_type: ["Japanese", "Ramen"],
      average_rating: 4.7,
      cover_image_url: null,
    },
    media: [
      {
        id: "med-013",
        media_type: "photo",
        url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=60",
        width: 800, height: 600, duration_seconds: null, sort_order: 0,
      },
    ],
    items: [
      { id: "item-033", name: "Tonkotsu Ramen", quantity: 1, unit_price: 1799, notes: "extra chashu, spicy egg", dietary_tags: [] },
      { id: "item-034", name: "Gyoza (6pc)", quantity: 1, unit_price: 699, notes: null, dietary_tags: [] },
      { id: "item-035", name: "Ramune Soda", quantity: 1, unit_price: 299, notes: null, dietary_tags: [] },
    ],
    tags: ["Ramen", "Japanese", "LasVegas", "HiddenGem"],
    like_count: 678, save_count: 423, comment_count: 89, try_count: 167,
    view_count: 4200, trending_score: 445.6,
    viewer_has_liked: false, viewer_has_saved: false, viewer_has_tried: false,
    published_at: hoursAgo(96), created_at: hoursAgo(96.5), updated_at: hoursAgo(96),
  },
];

// Trending: sorted by save_count desc
export const MOCK_TRENDING = [...MOCK_FEED_ITEMS].sort(
  (a, b) => b.save_count - a.save_count
);

// Following: sorted by created_at desc (same as base)
export const MOCK_FOLLOWING = [...MOCK_FEED_ITEMS];

// Near You: by trending_score desc (proxy for location relevance in mock)
export const MOCK_NEARBY = [...MOCK_FEED_ITEMS].sort(
  (a, b) => b.trending_score - a.trending_score
);
