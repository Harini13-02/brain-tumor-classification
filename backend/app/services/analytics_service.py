import os
import pandas as pd
from typing import Dict, Any, List

def get_models_dir() -> str:
    from .prediction_service import find_models_dir
    return find_models_dir()

def get_model_comparison() -> List[Dict[str, Any]]:
    models_dir = get_models_dir()
    csv_path = os.path.join(models_dir, "evaluation", "model_comparison.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Model comparison file not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    # Model,Accuracy,Precision,Recall,F1-score
    result = []
    for _, row in df.iterrows():
        result.append({
            "model": str(row["Model"]),
            "accuracy": round(float(row["Accuracy"]), 4),
            "precision": round(float(row["Precision"]), 4),
            "recall": round(float(row["Recall"]), 4),
            "f1_score": round(float(row["F1-score"]), 4)
        })
    return result

def get_classification_report() -> List[Dict[str, Any]]:
    models_dir = get_models_dir()
    csv_path = os.path.join(models_dir, "evaluation", "classification_report.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Classification report file not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    result = []
    for _, row in df.iterrows():
        class_name = str(row.iloc[0])
        result.append({
            "class_name": class_name,
            "precision": round(float(row["precision"]), 4) if pd.notnull(row["precision"]) else None,
            "recall": round(float(row["recall"]), 4) if pd.notnull(row["recall"]) else None,
            "f1_score": round(float(row["f1-score"]), 4) if pd.notnull(row["f1-score"]) else None,
            "support": float(row["support"]) if pd.notnull(row["support"]) else None
        })
    return result

def get_confusion_matrix_path() -> str:
    models_dir = get_models_dir()
    img_path = os.path.join(models_dir, "evaluation", "confusion_matrix.png")
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Confusion matrix image not found at {img_path}")
    return img_path

def get_pca_image_path() -> str:
    models_dir = get_models_dir()
    img_path = os.path.join(models_dir, "analytics", "pca_class_visualization.png")
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"PCA image not found at {img_path}")
    return img_path

def get_cluster_image_path() -> str:
    models_dir = get_models_dir()
    img_path = os.path.join(models_dir, "analytics", "kmeans_cluster_visualization.png")
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Cluster image not found at {img_path}")
    return img_path

def get_pca_data(sample_size: int = 400) -> Dict[str, Any]:
    models_dir = get_models_dir()
    csv_path = os.path.join(models_dir, "analytics", "pca_training_coordinates.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"PCA coordinates file not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    total_records = len(df)
    # Downsample evenly for UI performance if large
    if total_records > sample_size:
        df_sample = df.sample(n=sample_size, random_state=42)
    else:
        df_sample = df
        
    points = []
    for _, row in df_sample.iterrows():
        points.append({
            "pc1": round(float(row["PC1"]), 4),
            "pc2": round(float(row["PC2"]), 4),
            "actual_class": str(row["Actual_Class"])
        })
        
    return {
        "description": "PCA projects 128-dimensional CNN features into two dimensions. The recorded first two components explain a combined 43.26% of the feature variance.",
        "variance_explained": 43.26,
        "total_points": total_records,
        "sampled_points": len(points),
        "data": points
    }

def get_kmeans_data() -> Dict[str, Any]:
    models_dir = get_models_dir()
    csv_path = os.path.join(models_dir, "analytics", "kmeans_training_clusters.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"K-Means clusters file not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    total_samples = len(df)
    
    # Calculate cross-tabulation of Actual_Class vs Cluster
    crosstab = pd.crosstab(df["Actual_Class"], df["Cluster"]).to_dict()
    
    cluster_counts = df["Cluster"].value_counts().to_dict()
    cluster_summary = [{"cluster": f"Cluster {k}", "count": int(v)} for k, v in sorted(cluster_counts.items())]

    return {
        "description": "K-Means produced four clusters in the training experiment. Clusters do not automatically correspond to tumor classes. The recorded Adjusted Rand Index is 0.6248, clearly labelled as a training clustering result.",
        "adjusted_rand_index": 0.6248,
        "total_samples": total_samples,
        "cluster_distribution": cluster_summary,
        "class_by_cluster": crosstab
    }

def get_apriori_data() -> Dict[str, Any]:
    models_dir = get_models_dir()
    itemsets_path = os.path.join(models_dir, "analytics", "apriori_frequent_itemsets.csv")
    rules_path = os.path.join(models_dir, "analytics", "apriori_association_rules.csv")
    
    itemsets = []
    if os.path.exists(itemsets_path):
        df_items = pd.read_csv(itemsets_path)
        for _, row in df_items.iterrows():
            itemsets.append({
                "support": round(float(row["support"]), 4),
                "itemsets": str(row["itemsets"])
            })
            
    rules = []
    if os.path.exists(rules_path):
        df_rules = pd.read_csv(rules_path)
        for _, row in df_rules.iterrows():
            rules.append({
                "antecedents": str(row["antecedents"]),
                "consequents": str(row["consequents"]),
                "support": round(float(row["support"]), 4),
                "confidence": round(float(row["confidence"]), 4),
                "lift": round(float(row["lift"]), 4)
            })

    return {
        "disclaimer": "These are exploratory associations derived from training feature discretizations and are not medical or causal rules.",
        "frequent_itemsets": itemsets,
        "rules": rules
    }
