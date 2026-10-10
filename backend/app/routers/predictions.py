import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from ..database import get_db
from ..models import User, Prediction
from ..schemas import PredictionResponse, PredictionHistoryResponse, DashboardStats
from ..dependencies import get_current_user
from ..services.prediction_service import predict_tumor, generate_prediction_pdf
from ..services.analytics_service import get_model_comparison

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

# Controlled uploads directory
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def _format_prediction_response(pred: Prediction) -> PredictionResponse:
    return PredictionResponse(
        id=pred.id,
        user_id=pred.user_id,
        image_filename=pred.image_filename,
        image_url=f"/api/predictions/images/{pred.image_filename}",
        original_filename=pred.original_filename,
        predicted_class=pred.predicted_class,
        model_name=pred.model_name,
        confidence=pred.confidence,
        probabilities=pred.probabilities,
        created_at=pred.created_at
    )

@router.post("", response_model=PredictionResponse)
async def create_prediction(
    file: UploadFile = File(...),
    model_name: str = Form("Random Forest"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate file extension and MIME
    original_filename = file.filename or "unknown.jpg"
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only JPG, JPEG, and PNG images are allowed."
        )

    # 2. Read bytes and check size
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit."
        )

    # 3. Perform prediction with ML pipeline
    try:
        prediction_result = predict_tumor(image_bytes, model_name=model_name)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing prediction pipeline: {str(e)}"
        )

    # 4. Safely store the uploaded file with a randomized UUID filename
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    safe_filepath = os.path.join(UPLOAD_DIR, safe_filename)
    try:
        with open(safe_filepath, "wb") as f_out:
            f_out.write(image_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store processed image file."
        )

    # 5. Persist prediction record in SQLite database
    new_prediction = Prediction(
        user_id=current_user.id,
        image_filename=safe_filename,
        original_filename=os.path.basename(original_filename),
        predicted_class=prediction_result["predicted_class"],
        model_name=prediction_result["model_name"],
        confidence=prediction_result["confidence"],
        probabilities=prediction_result["probabilities"]
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return _format_prediction_response(new_prediction)

@router.get("", response_model=PredictionHistoryResponse)
def get_predictions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    predicted_class: Optional[str] = Query(None),
    model_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Prediction).filter(Prediction.user_id == current_user.id)

    if predicted_class and predicted_class.lower() != "all":
        query = query.filter(Prediction.predicted_class == predicted_class.lower())

    if model_name and model_name.lower() != "all":
        query = query.filter(Prediction.model_name == model_name)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(Prediction.original_filename.ilike(search_filter))

    total = query.count()

    order_col = desc(Prediction.created_at) if sort == "desc" else asc(Prediction.created_at)
    offset = (page - 1) * page_size
    items = query.order_by(order_col).offset(offset).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PredictionHistoryResponse(
        items=[_format_prediction_response(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total user predictions
    user_preds = db.query(Prediction).filter(Prediction.user_id == current_user.id)
    total_count = user_preds.count()

    # Counts by class
    class_counts = {"glioma": 0, "meningioma": 0, "notumor": 0, "pituitary": 0}
    for row in user_preds.all():
        c = row.predicted_class
        if c in class_counts:
            class_counts[c] += 1

    # 5 most recent predictions
    recent = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(desc(Prediction.created_at))
        .limit(5)
        .all()
    )

    model_comp = get_model_comparison()

    return DashboardStats(
        total_predictions=total_count,
        class_counts=class_counts,
        recent_predictions=[_format_prediction_response(p) for p in recent],
        model_comparison=model_comp
    )

@router.get("/{prediction_id}", response_model=PredictionResponse)
def get_prediction_by_id(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")
    return _format_prediction_response(pred)

@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")

    # Remove stored image if present
    file_path = os.path.join(UPLOAD_DIR, pred.image_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    db.delete(pred)
    db.commit()
    return {"message": "Prediction deleted successfully."}

@router.get("/{prediction_id}/report")
def download_pdf_report(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")

    pdf_buffer = generate_prediction_pdf(pred, current_user.name)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="MRI_Prediction_Report_{pred.id[:8]}.pdf"'
        }
    )

@router.get("/images/{filename}")
def get_prediction_image(filename: str):
    # Prevent path traversal
    safe_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")
    
    media_type = "image/png" if safe_name.endswith(".png") else "image/jpeg"
    return FileResponse(file_path, media_type=media_type)
