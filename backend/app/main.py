import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# Load environment variables if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from .database import init_db
from .services.prediction_service import load_models_once
from .routers import auth, predictions, analytics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("brain_tumor.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database schema...")
    init_db()
    
    logger.info("Pre-loading machine learning models into memory...")
    try:
        load_models_once()
        logger.info("ML models pre-loaded successfully!")
    except Exception as e:
        logger.error(f"Error pre-loading models: {e}. Models will attempt on-demand loading.")
        
    yield
    # Shutdown actions
    logger.info("Application shutting down...")

# Automatically initialize database tables on startup
init_db()

app = FastAPI(
    title="Brain Tumor Classification and Risk Prediction API",
    description="Educational machine learning prototype for MRI tumor classification and analytics.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins and "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to avoid leaking internal stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system administrator."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {
        "message": "Brain Tumor Classification and Risk Prediction API is running.",
        "documentation": "/docs",
        "health_check": "/api/health"
    }

@app.get("/api/health")
def health_check():
    from .services.prediction_service import _models_loaded, _class_names
    return {
        "status": "healthy",
        "models_loaded": _models_loaded,
        "available_classes": _class_names if _models_loaded else ["glioma", "meningioma", "notumor", "pituitary"],
        "default_model": "Random Forest (Test Accuracy: 92.45%)"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
