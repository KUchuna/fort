import { getImages } from '@/app/actions';
import InteractiveGallery from '@/components/Gallery/InteractiveGallery';
import ParallaxText from '@/components/Gallery/ParallaxText';
import { verifySession } from '@/lib/auth';

export default async function GalleryPage() {
  const images = await getImages();
  
  const isAdmin = await verifySession();

  return (
    <main className="w-full py-20">
            <section className='py-20'>
                <ParallaxText baseVelocity={-5}>
                memories &nbsp; memories &nbsp; memories &nbsp; memories &nbsp;
                </ParallaxText>
                <ParallaxText baseVelocity={5}>
                Explore &nbsp; Explore &nbsp; Explore &nbsp; Explore &nbsp; Explore &nbsp;
                </ParallaxText>
            </section>
        <div className='max-w-7xl mx-auto'>
            <section className='mx-auto w-full'>
                <div className="mb-16 text-center">
                <h1 className="text-5xl font-medium mb-4 uppercase">
                    Image Gallery
                </h1>
                <p className="text-accent text-lg font-medium uppercase">
                    {isAdmin ? 'Welcome back, Tamar.' : 'Browse my collection'}
                </p>
                </div>
                <InteractiveGallery 
                images={images} 
                isAdmin={isAdmin} 
                />
            </section>
        </div>
    </main>
  );
}