import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Play, Download, RefreshCw, Smartphone, Image as ImageIcon, Music, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const API_BASE = 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUploadStatus, setImageUploadStatus] = useState('');
  const [musicFiles, setMusicFiles] = useState([]);
  const [musicUploadStatus, setMusicUploadStatus] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedMusic, setUploadedMusic] = useState([]);

  useEffect(() => {
    fetchVideos();
    fetchUploadedFiles();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/list-videos`);
      setVideos(res.data.videos);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/list-input-files`);
      setUploadedImages(res.data.images);
      setUploadedMusic(res.data.music);
    } catch (err) {
      console.error("Failed to fetch uploaded files", err);
    }
  };

  const handleDeleteVideo = async (e, filename) => {
    e.stopPropagation(); // Prevent selection
    if (!window.confirm(`Delete video ${filename}?`)) return;

    try {
      await axios.delete(`${API_BASE}/delete-video?filename=${filename}`);
      fetchVideos();
      if (selectedVideo === filename) setSelectedVideo(null);
    } catch (err) {
      console.error("Failed to delete video", err);
      alert("Failed to delete video");
    }
  };

  const handleDeleteFile = async (filename, type) => {
    if (!window.confirm(`Delete ${type} file ${filename}?`)) return;

    try {
      await axios.delete(`${API_BASE}/delete-input-file?filename=${filename}&type=${type}`);
      fetchUploadedFiles();
    } catch (err) {
      console.error(`Failed to delete ${type} file`, err);
      alert(`Failed to delete ${type} file`);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setUploadStatus('Uploading and generating videos... This may take a while.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('Done! Videos generated.');
      setVideos(res.data.videos);
      setFile(null);
    } catch (err) {
      console.error(err);
      setUploadStatus(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
      fetchVideos(); // Refresh list to be sure
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return;

    setImageUploadStatus('Uploading images...');

    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await axios.post(`${API_BASE}/upload-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUploadStatus(`Success! ${imageFiles.length} images uploaded.`);
      setImageFiles([]);
      fetchUploadedFiles();
    } catch (err) {
      console.error(err);
      setImageUploadStatus(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleMusicChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMusicFiles(Array.from(e.target.files));
    }
  };

  const handleMusicUpload = async () => {
    if (musicFiles.length === 0) return;

    setMusicUploadStatus('Uploading music...');

    const formData = new FormData();
    musicFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await axios.post(`${API_BASE}/upload-music`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMusicUploadStatus(`Success! ${musicFiles.length} music files uploaded.`);
      setMusicFiles([]);
      fetchUploadedFiles();
    } catch (err) {
      console.error(err);
      setMusicUploadStatus(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-8 font-sans selection:bg-accent/30">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <header className="flex items-center justify-between pb-8 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Video Generator
            </h1>
            <p className="text-secondary mt-2">Transform CSV data into engaging videos instantly.</p>
          </div>
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-accent rounded-full opacity-80 blur-xl absolute right-1/4 top-10 pointer-events-none"></div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Upload & Instructions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-white/90">
                <Upload size={24} className="text-primary" />
                <h2>Upload Data</h2>
              </div>
              <p className="text-sm text-secondary">
                Upload a CSV file with columns: <code>VideoName</code>, <code>Step</code>, <code>ImageFile</code>, <code>Text</code>.
              </p>

              <div className="relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                  file ? "border-primary bg-primary/10" : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                )}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="text-primary" size={32} />
                      <span className="font-medium text-white">{file.name}</span>
                      <span className="text-xs text-secondary">Ready to generate</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-secondary">
                      <FileText className="text-white/40" size={32} />
                      <span>Click or Drag CSV here</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={clsx(
                  "w-full btn-primary justify-center py-3 text-lg",
                  (!file || loading) && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" size={18} /> Generate Videos
                  </>
                )}
              </button>

              {uploadStatus && (
                <div className={clsx(
                  "text-sm p-3 rounded-lg",
                  uploadStatus.includes("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                )}>
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-white/90">
                <ImageIcon size={24} className="text-accent" />
                <h2>Upload Images</h2>
              </div>
              <p className="text-sm text-secondary">
                Upload images referenced in your CSV (e.g. <code>image1.png</code>).
              </p>

              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                  imageFiles.length > 0 ? "border-accent bg-accent/10" : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                )}>
                  {imageFiles.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="text-accent" size={32} />
                      <span className="font-medium text-white">{imageFiles.length} files selected</span>
                      <span className="text-xs text-secondary">Ready to upload</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-secondary">
                      <ImageIcon className="text-white/40" size={32} />
                      <span>Click or Drag Images here</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleImageUpload}
                disabled={imageFiles.length === 0}
                className={clsx(
                  "w-full btn-secondary justify-center py-3 text-lg transition-all",
                  imageFiles.length === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Upload size={18} /> Upload Images
                </div>
              </button>

              {imageUploadStatus && (
                <div className={clsx(
                  "text-sm p-3 rounded-lg",
                  imageUploadStatus.includes("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                )}>
                  {imageUploadStatus}
                </div>
              )}

              {/* Uploaded Images List */}
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">Uploaded Images</h3>
                  <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                    {uploadedImages.map(img => (
                      <div key={img} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded hover:bg-white/10 group">
                        <span className="truncate max-w-[180px]">{img}</span>
                        <button
                          onClick={() => handleDeleteFile(img, 'image')}
                          className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Music Upload Section */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-white/90">
                <Music size={24} className="text-pink-500" />
                <h2>Upload Music</h2>
              </div>
              <p className="text-sm text-secondary">
                Upload background music files (e.g., <code>.mp3</code>, <code>.wav</code>).
              </p>

              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept=".mp3,.wav,.aac,.m4a"
                  onChange={handleMusicChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                  musicFiles.length > 0 ? "border-pink-500 bg-pink-500/10" : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                )}>
                  {musicFiles.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Music className="text-pink-500" size={32} />
                      <span className="font-medium text-white">{musicFiles.length} files selected</span>
                      <span className="text-xs text-secondary">Ready to upload</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-secondary">
                      <Music className="text-white/40" size={32} />
                      <span>Click or Drag Music here</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleMusicUpload}
                disabled={musicFiles.length === 0}
                className={clsx(
                  "w-full btn-secondary justify-center py-3 text-lg transition-all",
                  musicFiles.length === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Upload size={18} /> Upload Music
                </div>
              </button>

              {musicUploadStatus && (
                <div className={clsx(
                  "text-sm p-3 rounded-lg",
                  musicUploadStatus.includes("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                )}>
                  {musicUploadStatus}
                </div>
              )}

              {/* Uploaded Music List */}
              {uploadedMusic.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">Uploaded Music</h3>
                  <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                    {uploadedMusic.map(m => (
                      <div key={m} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded hover:bg-white/10 group">
                        <span className="truncate max-w-[180px]">{m}</span>
                        <button
                          onClick={() => handleDeleteFile(m, 'music')}
                          className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video List */}
            <div className="glass-panel p-6 h-[500px] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Smartphone size={24} className="text-accent" /> Generated Videos
                </h2>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-secondary">
                  {videos.length} items
                </span>
              </div>

              <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                {videos.length === 0 ? (
                  <p className="text-center text-secondary py-10">No videos generated yet.</p>
                ) : (
                  videos.map((vid) => (
                    <div
                      key={vid}
                      onClick={() => setSelectedVideo(vid)}
                      className={clsx(
                        "p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between group",
                        selectedVideo === vid ? "bg-white/15 border-l-4 border-accent" : "hover:bg-white/5 border-l-4 border-transparent"
                      )}
                    >
                      <span className="truncate flex-1 font-medium text-sm text-white/90">{vid}</span>
                      <div className="flex items-center gap-2">
                        <Play size={16} className={clsx(
                          "text-white/40 group-hover:text-white transition-opacity",
                          selectedVideo === vid ? "opacity-100 text-accent" : "opacity-0 group-hover:opacity-100"
                        )} />
                        <button
                          onClick={(e) => handleDeleteVideo(e, vid)}
                          className="text-white/40 hover:text-red-400 z-10 p-1 hover:bg-white/10 rounded"
                          title="Delete Video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-2 h-full">
            <div className="glass-panel p-8 h-full flex flex-col items-center justify-center relative min-h-[600px]">
              {selectedVideo ? (
                <div className="w-full max-w-sm flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
                  <h3 className="text-xl font-semibold text-center truncate">{selectedVideo}</h3>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[9/16] bg-black">
                    <video
                      key={selectedVideo} // Force remount on change
                      controls
                      className="w-full h-full object-cover"
                      src={`${API_BASE}/videos/${selectedVideo}`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <a
                      href={`${API_BASE}/videos/${selectedVideo}`}
                      download
                      className="btn-secondary w-full justify-center"
                    >
                      <Download size={20} /> Download Video
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-secondary space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Play size={40} className="text-white/20 translate-x-1" />
                  </div>
                  <p className="text-lg">Select a video to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
