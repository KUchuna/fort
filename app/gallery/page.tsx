import { getImages } from '@/app/actions';
import InteractiveGallery from '@/components/Gallery/InteractiveGallery';
import { verifySession } from '@/lib/auth';

export default async function GalleryPage() {
  const images = await getImages();
  
  const isAdmin = await verifySession();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-black font-[Gilroy]">
      <main className="max-w-7xl mx-auto py-20">
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-black mb-4">
            Image Gallery
          </h1>
          <p className="text-[var(--color-accent)] text-lg font-medium">
            {isAdmin ? 'Welcome back, Tamar.' : 'Browse my collection.'}
          </p>
        </header>

        {/* 3. Pass data to Client Component */}
        <InteractiveGallery 
          images={images} 
          isAdmin={isAdmin} 
        />
      </main>
    </div>
  );
}