# drone-pothole-detection

# 🚁 Drone Pothole Inspector - Backend API

An AI-powered FastAPI backend service for automated road damage inspection. It integrates deep learning object detection with a multi-stage classical Computer Vision fallback pipeline (OpenCV) to detect, annotate, and classify potholes across top-down drone imagery and street-level road photos.

---

## 📌 Features & Processing Pipeline

1. **Dual Detection Engine:**
   - **Primary Model:** Cloud-based Roboflow Deep Learning inference API (`pothole-detection-mev9q/6`).
   - **Fallback CV Engine:** An adaptive OpenCV computer vision pipeline using CLAHE contrast enhancement, HSV color thresholding (for tan/brown exposed gravel and asphalt cavities), Canny edge density mapping, and Non-Maximum Suppression (NMS).
2. **Automated Server-Side Annotation:** Dynamically draws bright green bounding boxes and confidence score labels onto uploaded images.
3. **Severity & Workflow Assessment:** Automatically computes defect count and confidence averages to assign severity levels (`High`, `Medium`, `Low`), priority tags (`P1`, `P2`, `P3`), and recommended repair actions.
4. **CORS Enabled:** Pre-configured for seamless integration with frontend web applications (React, Next.js, HTML/JS).

---

## 🛠️ Required Pip Packages

To run this backend, you need the following Python libraries installed in your environment:

### **Package Summary Table**
| Package Name | Pip Install Command Name | Purpose |
| :--- | :--- | :--- |
| **FastAPI** | `fastapi` | High-performance Web framework for API endpoints |
| **Uvicorn** | `uvicorn` | ASGI web server to serve the FastAPI app |
| **OpenCV** | `opencv-python` | Image processing, contrast tuning, contour extraction, and bounding box drawing |
| **NumPy** | `numpy` | Array operations, color thresholding, and math processing |
| **Requests** | `requests` | HTTP client for querying the Roboflow Cloud API |
| **Python Multipart** | `python-multipart` | Handles multipart form-data file uploads in FastAPI |

---

## ⚡ Quick Start & Installation Pipeline

Follow these steps to clone, set up, and run the backend locally:

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/drone-pothole-detection.git](https://github.com/YOUR_USERNAME/drone-pothole-detection.git)
cd drone-pothole-detection

### 2\. Set Up a Virtual Environment (Recommended)

**On Windows (PowerShell):**

PowerShell

python -m venv venv
.\venv\Scripts\Activate

**On macOS / Linux:**

Bash

python3 -m venv venv
source venv/bin/activate `

### 3\. Install All Dependencies

Run the single pip installation command:

Bash

pip install fastapi uvicorn opencv-python numpy requests python-multipart

_(Alternatively, if a requirements.txt file is present, run: pip install -r requirements.txt)_

🏃 Running the Application
--------------------------

Ensure you are in the root directory (drone-pothole-detection), then start the Uvicorn server:

Bash

python -m uvicorn backend.API.main:app --reload

The server will initialize locally at:

👉 **http://127.0.0.1:8000**

📖 Interactive API Documentation
--------------------------------

FastAPI automatically generates interactive documentation endpoints:

*   **Swagger UI Interactive Docs:** http://127.0.0.1:8000/docs
    
*   **ReDoc API Documentation:** http://127.0.0.1:8000/redoc
    

🔌 API Endpoint Documentation
-----------------------------

### POST /api/inspect

Receives an uploaded road/drone image, processes it through the detection pipeline, saves an annotated image in /static, and returns structural defect metadata in JSON format.

#### **Request Header**

Content-Type: multipart/form-data

#### **Request Parameters**

**FieldTypeStorage TypeDescriptionRequired**fileUploadFileFile(...)Road or aerial drone image (.jpg, .png, .webp)**Yes**

#### **Example Request (cURL)**

Bash

curl -X 'POST' \
  '[http://127.0.0.1:8000/api/inspect](http://127.0.0.1:8000/api/inspect)' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@sample_road.jpg'

#### **Sample JSON Output Response**

JSON

{
  "status": "success",
  "filename": "sample_road.jpg",
  "annotated_image_url": "[http://127.0.0.1:8000/static/annotated_sample_road.jpg](http://127.0.0.1:8000/static/annotated_sample_road.jpg)",
  "defects_found": 3,
  "severity": "High",
  "priority": "P1 - Immediate Repair",
  "color": "red",
  "recommended_action": "Critical road damage detected. Dispatch repair crew immediately.",
  "predictions": [
    {
      "x": 340,
      "y": 210,
      "width": 120,
      "height": 85,
      "confidence": 0.93,
      "class": "pothole"
    },
    {
      "x": 510,
      "y": 180,
      "width": 95,
      "height": 70,
      "confidence": 0.89,
      "class": "pothole"
    },
    {
      "x": 220,
      "y": 410,
      "width": 140,
      "height": 110,
      "confidence": 0.87,
      "class": "pothole"
    }
  ]
}`

📂 Repository Structure
-----------------------

drone-pothole-detection/
├── backend/
│   └── API/
│       └── main.py              # Core FastAPI & Computer Vision engine
├── tests/
│   └── sample_images/           # Archived raw test photos & proof for future reference
│       ├── bf63101a995...jpg
│       ├── p1.webp
│       └── potholes.jpg
├── .gitignore
└── README.md                    # Complete project documentation
