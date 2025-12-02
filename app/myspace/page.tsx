import CurrentObsession from "@/components/MySpace/CurrentObsession";
import SpotifyPetWrapper from "@/components/MySpace/SpotifyPetWrapper";
import ToDos from "@/components/MySpace/ToDos";
import { getTodos } from '../../api';
import ImageUpload from "@/components/MySpace/ImageUpload";
import { getImages } from "../actions";
import Images from "@/components/MySpace/Images";
import Link from "next/link";
import uhy from "@/public/images/uhy.png"
import Image from "next/image";

export default async function MySpace() {

  const todos = await getTodos()
  const images = await getImages();

  return (
    <main className="pb-20 relative px-4 md:px-0 pt-20">
      <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent">Welcome, Tamar ✨</h1>
      <p className="italic mb-4 text-sm md:text-base">This is your private space, which only you can access.</p>
      <hr />
      <div className="text-lg font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent flex w-full justify-center items-center">
        <Link href={"/work"} className="flex items-center gap-2">
          Go to workspace
          <Image src={uhy} alt="" width={40} height={40}/>
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mt-6">
        <div className="w-full lg:flex-1">
             <CurrentObsession />
        </div>
        <div className="w-full lg:w-auto flex justify-center lg:block">
             <SpotifyPetWrapper />
        </div>
      </div>

      <hr className="my-6"></hr>
      
      <section className="w-full lg:w-[40%]">
        <ToDos todosData={todos}/>
      </section>
      
      <section className="mt-8">
        <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent pb-2 mb-6">Upload images here to show them in gallery</h3>
        <ImageUpload/>
        <Images images={images}/>
      </section>
    </main>
  );
}