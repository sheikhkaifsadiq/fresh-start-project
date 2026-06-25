import os
import logging
import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger(__name__)

# Ensure models directory exists within the engine
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "data" / "models"
MODEL_PATH = MODEL_DIR / "bot_detector_rf.joblib"

_model = None

def _generate_dummy_model():
    """Generates a dummy Random Forest model if none exists."""
    logger.info(f"Generating dummy model at {MODEL_PATH}")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # 5 features: [has_ua, ua_length, has_accept_lang, js_solved, req_rate]
    # Generate random dummy data
    X_dummy = np.random.rand(100, 5)
    
    # Randomly assign classes (0 = human, 1 = bot)
    y_dummy = np.random.randint(0, 2, 100)
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_dummy, y_dummy)
    
    joblib.dump(clf, MODEL_PATH)
    logger.info("Dummy model successfully created and saved.")
    return clf

def load_model():
    """Loads the model from disk or creates a dummy if it doesn't exist."""
    global _model
    if not MODEL_PATH.exists():
        _model = _generate_dummy_model()
    else:
        try:
            _model = joblib.load(MODEL_PATH)
            logger.info("Successfully loaded bot detector model.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}. Generating new dummy model.")
            _model = _generate_dummy_model()

def extract_features(request_data: dict) -> np.ndarray:
    """
    Extracts numerical features from the incoming request payload.
    
    Expected keys in request_data:
    - user_agent (str)
    - headers (dict)
    - js_solved (bool or int)
    - request_rate (float)
    """
    ua = request_data.get("user_agent", "")
    headers = request_data.get("headers", {})
    
    has_ua = 1.0 if ua else 0.0
    ua_length = float(len(ua))
    
    # Ensure case-insensitive header check
    headers_lower = {str(k).lower(): v for k, v in headers.items()}
    has_accept_lang = 1.0 if "accept-language" in headers_lower else 0.0
    
    js_solved = float(request_data.get("js_solved", 0.0))
    req_rate = float(request_data.get("request_rate", 0.0))
    
    # Return 2D array for sklearn: shape (1, n_features)
    return np.array([[has_ua, ua_length, has_accept_lang, js_solved, req_rate]])

def predict_bot_probability(request_data: dict) -> float:
    """
    Returns the probability of the request being a bot (class 1).
    Probability range: 0.0 (human) to 1.0 (bot).
    """
    global _model
    if _model is None:
        load_model()
        
    features = extract_features(request_data)
    
    # predict_proba returns array of shape (n_samples, n_classes)
    # Class 1 is typically the bot class
    probabilities = _model.predict_proba(features)
    
    # Handle edge case if the dummy model only ended up with 1 class
    if probabilities.shape[1] > 1:
        bot_prob = probabilities[0][1]
    else:
        bot_prob = probabilities[0][0]
        
    return float(bot_prob)

# Initialize model into memory on module load
load_model()
