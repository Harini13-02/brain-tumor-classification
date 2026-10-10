import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from typing import Dict, Any, List

from ..services.analytics_service import (
    get_model_comparison,
    get_classification_report,
    get_confusion_matrix_path,
    get_pca_data,
    get_pca_image_path,
    get_kmeans_data,
    get_cluster_image_path,
    get_apriori_data
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Data Mining"])

@router.get("/model-comparison")
def read_model_comparison():
    try:
        return get_model_comparison()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/classification-report")
def read_classification_report():
    try:
        return get_classification_report()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/confusion-matrix")
def read_confusion_matrix():
    try:
        path = get_confusion_matrix_path()
        return FileResponse(path, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/pca")
def read_pca_info():
    try:
        return get_pca_data()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/pca/image")
def read_pca_image():
    try:
        path = get_pca_image_path()
        return FileResponse(path, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/clusters")
def read_kmeans_info():
    try:
        return get_kmeans_data()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/clusters/image")
def read_kmeans_image():
    try:
        path = get_cluster_image_path()
        return FileResponse(path, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/apriori")
def read_apriori_info():
    try:
        return get_apriori_data()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
