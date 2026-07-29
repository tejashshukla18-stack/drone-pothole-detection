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
'''

