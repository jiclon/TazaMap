import { useStore } from "./store";
import { useIsDesktop } from "./useIsDesktop";
import { MapScreen } from "./screens/MapScreen";
import { SpotScreen } from "./screens/SpotScreen";
import { NewSpotScreen } from "./screens/NewSpotScreen";
import { CleanupScreen } from "./screens/CleanupScreen";
import { NewCleanupScreen } from "./screens/NewCleanupScreen";
import { Shell } from "./desktop/Shell";

export default function App() {
  const { screen } = useStore();
  const desktop = useIsDesktop();

  // Экраны раздела «Карта»: список/карта, место, новое место, уборка, новая уборка.
  // Остальные страницы (Главная, Уборки, Рейтинг, Профиль) выбирает Shell.
  let detail = null;
  switch (screen.name) {
    case "map": detail = <MapScreen desktop={desktop} />; break;
    case "spot": detail = <SpotScreen id={screen.id} />; break;
    case "newSpot": detail = <NewSpotScreen latitude={screen.latitude} longitude={screen.longitude} />; break;
    case "cleanup": detail = <CleanupScreen id={screen.id} />; break;
    case "newCleanup": detail = <NewCleanupScreen spotId={screen.spotId} />; break;
  }

  return <Shell detail={detail} desktop={desktop} />;
}
