import CurrentObsession from "@/components/MySpace/CurrentObsession";
import SpotifyPlayer from "@/components/MySpace/SpotifyPlayer";

export default function MySpace() {
  return (
    <main className="pt-6">
      <h1 className="text-4xl font-semibold">Welcome, Tamar ✨</h1>
      <p className="italic  mb-4">This is your private space, which only you can access.</p>
      <hr></hr>
      <div className="flex justify-between items-center">
      <CurrentObsession />
      <SpotifyPlayer />
      </div>
    </main>
  );
}
