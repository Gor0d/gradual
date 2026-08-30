export type MatchingModel = "preco_fixo" | "sob_consulta" | "cotacao_instantanea";

export type VendorCategorySummary = {
  id: string;
  slug: string;
  name: string;
  matchingModel: MatchingModel;
};

export type VendorSummary = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  categories: VendorCategorySummary[];
  minPrice: number | null;
  hasFixedPrice: boolean;
  hasOnRequest: boolean;
  averageRating: number | null;
  reviewCount: number;
};

export type VendorPriceItem = {
  label: string;
  price: number;
};

export type VendorReviewSummary = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type VendorDetail = VendorSummary & {
  portfolioUrls: string[];
  regions: { city: string; state: string; serviceRadiusKm: number }[];
  priceTable: VendorPriceItem[];
  reviews: VendorReviewSummary[];
};
