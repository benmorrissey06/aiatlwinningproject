"""MongoDB models for User and SellerProfile."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class SalesHistorySummary(BaseModel):
    """Sales history summary for a category."""
    category: str
    item_examples: List[str] = Field(default_factory=list)
    total_items_sold: int = 0
    avg_price_per_item: Optional[float] = None
    dominant_transaction_type_in_category: str = Field(
        default="sell",
        description="Transaction type: 'sell', 'buy', or 'trade'"
    )


class SellerProfileSchema(BaseModel):
    """Seller profile schema matching the LLM-generated format."""
    schema_type: str = "SELLER_PROFILE"
    user_id: str
    context: dict = Field(default_factory=dict)
    profile_keywords: List[str] = Field(default_factory=list)
    inferred_major: Optional[str] = None
    inferred_location_keywords: List[str] = Field(default_factory=list)
    sales_history_summary: List[SalesHistorySummary] = Field(default_factory=list)
    overall_dominant_transaction_type: str = Field(
        default="sell",
        description="Overall transaction type: 'sell', 'buy', or 'trade'"
    )
    related_categories_of_interest: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserSchema(BaseModel):
    """User schema for MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    password: str  # Hashed password
    location: str  # City/state location
    bio: str  # Raw bio text
    seller_profile_id: Optional[str] = None
    verified: bool = False
    trust_score: int = 70
    rating: float = 0.0
    past_trades: int = 0
    badges: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserCreate(BaseModel):
    """Schema for user registration."""
    name: str
    email: EmailStr
    password: str
    location: str
    bio: str


class UserResponse(BaseModel):
    """User response schema (without password)."""
    id: str
    name: str
    email: str
    location: str
    bio: str
    seller_profile_id: Optional[str] = None
    verified: bool
    trust_score: int
    rating: float
    past_trades: int
    badges: List[str]
    created_at: datetime
    updated_at: datetime


class MessageSchema(BaseModel):
    """Message schema for MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    thread_id: str
    sender_id: str  # User ID of the sender
    receiver_id: str  # User ID of the receiver
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    
    class Config:
        populate_by_name = True


class MessageThreadSchema(BaseModel):
    """Message thread schema for MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    thread_id: str  # Unique thread identifier
    participant1_id: str  # First participant (current user or user1)
    participant2_id: str  # Second participant (other user or user2)
    other_user_id: str  # The other user's ID (for easier lookup)
    other_user_name: Optional[str] = None  # Cached name of the other user
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    unread_count: int = 0
    
    class Config:
        populate_by_name = True
