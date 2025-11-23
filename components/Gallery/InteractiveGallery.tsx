'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandedImage from './ExpandedImage';
import { MessageSquare } from 'lucide-react';

interface GalleryImage {
  id: number;
  url: string;
  title: string | null;
  created_at: string;
  pathname: string; 
  comment_count?: number;
  alt_text: string;
  width: number;
  height: number;
  blur_data_url: string;
  likes_count: number;
}

interface InteractiveGalleryProps {
  images: GalleryImage[];
  isAdmin: boolean;
}


export default function InteractiveGallery({ images, isAdmin }: InteractiveGalleryProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedImage = images.find((img) => img.id === selectedId);

  return (
    <>
      {/* Masonry/Grid Layout */}
      <div className="columns-1 md:columns-3 gap-6 space-y-6 px-4 md:px-0">
        {images.map((image) => (
          <motion.div
            key={image.id}
            layoutId={`card-${image.id}`}
            onClick={() => setSelectedId(image.id)}
            whileHover={{ scale: 1.02, y: -5 }}
            className="break-inside-avoid cursor-pointer group relative"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow border border-main">
              <motion.img
                layoutId={`image-${image.id}`}
                src={image.url}
                alt="Gallery thumbnail"
                className="w-full h-auto object-cover"
              />
              
              {/* Hover Overlay Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-end rounded-b-2xl">
                <div className="flex items-center text-white space-x-1">
                   <MessageSquare className="w-4 h-4" />
                   <span className="text-sm font-medium">{image.comment_count}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AnimatePresence handles the exit animation of the modal */}
      <AnimatePresence>
        {selectedId && selectedImage && (
          <ExpandedImage 
            image={selectedImage} 
            isAdmin={isAdmin} 
            onClose={() => setSelectedId(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}