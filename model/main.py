from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import io
import torch
from utils import preprocess_image, load_model, predict

app = FastAPI()

# Load your model at startup
model = load_model()

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Preprocess and predict
        tensor = preprocess_image(image)
        output = predict(model, tensor)

        return JSONResponse(content={"prediction": output})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
