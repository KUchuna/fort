import CurrentObsession from "@/components/MySpace/CurrentObsession";
import SpotifyPetWrapper from "@/components/MySpace/SpotifyPetWrapper";
import ToDos from "@/components/MySpace/ToDos";
import { getTodos } from '../../api';
import ImageUpload from "@/components/MySpace/ImageUpload";
import { getImages } from "../actions";
import Images from "@/components/MySpace/Images";


export default async function MySpace() {

  const todos = await getTodos()
  const images = await getImages();

  return (
    <main className="pt-6 pb-20 relative">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent">Welcome, Tamar ✨</h1>
      <p className="italic  mb-4">This is your private space, which only you can access.</p>
      <hr></hr>
      <div className="flex justify-between items-top">
      <CurrentObsession />
      <SpotifyPetWrapper />
      </div>
      <hr className="my-6"></hr>
      <section className="w-[40%]">
        <ToDos todosData={todos}/>
      </section>
      <section>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent pb-2 mb-6">Upload images here to show them in gallery</h3>
        <ImageUpload/>
        <Images images={images}/>
      </section>
    </main>
  );
}
