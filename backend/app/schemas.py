from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Prediction Schemas
class PredictionResponse(BaseModel):
    id: str
    user_id: int
    image_filename: str
    image_url: str
    original_filename: str
    predicted_class: str
    model_name: str
    confidence: float
    probabilities: Dict[str, float]
    created_at: datetime

    class Config:
        from_attributes = True

class PredictionHistoryResponse(BaseModel):
    items: List[PredictionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# Analytics Schemas
class ModelComparisonItem(BaseModel):
    model: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float

class ClassificationReportRow(BaseModel):
    class_name: str
    precision: float
    recall: float
    f1_score: float
    support: float

class PcaPoint(BaseModel):
    pc1: float
    pc2: float
    actual_class: str

class ClusterPoint(BaseModel):
    actual_class: str
    cluster: int

class FrequentItemset(BaseModel):
    support: float
    itemsets: str

class AssociationRule(BaseModel):
    antecedents: str
    consequents: str
    support: float
    confidence: float
    lift: float

class DashboardStats(BaseModel):
    total_predictions: int
    class_counts: Dict[str, int]
    recent_predictions: List[PredictionResponse]
    model_comparison: List[ModelComparisonItem]
