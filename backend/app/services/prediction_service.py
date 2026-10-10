import os
import json
import io
import logging
from typing import Dict, Any, Tuple
import numpy as np
from PIL import Image
import joblib

logger = logging.getLogger("brain_tumor.prediction")

# Global containers for loaded models
_class_names = []
_models = {}
_feature_extractor = None
_scaler = None
_models_loaded = False
_models_load_error = None

def find_models_dir() -> str:
    candidates = [
        os.getenv("MODELS_DIR"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "models"),
        os.path.join(os.path.dirname(__file__), "..", "..", "models"),
        os.path.join(os.path.dirname(__file__), "..", "models"),
        r"D:\TUMOR DATA MINING PROJECT\models",
        "models"
    ]
    for c in candidates:
        if c and os.path.exists(c) and os.path.exists(os.path.join(c, "class_names.json")):
            return os.path.abspath(c)
    raise FileNotFoundError("Could not find models directory containing class_names.json.")

def load_models_once():
    """Load machine learning models once at application startup."""
    global _class_names, _models, _feature_extractor, _scaler, _models_loaded, _models_load_error
    if _models_loaded:
        return
    try:
        models_dir = find_models_dir()
        logger.info(f"Loading machine learning models from: {models_dir}")
        
        # 1. Load class names
        class_names_path = os.path.join(models_dir, "class_names.json")
        with open(class_names_path, "r") as f:
            _class_names = json.load(f)
        logger.info(f"Loaded class names: {_class_names}")

        # Note: In accordance with security guidelines, joblib models are loaded only from trusted local project directory
        # 2. Load Scikit-Learn estimators
        _models["Random Forest"] = joblib.load(os.path.join(models_dir, "brain_tumor_random_forest.pkl"))
        _models["SVM"] = joblib.load(os.path.join(models_dir, "brain_tumor_svm.pkl"))
        _models["KNN"] = joblib.load(os.path.join(models_dir, "brain_tumor_knn.pkl"))
        _models["Decision Tree"] = joblib.load(os.path.join(models_dir, "brain_tumor_decision_tree.pkl"))
        _scaler = joblib.load(os.path.join(models_dir, "brain_tumor_feature_scaler.pkl"))

        # 3. Load Keras models
        import keras
        _models["CNN"] = keras.models.load_model(os.path.join(models_dir, "brain_tumor_cnn_model.keras"))
        _feature_extractor = keras.models.load_model(os.path.join(models_dir, "cnn_feature_extractor.keras"))

        _models_loaded = True
        logger.info("All 5 models and feature extractor successfully loaded!")
    except Exception as e:
        _models_load_error = str(e)
        logger.error(f"Failed to load models: {e}", exc_info=True)
        raise

def get_class_names() -> list:
    if not _models_loaded:
        load_models_once()
    return _class_names

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Validate and preprocess an image into (1, 224, 224, 3) float32 array.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception:
        raise ValueError("Invalid image file. Please upload a valid JPG or PNG image.")
    
    img = img.convert("RGB")
    img = img.resize((224, 224), Image.Resampling.LANCZOS)
    img_array = np.array(img, dtype=np.float32)
    img_batch = np.expand_dims(img_array, axis=0)
    return img_batch

def predict_tumor(image_bytes: bytes, model_name: str = "Random Forest") -> Dict[str, Any]:
    """
    Run prediction on MRI image using the specified classifier.
    Returns predicted_class, confidence, and class probabilities.
    """
    if not _models_loaded:
        load_models_once()

    valid_models = ["Random Forest", "CNN", "SVM", "KNN", "Decision Tree"]
    if model_name not in valid_models:
        raise ValueError(f"Invalid model '{model_name}'. Allowed models: {valid_models}")

    img_batch = preprocess_image(image_bytes)

    if model_name == "CNN":
        cnn_model = _models["CNN"]
        raw_probs = cnn_model.predict(img_batch, verbose=0)[0]
    else:
        # Traditional ML models require extracting 128-dimensional features
        features = _feature_extractor.predict(img_batch, verbose=0)
        
        # Follow estimator requirements:
        # SVM and KNN pipelines already contain StandardScaler.
        # Random Forest and Decision Tree take raw 128 features directly.
        estimator = _models[model_name]
        raw_probs = estimator.predict_proba(features)[0]

    probs_dict = {}
    for idx, cname in enumerate(_class_names):
        probs_dict[cname] = round(float(raw_probs[idx]), 4)

    best_idx = int(np.argmax(raw_probs))
    predicted_class = _class_names[best_idx]
    confidence = round(float(raw_probs[best_idx] * 100.0), 2)

    return {
        "model_name": model_name,
        "predicted_class": predicted_class,
        "confidence": confidence,
        "probabilities": probs_dict
    }

def generate_prediction_pdf(prediction_record: Any, user_name: str) -> io.BytesIO:
    """Generate a clean educational research PDF report for a prediction."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e3a8a')
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#991b1b')
    )

    elements = []

    # Title & Subtitle
    elements.append(Paragraph("Brain Tumor Classification and Risk Prediction", title_style))
    elements.append(Paragraph("Educational Research Prototype — MRI Classification Result", subtitle_style))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=15))

    # Disclaimer Box
    disclaimer_p = Paragraph(
        "<b>RESEARCH NOTICE:</b> This application is an educational research prototype. Its predictions are "
        "generated by machine learning models and are not a medical diagnosis. Model confidence is not the same as clinical "
        "certainty or patient risk. Consult a qualified medical professional for interpretation.",
        disclaimer_style
    )
    disclaimer_table = Table([[disclaimer_p]], colWidths=[530])
    disclaimer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef2f2')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#f87171')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(disclaimer_table)
    elements.append(Spacer(1, 15))

    # Metadata & Result Table
    elements.append(Paragraph("Analysis Details", section_style))
    elements.append(Spacer(1, 6))

    created_str = prediction_record.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if hasattr(prediction_record.created_at, 'strftime') else str(prediction_record.created_at)

    meta_data = [
        [Paragraph("<b>Prediction ID:</b>", body_style), Paragraph(str(prediction_record.id), body_style)],
        [Paragraph("<b>Researcher / User:</b>", body_style), Paragraph(user_name, body_style)],
        [Paragraph("<b>Original Image:</b>", body_style), Paragraph(str(prediction_record.original_filename), body_style)],
        [Paragraph("<b>Model Used:</b>", body_style), Paragraph(str(prediction_record.model_name), body_style)],
        [Paragraph("<b>Date & Time:</b>", body_style), Paragraph(created_str, body_style)],
        [Paragraph("<b>Predicted Class:</b>", body_style), Paragraph(f"<b><font color='#0284c7' size='12'>{prediction_record.predicted_class.upper()}</font></b>", body_style)],
        [Paragraph("<b>Model Output Confidence:</b>", body_style), Paragraph(f"<b>{prediction_record.confidence:.2f}%</b> (Uncalibrated output)", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[160, 370])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # Probabilities Table
    elements.append(Paragraph("Four-Class Probability Distribution", section_style))
    elements.append(Spacer(1, 6))

    prob_rows = [["Tumor Class", "Probability", "Percentage"]]
    probs = prediction_record.probabilities if isinstance(prediction_record.probabilities, dict) else {}
    for cname in ["glioma", "meningioma", "notumor", "pituitary"]:
        val = probs.get(cname, 0.0)
        prob_rows.append([cname.capitalize(), f"{val:.4f}", f"{val * 100.0:.2f}%"])

    prob_table = Table(prob_rows, colWidths=[180, 175, 175])
    prob_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')])
    ]))
    elements.append(prob_table)
    elements.append(Spacer(1, 20))

    # Footer note
    elements.append(Paragraph(
        "Generated by Brain Tumor Classification Educational System. Do not use for clinical diagnosis or treatment planning.",
        subtitle_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
