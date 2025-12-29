import sys
import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io

# Add parent directory to path to import main.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import main as video_generator

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount outputs directory to serve videos
OUTPUT_DIR = video_generator.OUTPUT_DIR
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)
    
app.mount("/videos", StaticFiles(directory=OUTPUT_DIR), name="videos")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Basic validation
        required_columns = ['VideoName', 'Step', 'ImageFile', 'Text']
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
             raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")
        
        # Generate videos
        # Note: This is blocking. For a real app, use background tasks.
        # But for this simple tool, blocking is fine or we can use BackgroundTasks
        
        generated_files = video_generator.generate_videos_from_df(df)
        
        # Return list of generated filenames
        filenames = [os.path.basename(f) for f in generated_files]
        return {"message": "Videos generated successfully", "videos": filenames}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-images")
async def upload_images(files: list[UploadFile] = File(...)):
    """
    Uploads multiple image files to the inputs/images directory.
    """
    try:
        saved_files = []
        image_dir = video_generator.IMAGE_DIR
        
        if not os.path.exists(image_dir):
            os.makedirs(image_dir)

        for file in files:
            # Basic validation for image extensions
            if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
                continue # Skip non-image files or handle as error. Skipping for now to be robust.

            file_path = os.path.join(image_dir, file.filename)
            
            # Read and write content
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            saved_files.append(file.filename)
            
        return {"message": "Images uploaded successfully", "files": saved_files}
        
    except Exception as e:
        print(f"Error uploading images: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-music")
async def upload_music(files: list[UploadFile] = File(...)):
    """
    Uploads multiple music files to the inputs/music directory.
    """
    try:
        saved_files = []
        music_dir = video_generator.MUSIC_DIR
        
        if not os.path.exists(music_dir):
            os.makedirs(music_dir)

        for file in files:
            # Basic validation for music extensions
            if not file.filename.lower().endswith(('.mp3', '.wav', '.aac', '.m4a')):
                continue 

            file_path = os.path.join(music_dir, file.filename)
            
            # Read and write content
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            saved_files.append(file.filename)
            
        return {"message": "Music uploaded successfully", "files": saved_files}
        
    except Exception as e:
        print(f"Error uploading music: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list-videos")
def list_videos():
    if not os.path.exists(OUTPUT_DIR):
        return {"videos": []}
    files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.mp4')]
    return {"videos": files}

@app.delete("/delete-video")
def delete_video(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": f"Video {filename} deleted"}
    raise HTTPException(status_code=404, detail="Video not found")

@app.get("/list-input-files")
def list_input_files():
    images = []
    music = []
    
    image_dir = video_generator.IMAGE_DIR
    if os.path.exists(image_dir):
        images = [f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'))]
        
    music_dir = video_generator.MUSIC_DIR
    if os.path.exists(music_dir):
         music = [f for f in os.listdir(music_dir) if f.lower().endswith(('.mp3', '.wav', '.aac', '.m4a'))]
    
    return {"images": images, "music": music}

@app.delete("/delete-input-file")
def delete_input_file(filename: str, type: str):
    if type == "image":
        directory = video_generator.IMAGE_DIR
    elif type == "music":
        directory = video_generator.MUSIC_DIR
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    file_path = os.path.join(directory, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": f"File {filename} deleted"}
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
