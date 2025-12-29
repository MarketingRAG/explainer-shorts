import pandas as pd
import os
# Updated imports for MoviePy v2
from moviepy import VideoFileClip, ImageClip, CompositeVideoClip, concatenate_videoclips, ColorClip, ImageSequenceClip, AudioFileClip, afx
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import random

# Configuration
# Default paths (can be overridden)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV = os.path.join(BASE_DIR, "inputs/data.csv")
IMAGE_DIR = os.path.join(BASE_DIR, "inputs/images")
MUSIC_DIR = os.path.join(BASE_DIR, "inputs/music")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
TOP_SECTION_HEIGHT = 1200
BOTTOM_SECTION_HEIGHT = VIDEO_HEIGHT - TOP_SECTION_HEIGHT
STEP_DURATION = 5 # Seconds per step
FPS = 24

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def create_text_image(text, width, height, partial=False):
    """Creates an image with text for the bottom section."""
    img = Image.new('RGB', (width, height), color=(20, 20, 20)) # Dark background
    d = ImageDraw.Draw(img)
    
    try:
        # Try a slightly nicer font if available, else default
        font = ImageFont.truetype("arial.ttf", 60)
    except IOError:
        font = ImageFont.load_default()
        
    margin = 50
    offset = 100
    
    # Text wrapping
    lines = []
    words = text.split(' ')
    current_line = []
    
    test_draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = test_draw.textbbox((0, 0), test_line, font=font)
        text_width = bbox[2] - bbox[0]
        if text_width < (width - 2 * margin):
            current_line.append(word)
        else:
            lines.append(' '.join(current_line))
            current_line = [word]
    lines.append(' '.join(current_line))

    # Draw lines
    display_char_count = len(text) if partial is False else partial
    current_char_count = 0
    
    for line in lines:
        if current_char_count >= display_char_count:
            break
            
        remaining = display_char_count - current_char_count
        if remaining >= len(line):
            line_to_draw = line
        else:
            line_to_draw = line[:remaining]
            
        d.text((margin, offset), line_to_draw, font=font, fill=(255, 255, 255))
        offset += 80 # line height
        current_char_count += len(line) + 1 # +1 for the space effectively
       
    return np.array(img)

def create_typing_clip(text, duration, width, height, fps=FPS):
    """Generates a video clip with typing effect."""
    total_frames = int(duration * fps)
    frames = []
    
    typing_duration_frames = int(total_frames * 0.8)
    text_len = len(text)
    
    for f in range(total_frames):
        if f < typing_duration_frames:
            char_count = int(text_len * (f / typing_duration_frames))
        else:
            char_count = text_len
            
        img_np = create_text_image(text, width, height, partial=char_count)
        frames.append(img_np)
        
    return ImageSequenceClip(frames, fps=fps)

def process_video(video_name, steps_df, output_dir=OUTPUT_DIR, image_dir=IMAGE_DIR, music_dir=MUSIC_DIR):
    print(f"Processing video: {video_name}")
    clips = []
    
    for _, row in steps_df.iterrows():
        image_path = os.path.join(image_dir, row['ImageFile'])
        text = row['Text']
        
        # 1. Prepare Image Clip (Top)
        if os.path.exists(image_path):
            img_clip = ImageClip(image_path).with_duration(STEP_DURATION)
            img_clip = img_clip.resized(width=VIDEO_WIDTH) 
            
            # Center in top section
            bg_top = ColorClip(size=(VIDEO_WIDTH, TOP_SECTION_HEIGHT), color=(0,0,0), duration=STEP_DURATION)
            
            img_clip = CompositeVideoClip([bg_top, img_clip.with_position("center")], size=(VIDEO_WIDTH, TOP_SECTION_HEIGHT))
            
        else:
            print(f"Warning: Image not found {image_path}")
            img_clip = ColorClip(size=(VIDEO_WIDTH, TOP_SECTION_HEIGHT), color=(0,0,0), duration=STEP_DURATION)

        # 2. Prepare Text Clip (Bottom) with Typing Effect
        txt_clip = create_typing_clip(text, STEP_DURATION, VIDEO_WIDTH, BOTTOM_SECTION_HEIGHT)
        
        # 3. Combine Top and Bottom
        step_clip = CompositeVideoClip([
            img_clip.with_position((0, 0)),
            txt_clip.with_position((0, TOP_SECTION_HEIGHT))
        ], size=(VIDEO_WIDTH, VIDEO_HEIGHT))
        
        clips.append(step_clip)
        
    # Concatenate all steps
    output_path = None
    if clips:
        final_video = concatenate_videoclips(clips)
        
        # Add Background Music
        if os.path.exists(music_dir):
            music_files = [f for f in os.listdir(music_dir) if f.endswith(('.mp3', '.wav', '.aac', '.m4a'))]
            if music_files:
                music_file = random.choice(music_files)
                music_path = os.path.join(music_dir, music_file)
                print(f"Adding background music: {music_file}")
                
                try:
                    audio = AudioFileClip(music_path)
                    
                    if audio.duration < final_video.duration:
                        audio = audio.with_effects([afx.AudioLoop(duration=final_video.duration)])
                    else:
                        audio = audio.subclipped(0, final_video.duration)
                        
                    final_video = final_video.with_audio(audio)
                except Exception as e:
                    print(f"Error adding music: {e}")
            else:
                print("No music files found in inputs/music")
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        output_path = os.path.join(output_dir, f"{video_name}.mp4")
        final_video.write_videofile(output_path, fps=FPS, codec="libx264", audio_codec="aac")
        print(f"Saved {output_path}")
    
    return output_path

def generate_videos_from_df(df, output_dir=OUTPUT_DIR):
    """Processes a dataframe to generate videos."""
    generated_files = []
    if 'VideoName' not in df.columns or 'Step' not in df.columns or 'ImageFile' not in df.columns or 'Text' not in df.columns:
         raise ValueError("CSV must contain VideoName, Step, ImageFile, and Text columns")

    grouped = df.groupby('VideoName')
    
    for video_name, group in grouped:
        sorted_group = group.sort_values('Step')
        # Pass dirs explicitly so they can be controlled if needed
        out_path = process_video(video_name, sorted_group, output_dir=output_dir)
        if out_path:
            generated_files.append(out_path)
            
    return generated_files

def main():
    if not os.path.exists(INPUT_CSV):
        print(f"Error: {INPUT_CSV} not found.")
        return

    df = pd.read_csv(INPUT_CSV)
    generate_videos_from_df(df)

if __name__ == "__main__":
    main()
