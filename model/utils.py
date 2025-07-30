import torch
from torchvision import transforms
import torch.nn.functional as F

# Example preprocessing — modify as per your model's requirement
def preprocess_image(image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])
    tensor = transform(image).unsqueeze(0)  # Add batch dimension
    return tensor

# Load your trained model
def load_model():
    model = torch.load("model/single-HLT.mar", map_location=torch.device('cpu'))  # Use .pt or .pth file
    model.eval()
    return model

# Run prediction
def predict(model, tensor):
    with torch.no_grad():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1)
        predicted_class = torch.argmax(probs, dim=1).item()
        return int(predicted_class)
