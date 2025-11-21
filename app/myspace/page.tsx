import CurrentObsession from "@/components/MySpace/CurrentObsession";
import SpotifyPetWrapper from "@/components/MySpace/SpotifyPetWrapper";
import ToDos from "@/components/MySpace/ToDos";

export default function MySpace() {
  return (
    <main className="pt-6 relative">
      <h1 className="text-4xl font-semibold">Welcome, Tamar ✨</h1>
      <p className="italic  mb-4">This is your private space, which only you can access.</p>
      <hr></hr>
      <div className="flex justify-between items-top">
      <CurrentObsession />
      <SpotifyPetWrapper />
      </div>
      <hr className="my-6"></hr>
      <section className="w-[40%]">
        <ToDos />
      </section>
    </main>
  );
}
