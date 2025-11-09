export interface FlashRequest {
  schema_type: "FLASH_REQUEST";
  item_meta: {
    parsed_item: string;
    category: string;
    tags: string[];
  };
  item_attributes: {
    primary: {
      size: string | null;
      color: string | null;
      condition_requested: string[];
    };
    secondary: {
      material: string | null;
      brand: string | null;
    };
  };
  transaction: {
    type_preferred: "buy" | "borrow";
    type_acceptable: ("buy" | "borrow")[];
    price_max: number | null;
  };
  context: {
    urgency: "immediate" | "high" | "medium" | "low";
    reason: string | null;
    original_text: string;
  };
  location: {
    text_input: string | null;
    device_gps: { lat: number; lng: number } | null;
  };
}

export interface SellerProfile {
  schema_type: "SELLER_PROFILE";
  user_id: string;
  context: {
    original_text: string;
  };
  profile_keywords: string[];
  inferred_major: string | null;
  inferred_location_keywords: string[];
  sales_history_summary: {
    category: string;
    item_examples: string[];
    total_items_sold: number;
    avg_price_per_item: number | null;
    dominant_transaction_type_in_category: "sell" | "lend" | "mixed";
  }[];
  overall_dominant_transaction_type: "sell" | "lend" | "mixed";
  related_categories_of_interest: string[];
}
