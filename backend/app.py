from __future__ import annotations

import asyncio
import json
import os
import random
import re
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

import httpx
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Depends, status, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

from .feature_encoder import FeatureEncoder
from .database import connect_db, close_db, get_db
from .models import (
    UserSchema, UserCreate, UserResponse, SellerProfileSchema,
    SalesHistorySummary, MessageSchema, MessageThreadSchema
)
from .auth import hash_password, verify_password, create_access_token, verify_token


ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT_DIR / "MLmodel" / "matchmaker_model.joblib"
COLUMNS_PATH = ROOT_DIR / "MLmodel" / "model_columns.json"
SYNTHETIC_DATA_DIR = ROOT_DIR / "synthetic-data"
CAMPUS_SELLERS_PATH = ROOT_DIR / "campus_sellers.json"

GEMINI_SERVICE_URL = os.getenv("GEMINI_SERVICE_URL", "http://127.0.0.1:3001")

if not MODEL_PATH.exists():
    raise RuntimeError(f"Expected to find model artefact at {MODEL_PATH}")

model = joblib.load(MODEL_PATH)
with open(COLUMNS_PATH, "r", encoding="utf-8") as fh:
    model_columns: List[str] = json.load(fh)

encoder = FeatureEncoder(model_columns)
positive_class_index = int(np.where(model.classes_ == 1)[0][0]) if hasattr(model, "classes_") else 1

DEMO_SELLER_PROFILES: List[Dict[str, Any]] = [
    {
        "user_id": "sustainable_style_aisha",
        "raw_text": "Austin-based sustainable fashion seller with over 140 eco-conscious apparel transactions.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "sustainable_style_aisha",
            "context": {
                "original_text": "Austin-based sustainable fashion seller with over 140 eco-conscious apparel transactions."
            },
            "profile_keywords": ["sustainable fashion", "eco textiles", "upcycled", "slow fashion", "austin"],
            "inferred_major": "Sustainability Studies",
            "inferred_location_keywords": ["Austin"],
            "sales_history_summary": [
                {
                    "category": "Eco-Friendly Apparel",
                    "item_examples": [
                        "recycled denim jacket with plant-based dyes",
                        "organic cotton tote bag with refillable clasp",
                        "hemp infinity scarf lined with cork buttons",
                    ],
                    "total_items_sold": 142,
                    "avg_price_per_item": 35.7,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Sustainable Accessories",
                    "item_examples": [
                        "reclaimed leather belt with brass buckle",
                        "bamboo loop earrings with natural lacquer",
                        "upcycled denim headwrap with herbal dye",
                    ],
                    "total_items_sold": 64,
                    "avg_price_per_item": 24.5,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Circular Fashion", "Eco Accessories"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Recycled denim jacket",
                "category": "Eco-Friendly Apparel",
                "tags": ["sustainable", "upcycled", "denim"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 50.0,
                "price": 48.0,
            },
            "context": {
                "urgency": "medium",
                "reason": "Campus sustainability showcase",
                "original_text": "Upcycled denim jacket tagged with sustainability markers and sizing notes.",
            },
            "location": {"text_input": "UT Austin Green Market", "device_gps": None},
        },
    },
    {
        "user_id": "miami_refurb_mateo",
        "raw_text": "Miami tech refurbisher handling laptops and accessories with verified condition guarantees.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "miami_refurb_mateo",
            "context": {
                "original_text": "Miami tech refurbisher handling laptops and accessories with verified condition guarantees."
            },
            "profile_keywords": ["refurbished electronics", "laptops", "warranty", "diagnostics", "miami"],
            "inferred_major": "Computer Engineering",
            "inferred_location_keywords": ["Miami"],
            "sales_history_summary": [
                {
                    "category": "Refurbished Tech",
                    "item_examples": [
                        "used MacBook Air 2020 with 12-month warranty",
                        "wireless gaming mouse (refurbished grade A)",
                        "refurbished iPad Mini with battery health swap",
                    ],
                    "total_items_sold": 95,
                    "avg_price_per_item": 325.0,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Verified Accessories",
                    "item_examples": [
                        "USB-C docking station with stress test log",
                        "noise-canceling headset tuned for latency",
                        "portable SSD 1TB with SMART report attached",
                    ],
                    "total_items_sold": 58,
                    "avg_price_per_item": 62.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Performance Accessories", "Tech Warranties"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Refurbished MacBook Air 2020 bundle",
                "category": "Refurbished Tech",
                "tags": ["verified", "laptop", "refurbished"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 680.0,
                "price": 650.0,
            },
            "context": {
                "urgency": "medium",
                "reason": "New semester enrollment",
                "original_text": "Verified-condition MacBook Air with battery health report and extended warranty offer.",
            },
            "location": {"text_input": "Miami Tech CoLab", "device_gps": None},
        },
    },
    {
        "user_id": "ai_art_evelyn",
        "raw_text": "Portland AI artist blending neural art prints with hand-crafted frames for sustainability-minded buyers.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "ai_art_evelyn",
            "context": {
                "original_text": "Portland AI artist blending neural art prints with hand-crafted frames for sustainability-minded buyers."
            },
            "profile_keywords": ["ai art", "handmade frames", "sustainability", "gallery", "portland"],
            "inferred_major": "Digital Arts",
            "inferred_location_keywords": ["Portland"],
            "sales_history_summary": [
                {
                    "category": "Art & Decor",
                    "item_examples": [
                        "eco print 'Neural Garden' with soy ink",
                        "recycled-wood frame set with cedar inlay",
                        "AI abstract 'Post-Human Bloom' on bamboo paper",
                    ],
                    "total_items_sold": 58,
                    "avg_price_per_item": 51.7,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Limited Series",
                    "item_examples": [
                        "AI canvas 'Retrofuture Roots'",
                        "neural sketch 'Rainforest Signals'",
                        "framed mini-print set 'Polymer Dreams'",
                    ],
                    "total_items_sold": 21,
                    "avg_price_per_item": 72.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Gallery Exhibits", "Sustainable Materials"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "AI print 'Neural Garden' with recycled frame",
                "category": "Art & Decor",
                "tags": ["ai", "sustainable", "print"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 65.0,
                "price": 60.0,
            },
            "context": {
                "urgency": "low",
                "reason": "Creative showcase pop-up",
                "original_text": "Limited-run AI print mounted in a recycled wood frame, signed and numbered.",
            },
            "location": {"text_input": "Portland Makers Collective", "device_gps": None},
        },
    },
    {
        "user_id": "diy_drone_rajesh",
        "raw_text": "Newark hobbyist crafting custom drones and RC components with technical documentation for buyers.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "diy_drone_rajesh",
            "context": {"original_text": "Newark hobbyist crafting custom drones and RC components with technical documentation for buyers."},
            "profile_keywords": ["custom drones", "rc components", "engineering", "telemetry", "newark"],
            "inferred_major": "Electrical Engineering",
            "inferred_location_keywords": ["Newark"],
            "sales_history_summary": [
                {
                    "category": "Custom Drones",
                    "item_examples": [
                        "3D-printed drone frame with carbon inserts",
                        "quadcopter with GPS module and telemetry",
                        "LiPo battery pack with balance charger",
                    ],
                    "total_items_sold": 77,
                    "avg_price_per_item": 150.0,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "RC Components",
                    "item_examples": [
                        "brushless motor kit with ESC tuning guide",
                        "FPV camera module with low-latency firmware",
                        "custom soldered flight controller stack",
                    ],
                    "total_items_sold": 49,
                    "avg_price_per_item": 92.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["FPV Racing", "Engineering Clubs"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Custom quadcopter with GPS",
                "category": "Custom Drones",
                "tags": ["drone", "gps", "custom build"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 265.0,
                "price": 250.0,
            },
            "context": {
                "urgency": "high",
                "reason": "Engineering race weekend",
                "original_text": "Hand-built quadcopter tuned for stability with GPS and telemetry modules, includes configuration notes.",
            },
            "location": {"text_input": "Newark Robotics Lab", "device_gps": None},
        },
    },
    {
        "user_id": "fair_trade_nia",
        "raw_text": "Minneapolis curator of fair-trade jewelry from African cooperatives with over 200 artisan accessory sales.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "fair_trade_nia",
            "context": {"original_text": "Minneapolis curator of fair-trade jewelry from African cooperatives with over 200 artisan accessory sales."},
            "profile_keywords": ["fair trade", "artisan jewelry", "african cooperatives", "storytelling", "minneapolis"],
            "inferred_major": "International Development",
            "inferred_location_keywords": ["Minneapolis"],
            "sales_history_summary": [
                {
                    "category": "Fair-Trade Jewelry",
                    "item_examples": [
                        "beaded Congolese necklace with recycled glass",
                        "woven bracelet from Ghana with Adinkra symbols",
                        "Tanzanian copper earrings with hammered finish",
                    ],
                    "total_items_sold": 210,
                    "avg_price_per_item": 29.7,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Story Collection",
                    "item_examples": [
                        "artisan story card set with QR code videos",
                        "community impact bracelet trio",
                        "limited anklet supporting cooperative fund",
                    ],
                    "total_items_sold": 88,
                    "avg_price_per_item": 18.5,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Nonprofit Partnerships", "Cultural Storytelling"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Fair-trade Congolese necklace",
                "category": "Fair-Trade Jewelry",
                "tags": ["artisan", "fair trade", "necklace"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 42.0,
                "price": 38.0,
            },
            "context": {
                "urgency": "medium",
                "reason": "Cultural showcase fundraiser",
                "original_text": "Handmade beaded necklace with cooperative origin story and donation allocation.",
            },
            "location": {"text_input": "Minneapolis Cultural Exchange Hall", "device_gps": None},
        },
    },
    {
        "user_id": "vintage_tools_tom",
        "raw_text": "Retired Boise carpenter restoring vintage woodworking tools with meticulous maintenance notes.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "vintage_tools_tom",
            "context": {"original_text": "Retired Boise carpenter restoring vintage woodworking tools with meticulous maintenance notes."},
            "profile_keywords": ["vintage tools", "woodworking", "restoration", "carpentry", "boise"],
            "inferred_major": "Carpentry",
            "inferred_location_keywords": ["Boise"],
            "sales_history_summary": [
                {
                    "category": "Restored Woodworking Tools",
                    "item_examples": [
                        "Stanley hand plane (1940s) tuned blade",
                        "cast-iron saw set with new oak handle",
                        "restored measuring square with brass inlay",
                    ],
                    "total_items_sold": 126,
                    "avg_price_per_item": 58.0,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Maintenance Kits",
                    "item_examples": [
                        "linseed oil care kit for antique handles",
                        "restoration guide booklet with step photos",
                        "precision sharpening stone tri-pack",
                    ],
                    "total_items_sold": 47,
                    "avg_price_per_item": 33.5,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Tool Collecting", "Workshop Restoration"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Restored Stanley hand plane",
                "category": "Restored Woodworking Tools",
                "tags": ["vintage", "woodworking", "restored"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 65.0,
                "price": 58.0,
            },
            "context": {
                "urgency": "low",
                "reason": "Collector showcase",
                "original_text": "1940s Stanley hand plane restored with detailed maintenance notes and sharpening guide.",
            },
            "location": {"text_input": "Boise Heritage Workshop", "device_gps": None},
        },
    },
    {
        "user_id": "minimal_decor_keiko",
        "raw_text": "San Francisco minimalist decor designer crafting Japanese-inspired pieces for modern apartments.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "minimal_decor_keiko",
            "context": {"original_text": "San Francisco minimalist decor designer crafting Japanese-inspired pieces for modern apartments."},
            "profile_keywords": ["minimalist decor", "japanese design", "ikebana", "modern home", "san francisco"],
            "inferred_major": "Industrial Design",
            "inferred_location_keywords": ["San Francisco"],
            "sales_history_summary": [
                {
                    "category": "Minimalist Home Decor",
                    "item_examples": [
                        "ceramic bonsai planter with matte glaze",
                        "origami-inspired lamp with rice paper shade",
                        "bamboo shelving set with hidden fasteners",
                    ],
                    "total_items_sold": 89,
                    "avg_price_per_item": 94.3,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Harmony Collections",
                    "item_examples": [
                        "matcha tea tray with slate accent",
                        "balance stones centerpiece kit",
                        "henshi incense holder with ash groove",
                    ],
                    "total_items_sold": 32,
                    "avg_price_per_item": 58.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Interior Styling", "Zen Living"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Origami-inspired minimalist lamp",
                "category": "Minimalist Home Decor",
                "tags": ["minimalist", "lighting", "japanese design"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 105.0,
                "price": 95.0,
            },
            "context": {
                "urgency": "low",
                "reason": "Apartment staging refresh",
                "original_text": "LED origami-inspired lamp crafted to balance light and shadow for serene spaces.",
            },
            "location": {"text_input": "SoMa Design Studio", "device_gps": None},
        },
    },
    {
        "user_id": "streetwear_jamal",
        "raw_text": "Atlanta sneaker and streetwear collector flipping limited drops with rapid sell-through and high engagement.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "streetwear_jamal",
            "context": {"original_text": "Atlanta sneaker and streetwear collector flipping limited drops with rapid sell-through and high engagement."},
            "profile_keywords": ["sneakers", "streetwear", "limited edition", "resell", "atlanta"],
            "inferred_major": "Marketing",
            "inferred_location_keywords": ["Atlanta"],
            "sales_history_summary": [
                {
                    "category": "Sneakers & Streetwear",
                    "item_examples": [
                        "Nike Dunk Low 'Panda' (deadstock)",
                        "Yeezy Boost 350 'Zebra' with authenticity tag",
                        "Supreme hoodie FW23 'City Grid'",
                    ],
                    "total_items_sold": 340,
                    "avg_price_per_item": 236.7,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Collector Drops",
                    "item_examples": [
                        "Travis Scott Air Jordan 1 swap pack",
                        "Fear of God Essentials crewneck (2024 run)",
                        "Palace tri-ferg tee limited release",
                    ],
                    "total_items_sold": 112,
                    "avg_price_per_item": 188.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Hype Drops", "Collector Communities"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Nike Dunk Low 'Panda'",
                "category": "Sneakers & Streetwear",
                "tags": ["limited", "sneaker", "resell"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 240.0,
                "price": 220.0,
            },
            "context": {
                "urgency": "immediate",
                "reason": "Streetwear swap meet",
                "original_text": "Deadstock Nike Dunk Low 'Panda' with original box and authentication receipts.",
            },
            "location": {"text_input": "Atlanta Sneaker Exchange", "device_gps": None},
        },
    },
    {
        "user_id": "edu_kits_lena",
        "raw_text": "Chicago physics education PhD crafting hands-on science kits with safety certifications and learning outcomes.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "edu_kits_lena",
            "context": {"original_text": "Chicago physics education PhD crafting hands-on science kits with safety certifications and learning outcomes."},
            "profile_keywords": ["STEM kits", "education", "hands-on learning", "safety certified", "chicago"],
            "inferred_major": "Physics Education",
            "inferred_location_keywords": ["Chicago"],
            "sales_history_summary": [
                {
                    "category": "Educational Kits",
                    "item_examples": [
                        "DIY microscope kit for grades 5-8",
                        "chemistry reaction box with safety goggles",
                        "solar power puzzle kit with mini panels",
                    ],
                    "total_items_sold": 62,
                    "avg_price_per_item": 45.0,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Classroom Bundles",
                    "item_examples": [
                        "phonics magnet lab with teacher guide",
                        "circuits discovery box with LED maze",
                        "planetarium projector kit with star maps",
                    ],
                    "total_items_sold": 38,
                    "avg_price_per_item": 52.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["STEM Outreach", "Learning Labs"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "DIY microscope science kit",
                "category": "Educational Kits",
                "tags": ["STEM", "education", "microscope"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 55.0,
                "price": 48.0,
            },
            "context": {
                "urgency": "medium",
                "reason": "Classroom enrichment week",
                "original_text": "Hands-on DIY microscope kit with safety-certified components and lesson plans.",
            },
            "location": {"text_input": "Chicago Learning Commons", "device_gps": None},
        },
    },
    {
        "user_id": "smart_home_omar",
        "raw_text": "Seattle smart home builder delivering Raspberry Pi automation kits with firmware support for early adopters.",
        "parsed_profile": {
            "schema_type": "SELLER_PROFILE",
            "user_id": "smart_home_omar",
            "context": {"original_text": "Seattle smart home builder delivering Raspberry Pi automation kits with firmware support for early adopters."},
            "profile_keywords": ["smart home", "raspberry pi", "automation", "firmware", "seattle"],
            "inferred_major": "Computer Science",
            "inferred_location_keywords": ["Seattle"],
            "sales_history_summary": [
                {
                    "category": "Smart Home Systems",
                    "item_examples": [
                        "Pi home controller kit with Zigbee bridge",
                        "motion sensor automation pack with scene scripts",
                        "indoor security camera module with Python API",
                    ],
                    "total_items_sold": 113,
                    "avg_price_per_item": 93.3,
                    "dominant_transaction_type_in_category": "sell",
                },
                {
                    "category": "Automation Add-ons",
                    "item_examples": [
                        "smart thermostat relay kit with Node-RED flow",
                        "rain sensor garden automation board",
                        "entryway smart lock retrofit module with firmware",
                    ],
                    "total_items_sold": 54,
                    "avg_price_per_item": 78.0,
                    "dominant_transaction_type_in_category": "sell",
                },
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["IoT Projects", "Home Automation"],
        },
        "representative_item": {
            "schema_type": "FLASH_REQUEST",
            "item_meta": {
                "parsed_item": "Raspberry Pi smart home controller kit",
                "category": "Smart Home Systems",
                "tags": ["raspberry pi", "automation", "smart home"],
            },
            "transaction": {
                "type_preferred": "sell",
                "type_acceptable": ["sell"],
                "price_max": 120.0,
                "price": 110.0,
            },
            "context": {
                "urgency": "medium",
                "reason": "Home automation installation",
                "original_text": "Comprehensive Pi-based controller kit with GitHub firmware links and setup documentation.",
            },
            "location": {"text_input": "Seattle Maker Garage", "device_gps": None},
        },
    },
]

DEMO_PROFILE_HISTORY: Dict[str, List[Dict[str, Any]]] = {
    "sustainable_style_aisha": [
        {
            "id": "aisha-001",
            "title": "Austin farmers market denim drop",
            "counterpartName": "Cam",
            "date": "2025-11-05T14:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "aisha-002",
            "title": "Organic cotton tote pre-order",
            "counterpartName": "Liv",
            "date": "2025-10-20T17:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "aisha-003",
            "title": "Cork-button hemp scarf commission",
            "counterpartName": "Marisol",
            "date": "2025-09-28T19:10:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "aisha-004",
            "title": "Campus zero-waste runway fittings",
            "counterpartName": "Dylan",
            "date": "2025-08-30T22:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "aisha-005",
            "title": "Reclaimed leather belt swap",
            "counterpartName": "Pri",
            "date": "2025-07-18T18:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "aisha-006",
            "title": "Bamboo earrings collaboration",
            "counterpartName": "Greta",
            "date": "2025-06-05T16:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "aisha-007",
            "title": "Repair clinic denim tailoring",
            "counterpartName": "Leo",
            "date": "2025-05-22T21:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "aisha-008",
            "title": "Eco gala styling package",
            "counterpartName": "Fern",
            "date": "2025-04-10T20:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
    ],
    "miami_refurb_mateo": [
        {
            "id": "mateo-001",
            "title": "MacBook Air 2020 diagnostics bundle",
            "counterpartName": "Shay",
            "date": "2025-11-03T15:20:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "mateo-002",
            "title": "Gaming mouse latency tune-up",
            "counterpartName": "Raj",
            "date": "2025-10-16T18:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "mateo-003",
            "title": "iPad Mini battery replacement handoff",
            "counterpartName": "Isa",
            "date": "2025-09-26T19:35:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "mateo-004",
            "title": "USB-C dock stress test report",
            "counterpartName": "Noel",
            "date": "2025-08-29T21:10:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "mateo-005",
            "title": "Noise-canceling headset refurb",
            "counterpartName": "Lena",
            "date": "2025-07-21T20:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "mateo-006",
            "title": "SSD diagnostics upload",
            "counterpartName": "Vic",
            "date": "2025-06-30T17:25:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "mateo-007",
            "title": "Warranty consult for campus IT",
            "counterpartName": "Ari",
            "date": "2025-05-12T13:50:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "mateo-008",
            "title": "Surface laptop logic board rescue",
            "counterpartName": "Kai",
            "date": "2025-04-07T18:30:00Z",
            "status": "FAILED",
            "notes": "Board corrosion beyond recovery – deposit refunded",
        },
    ],
    "ai_art_evelyn": [
        {
            "id": "evelyn-001",
            "title": "Neural Garden gallery pickup",
            "counterpartName": "Rowan",
            "date": "2025-11-01T22:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "evelyn-002",
            "title": "Recycled cedar frame delivery",
            "counterpartName": "Elle",
            "date": "2025-10-18T19:40:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "evelyn-003",
            "title": "Post-Human Bloom limited print",
            "counterpartName": "Theo",
            "date": "2025-09-14T20:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "evelyn-004",
            "title": "Retrofuture Roots canvas commission",
            "counterpartName": "Mika",
            "date": "2025-08-26T18:20:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "evelyn-005",
            "title": "Rainforest Signals print install",
            "counterpartName": "Jun",
            "date": "2025-07-30T21:55:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "evelyn-006",
            "title": "Polymer Dreams triptych loan",
            "counterpartName": "Nia",
            "date": "2025-06-25T18:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "evelyn-007",
            "title": "Frame repair for eco market",
            "counterpartName": "Cleo",
            "date": "2025-05-19T17:10:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "evelyn-008",
            "title": "Gallery install reschedule",
            "counterpartName": "ArtLab",
            "date": "2025-04-03T16:05:00Z",
            "status": "CANCELLED",
            "notes": "Client delayed venue opening – deposit credited",
        },
    ],
    "diy_drone_rajesh": [
        {
            "id": "rajesh-001",
            "title": "GPS quadcopter race tune",
            "counterpartName": "Milo",
            "date": "2025-11-06T18:50:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "rajesh-002",
            "title": "Telemetry coaching session",
            "counterpartName": "Anika",
            "date": "2025-10-10T16:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "rajesh-003",
            "title": "FPV camera low-light upgrade",
            "counterpartName": "Zed",
            "date": "2025-09-21T20:25:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "rajesh-004",
            "title": "ESC tuning workshop",
            "counterpartName": "Ravi",
            "date": "2025-08-15T19:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "rajesh-005",
            "title": "LiPo battery safety refresh",
            "counterpartName": "Jae",
            "date": "2025-07-27T17:35:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "rajesh-006",
            "title": "3D-printed frame swap",
            "counterpartName": "Omar",
            "date": "2025-06-18T15:40:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "rajesh-007",
            "title": "Flight controller solder repair",
            "counterpartName": "Nico",
            "date": "2025-05-02T21:55:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "rajesh-008",
            "title": "Drone scrimmage delivery delay",
            "counterpartName": "STEM Club",
            "date": "2025-03-29T18:05:00Z",
            "status": "CANCELLED",
            "notes": "Client postponed the race meet due to weather",
        },
    ],
    "fair_trade_nia": [
        {
            "id": "nia-001",
            "title": "Congolese beadwork showcase",
            "counterpartName": "Ivy",
            "date": "2025-11-04T17:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "nia-002",
            "title": "Ghana bracelet storytelling booth",
            "counterpartName": "Rekha",
            "date": "2025-10-13T19:50:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "nia-003",
            "title": "Tanzanian copper earrings drop",
            "counterpartName": "Olu",
            "date": "2025-09-19T18:35:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "nia-004",
            "title": "Story cards printing fulfillment",
            "counterpartName": "Grace",
            "date": "2025-08-24T15:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "nia-005",
            "title": "Impact bracelet trio fundraiser",
            "counterpartName": "Leo",
            "date": "2025-07-16T16:25:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "nia-006",
            "title": "Anklet cooperative restock",
            "counterpartName": "Tari",
            "date": "2025-06-08T20:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "nia-007",
            "title": "Cultural showcase livestream",
            "counterpartName": "BridgeOrg",
            "date": "2025-05-04T21:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "nia-008",
            "title": "Donation split planning session",
            "counterpartName": "Co-op Council",
            "date": "2025-03-22T17:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
    ],
    "vintage_tools_tom": [
        {
            "id": "tom-001",
            "title": "Stanley plane restoration drop-off",
            "counterpartName": "Harper",
            "date": "2025-11-02T18:40:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "tom-002",
            "title": "Cast-iron saw set appointment",
            "counterpartName": "Finn",
            "date": "2025-10-12T17:20:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "tom-003",
            "title": "Brass square calibration",
            "counterpartName": "Mason",
            "date": "2025-09-17T19:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "tom-004",
            "title": "Linseed care kit handover",
            "counterpartName": "Inez",
            "date": "2025-08-21T15:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "tom-005",
            "title": "Restoration guide workshop",
            "counterpartName": "Judge",
            "date": "2025-07-25T16:50:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "tom-006",
            "title": "Sharpening stone tutorial",
            "counterpartName": "Pam",
            "date": "2025-06-14T14:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "tom-007",
            "title": "Collector showcase staging",
            "counterpartName": "Orson",
            "date": "2025-05-08T19:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "tom-008",
            "title": "Antique lathe parts sourcing",
            "counterpartName": "Marla",
            "date": "2025-04-02T12:55:00Z",
            "status": "FAILED",
            "notes": "Supplier ran out of compatible bearings",
        },
    ],
    "minimal_decor_keiko": [
        {
            "id": "keiko-001",
            "title": "Origami lamp loft install",
            "counterpartName": "Aya",
            "date": "2025-11-07T21:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "keiko-002",
            "title": "Ceramic bonsai planter styling",
            "counterpartName": "Noah",
            "date": "2025-10-22T18:40:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "keiko-003",
            "title": "Bamboo shelving custom fit",
            "counterpartName": "Wes",
            "date": "2025-09-29T20:10:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "keiko-004",
            "title": "Matcha tray centerpiece design",
            "counterpartName": "Iris",
            "date": "2025-08-19T19:20:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "keiko-005",
            "title": "Balance stones mindfulness set",
            "counterpartName": "Luz",
            "date": "2025-07-31T18:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "keiko-006",
            "title": "Incense holder gallery event",
            "counterpartName": "Dev",
            "date": "2025-06-27T17:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "keiko-007",
            "title": "Zen micro-apartment consult",
            "counterpartName": "Kai",
            "date": "2025-05-06T14:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "keiko-008",
            "title": "Studio install reschedule",
            "counterpartName": "SOMA Hub",
            "date": "2025-03-25T16:25:00Z",
            "status": "CANCELLED",
            "notes": "Client requested redesign for lighting plan",
        },
    ],
    "streetwear_jamal": [
        {
            "id": "jamal-001",
            "title": "Nike Dunk Low 'Panda' handoff",
            "counterpartName": "KC",
            "date": "2025-11-07T18:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "jamal-002",
            "title": "Yeezy Boost 350 'Zebra' flip",
            "counterpartName": "JB",
            "date": "2025-11-03T15:10:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "jamal-003",
            "title": "Supreme City Grid hoodie trade",
            "counterpartName": "MT",
            "date": "2025-10-27T16:25:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "jamal-004",
            "title": "Travis Scott AJ1 swap meet",
            "counterpartName": "AL",
            "date": "2025-10-12T14:50:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "jamal-005",
            "title": "Fear of God crewneck drop",
            "counterpartName": "JB",
            "date": "2025-09-02T17:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "jamal-006",
            "title": "Palace tri-ferg tee overnight ship",
            "counterpartName": "MT",
            "date": "2025-08-18T13:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "jamal-007",
            "title": "Sneaker summit raffle assist",
            "counterpartName": "JB",
            "date": "2025-07-23T21:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "jamal-008",
            "title": "Streetwear livestream no-show",
            "counterpartName": "KC",
            "date": "2025-07-05T18:00:00Z",
            "status": "FAILED",
            "notes": "Buyer missed scheduled livestream pickup",
        },
    ],
    "edu_kits_lena": [
        {
            "id": "lena-001",
            "title": "DIY microscope fair delivery",
            "counterpartName": "Aria",
            "date": "2025-11-02T13:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "lena-002",
            "title": "Chemistry reaction box lab",
            "counterpartName": "Bo",
            "date": "2025-10-15T16:20:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "lena-003",
            "title": "Solar puzzle STEM night",
            "counterpartName": "Jules",
            "date": "2025-09-25T18:30:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "lena-004",
            "title": "Phonics magnet classroom kit",
            "counterpartName": "Kim",
            "date": "2025-08-31T15:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "lena-005",
            "title": "Circuits discovery box workshop",
            "counterpartName": "Mon",
            "date": "2025-07-28T20:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "lena-006",
            "title": "Planetarium projector kit install",
            "counterpartName": "Rio",
            "date": "2025-06-19T17:40:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "lena-007",
            "title": "Teacher training webinar",
            "counterpartName": "STEM Lab",
            "date": "2025-05-09T19:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "lena-008",
            "title": "Safety certification renewal",
            "counterpartName": "City Schools",
            "date": "2025-03-27T12:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
    ],
    "smart_home_omar": [
        {
            "id": "omar-001",
            "title": "Pi controller install with Zigbee",
            "counterpartName": "Nikhil",
            "date": "2025-11-06T20:40:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "omar-002",
            "title": "Motion automation script setup",
            "counterpartName": "Safa",
            "date": "2025-10-11T18:25:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "omar-003",
            "title": "Indoor camera firmware handoff",
            "counterpartName": "Wren",
            "date": "2025-09-22T19:35:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "omar-004",
            "title": "Smart thermostat relay retrofit",
            "counterpartName": "El",
            "date": "2025-08-16T17:15:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "omar-005",
            "title": "Rain sensor garden automation",
            "counterpartName": "Jia",
            "date": "2025-07-19T15:45:00Z",
            "status": "SUCCESS",
            "ratingGiven": 4,
        },
        {
            "id": "omar-006",
            "title": "Entryway smart lock firmware push",
            "counterpartName": "Hugo",
            "date": "2025-06-24T20:05:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "omar-007",
            "title": "Home lab GitHub training",
            "counterpartName": "UW Robotics",
            "date": "2025-05-18T22:00:00Z",
            "status": "SUCCESS",
            "ratingGiven": 5,
        },
        {
            "id": "omar-008",
            "title": "Sensor array parts shortage",
            "counterpartName": "Makers Co",
            "date": "2025-04-01T19:25:00Z",
            "status": "FAILED",
            "notes": "Vendor backorder delayed automation install",
        },
    ],
}


WORD_RE = re.compile(r"[A-Za-z0-9']+")


def tokenize(text: Optional[str]) -> List[str]:
    if not text:
        return []
    return [token.lower() for token in WORD_RE.findall(str(text)) if len(token) > 2]


def tokens_from_iterable(values: Optional[Iterable[Any]]) -> Set[str]:
    tokens: Set[str] = set()
    if not values:
        return tokens
    for value in values:
        tokens.update(tokenize(value))
    return tokens


def build_seller_keyword_index() -> Dict[str, Set[str]]:
    index: Dict[str, Set[str]] = {}
    for entry in DEMO_SELLER_PROFILES:
        tokens: Set[str] = set()
        tokens.update(tokenize(entry.get("raw_text")))

        parsed_profile = entry.get("parsed_profile") or {}
        tokens.update(tokens_from_iterable(parsed_profile.get("profile_keywords")))
        tokens.update(tokens_from_iterable(parsed_profile.get("related_categories_of_interest")))

        for summary in parsed_profile.get("sales_history_summary") or []:
            tokens.update(tokenize(summary.get("category")))
            tokens.update(tokens_from_iterable(summary.get("item_examples")))

        representative_item = entry.get("representative_item") or {}
        item_meta = representative_item.get("item_meta") or {}
        tokens.update(tokenize(item_meta.get("parsed_item")))
        tokens.update(tokens_from_iterable(item_meta.get("tags")))

        item_context = representative_item.get("context") or {}
        tokens.update(tokenize(item_context.get("original_text")))

        index[entry["user_id"]] = {token for token in tokens if token}
    return index


SELLER_KEYWORD_INDEX = build_seller_keyword_index()

SELLER_CATEGORY_BY_USER: Dict[str, Optional[str]] = {
    entry["user_id"]: ((entry.get("representative_item") or {}).get("item_meta") or {}).get("category")
    for entry in DEMO_SELLER_PROFILES
}

_category_keywords: Dict[str, Set[str]] = defaultdict(set)
_category_canonical: Dict[str, str] = {}
for entry in DEMO_SELLER_PROFILES:
    category = ((entry.get("representative_item") or {}).get("item_meta") or {}).get("category")
    if not category:
        continue
    key = category.lower()
    _category_canonical.setdefault(key, category)
    _category_keywords[key].update(SELLER_KEYWORD_INDEX.get(entry["user_id"], set()))

CATEGORY_KEYWORD_INDEX: Dict[str, Tuple[str, Set[str]]] = {
    key: (_category_canonical[key], keywords)
    for key, keywords in _category_keywords.items()
}


def infer_category_from_tokens(tokens: Set[str]) -> Optional[str]:
    best_category: Optional[str] = None
    best_score = 0
    for key, (canonical, keywords) in CATEGORY_KEYWORD_INDEX.items():
        score = len(tokens & keywords)
        if score > best_score:
            best_score = score
            best_category = canonical
    if best_category and best_score >= 2:
        return best_category
    return None


def extract_request_tokens(request_record: Dict[str, Any]) -> Set[str]:
    tokens: Set[str] = set()
    tokens.update(tokenize(request_record.get("raw_text")))

    parsed_request = request_record.get("parsed_request") or {}
    item_meta = parsed_request.get("item_meta") or {}
    tokens.update(tokenize(item_meta.get("parsed_item")))
    tokens.update(tokenize(item_meta.get("category")))
    tokens.update(tokens_from_iterable(item_meta.get("tags")))

    context = parsed_request.get("context") or {}
    tokens.update(tokenize(context.get("reason")))
    tokens.update(tokenize(context.get("original_text")))

    location = parsed_request.get("location") or {}
    tokens.update(tokenize(location.get("text_input")))

    metadata = request_record.get("metadata") or {}
    tokens.update(tokens_from_iterable(metadata.values() if isinstance(metadata, dict) else []))

    return {token for token in tokens if token}


def _format_display_name(user_id: str) -> str:
    return " ".join(part.capitalize() for part in user_id.split("_"))


def build_profile_history_summary(user_id: str, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_transactions = len(transactions)
    successful = [t for t in transactions if t.get("status") == "SUCCESS"]
    rating_values = [t.get("ratingGiven", 0) for t in successful if t.get("ratingGiven")]
    average_rating = round(sum(rating_values) / len(rating_values), 2) if rating_values else 0.0

    return {
        "userId": user_id,
        "displayName": _format_display_name(user_id),
        "avatarUrl": None,
        "totalTransactions": total_transactions,
        "successfulTransactions": len(successful),
        "averageRating": average_rating,
        "ratingCount": len(rating_values),
    }


app = FastAPI(
    title="Flash Matchmaker Service",
    version="0.1.0",
    description="Glue layer between the Gemini parsers, matching model, and UI.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FlashRequestCreate(BaseModel):
    text: str = Field(..., description="Raw flash request free-form text")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional structured metadata collected from the UI wizard.",
    )


class SellerProfileCreate(BaseModel):
    user_id: str = Field(..., description="Stable identifier supplied by the client/UI")
    text: str = Field(..., description="Seller profile free-form text blob to parse")
    metadata: Optional[Dict[str, Any]] = None


class PingMatchesRequest(BaseModel):
    matchIds: List[str] = Field(default_factory=list)
    broadcastType: Optional[str] = Field(
        default=None, description="Either 'narrow', 'wide', or omitted for direct pings"
    )


flash_requests: Dict[str, Dict[str, Any]] = {}
seller_profiles: Dict[str, Dict[str, Any]] = {}
message_threads: Dict[str, Dict[str, Any]] = {}  # threadId -> thread data
thread_messages: Dict[str, List[Dict[str, Any]]] = {}  # threadId -> list of messages
user_threads: Dict[str, str] = {}  # userId -> threadId mapping (for current user)


async def call_gemini_parser(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{GEMINI_SERVICE_URL.rstrip('/')}{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail={
                "message": "Gemini parsing service returned an error",
                "payload": exc.response.json() if exc.response.content else None,
            },
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail={"message": f"Gemini parsing service is unavailable: {exc}"},
        ) from exc


def urgency_from_ui(urgency_idx: Optional[int]) -> Optional[str]:
    if urgency_idx is None:
        return None
    mapping = {
        0: "immediate",
        1: "high",
        2: "medium",
        3: "low",
    }
    return mapping.get(int(urgency_idx))


def apply_request_metadata(parsed: Dict[str, Any], metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not metadata:
        return parsed

    parsed = json.loads(json.dumps(parsed))  # deep copy to avoid aliasing

    item_meta = parsed.setdefault("item_meta", {})
    context = parsed.setdefault("context", {})
    location = parsed.setdefault("location", {})
    transaction = parsed.setdefault("transaction", {})

    detected_category = metadata.get("detectedCategory") or metadata.get("category")
    if detected_category:
        item_meta["category"] = detected_category

    quantity = metadata.get("quantity")
    if quantity:
        tags = set(item_meta.get("tags") or [])
        tags.add(f"quantity:{quantity}")
        item_meta["tags"] = sorted(tags)

    when_text = metadata.get("when")
    if when_text:
        context["reason"] = when_text

    location_text = metadata.get("location")
    if location_text:
        location["text_input"] = location_text

    urgency_value = metadata.get("urgency")
    urgency_label = urgency_from_ui(urgency_value)
    if urgency_label:
        context["urgency"] = urgency_label

    price_max = metadata.get("priceMax")
    if price_max is not None:
        try:
            transaction["price_max"] = float(price_max)
        except (TypeError, ValueError):
            pass

    return parsed


def build_representative_item(profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    history: List[Dict[str, Any]] = profile.get("sales_history_summary") or []
    if not history:
        return None

    best_entry = max(history, key=lambda entry: entry.get("total_items_sold") or 0)
    examples = best_entry.get("item_examples") or []
    parsed_item = next(
        (example for example in examples if isinstance(example, str) and example.strip()),
        best_entry.get("category"),
    )

    inferred_locations = profile.get("inferred_location_keywords") or []
    location_text = next(
        (loc for loc in inferred_locations if isinstance(loc, str) and loc.strip()),
        None,
    )

    dominant = profile.get("overall_dominant_transaction_type") or "sell"
    if dominant not in {"sell", "lend", "buy"}:
        dominant = "sell"

    avg_price = best_entry.get("avg_price_per_item")

    representative = {
        "schema_type": "FLASH_REQUEST",
        "item_meta": {
            "parsed_item": parsed_item or best_entry.get("category") or "",
            "category": best_entry.get("category") or "",
            "tags": examples[1:4],
        },
        "transaction": {
            "type_preferred": dominant,
            "type_acceptable": [dominant],
            "price_max": avg_price,
            "price": avg_price,
        },
        "context": {
            "urgency": "medium",
            "reason": "Derived from seller profile history",
            "original_text": "; ".join(examples[:3]) or best_entry.get("category") or "",
        },
        "location": {
            "text_input": location_text,
            "device_gps": None,
        },
    }
    return representative


def pseudo_random(seed_input: str) -> random.Random:
    seed = hash(seed_input) & 0xFFFFFFFF
    return random.Random(seed)


# Cache for user names to avoid repeated database queries
_user_name_cache: Dict[str, str] = {}

def display_name_from_user_id(user_id: str) -> str:
    """
    Get the actual user name from the database cache or formatted user_id.
    Note: This is a synchronous function, so it uses a cache that should be
    populated by async functions that fetch user data.
    """
    if not user_id:
        return "Unknown Seller"
    
    # Check cache first
    if user_id in _user_name_cache:
        return _user_name_cache[user_id]
    
    # Fallback: format the user_id as a name
    cleaned = user_id.replace("_", " ").replace("-", " ").strip()
    parts = cleaned.split()
    formatted_name = " ".join(part.capitalize() for part in parts if part)
    return formatted_name


async def fetch_user_name_from_db(user_id: str) -> str:
    """
    Async function to fetch user name from database and update cache.
    Call this before building matches to populate the cache.
    """
    if not user_id:
        return "Unknown Seller"
    
    # Check cache first
    if user_id in _user_name_cache:
        return _user_name_cache[user_id]
    
    try:
        db = get_db()
        if db:
            # Try to find user by ObjectId
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if user and user.get("name"):
                    _user_name_cache[user_id] = user["name"]
                    return user["name"]
            except Exception as e:
                # If ObjectId conversion fails, try finding by string user_id
                print(f"[WARNING] Could not convert {user_id} to ObjectId: {e}")
                pass
    except Exception as e:
        # Database unavailable or error
        print(f"[WARNING] Could not fetch user name for {user_id}: {e}")
    
    # Fallback: format the user_id as a name
    cleaned = user_id.replace("_", " ").replace("-", " ").strip()
    parts = cleaned.split()
    formatted_name = " ".join(part.capitalize() for part in parts if part)
    _user_name_cache[user_id] = formatted_name
    return formatted_name


def score_profile_for_ui(profile: Dict[str, Any], request_id: str) -> Dict[str, Any]:
    rng = pseudo_random(f"{profile.get('user_id')}::{request_id}")
    rating = round(rng.uniform(4.2, 4.95), 2)
    trust_score = int(rng.uniform(78, 98))
    past_trades = int(rng.uniform(8, 45))
    badges = []
    if trust_score > 90:
        badges.append("Top Helper")
    if rng.random() > 0.3:
        badges.append("Verified Student")
    return {
        "rating": rating,
        "trustScore": trust_score,
        "pastTrades": past_trades,
        "badges": badges,
    }


def compute_shared_traits(request: Dict[str, Any], profile: Dict[str, Any], item: Optional[Dict[str, Any]]) -> List[str]:
    traits: List[str] = []
    request_category = (request.get("item_meta") or {}).get("category")
    item_category = (item or {}).get("item_meta", {}).get("category") if item else None
    seller_major = profile.get("inferred_major")

    if request_category and item_category and request_category.lower() == item_category.lower():
        traits.append("Same category speciality")
    if seller_major:
        traits.append(f"{seller_major} major")
    location_keywords = profile.get("inferred_location_keywords") or []
    if location_keywords:
        traits.append(f"Near {location_keywords[0]}")
    if not traits:
        traits.append("Active campus seller")
    return traits


def encode_and_score(request_record: Dict[str, Any], profile_record: Dict[str, Any]) -> Tuple[float, List[Tuple[str, float]]]:
    feature_row, activated = encoder.encode(
        request_record["parsed_request"],
        profile_record["parsed_profile"],
        profile_record.get("representative_item"),
    )
    probabilities = model.predict_proba([feature_row])[0]
    probability = float(probabilities[positive_class_index])
    return probability, activated


def seed_profiles_from_synthetic(limit: int = 150) -> int:
    if not SYNTHETIC_DATA_DIR.exists():
        return 0
    loaded = 0
    for json_path in sorted(SYNTHETIC_DATA_DIR.glob("*.json")):
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        seller_profile = data.get("seller_profile")
        actual_item = data.get("actual_item")
        if not seller_profile or not seller_profile.get("user_id"):
            continue
        user_id = seller_profile["user_id"]
        if user_id in seller_profiles:
            continue
        seller_profiles[user_id] = {
            "user_id": user_id,
            "parsed_profile": seller_profile,
            "raw_text": (seller_profile.get("context") or {}).get("original_text"),
            "representative_item": actual_item,
            "created_at": datetime.utcnow().isoformat(),
            "source": "synthetic",
            "metadata": {"seed_path": str(json_path)},
        }
        loaded += 1
        if limit and loaded >= limit:
            break
    return loaded


def load_demo_profiles() -> int:
    global seller_profiles
    seller_profiles.clear()
    inserted = 0
    for entry in DEMO_SELLER_PROFILES:
        user_id = entry["user_id"]
        if user_id in seller_profiles:
            continue
        seller_profiles[user_id] = {
            "user_id": user_id,
            "parsed_profile": entry["parsed_profile"],
            "raw_text": entry.get("raw_text"),
            "representative_item": entry.get("representative_item"),
            "created_at": datetime.utcnow().isoformat(),
            "source": "demo",
            "metadata": {"note": "demo_profile"},
        }
        inserted += 1
    return inserted


async def build_match_payload(request_id: str, request_record: Dict[str, Any]) -> Dict[str, Any]:
    matches: List[Dict[str, Any]] = []
    parsed_request = request_record.get("parsed_request") or {}
    item_meta = parsed_request.setdefault("item_meta", {}) or {}

    request_tokens = extract_request_tokens(request_record)
    request_category = (item_meta.get("category") or "").strip()

    if not request_category:
        inferred_category = infer_category_from_tokens(request_tokens)
        if inferred_category:
            item_meta["category"] = inferred_category
            request_category = inferred_category

    request_tag_tokens: Set[str] = set()
    for tag in item_meta.get("tags") or []:
        request_tag_tokens.update(tokenize(tag))

    # Pre-fetch all user names from database to populate cache
    user_ids_to_fetch = list(set([profile["user_id"] for profile in seller_profiles.values()]))
    try:
        db = get_db()
        if db:
            # Fetch all users in parallel
            fetch_tasks = []
            valid_user_ids = []
            for user_id in user_ids_to_fetch:
                try:
                    # Try to convert to ObjectId - if it fails, skip this user_id
                    obj_id = ObjectId(user_id)
                    fetch_tasks.append(db.users.find_one({"_id": obj_id}))
                    valid_user_ids.append(user_id)
                except Exception:
                    # user_id is not a valid ObjectId format, skip it
                    pass
            
            if fetch_tasks:
                users = await asyncio.gather(*fetch_tasks, return_exceptions=True)
                for idx, user in enumerate(users):
                    if isinstance(user, dict) and user.get("_id") and user.get("name"):
                        user_id_str = valid_user_ids[idx]
                        _user_name_cache[user_id_str] = user["name"]
                        # Also cache by ObjectId string format
                        _user_name_cache[str(user["_id"])] = user["name"]
    except Exception as e:
        print(f"[WARNING] Could not pre-fetch user names: {e}")

    for profile in seller_profiles.values():
        probability, activated = encode_and_score(request_record, profile)
        rng = pseudo_random(f"{request_id}::{profile['user_id']}")
        distance_minutes = round(rng.uniform(0.2, 3.5), 2)
        traits = compute_shared_traits(
            request_record["parsed_request"],
            profile["parsed_profile"],
            profile.get("representative_item"),
        )

        seller_id = profile["user_id"]
        seller_keywords = SELLER_KEYWORD_INDEX.get(seller_id, set())
        keyword_overlap = len(request_tokens & seller_keywords)

        representative_item = profile.get("representative_item") or {}
        rep_item_meta = representative_item.get("item_meta") or {}
        rep_category = (rep_item_meta.get("category") or "").strip()
        category_match = (
            bool(request_category)
            and bool(rep_category)
            and request_category.lower() == rep_category.lower()
        )

        seller_tag_tokens: Set[str] = set()
        for tag in rep_item_meta.get("tags") or []:
            seller_tag_tokens.update(tokenize(tag))
        tag_overlap = len(request_tag_tokens & seller_tag_tokens)

        boost = min(keyword_overlap * 0.05, 0.25)
        if category_match:
            boost += 0.15
        if tag_overlap:
            boost += min(tag_overlap * 0.04, 0.12)

        boosted_probability = min(probability + boost, 0.999)

        ui_stats = score_profile_for_ui(profile["parsed_profile"], request_id)
        matches.append(
            {
                "user": {
                    "id": profile["user_id"],
                    "name": display_name_from_user_id(profile["user_id"]),
                    "major": profile["parsed_profile"].get("inferred_major") or "Undeclared",
                    "dorm": (profile["parsed_profile"].get("inferred_location_keywords") or ["On campus"])[0],
                    "verified": "Verified Student" in ui_stats["badges"],
                    **ui_stats,
                },
                "likelihood": round(boosted_probability * 100, 1),
                "distanceMin": distance_minutes,
                "sharedTraits": traits,
                "debug": {
                    "probability": boosted_probability,
                    "modelProbability": probability,
                    "activatedFeatures": activated[:40],
                    "representativeItem": profile.get("representative_item"),
                    "sellerProfile": profile.get("parsed_profile"),
                    "source": profile.get("source"),
                    "heuristics": {
                        "keywordOverlap": keyword_overlap,
                        "categoryMatch": category_match,
                        "tagOverlap": tag_overlap,
                        "boostApplied": round(max(boosted_probability - probability, 0.0), 4),
                    },
                },
            }
        )

    matches.sort(key=lambda item: item["likelihood"], reverse=True)
    diversified: List[Dict[str, Any]] = []
    seen_categories: set[str] = set()
    for match in matches:
        category = (
            (match.get("debug") or {})
            .get("representativeItem", {})
            .get("item_meta", {})
            .get("category")
        )
        normalized = category.lower() if isinstance(category, str) else None
        if normalized and normalized in seen_categories:
            continue
        if normalized:
            seen_categories.add(normalized)
        diversified.append(match)
        if len(diversified) >= 10:
            break

    if len(diversified) < min(len(matches), 25):
        for match in matches:
            if match in diversified:
                continue
            diversified.append(match)
            if len(diversified) >= min(len(matches), 25):
                break

    top_matches = diversified

    return {
        "success": True,
        "requestId": request_id,
        "request": request_record["parsed_request"],
        "matches": top_matches,
        "debug": {
            "model": {
                "type": type(model).__name__,
                "positiveClassIndex": positive_class_index,
                "featureCount": len(model_columns),
                "artifact": MODEL_PATH.name,
            },
            "requestMetadata": request_record.get("metadata"),
            "generatedAt": datetime.utcnow().isoformat(),
        },
    }


@app.on_event("startup")
async def startup_event() -> None:
    # Connect to MongoDB (non-blocking if it fails)
    try:
        await connect_db()
        # Pre-populate user name cache from database
        try:
            db = get_db()
            if db:
                users_cursor = db.users.find({})
                users = await users_cursor.to_list(length=1000)
                for user in users:
                    if user.get("_id") and user.get("name"):
                        user_id_str = str(user["_id"])
                        _user_name_cache[user_id_str] = user["name"]
                print(f"[OK] Loaded {len(_user_name_cache)} user names into cache")
        except Exception as e:
            print(f"[WARNING] Could not pre-populate user name cache: {e}")
    except Exception as e:
        print(f"[WARNING] MongoDB connection failed on startup: {e}")
        print("[WARNING] App will continue but user features may not work")
    # Load demo profiles (for in-memory matching)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, load_demo_profiles)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_db()


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "modelLoaded": MODEL_PATH.name,
        "profiles": len(seller_profiles),
        "requests": len(flash_requests),
    }


@app.post("/api/flash-requests")
async def create_flash_request(payload: FlashRequestCreate) -> Dict[str, Any]:
    try:
        if not payload.text or not payload.text.strip():
            raise HTTPException(status_code=400, detail="Flash request text cannot be empty.")

        # Try to parse with Gemini service, but handle errors gracefully
        try:
            parsed = await call_gemini_parser("/api/parse-request", {"text": payload.text})
        except HTTPException as e:
            # If Gemini service fails, create a basic parsed request
            print(f"[WARNING] Gemini parser failed: {e.detail}, using fallback parsing")
            parsed = {
                "item_meta": {
                    "category": payload.metadata.get("category") if payload.metadata else "Other",
                },
                "context": {},
                "location": {},
                "transaction": {},
            }
        except Exception as e:
            # Generic error handling for Gemini service
            print(f"[WARNING] Gemini parser error: {e}, using fallback parsing")
            parsed = {
                "item_meta": {
                    "category": payload.metadata.get("category") if payload.metadata else "Other",
                },
                "context": {},
                "location": {},
                "transaction": {},
            }
        
        parsed = apply_request_metadata(parsed, payload.metadata)

        request_id = str(uuid.uuid4())
        flash_requests[request_id] = {
            "id": request_id,
            "raw_text": payload.text,
            "parsed_request": parsed,
            "created_at": datetime.utcnow().isoformat(),
            "metadata": payload.metadata or {},
        }

        # Try to build match payload, but handle errors gracefully
        try:
            return await build_match_payload(request_id, flash_requests[request_id])
        except Exception as e:
            print(f"[WARNING] Failed to build match payload: {e}")
            # Return a basic response even if matching fails
            return {
                "success": True,
                "requestId": request_id,
                "request": parsed,
                "matches": [],
                "debug": {
                    "error": str(e),
                    "generatedAt": datetime.utcnow().isoformat(),
                },
            }
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper error messages)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"[ERROR] Failed to create flash request: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create flash request: {str(e)}"
        )


@app.get("/api/flash-requests/{request_id}")
async def get_flash_request(request_id: str) -> Dict[str, Any]:
    record = flash_requests.get(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="Flash request not found.")
    return {
        "success": True,
        "requestId": request_id,
        "request": record["parsed_request"],
        "metadata": record.get("metadata"),
    }


@app.get("/api/flash-requests/{request_id}/matches")
async def get_flash_request_matches(request_id: str) -> Dict[str, Any]:
    record = flash_requests.get(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="Flash request not found.")
    return await build_match_payload(request_id, record)


@app.post("/api/profiles")
async def create_seller_profile(payload: SellerProfileCreate) -> Dict[str, Any]:
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Seller profile text cannot be empty.")

    parsed_profile = await call_gemini_parser(
        "/api/parse-profile", {"text": payload.text, "userId": payload.user_id}
    )

    representative_item = build_representative_item(parsed_profile)

    seller_profiles[payload.user_id] = {
        "user_id": payload.user_id,
        "raw_text": payload.text,
        "parsed_profile": parsed_profile,
        "representative_item": representative_item,
        "created_at": datetime.utcnow().isoformat(),
        "source": "live",
        "metadata": payload.metadata or {},
    }

    return {
        "success": True,
        "profile": parsed_profile,
        "representativeItem": representative_item,
        "totalProfiles": len(seller_profiles),
    }


@app.get("/api/profiles")
async def list_profiles() -> Dict[str, Any]:
    summaries = [
        {
            "userId": profile["user_id"],
            "source": profile.get("source"),
            "createdAt": profile.get("created_at"),
            "inferredMajor": profile["parsed_profile"].get("inferred_major"),
            "dominantTransactionType": profile["parsed_profile"].get(
                "overall_dominant_transaction_type"
            ),
        }
        for profile in seller_profiles.values()
    ]
    summaries.sort(key=lambda entry: entry["userId"])
    return {"success": True, "profiles": summaries}


@app.post("/api/profiles/seed")
async def seed_profiles(limit: int = 150) -> Dict[str, Any]:
    loop = asyncio.get_event_loop()
    loaded = await loop.run_in_executor(None, seed_profiles_from_synthetic, limit)
    return {
        "success": True,
        "loaded": loaded,
        "totalProfiles": len(seller_profiles),
    }


@app.post("/api/flash-requests/{request_id}/pings")
async def send_pings(request_id: str, payload: PingMatchesRequest) -> Dict[str, Any]:
    record = flash_requests.get(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="Flash request not found.")
    entry = {
        "matchIds": payload.matchIds,
        "broadcastType": payload.broadcastType,
        "timestamp": datetime.utcnow().isoformat(),
    }
    record.setdefault("pings", []).append(entry)
    return {
        "success": True,
        "pinged": len(payload.matchIds),
        "broadcastType": payload.broadcastType,
    }


@app.get("/api/messages")
async def get_messages(request: Request) -> Dict[str, Any]:
    """
    Get all message threads for the current user from MongoDB.
    """
    try:
        # Try to get current user from auth token
        user_id = None
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                user_id = payload.get("sub")
        except:
            pass
        
        # If no auth token, try to get from query param or use default
        if not user_id:
            user_id = request.query_params.get("current_user") or "current_user"
        
        # Get database connection
        db = get_db()
        
        # Find all threads where current user is a participant (from MongoDB)
        user_thread_list = []
        
        # Query MongoDB for threads where user is participant1 or participant2
        threads_cursor = db.message_threads.find({
            "$or": [
                {"participant1_id": user_id},
                {"participant2_id": user_id}
            ]
        }).sort("updated_at", -1)
        
        async for thread_doc in threads_cursor:
            thread_id = thread_doc.get("thread_id")
            
            # Determine the other user's ID
            if thread_doc.get("participant1_id") == user_id:
                other_user_id = thread_doc.get("participant2_id")
            else:
                other_user_id = thread_doc.get("participant1_id")
            
            # Use stored other_user_id if available, otherwise use the one we determined
            stored_other_user_id = thread_doc.get("other_user_id")
            if stored_other_user_id:
                other_user_id = stored_other_user_id
            
            if not other_user_id:
                print(f"[WARNING] Thread {thread_id} has no valid other_user_id, skipping")
                continue
            
            # Get user name from thread document or fetch from database
            user_name = thread_doc.get("other_user_name", "User")
            try:
                other_user = await db.users.find_one({"_id": ObjectId(other_user_id)})
                if other_user and other_user.get("name"):
                    user_name = other_user["name"]
                    # Update thread document with fresh name
                    await db.message_threads.update_one(
                        {"thread_id": thread_id},
                        {"$set": {"other_user_name": user_name, "other_user_id": other_user_id}}
                    )
            except Exception as e:
                print(f"[WARNING] Could not fetch user name for {other_user_id}: {e}")
            
            # Get last message from MongoDB
            last_message_doc = await db.messages.find_one(
                {"thread_id": thread_id},
                sort=[("timestamp", -1)]
            )
            
            last_message_text = "No messages"
            last_message_time = "No messages"
            if last_message_doc:
                last_message_text = last_message_doc.get("text", "No messages")
                last_message_time = last_message_doc.get("timestamp", datetime.utcnow()).isoformat()
            
            thread_info = {
                "id": thread_id,
                "userId": other_user_id,
                "userName": user_name,
                "lastMessage": last_message_text,
                "lastMessageTime": last_message_time,
                "unread": thread_doc.get("unread_count", 0),
                "avatar": "👤",
            }
            user_thread_list.append(thread_info)
            print(f"[OK] Added thread {thread_id} for user {user_id}: other_user_id={other_user_id}, name={user_name}")
        
        return {
            "success": True,
            "threads": user_thread_list,
        }
    except Exception as e:
        print(f"[WARNING] Error getting messages: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": True,
            "threads": [],
        }


@app.get("/api/dm/{user_id}")
async def get_dm_thread(user_id: str, request: Request) -> Dict[str, Any]:
    """
    Get existing direct message thread with a user from MongoDB.
    Returns 404 if thread doesn't exist.
    """
    try:
        # Try to get current user from auth token
        current_user_id = None
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                current_user_id = payload.get("sub")
        except:
            pass
        
        # If no auth token, try to get from query param or use default
        if not current_user_id:
            current_user_id = request.query_params.get("current_user") or "current_user"
        
        # Get database connection
        db = get_db()
        
        # Look for existing thread between current user and target user in MongoDB
        thread_doc = await db.message_threads.find_one({
            "$or": [
                {"participant1_id": current_user_id, "participant2_id": user_id},
                {"participant1_id": user_id, "participant2_id": current_user_id}
            ]
        })
        
        if thread_doc:
            thread_id = thread_doc.get("thread_id")
            # Verify that other_user_id matches the requested user_id
            stored_other_user_id = thread_doc.get("other_user_id")
            if stored_other_user_id and stored_other_user_id == user_id:
                print(f"[OK] Found existing thread {thread_id} for user_id {user_id}")
                return {
                    "threadId": thread_id,
                    "userId": user_id,
                }
            elif not stored_other_user_id:
                # Thread exists but other_user_id not set, update it
                await db.message_threads.update_one(
                    {"thread_id": thread_id},
                    {"$set": {"other_user_id": user_id}}
                )
                print(f"[OK] Found existing thread {thread_id}, set other_user_id to {user_id}")
                return {
                    "threadId": thread_id,
                    "userId": user_id,
                }
        
        # Thread doesn't exist
        print(f"[INFO] Thread not found for user_id {user_id}")
        raise HTTPException(status_code=404, detail="Thread not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] Error getting DM thread: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/dm/{user_id}")
async def create_dm_thread(user_id: str, request: Request) -> Dict[str, Any]:
    """
    Create a new direct message thread with a user and save to MongoDB.
    """
    try:
        # Try to get current user from auth token
        current_user_id = None
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                current_user_id = payload.get("sub")
        except:
            pass
        
        # Parse JSON body if present (might contain current_user_id)
        try:
            body = await request.json() if request.headers.get("content-type") == "application/json" else {}
            if not current_user_id and body.get("currentUserId"):
                current_user_id = body.get("currentUserId")
        except:
            body = {}
        
        # If no auth token or body param, try query param or use default
        if not current_user_id:
            current_user_id = request.query_params.get("current_user") or "current_user"
        
        # Validate that user_id is provided and different from current_user_id
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        if user_id == current_user_id:
            raise HTTPException(status_code=400, detail="Cannot create thread with yourself")
        
        # Get database connection
        db = get_db()
        
        # Check if thread already exists in MongoDB
        # Convert to strings for consistent comparison
        current_user_id_str = str(current_user_id) if current_user_id else "current_user"
        user_id_str = str(user_id) if user_id else user_id
        
        existing_thread = await db.message_threads.find_one({
            "$or": [
                {"participant1_id": current_user_id_str, "participant2_id": user_id_str},
                {"participant1_id": user_id_str, "participant2_id": current_user_id_str}
            ]
        })
        
        if existing_thread:
            thread_id = existing_thread.get("thread_id")
            print(f"[OK] Thread already exists: {thread_id}")
            return {
                "threadId": thread_id,
                "userId": user_id,
            }
        
        # Fetch user name from database for the target user (user_id)
        other_user_name = "User"  # Default fallback
        try:
            other_user = await db.users.find_one({"_id": ObjectId(user_id)})
            if other_user and other_user.get("name"):
                other_user_name = other_user["name"]
        except Exception as e:
            print(f"[WARNING] Could not fetch user name for {user_id}: {e}")
            # Continue with default name
        
        # Create new thread and save to MongoDB
        # Ensure all IDs are strings for consistency
        thread_id = str(uuid.uuid4())
        current_user_id_str = str(current_user_id) if current_user_id else "current_user"
        user_id_str = str(user_id) if user_id else user_id
        
        thread_doc = {
            "thread_id": thread_id,
            "participant1_id": current_user_id_str,  # Store as string for consistency
            "participant2_id": user_id_str,  # Store as string for consistency
            "other_user_id": user_id_str,  # The target user (the seller)
            "other_user_name": other_user_name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "unread_count": 0,
        }
        
        await db.message_threads.insert_one(thread_doc)
        
        print(f"[OK] Created DM thread {thread_id} in MongoDB between current_user={current_user_id} and other_user={user_id} (name: {other_user_name})")
        print(f"[OK] Thread data: other_user_id={user_id}, other_user_name={other_user_name}")
        
        return {
            "threadId": thread_id,
            "userId": user_id,  # Return the target user's ID (the seller)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] Error creating DM thread: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/messages/{thread_id}")
async def get_thread_messages(thread_id: str, request: Request) -> Dict[str, Any]:
    """
    Get all messages for a thread from MongoDB.
    """
    try:
        # Try to get current user from auth token
        current_user_id = None
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                current_user_id = payload.get("sub")
        except:
            pass
        
        # If no auth token, try to get from query param or use default
        if not current_user_id:
            current_user_id = request.query_params.get("current_user") or "current_user"
        
        # Get database connection
        db = get_db()
        
        # Load messages from MongoDB
        messages_cursor = db.messages.find(
            {"thread_id": thread_id}
        ).sort("timestamp", 1)  # Sort by timestamp ascending (oldest first)
        
        formatted_messages = []
        async for msg_doc in messages_cursor:
            sender_id = msg_doc.get("sender_id", "unknown")
            formatted_messages.append({
                "id": str(msg_doc.get("_id", "")),
                "senderId": sender_id,
                "text": msg_doc.get("text", ""),
                "timestamp": msg_doc.get("timestamp", datetime.utcnow()).isoformat(),
                "isOwn": sender_id == current_user_id,
            })
        
        print(f"[OK] Loaded {len(formatted_messages)} messages for thread {thread_id}")
        
        return {
            "success": True,
            "messages": formatted_messages,
        }
    except Exception as e:
        print(f"[WARNING] Error getting thread messages: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": True,
            "messages": [],
        }


@app.post("/api/messages/{thread_id}")
async def send_thread_message(
    thread_id: str, 
    request: Request,
    payload: MessageSendRequest = Body(...)
) -> Dict[str, Any]:
    """
    Send a message in a thread and save to MongoDB.
    """
    try:
        text = payload.text
        sender_id = payload.senderId or "current_user"
        
        # Try to get current user from auth token
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                token_payload = verify_token(token)
                sender_id = token_payload.get("sub") or sender_id
        except Exception as auth_error:
            print(f"[WARNING] Auth token verification failed (using senderId from payload): {auth_error}")
            pass
        
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Message text cannot be empty")
        
        print(f"[DEBUG] Sending message to thread {thread_id}, sender_id: {sender_id}, text: {text[:50]}...")
        
        # Get database connection
        db = get_db()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Verify thread exists
        thread_doc = await db.message_threads.find_one({"thread_id": thread_id})
        if not thread_doc:
            print(f"[ERROR] Thread {thread_id} not found in database")
            print(f"[DEBUG] Attempting to find thread by participants to recover...")
            # Try to find thread by participants as a fallback
            # This handles cases where thread_id might be different but participants match
            fallback_thread = await db.message_threads.find_one({
                "$or": [
                    {"participant1_id": sender_id},
                    {"participant2_id": sender_id}
                ]
            })
            if fallback_thread:
                thread_id = fallback_thread.get("thread_id")
                thread_doc = fallback_thread
                print(f"[OK] Found fallback thread: {thread_id}")
            else:
                # If thread truly doesn't exist, return 404
                raise HTTPException(status_code=404, detail=f"Thread not found: {thread_id}. Please create a conversation first.")
        
        # Determine receiver_id (the other participant)
        participant1_id = thread_doc.get("participant1_id")
        participant2_id = thread_doc.get("participant2_id")
        other_user_id = thread_doc.get("other_user_id")
        
        print(f"[DEBUG] Thread participants: participant1_id={participant1_id}, participant2_id={participant2_id}, sender_id={sender_id}, other_user_id={other_user_id}")
        
        # Convert to strings for comparison to handle ObjectId vs string mismatches
        participant1_id_str = str(participant1_id).strip() if participant1_id else ""
        participant2_id_str = str(participant2_id).strip() if participant2_id else ""
        sender_id_str = str(sender_id).strip() if sender_id else ""
        other_user_id_str = str(other_user_id).strip() if other_user_id else ""
        
        # Determine receiver: it's the participant who is NOT the sender
        receiver_id = None
        
        # Normalize for comparison (handle case-insensitive and whitespace)
        sender_normalized = sender_id_str.lower() if sender_id_str else ""
        p1_normalized = participant1_id_str.lower() if participant1_id_str else ""
        p2_normalized = participant2_id_str.lower() if participant2_id_str else ""
        other_normalized = other_user_id_str.lower() if other_user_id_str else ""
        
        # Strategy: If sender matches participant1, receiver is participant2 (and vice versa)
        # If sender matches other_user_id, receiver is the current user (participant1 typically)
        # If no clear match, use other_user_id as receiver (assuming sender is current user)
        
        if sender_normalized == p1_normalized:
            # Sender is participant1, receiver is participant2
            receiver_id = participant2_id_str
        elif sender_normalized == p2_normalized:
            # Sender is participant2, receiver is participant1
            receiver_id = participant1_id_str
        elif other_user_id_str and sender_normalized == other_normalized:
            # Sender is the other user, receiver should be participant1 (current user)
            receiver_id = participant1_id_str
        elif other_user_id_str:
            # Sender is likely the current user (participant1), receiver is the other user
            receiver_id = other_user_id_str
        else:
            # Fallback: if sender is participant1, receiver is participant2, otherwise participant1
            if sender_normalized == p1_normalized or (not sender_normalized and p1_normalized):
                receiver_id = participant2_id_str
            else:
                receiver_id = participant1_id_str
        
        # Ensure we have a valid receiver
        if not receiver_id or receiver_id == sender_id_str:
            # Last resort: use the participant that's not the sender
            if participant1_id_str and participant1_id_str != sender_id_str:
                receiver_id = participant1_id_str
            elif participant2_id_str and participant2_id_str != sender_id_str:
                receiver_id = participant2_id_str
            else:
                receiver_id = other_user_id_str or participant2_id_str or participant1_id_str
        
        print(f"[DEBUG] Determined receiver: {receiver_id} (sender: {sender_id_str})")
        
        # Validate receiver_id is not empty
        if not receiver_id or receiver_id.strip() == "":
            print(f"[ERROR] Could not determine receiver_id for thread {thread_id}")
            # Use the other participant as receiver
            if participant1_id_str and participant1_id_str != sender_id_str:
                receiver_id = participant1_id_str
            elif participant2_id_str and participant2_id_str != sender_id_str:
                receiver_id = participant2_id_str
            else:
                receiver_id = other_user_id_str or "unknown"
        
        # Create message document
        message_doc = {
            "thread_id": thread_id,
            "sender_id": sender_id_str,  # Use string version for consistency
            "receiver_id": str(receiver_id).strip(),  # Ensure receiver_id is a string
            "text": text.strip(),
            "timestamp": datetime.utcnow(),
            "read": False,
        }
        
        print(f"[DEBUG] Creating message document: thread_id={thread_id}, sender_id={sender_id_str}, receiver_id={receiver_id}, text_length={len(text)}")
        
        # Save message to MongoDB
        try:
            result = await db.messages.insert_one(message_doc)
            message_id = str(result.inserted_id)
            print(f"[OK] Message inserted with ID: {message_id}")
        except Exception as insert_error:
            print(f"[ERROR] Failed to insert message: {insert_error}")
            raise HTTPException(status_code=500, detail=f"Failed to save message: {str(insert_error)}")
        
        # Verify the message was actually saved by reading it back
        saved_message = await db.messages.find_one({"_id": result.inserted_id})
        if not saved_message:
            print(f"[WARNING] Message {message_id} was not found immediately after insert!")
        else:
            print(f"[OK] Verified message {message_id} was saved to MongoDB")
        
        # Update thread's updated_at timestamp
        await db.message_threads.update_one(
            {"thread_id": thread_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        print(f"[OK] Saved message {message_id} to MongoDB for thread {thread_id}")
        print(f"[OK] From: {sender_id_str} -> To: {receiver_id}")
        print(f"[OK] Message text: {text[:50]}...")  # Log first 50 chars for debugging
        
        return {
            "success": True,
            "messageId": message_id,
            "text": text,  # Return the text so frontend can verify
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Error sending message: {error_msg}")
        import traceback
        traceback.print_exc()
        # Return more detailed error message for debugging
        raise HTTPException(status_code=500, detail=f"Internal server error: {error_msg}")


@app.get("/api/profiles/{user_id}/history")
async def get_profile_history(user_id: str, cursor: Optional[int] = None) -> Dict[str, Any]:
    history = DEMO_PROFILE_HISTORY.get(user_id)
    if history is None:
        raise HTTPException(status_code=404, detail="Profile history not found.")

    start = cursor or 0
    if start < 0:
        start = 0

    page_size = 10
    end = start + page_size
    transactions = history[start:end]
    next_cursor = None if end >= len(history) else str(end)

    summary = build_profile_history_summary(user_id, history)

    return {
        "summary": summary,
        "transactions": transactions,
        "nextCursor": next_cursor,
    }


# ============================================================================
# Listings Endpoint
# ============================================================================

_campus_sellers_cache: Optional[List[Dict[str, Any]]] = None
_campus_sellers_cache_time: Optional[float] = None


def load_campus_sellers(use_cache: bool = True) -> List[Dict[str, Any]]:
    """Load sellers from campus_sellers.json with caching."""
    global _campus_sellers_cache, _campus_sellers_cache_time
    
    if use_cache and _campus_sellers_cache is not None:
        # Check if file was modified (simple cache invalidation)
        try:
            mtime = CAMPUS_SELLERS_PATH.stat().st_mtime
            if _campus_sellers_cache_time == mtime:
                return _campus_sellers_cache
        except OSError:
            pass
    
    if not CAMPUS_SELLERS_PATH.exists():
        return []
    
    try:
        with open(CAMPUS_SELLERS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            sellers = data.get("sellers", [])
            _campus_sellers_cache = sellers
            _campus_sellers_cache_time = CAMPUS_SELLERS_PATH.stat().st_mtime
            return sellers
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error loading campus_sellers.json: {e}")
        return []


def normalize_category(category: str) -> str:
    """Normalize backend category to frontend category."""
    if not category:
        return "Other"
    category_lower = category.lower().replace("_", " ")
    if "textbook" in category_lower:
        return "Textbooks"
    elif "electronic" in category_lower:
        return "Electronics"
    elif "cloth" in category_lower:
        return "Clothing"
    elif "food" in category_lower or "snack" in category_lower:
        return "Food"
    elif "furniture" in category_lower or "furnish" in category_lower:
        return "Furniture"
    else:
        return "Other"


def get_category_emoji(category: str) -> str:
    """Get emoji based on category."""
    category_lower = category.lower()
    if "textbook" in category_lower:
        return "📚"
    elif "electronic" in category_lower:
        return "💻"
    elif "cloth" in category_lower:
        return "👕"
    elif "food" in category_lower:
        return "🍕"
    elif "furniture" in category_lower:
        return "🪑"
    else:
        return "📦"


def calculate_seller_badges(seller: Dict[str, Any]) -> List[str]:
    """Calculate badges for a seller based on their stats."""
    badges = []
    
    # Verified Student - if seller has a rating, consider them verified
    if seller.get("seller_rating_avg", 0) > 0:
        badges.append("Verified Student")
    
    # Top Seller - if total items sold > 20
    total_items_sold = sum(
        s.get("total_items_sold", 0) 
        for s in seller.get("sales_history_summary", [])
    )
    if total_items_sold > 20:
        badges.append("Top Seller")
    
    # Campus Leader - if trust score > 90
    # Calculate trust score: base 70 + up to 25 based on rating + items sold
    rating = seller.get("seller_rating_avg", 0)
    trust_score = min(95, 70 + min(15, (rating - 3) * 5) + min(10, total_items_sold // 5))
    if trust_score > 90:
        badges.append("Campus Leader")
    
    return badges


def calculate_trust_score(seller: Dict[str, Any]) -> int:
    """Calculate trust score for a seller."""
    rating = seller.get("seller_rating_avg", 0)
    total_items_sold = sum(
        s.get("total_items_sold", 0) 
        for s in seller.get("sales_history_summary", [])
    )
    # Base score 70, add up to 15 for rating, up to 10 for volume
    return min(95, 70 + min(15, int((rating - 3) * 5)) + min(10, total_items_sold // 5))


@app.get("/api/listings")
async def get_listings(
    search: Optional[str] = None,
    category: Optional[str] = None,
    priceMax: Optional[float] = None,
    verifiedOnly: Optional[bool] = None,
) -> Dict[str, Any]:
    """Get listings from campus_sellers.json with filtering."""
    sellers = load_campus_sellers(use_cache=True)
    
    all_listings = []
    
    # Extract all listings from all sellers
    for seller in sellers:
        seller_listings = seller.get("current_item_listings", [])
        if not seller_listings:
            continue
        
        # Calculate seller stats
        total_items_sold = sum(
            s.get("total_items_sold", 0) 
            for s in seller.get("sales_history_summary", [])
        )
        seller_rating = seller.get("seller_rating_avg", 0)
        badges = calculate_seller_badges(seller)
        trust_score = calculate_trust_score(seller)
        verified = seller_rating > 0
        
        # Get seller location
        location_keywords = seller.get("inferred_location_keywords", [])
        seller_location = location_keywords[0] if location_keywords else "Campus"
        
        # Create listing for each item
        for listing_index, listing in enumerate(seller_listings):
            # Generate unique ID
            listing_id = f"{seller.get('user_id', 'unknown')}-{listing.get('parsed_item', 'item')}-{listing_index}-{listing.get('date_posted', '')}"
            
            # Normalize category
            normalized_category = normalize_category(listing.get("category", "Other"))
            
            # Get location - use listing location if available, else seller location
            listing_location = listing.get("location", "") or seller_location
            
            # Format price
            price = listing.get("price", 0)
            price_str = f"${int(price)}" if price else "$0"
            
            # Format listing
            formatted_listing = {
                "id": listing_id,
                "title": listing.get("parsed_item", "Item"),
                "category": normalized_category,
                "price": price_str,
                "photo": get_category_emoji(listing.get("category", "Other")),
                "condition": listing.get("condition", ""),
                "description": listing.get("description", ""),
                "location": listing_location,
                "lastActive": listing.get("date_posted", ""),
                "owner": {
                    "id": seller.get("user_id", ""),
                    "name": seller.get("full_name", "Unknown Seller"),
                    "major": seller.get("inferred_major", "Undeclared"),
                    "dorm": seller_location,
                    "rating": round(seller_rating, 2) if seller_rating else 0.0,
                    "verified": verified,
                    "trustScore": trust_score,
                    "pastTrades": total_items_sold,
                    "badges": badges,
                },
            }
            
            all_listings.append(formatted_listing)
    
    # Apply filters
    filtered_listings = all_listings
    
    # Search filter
    if search:
        search_lower = search.lower()
        filtered_listings = [
            l for l in filtered_listings
            if search_lower in l["title"].lower() 
            or search_lower in l.get("description", "").lower()
            or search_lower in l.get("condition", "").lower()
        ]
    
    # Category filter
    if category and category != "All":
        filtered_listings = [
            l for l in filtered_listings
            if l["category"] == category
        ]
    
    # Price filter
    if priceMax is not None:
        filtered_listings = [
            l for l in filtered_listings
            if float(l["price"].replace("$", "").replace(",", "")) <= priceMax
        ]
    
    # Verified filter
    if verifiedOnly:
        filtered_listings = [
            l for l in filtered_listings
            if l["owner"]["verified"]
        ]
    
    # Sort by date_posted (newest first)
    filtered_listings.sort(
        key=lambda x: x.get("lastActive", ""),
        reverse=True
    )
    
    return {
        "success": True,
        "listings": filtered_listings,
        "total": len(filtered_listings),
    }


# ============================================================================
# Authentication Endpoints
# ============================================================================

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token."""
    token = credentials.credentials
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


@app.post("/api/auth/register")
async def register(user_data: UserCreate) -> Dict[str, Any]:
    """Register a new user with bio processing."""
    try:
        db = get_db()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Please check MongoDB connection."
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "location": user_data.location,
        "bio": user_data.bio,
        "verified": False,
        "trust_score": 70,
        "rating": 0.0,
        "past_trades": 0,
        "badges": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Insert user
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Add user name to cache immediately
    _user_name_cache[user_id] = user_data.name
    
    # Process bio with LLM to generate seller profile
    try:
        parsed_profile = await call_gemini_parser(
            "/api/parse-profile",
            {"text": user_data.bio, "userId": user_id}
        )
        
        # Create seller profile document
        seller_profile_doc = {
            "schema_type": "SELLER_PROFILE",
            "user_id": user_id,
            "context": parsed_profile.get("context", {"original_text": user_data.bio}),
            "profile_keywords": parsed_profile.get("profile_keywords", []),
            "inferred_major": parsed_profile.get("inferred_major"),
            "inferred_location_keywords": parsed_profile.get("inferred_location_keywords", []),
            "sales_history_summary": parsed_profile.get("sales_history_summary", []),
            "overall_dominant_transaction_type": parsed_profile.get("overall_dominant_transaction_type", "sell"),
            "related_categories_of_interest": parsed_profile.get("related_categories_of_interest", []),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Insert seller profile
        profile_result = await db.seller_profiles.insert_one(seller_profile_doc)
        profile_id = profile_result.inserted_id
        
        # Update user with seller profile reference
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"seller_profile_id": profile_id, "updated_at": datetime.utcnow()}}
        )
        
        # Also add seller profile to in-memory seller_profiles for matching
        seller_profiles[user_id] = {
            "user_id": user_id,
            "parsed_profile": parsed_profile,
            "raw_text": user_data.bio,
            "created_at": datetime.utcnow().isoformat(),
            "source": "registered_user",
        }
        
    except Exception as e:
        # If bio processing fails, user is still created but without seller profile
        print(f"Warning: Failed to process bio for user {user_id}: {e}")
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "success": True,
        "userId": user_id,
        "accessToken": access_token,
        "message": "User registered successfully"
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/login")
async def login(login_data: LoginRequest) -> Dict[str, Any]:
    """Login user and return access token."""
    try:
        db = get_db()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Please check MongoDB connection."
        )
    
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "success": True,
        "userId": str(user["_id"]),
        "accessToken": access_token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "location": user.get("location", ""),
            "verified": user.get("verified", False),
        }
    }


@app.get("/api/users/{user_id}/profile")
async def get_user_profile(user_id: str) -> Dict[str, Any]:
    """Get user profile with seller profile data."""
    try:
        db = get_db()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Please check MongoDB connection."
        )
    
    # Get user
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get seller profile if exists
    seller_profile = None
    if user.get("seller_profile_id"):
        seller_profile = await db.seller_profiles.find_one(
            {"_id": user["seller_profile_id"]}
        )
    
    # Get inferred major from seller profile if available
    inferred_major = None
    if seller_profile and seller_profile.get("inferred_major"):
        inferred_major = seller_profile["inferred_major"]
    
    # Convert ObjectId to string
    user_response = {
        "id": str(user["_id"]),
        "name": user.get("name", "User"),  # Use .get() with default to prevent KeyError
        "email": user.get("email", ""),
        "location": user.get("location", ""),
        "bio": user.get("bio", ""),
        "verified": user.get("verified", False),
        "trustScore": user.get("trust_score", 70),
        "rating": user.get("rating", 0.0),
        "pastTrades": user.get("past_trades", 0),
        "badges": user.get("badges", []),
        "inferredMajor": inferred_major,  # Include inferred major from seller profile
        "createdAt": user.get("created_at").isoformat() if user.get("created_at") else None,
        "updatedAt": user.get("updated_at").isoformat() if user.get("updated_at") else None,
    }
    
    if seller_profile:
        # Convert ObjectId to string in seller profile
        seller_profile_response = {
            "schema_type": seller_profile.get("schema_type"),
            "user_id": str(seller_profile.get("user_id")),
            "context": seller_profile.get("context", {}),
            "profile_keywords": seller_profile.get("profile_keywords", []),
            "inferred_major": seller_profile.get("inferred_major"),
            "inferred_location_keywords": seller_profile.get("inferred_location_keywords", []),
            "sales_history_summary": seller_profile.get("sales_history_summary", []),
            "overall_dominant_transaction_type": seller_profile.get("overall_dominant_transaction_type", "sell"),
            "related_categories_of_interest": seller_profile.get("related_categories_of_interest", []),
        }
        user_response["sellerProfile"] = seller_profile_response
    
    return {
        "success": True,
        "user": user_response
    }


@app.get("/api/seller-profiles/{user_id}")
async def get_seller_profile(user_id: str) -> Dict[str, Any]:
    """Get detailed seller profile for a user."""
    db = get_db()
    
    seller_profile = await db.seller_profiles.find_one({"user_id": user_id})
    if not seller_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller profile not found"
        )
    
    # Convert ObjectId to string
    seller_profile_response = {
        "schema_type": seller_profile.get("schema_type"),
        "user_id": str(seller_profile.get("user_id")),
        "context": seller_profile.get("context", {}),
        "profile_keywords": seller_profile.get("profile_keywords", []),
        "inferred_major": seller_profile.get("inferred_major"),
        "inferred_location_keywords": seller_profile.get("inferred_location_keywords", []),
        "sales_history_summary": seller_profile.get("sales_history_summary", []),
        "overall_dominant_transaction_type": seller_profile.get("overall_dominant_transaction_type", "sell"),
        "related_categories_of_interest": seller_profile.get("related_categories_of_interest", []),
        "created_at": seller_profile.get("created_at").isoformat() if seller_profile.get("created_at") else None,
        "updated_at": seller_profile.get("updated_at").isoformat() if seller_profile.get("updated_at") else None,
    }
    
    return {
        "success": True,
        "profile": seller_profile_response
    }


class ProcessBioRequest(BaseModel):
    bio: str


class MessageSendRequest(BaseModel):
    text: str
    senderId: Optional[str] = None


@app.post("/api/seller-profiles/process-bio")
async def process_bio(request: ProcessBioRequest) -> Dict[str, Any]:
    """Process a bio using LLM and create/update seller profile."""
    if not request.bio.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bio cannot be empty"
        )
    
    # Process bio with LLM
    parsed_profile = await call_gemini_parser(
        "/api/parse-profile",
        {"text": request.bio, "userId": request.userId}
    )
    
    db = get_db()
    
    # Check if seller profile already exists
    existing_profile = await db.seller_profiles.find_one({"user_id": request.userId})
    
    seller_profile_doc = {
        "schema_type": "SELLER_PROFILE",
        "user_id": request.userId,
        "context": parsed_profile.get("context", {"original_text": request.bio}),
        "profile_keywords": parsed_profile.get("profile_keywords", []),
        "inferred_major": parsed_profile.get("inferred_major"),
        "inferred_location_keywords": parsed_profile.get("inferred_location_keywords", []),
        "sales_history_summary": parsed_profile.get("sales_history_summary", []),
        "overall_dominant_transaction_type": parsed_profile.get("overall_dominant_transaction_type", "sell"),
        "related_categories_of_interest": parsed_profile.get("related_categories_of_interest", []),
        "updated_at": datetime.utcnow(),
    }
    
    if existing_profile:
        # Update existing profile
        await db.seller_profiles.update_one(
            {"user_id": request.userId},
            {"$set": seller_profile_doc}
        )
        seller_profile_doc["_id"] = existing_profile["_id"]
    else:
        # Create new profile
        seller_profile_doc["created_at"] = datetime.utcnow()
        result = await db.seller_profiles.insert_one(seller_profile_doc)
        seller_profile_doc["_id"] = result.inserted_id
        
        # Update user with seller profile reference
        await db.users.update_one(
            {"_id": ObjectId(request.userId)},
            {"$set": {"seller_profile_id": seller_profile_doc["_id"], "updated_at": datetime.utcnow()}}
        )
    
    # Convert ObjectId to string
    seller_profile_doc["_id"] = str(seller_profile_doc["_id"])
    seller_profile_doc["user_id"] = str(seller_profile_doc["user_id"])
    
    return {
        "success": True,
        "profile": seller_profile_doc
    }


# ============================================================================
# Default Profiles Seeding
# ============================================================================

DEFAULT_PROFILES = [
    {
        "name": "Evelyn Chen",
        "email": "evelyn.art@university.edu",
        "location": "Portland, OR",
        "bio": "Portland AI artist blending neural art prints with hand-crafted frames for sustainability-minded buyers. I create unique digital art pieces and custom frame them using recycled materials.",
        "password": "password123",
        "sellerProfile": {
            "schema_type": "SELLER_PROFILE",
            "profile_keywords": ["ai art", "handmade frames", "sustainability", "gallery", "portland"],
            "inferred_major": "Digital Arts",
            "inferred_location_keywords": ["Portland"],
            "sales_history_summary": [
                {
                    "category": "Art & Decor",
                    "item_examples": [
                        "eco print 'Neural Garden' with soy ink",
                        "recycled-wood frame set with cedar inlay",
                        "AI abstract 'Post-Human Bloom' on bamboo paper"
                    ],
                    "total_items_sold": 58,
                    "avg_price_per_item": 51.7,
                    "dominant_transaction_type_in_category": "sell"
                }
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Gallery Exhibits", "Sustainable Materials"]
        }
    },
    {
        "name": "Marcus Rodriguez",
        "email": "marcus.tech@university.edu",
        "location": "Austin, TX",
        "bio": "Computer Science student specializing in vintage electronics restoration. I buy, repair, and resell retro computers, gaming consoles, and audio equipment. Always looking for broken electronics to fix!",
        "password": "password123",
        "sellerProfile": {
            "schema_type": "SELLER_PROFILE",
            "profile_keywords": ["electronics", "vintage", "restoration", "gaming", "audio"],
            "inferred_major": "Computer Science",
            "inferred_location_keywords": ["Austin"],
            "sales_history_summary": [
                {
                    "category": "Electronics",
                    "item_examples": [
                        "Restored 1984 Macintosh 128K",
                        "Fixed Nintendo GameBoy Color with new screen",
                        "Vintage Technics turntable with new belt"
                    ],
                    "total_items_sold": 34,
                    "avg_price_per_item": 127.5,
                    "dominant_transaction_type_in_category": "sell"
                },
                {
                    "category": "Gaming",
                    "item_examples": [
                        "Retro game cartridge collection",
                        "Custom modded Game Boy",
                        "Restored arcade cabinet controls"
                    ],
                    "total_items_sold": 22,
                    "avg_price_per_item": 89.2,
                    "dominant_transaction_type_in_category": "sell"
                }
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Retro Gaming", "Electronics Repair"]
        }
    },
    {
        "name": "Sofia Kim",
        "email": "sofia.books@university.edu",
        "location": "Boston, MA",
        "bio": "Literature major and bookstore owner's daughter. I specialize in rare textbooks, first editions, and academic materials. Also trade vintage novels and poetry collections.",
        "password": "password123",
        "sellerProfile": {
            "schema_type": "SELLER_PROFILE",
            "profile_keywords": ["books", "textbooks", "literature", "rare editions", "academic"],
            "inferred_major": "Literature",
            "inferred_location_keywords": ["Boston"],
            "sales_history_summary": [
                {
                    "category": "Textbooks",
                    "item_examples": [
                        "Advanced Calculus 8th Edition (like new)",
                        "Organic Chemistry Study Guide Set",
                        "Psychology: Mind & Behavior textbook bundle"
                    ],
                    "total_items_sold": 67,
                    "avg_price_per_item": 45.8,
                    "dominant_transaction_type_in_category": "sell"
                },
                {
                    "category": "Books & Literature",
                    "item_examples": [
                        "First edition Virginia Woolf collection",
                        "Signed copy of contemporary poetry anthology",
                        "Vintage philosophy reader with notes"
                    ],
                    "total_items_sold": 29,
                    "avg_price_per_item": 78.3,
                    "dominant_transaction_type_in_category": "sell"
                }
            ],
            "overall_dominant_transaction_type": "sell",
            "related_categories_of_interest": ["Academic Resources", "Literary Collections"]
        }
    },
]


@app.post("/api/users/seed-defaults")
async def seed_default_profiles() -> Dict[str, Any]:
    """Create default user profiles with seller data and upload to MongoDB."""
    db = get_db()
    created_count = 0
    skipped_count = 0
    
    for profile_data in DEFAULT_PROFILES:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": profile_data["email"]})
        if existing_user:
            skipped_count += 1
            continue
        
        # Hash password
        hashed_password = hash_password(profile_data["password"])
        
        # Create user document
        user_doc = {
            "name": profile_data["name"],
            "email": profile_data["email"],
            "password": hashed_password,
            "location": profile_data["location"],
            "bio": profile_data["bio"],
            "verified": True,
            "trust_score": 85,
            "rating": 4.5,
            "past_trades": sum(
                cat.get("total_items_sold", 0)
                for cat in profile_data["sellerProfile"]["sales_history_summary"]
            ),
            "badges": ["Verified Student", "Top Seller"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create seller profile
        seller_profile = profile_data["sellerProfile"]
        seller_profile_doc = {
            "schema_type": seller_profile["schema_type"],
            "user_id": user_id,
            "context": {"original_text": profile_data["bio"]},
            "profile_keywords": seller_profile["profile_keywords"],
            "inferred_major": seller_profile["inferred_major"],
            "inferred_location_keywords": seller_profile["inferred_location_keywords"],
            "sales_history_summary": seller_profile["sales_history_summary"],
            "overall_dominant_transaction_type": seller_profile["overall_dominant_transaction_type"],
            "related_categories_of_interest": seller_profile["related_categories_of_interest"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Insert seller profile
        profile_result = await db.seller_profiles.insert_one(seller_profile_doc)
        profile_id = profile_result.inserted_id
        
        # Update user with seller profile reference
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"seller_profile_id": profile_id, "updated_at": datetime.utcnow()}}
        )
        
        created_count += 1
    
    return {
        "success": True,
        "created": created_count,
        "skipped": skipped_count,
        "total": len(DEFAULT_PROFILES)
    }

