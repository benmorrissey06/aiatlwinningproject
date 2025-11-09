from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np


Number = Optional[float]


class FeatureEncoder:
    """
    Utility that mirrors the feature engineering that was used to train
    the RandomForest matching model.  It consumes the structured flash
    request JSON, seller profile JSON, and (optionally) a representative
    item JSON and produces the numeric feature row expected by the model.

    The joblib artefact ships with an explicit ordered list of feature
    column names.  We build a dense vector that matches that order so the
    estimator can operate exactly as it did during training.
    """

    def __init__(self, feature_names: Sequence[str]) -> None:
        self.feature_names: List[str] = list(feature_names)
        self.index_by_name: Dict[str, int] = {
            name: idx for idx, name in enumerate(self.feature_names)
        }
        self._prefix_cache: Dict[str, bool] = {}

    def encode(
        self,
        request: Dict[str, Any],
        seller_profile: Dict[str, Any],
        representative_item: Optional[Dict[str, Any]] = None,
    ) -> Tuple[np.ndarray, List[Tuple[str, float]]]:
        """
        Build a feature vector for a (request, seller_profile, item) triple.

        Returns the ndarray feature row along with a light-weight list of
        (feature_name, value) pairs that were activated.  The second return
        value is purely for debugging and observability and is capped to
        avoid flooding the API response.
        """
        vector = np.zeros(len(self.feature_names), dtype=np.float32)
        activated: List[Tuple[str, float]] = []

        def prefix_exists(prefix: str) -> bool:
            if prefix not in self._prefix_cache:
                target = f"{prefix}_"
                self._prefix_cache[prefix] = any(
                    name.startswith(target) for name in self.feature_names
                )
            return self._prefix_cache[prefix]

        def set_numeric(feature_name: str, value: Number) -> None:
            if value is None:
                return
            idx = self.index_by_name.get(feature_name)
            if idx is None:
                return
            try:
                numeric_value = float(value)
            except (TypeError, ValueError):
                return
            vector[idx] = numeric_value
            activated.append((feature_name, float(numeric_value)))

        def set_categorical(prefix: str, value: Optional[str]) -> None:
            if not prefix_exists(prefix):
                return
            cleaned = (value or "").strip()
            if not cleaned:
                nan_feature = f"{prefix}_nan"
                idx = self.index_by_name.get(nan_feature)
                if idx is not None:
                    vector[idx] = 1.0
                    activated.append((nan_feature, 1.0))
                return

            feature_name = f"{prefix}_{cleaned}"
            idx = self.index_by_name.get(feature_name)
            if idx is not None:
                vector[idx] = 1.0
                activated.append((feature_name, 1.0))
                return

            # Fallback to the explicit nan bucket if the feature was unseen
            nan_feature = f"{prefix}_nan"
            idx = self.index_by_name.get(nan_feature)
            if idx is not None:
                vector[idx] = 1.0
                activated.append((nan_feature, 1.0))

        def set_multi(prefix: str, values: Optional[Iterable[str]]) -> None:
            if not prefix_exists(prefix):
                return
            items = [item for item in (values or []) if isinstance(item, str) and item.strip()]
            if not items:
                nan_feature = f"{prefix}_nan"
                idx = self.index_by_name.get(nan_feature)
                if idx is not None:
                    vector[idx] = 1.0
                    activated.append((nan_feature, 1.0))
                return
            for item in items:
                set_categorical(prefix, item)

        # --- Flash Request features ---
        request_item_meta = request.get("item_meta", {}) or {}
        request_transaction = request.get("transaction", {}) or {}
        request_context = request.get("context", {}) or {}
        request_location = request.get("location", {}) or {}

        set_categorical("req_schema_type", request.get("schema_type"))
        set_categorical("req_item_meta_parsed_item", request_item_meta.get("parsed_item"))
        set_categorical("req_item_meta_category", request_item_meta.get("category"))
        set_multi("req_item_meta_tags", request_item_meta.get("tags"))

        set_categorical(
            "req_transaction_type_preferred", request_transaction.get("type_preferred")
        )
        set_numeric("req_transaction_price_max", request_transaction.get("price_max"))

        set_categorical("req_context_urgency", request_context.get("urgency"))
        set_categorical("req_context_reason", request_context.get("reason"))
        set_categorical("req_context_original_text", request_context.get("original_text"))

        set_categorical("req_location_text_input", request_location.get("text_input"))
        req_gps = request_location.get("device_gps") or {}
        set_numeric("req_location_device_gps_lat", req_gps.get("lat"))
        set_numeric("req_location_device_gps_lng", req_gps.get("lng"))

        # --- Seller Profile features ---
        seller_context = seller_profile.get("context", {}) or {}

        set_categorical("sp_schema_type", seller_profile.get("schema_type"))
        set_categorical("sp_user_id", seller_profile.get("user_id"))
        set_categorical("sp_inferred_major", seller_profile.get("inferred_major"))
        set_categorical(
            "sp_overall_dominant_transaction_type",
            seller_profile.get("overall_dominant_transaction_type"),
        )
        set_categorical("sp_context_original_text", seller_context.get("original_text"))
        set_multi("sp_inferred_location_keywords", seller_profile.get("inferred_location_keywords"))
        set_multi("sp_related_categories_of_interest", seller_profile.get("related_categories_of_interest"))

        # --- Representative item features ---
        item = representative_item or {}
        item_meta = item.get("item_meta", {}) or {}
        item_transaction = item.get("transaction", {}) or {}
        item_context = item.get("context", {}) or {}
        item_location = item.get("location", {}) or {}

        set_categorical("item_schema_type", item.get("schema_type"))
        set_categorical("item_item_meta_parsed_item", item_meta.get("parsed_item"))
        set_categorical("item_item_meta_category", item_meta.get("category"))
        set_multi("item_item_meta_tags", item_meta.get("tags"))

        set_categorical(
            "item_transaction_type_preferred", item_transaction.get("type_preferred")
        )
        set_numeric("item_transaction_price_max", item_transaction.get("price_max"))
        set_numeric("item_transaction_price", item_transaction.get("price"))

        set_categorical("item_context_original_text", item_context.get("original_text"))

        item_gps = item_location.get("device_gps") or {}
        set_numeric("item_location_device_gps_lat", item_gps.get("lat"))
        set_numeric("item_location_device_gps_lng", item_gps.get("lng"))
        set_categorical("item_location_text_input", item_location.get("text_input"))

        # Deduplicate activated features while preserving the original order.
        seen: set[str] = set()
        unique_activated: List[Tuple[str, float]] = []
        for name, value in activated:
            if name in seen:
                continue
            seen.add(name)
            unique_activated.append((name, value))

        return vector, unique_activated



