import type { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  MatchingModel,
  VendorCategorySummary,
  VendorDetail,
  VendorReviewSummary,
  VendorSummary,
} from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type LocationRow = { city: string; state: string; service_radius_km: number };
type CategoryRow = { id: string; slug: string; name: string; matching_model: MatchingModel };
type CategoryLinkRow = { vendor_categories: CategoryRow | null };
type PriceTableRow = { label: string; price: string };
type ReviewRow = { id: string; rating: number; comment: string | null; created_at: string };

type VendorListRow = {
  id: string;
  display_name: string;
  description: string | null;
  vendor_locations: LocationRow[];
  vendor_category_links: CategoryLinkRow[];
  vendor_price_tables: PriceTableRow[];
  reviews: { rating: number }[];
};

type VendorDetailRow = {
  id: string;
  display_name: string;
  description: string | null;
  portfolio_urls: string[];
  vendor_locations: LocationRow[];
  vendor_category_links: CategoryLinkRow[];
  vendor_price_tables: PriceTableRow[];
  reviews: ReviewRow[];
};

const LIST_SELECT = `
  id, display_name, description,
  vendor_locations(city, state, service_radius_km),
  vendor_category_links!inner(vendor_categories!inner(id, slug, name, matching_model)),
  vendor_price_tables(label, price),
  reviews(rating)
`;

function toCategorySummaries(links: CategoryLinkRow[]): VendorCategorySummary[] {
  return links
    .map((link) => link.vendor_categories)
    .filter((category): category is CategoryRow => category !== null)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      matchingModel: category.matching_model,
    }));
}

function toSummary(row: VendorListRow): VendorSummary {
  const categories = toCategorySummaries(row.vendor_category_links);
  const prices = row.vendor_price_tables.map((item) => Number(item.price));
  const ratings = row.reviews.map((review) => review.rating);
  const location = row.vendor_locations[0];

  return {
    id: row.id,
    name: row.display_name,
    description: row.description,
    city: location?.city ?? null,
    state: location?.state ?? null,
    categories,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    hasFixedPrice: categories.some((category) => category.matchingModel === "preco_fixo"),
    hasOnRequest: categories.some((category) => category.matchingModel !== "preco_fixo"),
    averageRating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
    reviewCount: ratings.length,
  };
}

export type VendorSearchFilters = {
  categorySlug?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
};

/**
 * Category filtering is pushed into the query (PostgREST embedded-resource
 * filter via !inner); city/rating/price are applied in-memory afterward.
 * At MVP scale (a handful of vendors per category) this is simpler and
 * safer than composing filters across a one-to-many location embed and a
 * client-computed rating average, both of which PostgREST can't filter on
 * directly.
 */
export async function searchVendors(
  supabase: SupabaseServerClient,
  filters: VendorSearchFilters,
): Promise<VendorSummary[]> {
  let query = supabase.from("vendors").select(LIST_SELECT);

  if (filters.categorySlug) {
    query = query.eq("vendor_category_links.vendor_categories.slug", filters.categorySlug);
  }

  const { data, error } = await query.returns<VendorListRow[]>();
  if (error) {
    throw error;
  }

  let vendors = (data ?? []).map(toSummary);

  if (filters.city) {
    const needle = filters.city.trim().toLowerCase();
    vendors = vendors.filter(
      (vendor) =>
        vendor.city?.toLowerCase().includes(needle) || vendor.state?.toLowerCase() === needle,
    );
  }

  if (filters.minRating) {
    const threshold = filters.minRating;
    vendors = vendors.filter((vendor) => (vendor.averageRating ?? 0) >= threshold);
  }

  if (filters.maxPrice) {
    const ceiling = filters.maxPrice;
    vendors = vendors.filter((vendor) => vendor.minPrice === null || vendor.minPrice <= ceiling);
  }

  return vendors;
}

export async function getVendorCategories(
  supabase: SupabaseServerClient,
): Promise<VendorCategorySummary[]> {
  const { data, error } = await supabase
    .from("vendor_categories")
    .select("id, slug, name, matching_model")
    .order("name", { ascending: true })
    .returns<CategoryRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    matchingModel: category.matching_model,
  }));
}

export async function getVendorCategoryBySlug(
  supabase: SupabaseServerClient,
  slug: string,
): Promise<VendorCategorySummary | null> {
  const { data, error } = await supabase
    .from("vendor_categories")
    .select("id, slug, name, matching_model")
    .eq("slug", slug)
    .maybeSingle<CategoryRow>();

  if (error) {
    throw error;
  }
  if (!data) return null;

  return { id: data.id, slug: data.slug, name: data.name, matchingModel: data.matching_model };
}

export async function getVendorById(
  supabase: SupabaseServerClient,
  vendorId: string,
): Promise<VendorDetail | null> {
  const { data, error } = await supabase
    .from("vendors")
    .select(`
      id, display_name, description, portfolio_urls,
      vendor_locations(city, state, service_radius_km),
      vendor_category_links!inner(vendor_categories!inner(id, slug, name, matching_model)),
      vendor_price_tables(label, price),
      reviews(id, rating, comment, created_at)
    `)
    .eq("id", vendorId)
    .maybeSingle<VendorDetailRow>();

  if (error) {
    throw error;
  }
  if (!data) return null;

  const summary = toSummary(data);
  const reviews: VendorReviewSummary[] = data.reviews
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
    }));

  return {
    ...summary,
    portfolioUrls: data.portfolio_urls,
    regions: data.vendor_locations.map((location) => ({
      city: location.city,
      state: location.state,
      serviceRadiusKm: location.service_radius_km,
    })),
    priceTable: data.vendor_price_tables.map((item) => ({ label: item.label, price: Number(item.price) })),
    reviews,
  };
}
