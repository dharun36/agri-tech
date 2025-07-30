from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
# import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
from pathlib import Path

app = FastAPI()

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

CLASS_NAMES = ["Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy", "Background_without_leaves", "Blueberry___healthy",  "Cherry___Powdery_mildew", "Cherry___healthy", "Corn___Cercospora_leaf_spot Gray_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy", "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy", "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",  "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy", "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot", "", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",]

model_path = Path(__file__).parent.absolute() / "saved_model"
MODEL = tf.keras.models.load_model(model_path)

@app.get('/ping')
async def ping():
    return "Helloo!"

def read_file_as_image(data) -> np.ndarray:
    image = Image.open(BytesIO(data))
    image = image.resize((224, 224))
    image = np.array(image) / 255.0
    image = np.array(image)
    image = np.expand_dims(image, axis=0)
    return image

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    img = read_file_as_image(await file.read())
    
    # Predict the disease class
    class_probs = MODEL.predict(img)
    class_index = (np.argmax(class_probs[0]))
    class_name = CLASS_NAMES[class_index]
    confidence = np.max(class_probs[0])

    return {
        'class_name': class_name,
        'class_index': int(class_index),
        'confidence': float(confidence)
    }

# if __name__ == "__main__":
#     uvicorn.run(app, host='localhost', port=10000)
