from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
from io import BytesIO
from PIL import Image
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("plant-disease-api")

app = FastAPI(title="Plant Disease Classifier")

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Background_without_leaves", "Blueberry___healthy", "Cherry___Powdery_mildew", "Cherry___healthy",
    "Corn___Cercospora_leaf_spot Gray_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
]

model_path = str(Path(__file__).parent.absolute() / "saved_model")
logger.info(f"Loading model from {model_path}")
MODEL = tf.keras.layers.TFSMLayer(model_path, call_endpoint='serving_default')
logger.info("Model loaded.")

@app.get('/ping')
async def ping():
    return {"message": "ok"}

def read_file_as_image(data) -> np.ndarray:
    try:
        image = Image.open(BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Ensure 3 channels (RGB) - convert RGBA / L / P etc.
    if image.mode != 'RGB':
        image = image.convert('RGB')

    image = image.resize((224, 224))
    arr = np.asarray(image, dtype=np.float32) / 255.0  # shape (224,224,3)
    if arr.shape[-1] != 3:
        raise HTTPException(status_code=400, detail=f"Unexpected channel count: {arr.shape[-1]}")
    arr = np.expand_dims(arr, axis=0)  # shape (1,224,224,3)
    return arr

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    img = read_file_as_image(raw)

    predictions = MODEL(img)

    # Extract probabilities
    if isinstance(predictions, dict):
        # Take first tensor
        class_probs = next(iter(predictions.values()))
    else:
        class_probs = predictions

    class_probs = np.array(class_probs)
    if class_probs.ndim != 2:
        raise HTTPException(status_code=500, detail=f"Unexpected prediction shape: {class_probs.shape}")

    probs = class_probs[0]
    # Align class name list length if mismatch
    if len(CLASS_NAMES) != probs.shape[0]:
        logger.warning(f"Class name count ({len(CLASS_NAMES)}) != model output ({probs.shape[0]}). Truncating/matching.")
    usable_names = CLASS_NAMES[:probs.shape[0]]

    class_index = int(np.argmax(probs))
    class_name = usable_names[class_index]
    confidence = float(probs[class_index])

    return {"class_name": class_name, "class_index": class_index, "confidence": confidence}

# if __name__ == "__main__":
#     uvicorn.run(app, host='localhost', port=10000)
