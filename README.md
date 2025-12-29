# Explainer Shorts Video Generator
A full-stack application for automated video generation. This tool allows you to create short explainer videos by uploading a CSV script along with images and background music.
## Features
- **CSV-based Generation**: Define your video structure (steps, images, text) in a simple CSV file.
- **Media Management**: Upload and manage images and background music tracks via the UI.
- **Video Preview**: View generated videos directly in the browser.
- **Management Dashboard**: List and delete input files (images/music) and generated output videos.
## Tech Stack
- **Backend**: Python, FastAPI, Pandas
- **Frontend**: React, Vite, Tailwind CSS
- **Video Processing**: Custom Python logic (see `main.py`)
## Prerequisites
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/)
## Installation & Setup
### 1. Backend Setup
Navigate to the project root and install Python dependencies:
```bash
# Recommended: Create and activate a virtual environment first
# python -m venv venv
# source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Start the backend server:
```bash
# Run using Python
python backend/server.py
# OR using Uvicorn directly (for development with reload)
uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be available at `http://localhost:8000`.
### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Start the development server:
```bash
npm run dev
```
The frontend will start at `http://localhost:5173` (or the port shown in your terminal).
## Usage
1.  **Prepare Assets**: Upload your images and background music using the "Manage Files" section in the UI.
2.  **Create CSV**: Create a CSV file with the following columns:
    *   `VideoName`: Name of the output video.
    *   `Step`: Step number/order.
    *   `ImageFile`: Filename of the uploaded image to show for this step.
    *   `Text`: Text/Script to display or narrate for this step.
3.  **Generate**: Upload the CSV on the main page. The system will process the inputs and generate the video.
4.  **Download**: Once generated, the video will appear in the "Generated Videos" list for preview and download.
## Project Structure
- `backend/`: FastAPI server implementation.
- `frontend/`: React frontend application.
- `inputs/`: Stores uploaded `images` and `music`.
- `outputs/`: Stores generated videos.
- `main.py`: Core video generation logic.
